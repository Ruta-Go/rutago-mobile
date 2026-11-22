import * as Location from 'expo-location';
import * as SecureStore from 'expo-secure-store';
import * as TaskManager from 'expo-task-manager';
import { Platform } from 'react-native';

import { API_URL } from '@/services/api';

export const TAREA_GPS_FONDO = 'rutago_gps_fondo';

const CLAVE_VEHICULO = 'rutago_gps_vehiculo';
const CLAVE_VIAJE = 'rutago_gps_viaje';
const CLAVE_ESTADO = 'rutago_gps_estado';

type DatosTarea = {
  locations?: Location.LocationObject[];
};

let tareaDefinida = false;

/**
 * Definí la tarea una sola vez. El envío usa el token guardado y el endpoint real,
 * sin depender de que la pantalla esté abierta cuando el sistema entrega la coordenada.
 */
function definirTarea(): void {
  if (tareaDefinida || Platform.OS === 'web') return;

  TaskManager.defineTask(TAREA_GPS_FONDO, async ({ data, error }) => {
    if (error) return;
    const ubicaciones = (data as DatosTarea | null)?.locations;
    const ultima = ubicaciones?.[ubicaciones.length - 1];
    if (!ultima) return;

    try {
      const [token, vehiculoId, estadoId] = await Promise.all([
        SecureStore.getItemAsync('rutago_token'),
        SecureStore.getItemAsync(CLAVE_VEHICULO),
        SecureStore.getItemAsync(CLAVE_ESTADO),
      ]);
      if (!token || !vehiculoId) return;

      const velocidad = ultima.coords.speed;
      const cuerpo: Record<string, number> = {
        latitud: ultima.coords.latitude,
        longitud: ultima.coords.longitude,
        estadoId: Number(estadoId) || 2,
      };
      if (velocidad != null && Number.isFinite(velocidad)) {
        cuerpo.velocidadActual = Math.round(velocidad * 3.6 * 10) / 10;
      }

      await fetch(`${API_URL}/api/vehiculos/${vehiculoId}/ubicacion`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(cuerpo),
      });
    } catch (error) {
      console.warn('[gps-fondo] no se pudo reportar la coordenada', error);
    }
  });

  tareaDefinida = true;
}

/** Guardé el contexto del viaje y pedí el permiso de ubicación en segundo plano. */
export async function iniciarGpsFondo(
  vehiculoId: number,
  viajeId: number,
  estadoId: number,
): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  definirTarea();

  const permiso = await Location.requestBackgroundPermissionsAsync();
  if (permiso.status !== 'granted') return false;

  await Promise.all([
    SecureStore.setItemAsync(CLAVE_VEHICULO, String(vehiculoId)),
    SecureStore.setItemAsync(CLAVE_VIAJE, String(viajeId)),
    SecureStore.setItemAsync(CLAVE_ESTADO, String(estadoId)),
  ]);

  await Location.startLocationUpdatesAsync(TAREA_GPS_FONDO, {
    accuracy: Location.Accuracy.High,
    timeInterval: 15000,
    distanceInterval: 10,
    showsBackgroundLocationIndicator: true,
    foregroundService: {
      notificationTitle: 'RutaGo reportando ubicación',
      notificationBody: 'Tu viaje está enviando la posición del vehículo.',
      notificationColor: '#087A35',
    },
  });
  return true;
}

/** Detuve el reporte en segundo plano y limpié el contexto guardado. */
export async function detenerGpsFondo(): Promise<void> {
  if (Platform.OS === 'web') return;
  const activo = await Location.hasStartedLocationUpdatesAsync(
    TAREA_GPS_FONDO,
  );
  if (activo) await Location.stopLocationUpdatesAsync(TAREA_GPS_FONDO);
  await Promise.all([
    SecureStore.deleteItemAsync(CLAVE_VEHICULO),
    SecureStore.deleteItemAsync(CLAVE_VIAJE),
    SecureStore.deleteItemAsync(CLAVE_ESTADO),
  ]);
}

/** Consulté si el sistema todavía está reportando para el viaje anterior. */
export async function gpsFondoActivo(): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  return Location.hasStartedLocationUpdatesAsync(TAREA_GPS_FONDO);
}
