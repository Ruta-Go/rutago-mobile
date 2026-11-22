import { isAxiosError } from 'axios';

import { esRolValido } from '@/constants/roles';
import {
  api,
  guardarSesion,
  guardarUsuarioSesion,
  intercambiarRefreshToken,
  leerRefreshToken,
  leerSesion,
  limpiarSesion,
  type RespuestaApi,
} from './api';
import {
  autenticarConBiometria,
  canUseBiometrics as puedeUsarBiometria,
} from './biometria';

type MensajeRespuesta = RespuestaApi<never> & {
  message?: string;
  valido?: boolean;
};

function mensajeDe(error: unknown, respaldo: string): string {
  if (isAxiosError(error)) {
    const data = error.response?.data as { message?: string } | undefined;
    return data?.message || respaldo;
  }
  return error instanceof Error ? error.message : respaldo;
}

function texto(valor: unknown): string | undefined {
  return typeof valor === 'string' && valor.trim() ? valor : undefined;
}

function numero(valor: unknown): number | undefined {
  if (valor === null || valor === undefined || valor === '') return undefined;
  const resultado = Number(valor);
  return Number.isFinite(resultado) ? resultado : undefined;
}

export interface UsuarioAuth {
  id?: number | string;
  nombres?: string;
  apellidos?: string;
  correo?: string;
  rolId?: number;
  rol?: { id?: number | string; nombreRol?: string } | null;
}

export interface LoginResponse {
  success: boolean;
  message: string;
  token?: string;
  refreshToken?: string;
  usuario?: UsuarioAuth;
}

export interface DatosRegistro {
  nombres: string;
  apellidos: string;
  correo: string;
  contrasena: string;
  telefono?: string;
  direccion?: string;
  tipoDocumentoId?: number;
  numeroDocumento?: string;
  fechaNacimiento?: string;
}

/** Normalicé las respuestas del backend para que la app siempre trabaje con el mismo usuario. */
function normalizarUsuario(usuario: unknown): UsuarioAuth {
  const fuente =
    usuario && typeof usuario === 'object'
      ? (usuario as Record<string, unknown>)
      : {};
  const rolCrudo =
    fuente.rol && typeof fuente.rol === 'object'
      ? (fuente.rol as Record<string, unknown>)
      : undefined;
  const rolId = numero(fuente.rolId ?? rolCrudo?.id);

  return {
    id: numero(fuente.id) ?? texto(fuente.id),
    nombres: texto(fuente.nombres),
    apellidos: texto(fuente.apellidos),
    correo: texto(fuente.correo),
    rolId,
    rol:
      rolId !== undefined
        ? { id: rolId, nombreRol: texto(rolCrudo?.nombreRol) }
        : null,
  };
}

/** Centralicé el filtro de roles para que el rol 4 nunca entre a la app móvil. */
function validarUsuarioMovil(usuario: unknown): UsuarioAuth {
  const normalizado = normalizarUsuario(usuario);
  if (!esRolValido(normalizado.rolId)) {
    throw new Error('Este rol no está habilitado en la aplicación móvil.');
  }
  return normalizado;
}

/** El registro público del backend crea siempre un Pasajero. */
export async function registrarUsuario(
  datos: DatosRegistro,
): Promise<{ mensaje: string }> {
  try {
    const { data } = await api.post<MensajeRespuesta>('/usuarios/registro', {
      nombres: datos.nombres.trim(),
      apellidos: datos.apellidos.trim(),
      correo: datos.correo.trim(),
      contrasena: datos.contrasena,
      ...(datos.telefono?.trim() ? { telefono: datos.telefono.trim() } : {}),
      ...(datos.direccion?.trim() ? { direccion: datos.direccion.trim() } : {}),
      ...(datos.tipoDocumentoId ? { tipoDocumentoId: datos.tipoDocumentoId } : {}),
      ...(datos.numeroDocumento?.trim()
        ? { numeroDocumento: datos.numeroDocumento.trim() }
        : {}),
      ...(datos.fechaNacimiento?.trim()
        ? { fechaNacimiento: datos.fechaNacimiento.trim() }
        : {}),
    });
    if (!data?.success) {
      throw new Error(data?.message || 'No se pudo completar el registro');
    }
    return { mensaje: data.message ?? 'Registro creado correctamente' };
  } catch (error) {
    throw new Error(mensajeDe(error, 'No se pudo completar el registro'));
  }
}

export async function iniciarSesion(
  correo: string,
  contrasena: string,
  rolEsperado?: number,
): Promise<LoginResponse> {
  try {
    const { data } = await api.post<LoginResponse>('/auth/login', {
      correo: correo.trim(),
      contrasena,
    });

    if (!data.success || !data.token || !data.refreshToken || !data.usuario) {
      throw new Error(data.message || 'No fue posible iniciar sesión');
    }

    const usuario = validarUsuarioMovil(data.usuario);

    // La selección de la bienvenida nunca otorga permisos: si el rol real del
    // backend es distinto, se aborta antes de guardar la sesión.
    if (rolEsperado !== undefined && Number(usuario.rolId) !== rolEsperado) {
      throw new Error('Tu cuenta no corresponde al rol seleccionado.');
    }

    await guardarSesion(data.token, data.refreshToken, usuario);
    return { ...data, usuario };
  } catch (error) {
    throw new Error(mensajeDe(error, 'No fue posible iniciar sesión'));
  }
}

/**
 * Implementé getUser contra el endpoint real del backend y guardé el perfil
 * normalizado para mantener actualizada la sesión persistida.
 */
export async function getUser(): Promise<UsuarioAuth> {
  try {
    const { data } = await api.get<{
      success?: boolean;
      usuario?: unknown;
      message?: string;
    }>('/auth/verificar-token');

    if (!data?.success || !data.usuario) {
      throw new Error(data?.message || 'No se pudo obtener el usuario');
    }

    const usuario = validarUsuarioMovil(data.usuario);
    await guardarUsuarioSesion(usuario);
    return usuario;
  } catch (error) {
    throw new Error(mensajeDe(error, 'No se pudo obtener el usuario'));
  }
}

/** Centralicé el logout para que servicio y estado global limpien exactamente lo mismo. */
export async function logout(): Promise<void> {
  await limpiarSesion();
}

/** Dejé un alias con el nombre usado por la UI para no romper consumidores existentes. */
export const cerrarSesion = logout;

/** Delegué la comprobación biométrica al servicio que consulta hardware y enrolamiento reales. */
export async function canUseBiometrics(): Promise<boolean> {
  return puedeUsarBiometria();
}

/**
 * Reanudé la sesión con el refresh token ya guardado; así la biometría no
 * necesita almacenar contraseñas y el backend sigue siendo la fuente de verdad.
 */
export async function iniciarSesionBiometrica(): Promise<LoginResponse> {
  try {
    await autenticarConBiometria();

    const refreshToken = await leerRefreshToken();
    if (!refreshToken) {
      throw new Error(
        'Inicia sesión con contraseña una vez para habilitar el ingreso biométrico.',
      );
    }

    const sesion = await leerSesion();
    const usuarioPrevio = validarUsuarioMovil(sesion.usuario);
    const tokens = await intercambiarRefreshToken(refreshToken);

    await guardarSesion(tokens.token, tokens.refreshToken, usuarioPrevio);
    const usuario = await getUser();

    return {
      success: true,
      message: 'Sesión iniciada con biometría',
      token: tokens.token,
      refreshToken: tokens.refreshToken,
      usuario,
    };
  } catch (error) {
    throw new Error(mensajeDe(error, 'No se pudo iniciar sesión con biometría'));
  }
}

/** Solicita el enlace de recuperación. El backend responde 503 si no hay proveedor. */
export async function solicitarRecuperacion(correo: string): Promise<string> {
  try {
    const { data } = await api.post<MensajeRespuesta>(
      '/usuarios/recuperar-contrasena',
      { correo: correo.trim() },
    );
    if (!data?.success) {
      throw new Error(data?.message || 'No se pudo solicitar la recuperación');
    }
    return data.message ?? 'Revisa tu correo para continuar';
  } catch (error) {
    throw new Error(mensajeDe(error, 'No se pudo solicitar la recuperación'));
  }
}

/** Consulta al backend si el enlace sigue vigente, sin consumirlo. */
export async function verificarTokenRecuperacion(
  token: string,
): Promise<{ expira?: string }> {
  try {
    const { data } = await api.post<MensajeRespuesta & { expira?: string }>(
      '/usuarios/verificar-token-recuperacion',
      { token: token.trim() },
    );
    if (!data?.success || data.valido !== true) {
      throw new Error(data?.message || 'El enlace no es válido o ya expiró');
    }
    return { expira: data.expira };
  } catch (error) {
    throw new Error(mensajeDe(error, 'El enlace no es válido o ya expiró'));
  }
}

export async function cambiarContrasenaConToken(
  token: string,
  nuevaContrasena: string,
): Promise<void> {
  try {
    const { data } = await api.post<MensajeRespuesta>(
      '/usuarios/cambiar-contrasena',
      { token, nuevaContrasena },
    );
    if (!data?.success) {
      throw new Error(data?.message || 'No se pudo cambiar la contraseña');
    }
  } catch (error) {
    throw new Error(mensajeDe(error, 'No se pudo cambiar la contraseña'));
  }
}
