/// <reference types="jest" />
/** Verifiqué que los avisos del backend se conviertan en notificaciones locales reales. */
jest.mock('expo-notifications', () => ({
  DEFAULT_ACTION_IDENTIFIER: 'expo.modules.notifications.actions.DEFAULT',
  setNotificationHandler: jest.fn(),
  getPermissionsAsync: jest.fn(),
  requestPermissionsAsync: jest.fn(),
  getExpoPushTokenAsync: jest.fn(),
  scheduleNotificationAsync: jest.fn(),
  addNotificationReceivedListener: jest.fn(),
  addNotificationResponseReceivedListener: jest.fn(),
  getLastNotificationResponse: jest.fn(),
  clearLastNotificationResponse: jest.fn(),
  setBadgeCountAsync: jest.fn(),
}));

jest.mock('expo-constants', () => ({
  ExecutionEnvironment: { Bare: 'bare', Standalone: 'standalone', StoreClient: 'storeClient' },
  __esModule: true,
  default: {
    expoConfig: { extra: { eas: { projectId: undefined as string | undefined } } },
  },
}));

jest.mock('@/services/api', () => ({
  api: { get: jest.fn() },
  extraerDatos: (cuerpo: { data?: unknown }) => cuerpo?.data ?? cuerpo,
}));

import Constants from 'expo-constants';
import * as Notificaciones from 'expo-notifications';

import { api } from '@/services/api';
import {
  destinoDeNotificacion,
  escucharNotificaciones,
  limpiarContador,
  mostrarNotificacionLocal,
  registrarNotificaciones,
  sincronizarContador,
} from '@/services/notificaciones';

const TOQUE = 'expo.modules.notifications.actions.DEFAULT';
const DESCARTE = 'expo.modules.notifications.actions.DISMISS';

const programar = Notificaciones.scheduleNotificationAsync as jest.Mock;
const permisos = Notificaciones.getPermissionsAsync as jest.Mock;
const token = Notificaciones.getExpoPushTokenAsync as jest.Mock;
const escucharRecibidas =
  Notificaciones.addNotificationReceivedListener as jest.Mock;
const escucharToques =
  Notificaciones.addNotificationResponseReceivedListener as jest.Mock;
const ultimaRespuesta = Notificaciones.getLastNotificationResponse as jest.Mock;
const limpiarUltima = Notificaciones.clearLastNotificationResponse as jest.Mock;
const contador = Notificaciones.setBadgeCountAsync as jest.Mock;
const apiGet = api.get as jest.Mock;
const configuracion = Constants as unknown as {
  expoConfig: { extra: { eas: { projectId?: string } } };
};

function respuestaCon(data: unknown, accion = TOQUE, identifier?: string) {
  return {
    actionIdentifier: accion,
    notification: { request: { identifier, content: { data } } },
  };
}

describe('servicio de notificaciones', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    configuracion.expoConfig.extra.eas.projectId = undefined;
    permisos.mockResolvedValue({ granted: true });
    token.mockResolvedValue({ data: 'ExpoPushToken[demo]' });
    escucharRecibidas.mockReturnValue({ remove: jest.fn() });
    escucharToques.mockReturnValue({ remove: jest.fn() });
    ultimaRespuesta.mockReturnValue(null);
  });

  it('programó una notificación local inmediata con el evento real', async () => {
    await mostrarNotificacionLocal('Viaje aceptado', 'Tu conductor salió');

    expect(programar).toHaveBeenCalledWith({
      content: {
        title: 'Viaje aceptado',
        body: 'Tu conductor salió',
        sound: true,
      },
      trigger: null,
    });
  });

  it('adjuntó el viaje a la notificación local para poder abrirlo', async () => {
    await mostrarNotificacionLocal('Viaje en curso', 'Ya salieron', {
      viajeId: 12,
    });

    expect(programar).toHaveBeenCalledWith({
      content: {
        title: 'Viaje en curso',
        body: 'Ya salieron',
        sound: true,
        data: { viajeId: 12 },
      },
      trigger: null,
    });
  });

  it('no inventó token remoto sin proyecto de Expo configurado', async () => {
    const resultado = await registrarNotificaciones();

    expect(resultado).toBeNull();
    expect(token).not.toHaveBeenCalled();
  });

  it('usó el projectId de app.json para obtener el token', async () => {
    configuracion.expoConfig.extra.eas.projectId = 'id-desde-config';

    const resultado = await registrarNotificaciones();

    expect(resultado).toBe('ExpoPushToken[demo]');
    expect(token).toHaveBeenCalledWith({ projectId: 'id-desde-config' });
  });

  describe('destino al tocar', () => {
    it('abrió el viaje cuando la notificación trae viajeId', () => {
      expect(destinoDeNotificacion({ viajeId: 7 })).toBe('/detalle-viaje?viajeId=7');
      expect(destinoDeNotificacion({ viajeId: '15' })).toBe(
        '/detalle-viaje?viajeId=15',
      );
    });

    it('respetó una ruta permitida y descartó las desconocidas', () => {
      expect(destinoDeNotificacion({ ruta: '/mis-viajes' })).toBe('/mis-viajes');
      expect(destinoDeNotificacion({ ruta: '/panel-gestion' })).toBe(
        '/notificaciones',
      );
    });

    it('ignoró viajeId inválidos y datos vacíos', () => {
      expect(destinoDeNotificacion({ viajeId: -3 })).toBe('/notificaciones');
      expect(destinoDeNotificacion({ viajeId: 'abc' })).toBe('/notificaciones');
      expect(destinoDeNotificacion(null)).toBe('/notificaciones');
    });
  });

  describe('manejadores del sistema', () => {
    it('avisó al recibir una notificación con la app abierta', () => {
      const alRecibir = jest.fn();
      escucharNotificaciones({ alRecibir, alTocar: jest.fn() });
      const manejador = escucharRecibidas.mock.calls[0][0] as (
        notificacion: unknown,
      ) => void;

      manejador({ request: { content: { data: {} } } });

      expect(alRecibir).toHaveBeenCalledTimes(1);
    });

    it('navegó al viaje al tocar la notificación', () => {
      const alTocar = jest.fn();
      escucharNotificaciones({ alTocar });
      const manejador = escucharToques.mock.calls[0][0] as (
        respuesta: unknown,
      ) => void;

      manejador(respuestaCon({ viajeId: 9 }));

      expect(alTocar).toHaveBeenCalledWith('/detalle-viaje?viajeId=9');
    });

    it('no navegó cuando el usuario descartó la notificación', () => {
      const alTocar = jest.fn();
      escucharNotificaciones({ alTocar });
      const manejador = escucharToques.mock.calls[0][0] as (
        respuesta: unknown,
      ) => void;

      manejador(respuestaCon({ viajeId: 9 }, DESCARTE));

      expect(alTocar).not.toHaveBeenCalled();
    });

    it('atendió el toque que abrió la app estando cerrada', () => {
      ultimaRespuesta.mockReturnValue(respuestaCon({ viajeId: 4 }));
      const alTocar = jest.fn();

      escucharNotificaciones({ alTocar });

      expect(alTocar).toHaveBeenCalledWith('/detalle-viaje?viajeId=4');
      expect(limpiarUltima).toHaveBeenCalled();
    });

    it('no navegó dos veces cuando el toque inicial también llega al listener', () => {
      const toque = respuestaCon({ viajeId: 4 }, TOQUE, 'aviso-1');
      ultimaRespuesta.mockReturnValue(toque);
      const alTocar = jest.fn();

      escucharNotificaciones({ alTocar });
      const manejador = escucharToques.mock.calls[0][0] as (
        respuesta: unknown,
      ) => void;
      manejador(toque);
      manejador(respuestaCon({ viajeId: 5 }, TOQUE, 'aviso-2'));

      expect(alTocar).toHaveBeenCalledTimes(2);
      expect(alTocar).toHaveBeenNthCalledWith(1, '/detalle-viaje?viajeId=4');
      expect(alTocar).toHaveBeenNthCalledWith(2, '/detalle-viaje?viajeId=5');
    });

    it('quitó ambos listeners al limpiar', () => {
      const quitarRecibida = jest.fn();
      const quitarToque = jest.fn();
      escucharRecibidas.mockReturnValue({ remove: quitarRecibida });
      escucharToques.mockReturnValue({ remove: quitarToque });

      escucharNotificaciones({ alTocar: jest.fn() })();

      expect(quitarRecibida).toHaveBeenCalled();
      expect(quitarToque).toHaveBeenCalled();
    });
  });

  describe('contador de pendientes', () => {
    it('puso en el ícono el total real de no leídas', async () => {
      apiGet.mockResolvedValue({ data: { success: true, data: { total: 3 } } });

      const total = await sincronizarContador();

      expect(apiGet).toHaveBeenCalledWith('/notificaciones/no-leidas');
      expect(contador).toHaveBeenCalledWith(3);
      expect(total).toBe(3);
    });

    it('no inventó un número cuando falla la red', async () => {
      apiGet.mockRejectedValue(new Error('sin red'));
      const aviso = jest.spyOn(console, 'warn').mockImplementation(() => {});

      const total = await sincronizarContador();

      expect(total).toBeNull();
      expect(contador).not.toHaveBeenCalled();
      aviso.mockRestore();
    });

    it('dejó el contador en cero al cerrar sesión', async () => {
      await limpiarContador();

      expect(contador).toHaveBeenCalledWith(0);
    });
  });
});
