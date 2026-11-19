/// <reference types="jest" />
/** Simulé la persistencia, el servicio y el router para probar el store sin dispositivo. */
jest.mock('@/services/api', () => ({
  leerSesion: jest.fn(),
  suscribirseASesion: jest.fn(() => jest.fn()),
}));

jest.mock('@/services/authService', () => ({
  getUser: jest.fn(),
  logout: jest.fn(),
}));

jest.mock('expo-router', () => ({
  router: { replace: jest.fn() },
}));

import { router } from 'expo-router';
import * as moduloApi from '@/services/api';
import * as moduloAuth from '@/services/authService';
import {
  iniciarSincronizacionSesion,
  useAuthStore,
} from '@/store/authStore';

const leerSesion = moduloApi.leerSesion as jest.Mock;
const suscribirseASesion = moduloApi.suscribirseASesion as jest.Mock;
const getUser = moduloAuth.getUser as jest.Mock;
const logout = moduloAuth.logout as jest.Mock;
const reemplazar = router.replace as jest.Mock;

const estadoInicial = useAuthStore.getState();

describe('authStore', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useAuthStore.setState({ ...estadoInicial, cargando: true }, true);
  });

  it('hidrata la sesión válida desde SecureStore', async () => {
    leerSesion.mockResolvedValue({
      token: 'token-1',
      usuario: { id: 4, nombres: 'María', rolId: 2 },
    });

    await useAuthStore.getState().hidratar();

    expect(useAuthStore.getState()).toMatchObject({
      token: 'token-1',
      cargando: false,
      usuario: expect.objectContaining({ rolId: 2 }),
    });
  });

  it('descarta sesiones con rol 4 y cierra la sesión persistida', async () => {
    leerSesion.mockResolvedValue({
      token: 'token-4',
      usuario: { id: 8, rolId: 4 },
    });

    await useAuthStore.getState().hidratar();

    expect(logout).toHaveBeenCalledTimes(1);
    expect(useAuthStore.getState().token).toBeNull();
    expect(useAuthStore.getState().usuario).toBeNull();
  });

  it('refresca el perfil real sin perder la sesión', async () => {
    useAuthStore.setState({
      token: 'token-1',
      usuario: { id: 4, rolId: 3 },
      cargando: false,
    });
    getUser.mockResolvedValue({
      id: 4,
      rolId: 3,
      correo: 'maria@correo.com',
    });

    await useAuthStore.getState().refrescarPerfil();

    expect(getUser).toHaveBeenCalledTimes(1);
    expect(useAuthStore.getState().usuario?.correo).toBe('maria@correo.com');
    expect(useAuthStore.getState().token).toBe('token-1');
  });

  it('cierra sesión, limpia el store y vuelve al login', async () => {
    useAuthStore.setState({
      token: 'token-1',
      usuario: { id: 4, rolId: 3 },
      cargando: false,
    });

    await useAuthStore.getState().cerrarSesion();

    expect(logout).toHaveBeenCalledTimes(1);
    expect(reemplazar).toHaveBeenCalledWith('/');
    expect(useAuthStore.getState().token).toBeNull();
  });

  it('sincroniza el store con los cambios de sesión de la API', () => {
    const desuscribir = iniciarSincronizacionSesion();

    expect(suscribirseASesion).toHaveBeenCalledTimes(1);
    desuscribir();
  });
});
