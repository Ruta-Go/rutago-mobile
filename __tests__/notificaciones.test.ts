/// <reference types="jest" />
/** Verifiqué que los avisos del backend se conviertan en notificaciones locales reales. */
jest.mock('expo-notifications', () => ({
  setNotificationHandler: jest.fn(),
  getPermissionsAsync: jest.fn(),
  requestPermissionsAsync: jest.fn(),
  getExpoPushTokenAsync: jest.fn(),
  scheduleNotificationAsync: jest.fn(),
  addNotificationResponseReceivedListener: jest.fn(),
}));

jest.mock('expo-constants', () => ({
  __esModule: true,
  default: {
    expoConfig: { extra: { eas: { projectId: undefined as string | undefined } } },
  },
}));

import Constants from 'expo-constants';
import * as Notificaciones from 'expo-notifications';

import {
  escucharTapPush,
  mostrarNotificacionLocal,
  registrarNotificaciones,
} from '@/services/notificaciones';

const programar = Notificaciones.scheduleNotificationAsync as jest.Mock;
const permisos = Notificaciones.getPermissionsAsync as jest.Mock;
const token = Notificaciones.getExpoPushTokenAsync as jest.Mock;
const escuchar =
  Notificaciones.addNotificationResponseReceivedListener as jest.Mock;
const configuracion = Constants as unknown as {
  expoConfig: { extra: { eas: { projectId?: string } } };
};

describe('servicio de notificaciones', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    configuracion.expoConfig.extra.eas.projectId = undefined;
    permisos.mockResolvedValue({ granted: true });
    token.mockResolvedValue({ data: 'ExpoPushToken[demo]' });
    escuchar.mockReturnValue({ remove: jest.fn() });
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

  it('navegó a una pantalla permitida al tocar una notificación', () => {
    const alTocar = jest.fn();
    const quitar = escucharTapPush(alTocar);
    const manejador = escuchar.mock.calls[0][0] as (respuesta: unknown) => void;

    manejador({
      notification: {
        request: { content: { data: { ruta: '/mis-viajes' } } },
      },
    });

    expect(alTocar).toHaveBeenCalledWith('/mis-viajes');
    quitar();
  });
});
