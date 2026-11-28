import Constants, { ExecutionEnvironment } from 'expo-constants';
import * as Notificaciones from 'expo-notifications';
import { Platform } from 'react-native';

import { api, extraerDatos } from '@/services/api';

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

  const enExpoGo =
    Constants.executionEnvironment === ExecutionEnvironment.StoreClient ||
    Constants.appOwnership === 'expo';
  if (Platform.OS === 'android' && enExpoGo) {
    return null;
  }

  try {
    const token = await Notificaciones.getExpoPushTokenAsync({ projectId });
    await enviarTokenAlBackend(token.data);
    return token.data;
  } catch (error) {
    console.warn('[notificaciones] no se pudo obtener el token remoto', error);
    return null;
  }
}

export type DestinoPush =
  | '/notificaciones'
  | '/mis-viajes'
  | '/dashboard'
  | `/detalle-viaje?viajeId=${number}`;

const DESTINOS_PERMITIDOS: DestinoPush[] = [
  '/notificaciones',
  '/mis-viajes',
  '/dashboard',
];

export function destinoDeNotificacion(datos: unknown): DestinoPush {
  const registro =
    datos && typeof datos === 'object' ? (datos as Record<string, unknown>) : {};

  const viajeId = Number(registro.viajeId);
  if (Number.isInteger(viajeId) && viajeId > 0) {
    return `/detalle-viaje?viajeId=${viajeId}`;
  }

  const ruta = DESTINOS_PERMITIDOS.find((valido) => valido === registro.ruta);
  return ruta ?? '/notificaciones';
}

type ManejadoresNotificacion = {
  alRecibir?: (notificacion: Notificaciones.Notification) => void;
  alTocar: (destino: DestinoPush) => void;
};

export function escucharNotificaciones({
  alRecibir,
  alTocar,
}: ManejadoresNotificacion): () => void {
  if (Platform.OS === 'web') return () => {};

  let ultimoAtendido: string | null = null;

  const atenderRespuesta = (respuesta: Notificaciones.NotificationResponse) => {
    if (
      respuesta.actionIdentifier !== Notificaciones.DEFAULT_ACTION_IDENTIFIER
    ) {
      return;
    }
    const identificador = respuesta.notification.request.identifier;
    if (identificador && identificador === ultimoAtendido) return;
    ultimoAtendido = identificador ?? null;
    alTocar(destinoDeNotificacion(respuesta.notification.request.content.data));
  };

  const recibida = Notificaciones.addNotificationReceivedListener(
    (notificacion) => alRecibir?.(notificacion),
  );
  const tocada =
    Notificaciones.addNotificationResponseReceivedListener(atenderRespuesta);

  const inicial = Notificaciones.getLastNotificationResponse();
  if (inicial) {
    atenderRespuesta(inicial);
    Notificaciones.clearLastNotificationResponse();
  }

  return () => {
    recibida.remove();
    tocada.remove();
  };
}

/** Alias conservado para pantallas que todavía usaban la API anterior. */
export function escucharTapPush(
  alTocar: (destino: DestinoPush) => void,
): () => void {
  return escucharNotificaciones({ alTocar });
}

export async function sincronizarContador(): Promise<number | null> {
  if (Platform.OS === 'web') return null;
  try {
    const respuesta = await api.get<unknown>('/notificaciones/no-leidas');
    const total = Number(
      extraerDatos<{ total?: number } | null>(respuesta.data)?.total,
    );
    if (!Number.isInteger(total) || total < 0) return null;
    await Notificaciones.setBadgeCountAsync(total);
    return total;
  } catch (error) {
    console.warn('[notificaciones] no se pudo actualizar el contador', error);
    return null;
  }
}

export async function limpiarContador(): Promise<void> {
  if (Platform.OS === 'web') return;
  try {
    await Notificaciones.setBadgeCountAsync(0);
  } catch {
  }
}

/** Convertí cada evento real del backend en una notificación local inmediata. */
export async function mostrarNotificacionLocal(
  titulo: string,
  cuerpo: string,
  datos?: Record<string, unknown>,
): Promise<void> {
  await Notificaciones.scheduleNotificationAsync({
    content: datos
      ? { title: titulo, body: cuerpo, sound: true, data: datos }
      : { title: titulo, body: cuerpo, sound: true },
    trigger: null,
  });
}
