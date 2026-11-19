/// <reference types="jest" />
/** Simulé el hardware biométrico dentro de la fábrica para que los mocks se apliquen siempre. */
jest.mock('expo-local-authentication', () => ({
  hasHardwareAsync: jest.fn(),
  isEnrolledAsync: jest.fn(),
  supportedAuthenticationTypesAsync: jest.fn(),
  authenticateAsync: jest.fn(),
  AuthenticationType: {
    FINGERPRINT: 1,
    FACIAL_RECOGNITION: 2,
  },
}));

import * as LocalAuthentication from 'expo-local-authentication';
import {
  autenticarConBiometria,
  canUseBiometrics,
  obtenerEstadoBiometria,
} from '@/services/biometria';

const hasHardwareAsync = LocalAuthentication.hasHardwareAsync as jest.Mock;
const isEnrolledAsync = LocalAuthentication.isEnrolledAsync as jest.Mock;
const supportedAuthenticationTypesAsync =
  LocalAuthentication.supportedAuthenticationTypesAsync as jest.Mock;
const authenticateAsync = LocalAuthentication.authenticateAsync as jest.Mock;

const HUELLA = 1;
const FACIAL = 2;

describe('biometria', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    hasHardwareAsync.mockResolvedValue(true);
    isEnrolledAsync.mockResolvedValue(true);
  });

  it('detecta Face ID cuando el dispositivo lo soporta', async () => {
    supportedAuthenticationTypesAsync.mockResolvedValue([FACIAL]);

    const estado = await obtenerEstadoBiometria();

    expect(estado).toEqual({
      disponible: true,
      tipo: 'faceid',
      etiqueta: 'Face ID',
    });
    await expect(canUseBiometrics()).resolves.toBe(true);
  });

  it('detecta huella cuando no hay reconocimiento facial', async () => {
    supportedAuthenticationTypesAsync.mockResolvedValue([HUELLA]);

    const estado = await obtenerEstadoBiometria();

    expect(estado.tipo).toBe('huella');
    expect(estado.etiqueta).toBe('huella');
  });

  it('deshabilita la biometría si no hay huella o rostro enrolado', async () => {
    isEnrolledAsync.mockResolvedValue(false);
    supportedAuthenticationTypesAsync.mockResolvedValue([HUELLA]);

    await expect(canUseBiometrics()).resolves.toBe(false);
  });

  it('confirma la identidad con el diálogo real del sistema', async () => {
    supportedAuthenticationTypesAsync.mockResolvedValue([HUELLA]);
    authenticateAsync.mockResolvedValue({ success: true });

    await expect(autenticarConBiometria()).resolves.toBeUndefined();
    expect(authenticateAsync).toHaveBeenCalledWith(
      expect.objectContaining({ disableDeviceFallback: false }),
    );
  });

  it('rechaza el acceso cuando la validación biométrica falla', async () => {
    supportedAuthenticationTypesAsync.mockResolvedValue([HUELLA]);
    authenticateAsync.mockResolvedValue({ success: false });

    await expect(autenticarConBiometria()).rejects.toThrow(
      'No se pudo verificar tu identidad.',
    );
  });
});
