/// <reference types="jest" />
/** Definí los mocks dentro de la fábrica para evitar problemas de hoisting con Jest. */
jest.mock('@/services/api', () => ({
  api: { get: jest.fn(), post: jest.fn() },
  guardarSesion: jest.fn(),
  guardarUsuarioSesion: jest.fn(),
  intercambiarRefreshToken: jest.fn(),
  leerRefreshToken: jest.fn(),
  leerSesion: jest.fn(),
  limpiarSesion: jest.fn(),
}));

jest.mock('@/services/biometria', () => ({
  autenticarConBiometria: jest.fn(),
  canUseBiometrics: jest.fn(),
}));

import * as moduloApi from '@/services/api';
import * as moduloBiometria from '@/services/biometria';
import {
  cambiarContrasenaConToken,
  canUseBiometrics,
  getUser,
  iniciarSesion,
  iniciarSesionBiometrica,
  logout,
  registrarUsuario,
  solicitarRecuperacion,
  verificarTokenRecuperacion,
} from '@/services/authService';

const api = moduloApi.api as unknown as { get: jest.Mock; post: jest.Mock };
const guardarSesion = moduloApi.guardarSesion as jest.Mock;
const guardarUsuarioSesion = moduloApi.guardarUsuarioSesion as jest.Mock;
const intercambiarRefreshToken = moduloApi.intercambiarRefreshToken as jest.Mock;
const leerRefreshToken = moduloApi.leerRefreshToken as jest.Mock;
const leerSesion = moduloApi.leerSesion as jest.Mock;
const limpiarSesion = moduloApi.limpiarSesion as jest.Mock;
const autenticarConBiometria =
  moduloBiometria.autenticarConBiometria as jest.Mock;
const puedeUsarBiometria = moduloBiometria.canUseBiometrics as jest.Mock;

describe('authService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('inicia sesión contra el backend y persiste un usuario normalizado', async () => {
    api.post.mockResolvedValue({
      data: {
        success: true,
        message: 'Inicio de sesión exitoso.',
        token: 'token-1',
        refreshToken: 'refresh-1',
        usuario: {
          id: 7,
          nombres: 'Ana',
          rol: { id: 3, nombreRol: 'Pasajero' },
        },
      },
    });

    const respuesta = await iniciarSesion('ana@correo.com', 'clave123');

    expect(api.post).toHaveBeenCalledWith('/auth/login', {
      correo: 'ana@correo.com',
      contrasena: 'clave123',
    });
    expect(guardarSesion).toHaveBeenCalledWith(
      'token-1',
      'refresh-1',
      expect.objectContaining({ id: 7, rolId: 3 }),
    );
    expect(respuesta.usuario?.rolId).toBe(3);
  });

  it('rechaza el ingreso de la entidad externa con rol 4', async () => {
    api.post.mockResolvedValue({
      data: {
        success: true,
        token: 'token-4',
        refreshToken: 'refresh-4',
        usuario: { id: 8, rol: { id: 4, nombreRol: 'Entidad Externa' } },
      },
    });

    await expect(iniciarSesion('externo@correo.com', 'clave123')).rejects.toThrow(
      'Este rol no está habilitado en la aplicación móvil.',
    );
    expect(guardarSesion).not.toHaveBeenCalled();
  });

  it('no guarda sesión si el rol real no coincide con la selección visual', async () => {
    api.post.mockResolvedValue({
      data: {
        success: true,
        token: 'token-pasajero',
        refreshToken: 'refresh-pasajero',
        usuario: { id: 7, rol: { id: 3, nombreRol: 'Pasajero' } },
      },
    });

    await expect(
      iniciarSesion('ana@correo.com', 'clave123', 2),
    ).rejects.toThrow('Tu cuenta no corresponde al rol seleccionado.');
    expect(guardarSesion).not.toHaveBeenCalled();
  });

  it('getUser consulta el endpoint real y actualiza el perfil guardado', async () => {
    api.get.mockResolvedValue({
      data: {
        success: true,
        usuario: {
          id: 9,
          nombres: 'Luis',
          apellidos: 'Pérez',
          correo: 'luis@correo.com',
          rolId: 2,
          rol: { id: 2, nombreRol: 'Conductor' },
        },
      },
    });

    const usuario = await getUser();

    expect(api.get).toHaveBeenCalledWith('/auth/verificar-token');
    expect(guardarUsuarioSesion).toHaveBeenCalledWith(
      expect.objectContaining({ id: 9, rolId: 2, correo: 'luis@correo.com' }),
    );
    expect(usuario.rol?.nombreRol).toBe('Conductor');
  });

  it('logout centralizado limpia la sesión persistida', async () => {
    await logout();

    expect(limpiarSesion).toHaveBeenCalledTimes(1);
  });

  it('canUseBiometrics delega en la comprobación real del dispositivo', async () => {
    puedeUsarBiometria.mockResolvedValue(true);

    await expect(canUseBiometrics()).resolves.toBe(true);
    expect(puedeUsarBiometria).toHaveBeenCalledTimes(1);
  });

  it('reanuda la sesión con biometría y el refresh token real', async () => {
    autenticarConBiometria.mockResolvedValue(undefined);
    leerRefreshToken.mockResolvedValue('refresh-viejo');
    leerSesion.mockResolvedValue({
      token: 'token-viejo',
      usuario: { id: 5, rolId: 3 },
    });
    intercambiarRefreshToken.mockResolvedValue({
      token: 'token-nuevo',
      refreshToken: 'refresh-nuevo',
    });
    api.get.mockResolvedValue({
      data: {
        success: true,
        usuario: { id: 5, correo: 'ana@correo.com', rolId: 3 },
      },
    });

    const respuesta = await iniciarSesionBiometrica();

    expect(autenticarConBiometria).toHaveBeenCalledTimes(1);
    expect(intercambiarRefreshToken).toHaveBeenCalledWith('refresh-viejo');
    expect(guardarSesion).toHaveBeenCalledWith(
      'token-nuevo',
      'refresh-nuevo',
      expect.objectContaining({ rolId: 3 }),
    );
    expect(respuesta.token).toBe('token-nuevo');
  });

  it('no intenta reanudar sesión biométrica sin refresh token guardado', async () => {
    autenticarConBiometria.mockResolvedValue(undefined);
    leerRefreshToken.mockResolvedValue(null);

    await expect(iniciarSesionBiometrica()).rejects.toThrow(
      'Inicia sesión con contraseña una vez para habilitar el ingreso biométrico.',
    );
    expect(intercambiarRefreshToken).not.toHaveBeenCalled();
  });

  it('registra un pasajero enviando el payload saneado al backend', async () => {
    api.post.mockResolvedValue({
      data: { success: true, message: 'Usuario registrado correctamente.' },
    });

    const respuesta = await registrarUsuario({
      nombres: '  Ana ',
      apellidos: ' López ',
      correo: ' ana@correo.com ',
      contrasena: 'clave123',
      telefono: '  3001234567 ',
      direccion: '  ',
      tipoDocumentoId: 1,
      numeroDocumento: '  123 ',
      fechaNacimiento: ' 2000-01-01 ',
    });

    expect(api.post).toHaveBeenCalledWith('/usuarios/registro', {
      nombres: 'Ana',
      apellidos: 'López',
      correo: 'ana@correo.com',
      contrasena: 'clave123',
      telefono: '3001234567',
      tipoDocumentoId: 1,
      numeroDocumento: '123',
      fechaNacimiento: '2000-01-01',
    });
    expect(respuesta.mensaje).toBe('Usuario registrado correctamente.');
  });

  it('propaga el mensaje del backend cuando el registro falla', async () => {
    api.post.mockResolvedValue({
      data: { success: false, message: 'El correo ya está registrado.' },
    });

    await expect(
      registrarUsuario({
        nombres: 'Ana',
        apellidos: 'López',
        correo: 'ana@correo.com',
        contrasena: 'clave123',
      }),
    ).rejects.toThrow('El correo ya está registrado.');
  });

  it('solicita la recuperación de contraseña al endpoint real', async () => {
    api.post.mockResolvedValue({
      data: { success: true, message: 'Revisa tu correo para continuar.' },
    });

    await expect(
      solicitarRecuperacion('  ana@correo.com '),
    ).resolves.toBe('Revisa tu correo para continuar.');
    expect(api.post).toHaveBeenCalledWith('/usuarios/recuperar-contrasena', {
      correo: 'ana@correo.com',
    });
  });

  it('rechaza un enlace de recuperación inválido', async () => {
    api.post.mockResolvedValue({
      data: { success: false, message: 'El enlace no es válido o ya expiró.' },
    });

    await expect(verificarTokenRecuperacion('token-viejo')).rejects.toThrow(
      'El enlace no es válido o ya expiró.',
    );
    expect(api.post).toHaveBeenCalledWith(
      '/usuarios/verificar-token-recuperacion',
      { token: 'token-viejo' },
    );
  });

  it('cambia la contraseña con el token de recuperación', async () => {
    api.post.mockResolvedValue({
      data: { success: true, message: 'Contraseña actualizada.' },
    });

    await cambiarContrasenaConToken('token-valido', 'nuevaClave123');
    expect(api.post).toHaveBeenCalledWith('/usuarios/cambiar-contrasena', {
      token: 'token-valido',
      nuevaContrasena: 'nuevaClave123',
    });
  });
});
