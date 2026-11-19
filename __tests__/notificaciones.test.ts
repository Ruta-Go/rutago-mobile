/// <reference types="jest" />
/** Verifiqué que los avisos del backend se conviertan en notificaciones locales reales. */
jest.mock('expo-notifications', () => ({
  setNotificationHandler: jest.fn(),
  getPermissionsAsync: jest.fn(),
  requestPermissionsAsync: jest.fn(),
  getExpoPushTokenAsync: jest.fn(),
  scheduleNotificationAsync: jest.fn(),
}));

import * as Notificaciones from 'expo-notifications';

import {
  mostrarNotificacionLocal,
  registrarNotificaciones,
} from '@/services/notificaciones';

const programar = Notificaciones.scheduleNotificationAsync as jest.Mock;
const permisos = Notificaciones.getPermissionsAsync as jest.Mock;
const token = Notificaciones.getExpoPushTokenAsync as jest.Mock;

describe('servicio de notificaciones', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    permisos.mockResolvedValue({ granted: true });
    token.mockResolvedValue({ data: 'ExpoPushToken[demo]' });
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
    const anterior = process.env.EXPO_PUBLIC_EAS_PROJECT_ID;
    delete process.env.EXPO_PUBLIC_EAS_PROJECT_ID;

    const resultado = await registrarNotificaciones();

    expect(resultado).toBeNull();
    expect(token).not.toHaveBeenCalled();
    if (anterior !== undefined) {
      process.env.EXPO_PUBLIC_EAS_PROJECT_ID = anterior;
    }
  });
});
