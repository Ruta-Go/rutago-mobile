import Constants from 'expo-constants';
import * as Notificaciones from 'expo-notifications';
import { Platform } from 'react-native';

import { api } from '@/services/api';

let manejadorInstalado = false;

/**
 * Envié el token real al backend autenticado. Si falla el registro remoto no
 * rompo la pantalla: las notificaciones locales y WebSocket siguen activas.
 * Nunca imprimí el token completo en consola.
 */
export async function enviarTokenAlBackend(token: string): Promise<boolean> {
  if (Platform.OS === 'web' || !token) return false;

  const plataforma = Platform.OS === 'ios' ? 'ios' : 'android';
  try {
    await api.post('/notificaciones/push-token', { token, plataforma });
    return true;
  } catch (error) {
    const mensaje = error instanceof Error ? error.message : 'error desconocido';
    console.warn('[notificaciones] no se pudo registrar el token en el backend', mensaje);
    return false;
  }
}

/**
 * Registré permisos y el token público de Expo cuando hay proyecto configurado.
 * Sin projectId de Expo no invento un token: las notificaciones locales siguen funcionando.
 */
export async function registrarNotificaciones(): Promise<string | null> {
  if (Platform.OS === 'web') return null;

  if (!manejadorInstalado) {
    Notificaciones.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
      }),
    });
    manejadorInstalado = true;
  }

  const permisoActual = await Notificaciones.getPermissionsAsync();
  const permiso = permisoActual.granted
    ? permisoActual
    : await Notificaciones.requestPermissionsAsync();
  if (!permiso.granted) return null;

  // Tomé el projectId publicado en app.json y permití sobreescribirlo con la variable pública.
  const projectId =
    process.env.EXPO_PUBLIC_EAS_PROJECT_ID ??
    (Constants.expoConfig?.extra?.eas as { projectId?: string } | undefined)
      ?.projectId;
  if (!projectId) return null;

  try {
    const token = await Notificaciones.getExpoPushTokenAsync({ projectId });
    await enviarTokenAlBackend(token.data);
    return token.data;
  } catch (error) {
    console.warn('[notificaciones] no se pudo obtener el token remoto', error);
    return null;
  }
}

export type DestinoPush = '/notificaciones' | '/mis-viajes' | '/dashboard';

const DESTINOS_PERMITIDOS: DestinoPush[] = [
  '/notificaciones',
  '/mis-viajes',
  '/dashboard',
];

/** Llevé al usuario a una pantalla válida de la app cuando tocó una notificación del sistema. */
export function escucharTapPush(
  alTocar: (destino: DestinoPush) => void,
): () => void {
  if (Platform.OS === 'web') return () => {};

  const suscripcion = Notificaciones.addNotificationResponseReceivedListener(
    (respuesta) => {
      const datos = respuesta.notification.request.content.data as Record<
        string,
        unknown
      >;
      const destino = DESTINOS_PERMITIDOS.find(
        (valido) => valido === datos.ruta,
      );
      alTocar(destino ?? '/notificaciones');
    },
  );
  return () => suscripcion.remove();
}

/** Convertí cada evento real del backend en una notificación local inmediata. */
export async function mostrarNotificacionLocal(
  titulo: string,
  cuerpo: string,
): Promise<void> {
  await Notificaciones.scheduleNotificationAsync({
    content: { title: titulo, body: cuerpo, sound: true },
    trigger: null,
  });
}
