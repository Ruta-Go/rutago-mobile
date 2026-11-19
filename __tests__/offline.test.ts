/// <reference types="jest" />
/** Verifiqué que la caché offline devuelva datos reales guardados y nunca invente registros. */
jest.mock('expo-secure-store', () => {
  const almacen = new Map<string, string>();
  return {
    getItemAsync: jest.fn(async (clave: string) => almacen.get(clave) ?? null),
    setItemAsync: jest.fn(async (clave: string, valor: string) => {
      almacen.set(clave, valor);
    }),
    __almacen: almacen,
  };
});

import * as SecureStore from 'expo-secure-store';

import { obtenerConCache } from '@/services/offline';

const almacen = (
  SecureStore as unknown as { __almacen: Map<string, string> }
).__almacen;

describe('servicio offline', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    almacen.clear();
  });

  it('guardó la respuesta de red y la devolvió sin modo offline', async () => {
    const consulta = jest.fn().mockResolvedValue([{ id: 1 }]);

    const resultado = await obtenerConCache('mis-viajes-1', consulta);

    expect(resultado).toEqual({ datos: [{ id: 1 }], offline: false });
    expect(almacen.get('rutago_cache_mis-viajes-1')).toBe(
      JSON.stringify([{ id: 1 }]),
    );
  });

  it('devolvió la caché real cuando la red falló', async () => {
    await obtenerConCache('notificaciones-1', async () => [{ id: 7 }]);
    const consulta = jest.fn().mockRejectedValue(new Error('sin red'));

    const resultado = await obtenerConCache('notificaciones-1', consulta);

    expect(resultado).toEqual({ datos: [{ id: 7 }], offline: true });
  });

  it('propagó el error cuando no había caché', async () => {
    const consulta = jest.fn().mockRejectedValue(new Error('sin red'));

    await expect(obtenerConCache('vacío', consulta)).rejects.toThrow('sin red');
  });
});
