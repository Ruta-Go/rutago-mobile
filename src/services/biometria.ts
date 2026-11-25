import * as LocalAuthentication from 'expo-local-authentication';

export type TipoBiometria = 'huella' | 'faceid' | 'ninguna';

export type EstadoBiometria = {
  disponible: boolean;
  tipo: TipoBiometria;
  etiqueta: string;
};

const SIN_BIOMETRIA: EstadoBiometria = {
  disponible: false,
  tipo: 'ninguna',
  etiqueta: '',
};

/**
 * Consulté hardware, enrolamiento y tipos soportados para no mostrar el botón
 * biométrico en dispositivos que no pueden completar la validación.
 */
export async function obtenerEstadoBiometria(): Promise<EstadoBiometria> {
  try {
    const [hardware, inscrita, tipos] = await Promise.all([
      LocalAuthentication.hasHardwareAsync(),
      LocalAuthentication.isEnrolledAsync(),
      LocalAuthentication.supportedAuthenticationTypesAsync(),
    ]);

    if (!hardware || !inscrita) return SIN_BIOMETRIA;

    const facial = tipos.includes(
      LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION,
    );
    const huella = tipos.includes(
      LocalAuthentication.AuthenticationType.FINGERPRINT,
    );

    if (facial) {
      return { disponible: true, tipo: 'faceid', etiqueta: 'Face ID' };
    }
    if (huella) {
      return { disponible: true, tipo: 'huella', etiqueta: 'huella' };
    }
    return SIN_BIOMETRIA;
  } catch {
    return SIN_BIOMETRIA;
  }
}

/** Verifiqué la disponibilidad real antes de habilitar cualquier acceso biométrico. */
export async function canUseBiometrics(): Promise<boolean> {
  return (await obtenerEstadoBiometria()).disponible;
}

/**
 * Solicité la validación biométrica del sistema y dejé el fallback de
 * contraseña activo para no bloquear al usuario si la lectura falla.
 */
export async function autenticarConBiometria(): Promise<void> {
  const estado = await obtenerEstadoBiometria();
  if (!estado.disponible) {
    throw new Error('La biometría no está disponible en este dispositivo.');
  }

  const resultado = await LocalAuthentication.authenticateAsync({
    promptMessage: `Confirma tu ${estado.etiqueta} para ingresar a RutaGo`,
    fallbackLabel: 'Usar contraseña',
    cancelLabel: 'Cancelar',
    disableDeviceFallback: false,
  });

  if (!resultado.success) {
    const codigo = 'error' in resultado ? String(resultado.error) : '';
    if (codigo.includes('cancel')) {
      throw new Error('La autenticación biométrica fue cancelada.');
    }
    throw new Error('No se pudo verificar tu identidad.');
  }
}
