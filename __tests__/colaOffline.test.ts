/// <reference types="jest" />
/**
 * Verifiqué que un cambio hecho sin red quede guardado, se reenvíe en orden
 * cuando vuelva la conexión y se descarten las respuestas definitivas.
 */

jest.mock('expo-secure-store', () => {
  const almacen = new Map<string, string>();
  return {
    getItemAsync: jest.fn(async (clave: string) => almacen.get(clave) ?? null),
    setItemAsync: jest.fn(async (clave: string, valor: string) => {
      almacen.set(clave, valor);
    }),
    deleteItemAsync: jest.fn(async (clave: string) => {
      almacen.delete(clave);
    }),
    __almacen: almacen,
  };
});

jest.mock('@/services/api', () => ({
  api: { request: jest.fn() },
  extraerDatos: (cuerpo: unknown) => cuerpo,
}));

jest.mock('@/services/conexion', () => ({
  hayConexion: jest.fn(async () => true),
  suscribirConexion: jest.fn(() => () => undefined),
}));

import * as SecureStore from 'expo-secure-store';

import { suscribirConexion } from '@/services/conexion';
import {
  encolarMutacion,
  iniciarSincronizacionAutomatica,
  listarPendientes,
  mutarConCola,
  sincronizarCola,
  vaciarCola,
} from '@/services/colaOffline';
import { api } from '@/services/api';

const CLAVE = 'rutago_cola_offline';
const almacen = (
  SecureStore as unknown as { __almacen: Map<string, string> }
).__almacen;
const request = api.request as jest.Mock;
const conRed = jest.requireMock('@/services/conexion').hayConexion as jest.Mock;

/** Fallo de red: axios sin respuesta (la llamó el dispositivo, no el servidor). */
function errorRed(): Error {
  return Object.assign(new Error('Network Error'), { isAxiosError: true });
}

/** Respuesta del servidor con un estado concreto. */
function errorRespuesta(status: number): { response: { status: number } } {
  return { response: { status } };
}

describe('cola de cambios sin red', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    almacen.clear();
    conRed.mockResolvedValue(true);
    request.mockResolvedValue({ data: { ok: true } });
  });

  it('envió el cambio cuando había red y no dejó nada pendiente', async () => {
    const resultado = await mutarConCola({
      metodo: 'PATCH',
      url: '/notificaciones/7/leida',
    });

    expect(resultado).toMatchObject({ ok: true, offline: false });
    expect(resultado.datos).toEqual({ ok: true });
    expect(request).toHaveBeenCalledWith({
      url: '/notificaciones/7/leida',
      method: 'PATCH',
      data: undefined,
    });
    expect(await listarPendientes()).toHaveLength(0);
  });

  it('guardó el cambio para reenviarlo cuando no había red', async () => {
    conRed.mockResolvedValue(false);

    const resultado = await mutarConCola({
      metodo: 'PUT',
      url: '/vehiculos/3/ubicacion',
      cuerpo: { latitud: 4 },
    });

    expect(resultado).toMatchObject({ ok: true, offline: true });
    expect(request).not.toHaveBeenCalled();

    const pendientes = await listarPendientes();
    expect(pendientes).toHaveLength(1);
    expect(pendientes[0]).toMatchObject({
      metodo: 'PUT',
      url: '/vehiculos/3/ubicacion',
      intentos: 0,
    });
    expect(pendientes[0].cuerpo).toEqual({ latitud: 4 });
  });

  it('guardó el cambio si la red cayó aunque el dispositivo seguía en línea', async () => {
    request.mockRejectedValue(errorRed());

    const resultado = await mutarConCola({
      metodo: 'PUT',
      url: '/vehiculos/3/ubicacion',
    });

    expect(resultado).toMatchObject({ ok: true, offline: true });
    expect(await listarPendientes()).toHaveLength(1);
  });

  it('devolvió el error del servidor sin guardar nada', async () => {
    request.mockRejectedValue(errorRespuesta(400));

    const resultado = await mutarConCola({ metodo: 'PATCH', url: '/viajes/1' });

    expect(resultado).toMatchObject({ ok: false, offline: false });
    expect(resultado.error).toBeDefined();
    expect(await listarPendientes()).toHaveLength(0);
  });

  it('dejó sólo el último valor pendiente del mismo recurso', async () => {
    await encolarMutacion({
      metodo: 'PUT',
      url: '/vehiculos/3/ubicacion',
      cuerpo: { latitud: 1 },
    });
    await encolarMutacion({
      metodo: 'PUT',
      url: '/vehiculos/3/ubicacion',
      cuerpo: { latitud: 9 },
    });

    const pendientes = await listarPendientes();

    expect(pendientes).toHaveLength(1);
    expect(pendientes[0].cuerpo).toEqual({ latitud: 9 });
  });

  it('acumuló los cambios que no pueden pisarse entre sí', async () => {
    await encolarMutacion({ metodo: 'POST', url: '/viajes/1/solicitar' });
    await encolarMutacion({ metodo: 'POST', url: '/viajes/1/solicitar' });

    expect(await listarPendientes()).toHaveLength(2);
  });

  it('vació la cola al cerrar la sesión', async () => {
    await encolarMutacion({ metodo: 'PATCH', url: '/notificaciones/1/leida' });

    await vaciarCola();

    expect(await listarPendientes()).toHaveLength(0);
  });
});

describe('sincronización al recuperar la red', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    almacen.clear();
    conRed.mockResolvedValue(true);
    request.mockResolvedValue({ data: { ok: true } });
  });

  it('reenvió los cambios pendientes respetando el orden original', async () => {
    await encolarMutacion({ metodo: 'POST', url: '/viajes/1/bajarse' });
    await encolarMutacion({ metodo: 'POST', url: '/viajes/2/bajarse' });

    const resultado = await sincronizarCola();

    expect(resultado).toEqual({ enviadas: 2, descartadas: 0, quedan: 0 });
    expect(request.mock.calls.map((llamada) => llamada[0].url)).toEqual([
      '/viajes/1/bajarse',
      '/viajes/2/bajarse',
    ]);
    expect(await listarPendientes()).toHaveLength(0);
  });

  it('descartó lo que el servidor rechazó con 4xx', async () => {
    await encolarMutacion({ metodo: 'PATCH', url: '/viajes/1/cancelar' });
    request.mockRejectedValue(errorRespuesta(409));

    const resultado = await sincronizarCola();

    expect(resultado).toEqual({ enviadas: 0, descartadas: 1, quedan: 0 });
    expect(await listarPendientes()).toHaveLength(0);
  });

  it('conservó el cambio cuando falló la red y sumó un intento', async () => {
    await encolarMutacion({ metodo: 'PUT', url: '/vehiculos/3/ubicacion' });
    request.mockRejectedValue(errorRed());

    const resultado = await sincronizarCola();

    expect(resultado).toEqual({ enviadas: 0, descartadas: 0, quedan: 1 });
    const pendientes = await listarPendientes();
    expect(pendientes).toHaveLength(1);
    expect(pendientes[0].intentos).toBe(1);
  });

  it('descartó el cambio cuando agotó los reintentos', async () => {
    await encolarMutacion({ metodo: 'PUT', url: '/vehiculos/3/ubicacion' });

    // Cuatro intentos previos: el quinto es el último permitido.
    const pendientes = await listarPendientes();
    pendientes[0].intentos = 4;
    await SecureStore.setItemAsync(CLAVE, JSON.stringify(pendientes));
    request.mockRejectedValue(errorRed());

    const resultado = await sincronizarCola();

    expect(resultado).toEqual({ enviadas: 0, descartadas: 1, quedan: 0 });
    expect(await listarPendientes()).toHaveLength(0);
  });

  it('no encoló nada cuando no había trabajo pendiente', async () => {
    const resultado = await sincronizarCola();

    expect(resultado).toEqual({ enviadas: 0, descartadas: 0, quedan: 0 });
    expect(request).not.toHaveBeenCalled();
  });

  it('programó el reenvío automático al recuperar la conexión', async () => {
    const baja = iniciarSincronizacionAutomatica();

    expect(suscribirConexion).toHaveBeenCalled();
    expect(typeof baja).toBe('function');

    baja();
    // Dejo terminar la comprobación inicial de red que dispara la sincronización.
    await new Promise((resolver) => setTimeout(resolver, 0));
    expect(await listarPendientes()).toHaveLength(0);
  });
});
