import Constants from 'expo-constants';
import * as Notificaciones from 'expo-notifications';
import { Platform } from 'react-native';

import { api, extraerDatos } from '@/services/api';

let manejadorInstalado = false;

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

/**
 * Decidí a qué pantalla lleva una notificación según sus datos: si trae un
 * viaje válido abro su detalle; si trae una ruta conocida la respeto y si no,
 * caigo en el centro de notificaciones. Nunca navego a rutas arbitrarias.
 */
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
  /** Llega una notificación con la app abierta (notificationReceived). */
  alRecibir?: (notificacion: Notificaciones.Notification) => void;
  /** El usuario tocó una notificación (notificationResponse). */
  alTocar: (destino: DestinoPush) => void;
};

/**
 * Instalé los dos manejadores del sistema: notificación recibida e interacción
 * del usuario. También atiendo el toque que abrió la app estando cerrada, que
 * ocurre antes de que exista el listener.
 */
export function escucharNotificaciones({
  alRecibir,
  alTocar,
}: ManejadoresNotificacion): () => void {
  if (Platform.OS === 'web') return () => {};

  // El toque que abrió la app puede llegar por getLastNotificationResponse y
  // también por el listener: recuerdo el último atendido para no navegar dos veces.
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

/**
 * Pedí al backend el total real de avisos sin leer y lo puse como contador del
 * ícono de la app. Sin red no invento un número: devuelvo null y dejo el último.
 */
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

/** Borré el contador del ícono al cerrar sesión para no dejar avisos de otra cuenta. */
export async function limpiarContador(): Promise<void> {
  if (Platform.OS === 'web') return;
  try {
    await Notificaciones.setBadgeCountAsync(0);
  } catch {
    // Sin permiso de notificaciones el sistema rechaza el contador: no es un error de la app.
  }
}

/** Convertí cada evento real del backend en una notificación local inmediata. */
export async function mostrarNotificacionLocal(
  titulo: string,
  cuerpo: string,
  datos?: Record<string, unknown>,
): Promise<void> {
  await Notificaciones.scheduleNotificationAsync({
    // Guardé los datos (por ejemplo viajeId) para que al tocarla se abra ese viaje.
    content: datos
      ? { title: titulo, body: cuerpo, sound: true, data: datos }
      : { title: titulo, body: cuerpo, sound: true },
    trigger: null,
  });
}
