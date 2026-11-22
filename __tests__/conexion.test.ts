/// <reference types="jest" />
/** Verifiqué que la app detecte el estado real de la red del dispositivo. */

jest.mock('@react-native-community/netinfo', () => {
  const estado = { isConnected: true, isInternetReachable: true };
  let oyente: ((valor: typeof estado) => void) | null = null;

  return {
    __esModule: true,
    __estado: estado,
    __notificar: () => oyente?.(estado),
    default: {
      addEventListener: jest.fn((cb: (valor: typeof estado) => void) => {
        oyente = cb;
        cb(estado);
        return () => {
          oyente = null;
        };
      }),
      fetch: jest.fn(async () => ({ ...estado })),
    },
  };
});

import { conexionActual, hayConexion, suscribirConexion } from '@/services/conexion';

type MockNetInfo = {
  __estado: { isConnected: boolean; isInternetReachable: boolean };
  __notificar: () => void;
};

const netInfo = jest.requireMock('@react-native-community/netinfo') as MockNetInfo;

/** Dejo la conexión conocida en línea antes de cada caso. */
async function dejarEnLinea(): Promise<void> {
  netInfo.__estado.isConnected = true;
  netInfo.__estado.isInternetReachable = true;
  await hayConexion();
}

describe('detección de conexión', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    await dejarEnLinea();
  });

  it('devolvió que hay red cuando el dispositivo está conectado', async () => {
    netInfo.__estado.isConnected = true;

    await expect(hayConexion()).resolves.toBe(true);
    expect(conexionActual()).toBe(true);
  });

  it('devolvió que no hay red cuando el dispositivo se desconecta', async () => {
    netInfo.__estado.isConnected = false;

    await expect(hayConexion()).resolves.toBe(false);
    expect(conexionActual()).toBe(false);
  });

  it('avisó a los suscriptores en cuanto cambió la conexión', async () => {
    const cambios: boolean[] = [];
    const baja = suscribirConexion((enLinea) => cambios.push(enLinea));

    netInfo.__estado.isConnected = false;
    netInfo.__notificar();

    expect(cambios).toEqual([false]);
    baja();
  });

  it('dejó de avisar después de darse de baja', async () => {
    const cambios: boolean[] = [];
    const baja = suscribirConexion((enLinea) => cambios.push(enLinea));
    baja();

    netInfo.__estado.isConnected = false;
    netInfo.__notificar();

    expect(cambios).toEqual([]);
  });

  it('trató el estado sin resolver como conexión disponible', async () => {
    // NetInfo devuelve null mientras resuelve; no debe cortar la app.
    netInfo.__estado.isConnected = null as unknown as boolean;
    netInfo.__estado.isInternetReachable = null as unknown as boolean;

    await expect(hayConexion()).resolves.toBe(true);
  });
});
