/// <reference types="jest" />
/** Simulé Axios y SecureStore para verificar renovación, cola y expiración sin red real. */
jest.mock('axios', () => {
  const crearInstancia = () => {
    const instancia: any = jest.fn();
    instancia.interceptors = {
      request: { use: jest.fn() },
      response: { use: jest.fn() },
    };
    instancia.get = jest.fn();
    instancia.post = jest.fn();
    return instancia;
  };

  return {
    create: jest.fn(() => crearInstancia()),
    isAxiosError: jest.fn(() => false),
  };
});

jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

jest.mock('expo-router', () => ({
  router: { replace: jest.fn() },
}));

import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { router } from 'expo-router';
import { api, extraerDatos, extraerLista } from '@/services/api';

const obtener = SecureStore.getItemAsync as jest.Mock;
const guardar = SecureStore.setItemAsync as jest.Mock;
const borrar = SecureStore.deleteItemAsync as jest.Mock;
const reemplazar = router.replace as jest.Mock;

type Instancia = jest.Mock & {
  interceptors: {
    request: { use: jest.Mock };
    response: { use: jest.Mock };
  };
  get: jest.Mock;
  post: jest.Mock;
};

const instancias = (axios.create as jest.Mock).mock.results.map(
  (resultado) => resultado.value as Instancia,
);
const apiInstancia = instancias[0];
const refreshInstancia = instancias[1];
const interceptorRespuesta = apiInstancia.interceptors.response.use.mock
  .calls[0][1] as (error: unknown) => Promise<unknown>;

function error401(config: Record<string, unknown>) {
  return {
    config,
    response: { status: 401 },
  };
}

describe('interceptor de sesión', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    obtener.mockImplementation((clave: string) =>
      Promise.resolve(clave === 'rutago_refresh_token' ? 'refresh-viejo' : null),
    );
    refreshInstancia.post.mockResolvedValue({
      data: { token: 'token-nuevo', refreshToken: 'refresh-nuevo' },
    });
    apiInstancia.mockResolvedValue({ status: 200 });
  });

  it('renueva el token, persiste la rotación y reintenta la solicitud', async () => {
    const original = {
      url: '/viajes',
      headers: { Authorization: 'Bearer token-viejo' },
      _reintento: false,
    };

    await interceptorRespuesta(error401(original));

    expect(refreshInstancia.post).toHaveBeenCalledWith(
      expect.stringContaining('/api/auth/refresh'),
      { refreshToken: 'refresh-viejo' },
    );
    expect(guardar).toHaveBeenCalledWith('rutago_token', 'token-nuevo');
    expect(guardar).toHaveBeenCalledWith(
      'rutago_refresh_token',
      'refresh-nuevo',
    );
    expect(original.headers.Authorization).toBe('Bearer token-nuevo');
    expect(apiInstancia).toHaveBeenCalledWith(original);
  });

  it('limpia la sesión y vuelve al login cuando el refresh expira', async () => {
    refreshInstancia.post.mockRejectedValue(new Error('refresh expirado'));
    const original = {
      url: '/viajes',
      headers: { Authorization: 'Bearer token-viejo' },
      _reintento: false,
    };

    await expect(
      interceptorRespuesta(error401(original)),
    ).rejects.toBeDefined();

    expect(borrar).toHaveBeenCalledWith('rutago_token');
    expect(borrar).toHaveBeenCalledWith('rutago_refresh_token');
    expect(borrar).toHaveBeenCalledWith('rutago_user');
    expect(reemplazar).toHaveBeenCalledWith('/');
  });

  it('no intenta refrescar un error del propio login', async () => {
    const original = {
      url: '/auth/login',
      headers: {},
      _reintento: false,
    };

    await expect(
      interceptorRespuesta(error401(original)),
    ).rejects.toBeDefined();

    expect(refreshInstancia.post).not.toHaveBeenCalled();
    expect(reemplazar).not.toHaveBeenCalled();
  });

  it('extrae datos y listas del envelope real del backend', () => {
    expect(extraerDatos({ success: true, data: { id: 1 } })).toEqual({ id: 1 });
    expect(extraerLista({ success: true, data: [{ id: 2 }] })).toEqual([
      { id: 2 },
    ]);
    expect(api).toBe(apiInstancia);
  });
});
