import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import * as Location from 'expo-location';
import { isAxiosError, type AxiosError } from 'axios';
import { Stack, useLocalSearchParams } from 'expo-router';

import { MapaIntegrado, type PuntoMapa } from '@/components/mapa/MapaIntegrado';
import { volverSeguro } from '@/utils/navegacion';

import {
  ESTADOS_VEHICULO,
  ESTADOS_VIAJE,
} from '@/constants/estados';
import { ROLES } from '@/constants/roles';
import { useSesion } from '@/hooks/useSesion';
import { api, extraerDatos, extraerLista } from '@/services/api';
import { mutarConCola } from '@/services/colaOffline';
import {
  detenerGpsFondo,
  gpsFondoActivo,
  iniciarGpsFondo,
} from '@/services/gpsFondo';
import type { Viaje } from '@/types/rutago';
import { idEstado, nombreEstado, tituloRuta } from '@/utils/viajes';

type UltimoReporte = {
  latitud: number;
  longitud: number;
  velocidadKmh: number | null;
  fecha: string;
};

type UbicacionBackend = {
  latitud?: number | string | null;
  longitud?: number | string | null;
  velocidadActual?: number | string | null;
  ultimaActualizacion?: string;
  fecha?: string;
};

type SuscripcionGPS = Awaited<ReturnType<typeof Location.watchPositionAsync>>;

function mensajeError(error: unknown): string {
  const err = error as AxiosError<{ message?: string }>;
  if (err.response?.data?.message) return err.response.data.message;
  if (isAxiosError(error)) {
    return `Error ${err.response?.status ?? 'de conexión'}: ${err.message}`;
  }
  return 'No se pudo reportar la ubicación.';
}

export default function ReportarUbicacionScreen() {
  const params = useLocalSearchParams<{ viajeId?: string }>();
  const { usuario } = useSesion();
  const rolId = Number(usuario?.rolId ?? usuario?.rol?.id);
  const [viajes, setViajes] = useState<Viaje[]>([]);
  const [viajeId, setViajeId] = useState<number | null>(
    params.viajeId ? Number(params.viajeId) : null,
  );
  const [cargando, setCargando] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [monitoreando, setMonitoreando] = useState(false);
  const [fondoActivo, setFondoActivo] = useState(false);
  const [ultimoReporte, setUltimoReporte] = useState<UltimoReporte | null>(null);
  const suscripcion = useRef<SuscripcionGPS | null>(null);

  const cargar = useCallback(async () => {
    try {
      const respuesta = await api.get<unknown>('/viajes/me/mis-viajes');
      const activos = extraerLista<Viaje>(respuesta.data).filter((viaje) => {
        const id = idEstado(viaje);
        return (
          (id === ESTADOS_VIAJE.ACEPTADO || id === ESTADOS_VIAJE.EN_CURSO) &&
          Boolean(viaje.vehiculo?.id)
        );
      });
      setViajes(activos);
      if (params.viajeId && !activos.some((viaje) => viaje.id === Number(params.viajeId))) {
        Alert.alert('Aviso', 'El viaje indicado ya no tiene un vehículo asignado.');
        setViajeId(null);
      }
    } catch (error) {
      console.error('Error al cargar viajes activos:', mensajeError(error));
      Alert.alert('Error', mensajeError(error));
    } finally {
      setCargando(false);
    }
  }, [params.viajeId]);

  useEffect(() => {
    void Promise.resolve().then(cargar);
  }, [cargar]);

  useEffect(
    () => () => {
      suscripcion.current?.remove();
      suscripcion.current = null;
    },
    [],
  );

  // Recuperé el estado real del reporte en segundo plano al abrir la pantalla.
  useEffect(() => {
    let activo = true;
    void gpsFondoActivo().then((valor) => {
      if (activo) setFondoActivo(valor);
    });
    return () => {
      activo = false;
    };
  }, []);

  const viaje = viajes.find((item) => item.id === viajeId) ?? null;
  const vehiculoId = viaje?.vehiculo?.id;

  useEffect(() => {
    if (!vehiculoId) return;
    let activo = true;

    (async () => {
      try {
        const respuesta = await api.get<unknown>(
          `/vehiculos/${vehiculoId}/ubicacion`,
        );
        const dato = extraerDatos<UbicacionBackend>(respuesta.data);
        if (
          !activo ||
          dato.latitud == null ||
          dato.longitud == null ||
          !Number.isFinite(Number(dato.latitud)) ||
          !Number.isFinite(Number(dato.longitud))
        ) {
          return;
        }
        setUltimoReporte({
          latitud: Number(dato.latitud),
          longitud: Number(dato.longitud),
          velocidadKmh:
            dato.velocidadActual == null ? null : Number(dato.velocidadActual),
          fecha:
            dato.ultimaActualizacion ??
            dato.fecha ??
            new Date().toLocaleString('es-CO'),
        });
      } catch {
        // Sin reporte previo no hay coordenadas reales que mostrar.
      }
    })();

    return () => {
      activo = false;
    };
  }, [vehiculoId]);

  const reportar = useCallback(
    async (latitud: number, longitud: number, velocidad: number | null) => {
      if (!viaje?.vehiculo?.id) {
        Alert.alert('Sin vehículo', 'Selecciona un viaje con vehículo asignado.');
        return false;
      }
      const estadoId =
        idEstado(viaje) === ESTADOS_VIAJE.EN_CURSO
          ? ESTADOS_VEHICULO.EN_RUTA
          : ESTADOS_VEHICULO.PROXIMO;
      const velocidadKmh =
        velocidad != null && Number.isFinite(velocidad)
          ? Math.round(velocidad * 3.6 * 10) / 10
          : null;

      try {
        setEnviando(true);
        const cuerpo: Record<string, number> = {
          latitud,
          longitud,
          estadoId,
        };
        if (velocidadKmh != null) cuerpo.velocidadActual = velocidadKmh;

        const resultado = await mutarConCola({
          metodo: 'PUT',
          url: `/vehiculos/${viaje.vehiculo.id}/ubicacion`,
          cuerpo,
        });

        if (!resultado.ok) throw resultado.error;

        /**
         * Sin red conservo en la cola sólo la posición más reciente del
         * vehículo: al reconectar se envía esa y no el histórico de la caída.
         * No marco "último reporte" porque todavía no llegó al servidor.
         */
        if (resultado.offline) {
          if (!monitoreando) {
            Alert.alert(
              'Sin conexión',
              'La ubicación quedó guardada y se enviará cuando vuelva la red.',
            );
          }
          return true;
        }

        setUltimoReporte({
          latitud,
          longitud,
          velocidadKmh,
          fecha: new Date().toLocaleTimeString('es-CO'),
        });
        return true;
      } catch (error) {
        console.warn('Error al reportar ubicación:', mensajeError(error));
        if (!monitoreando) Alert.alert('Error', mensajeError(error));
        return false;
      } finally {
        setEnviando(false);
      }
    },
    [monitoreando, viaje],
  );

  const reportarUnaVez = async () => {
    if (rolId !== ROLES.CONDUCTOR) {
      Alert.alert('Rol no permitido', 'Sólo un conductor puede reportar ubicación.');
      return;
    }
    try {
      const permiso = await Location.requestForegroundPermissionsAsync();
      if (permiso.status !== 'granted') {
        Alert.alert('Permiso denegado', 'Debes permitir el uso de la ubicación.');
        return;
      }
      const activos = await Location.hasServicesEnabledAsync();
      if (!activos) {
        Alert.alert('Ubicación desactivada', 'Activa el GPS del dispositivo.');
        return;
      }
      const posicion = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      const ok = await reportar(
        posicion.coords.latitude,
        posicion.coords.longitude,
        posicion.coords.speed,
      );
      if (ok) Alert.alert('Listo', 'Tu coordenada real fue reportada.');
    } catch (error) {
      Alert.alert('Error', mensajeError(error));
    }
  };

  const alternarMonitoreo = async () => {
    if (rolId !== ROLES.CONDUCTOR) {
      Alert.alert('Rol no permitido', 'Sólo un conductor puede reportar ubicación.');
      return;
    }
    if (monitoreando) {
      suscripcion.current?.remove();
      suscripcion.current = null;
      setMonitoreando(false);
      return;
    }
    try {
      const permiso = await Location.requestForegroundPermissionsAsync();
      if (permiso.status !== 'granted') {
        Alert.alert('Permiso denegado', 'Debes permitir el uso de la ubicación.');
        return;
      }
      suscripcion.current = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 10000,
          distanceInterval: 10,
        },
        (posicion) => {
          void reportar(
            posicion.coords.latitude,
            posicion.coords.longitude,
            posicion.coords.speed,
          );
        },
      );
      setMonitoreando(true);
      Alert.alert('Monitoreo activo', 'Reportaremos tu coordenada cada 10 segundos.');
    } catch (error) {
      Alert.alert('Error', mensajeError(error));
    }
  };

  const alternarFondo = async () => {
    if (rolId !== ROLES.CONDUCTOR) {
      Alert.alert('Rol no permitido', 'Sólo un conductor puede reportar ubicación.');
      return;
    }
    if (!viaje?.vehiculo?.id) {
      Alert.alert('Sin vehículo', 'Selecciona un viaje con vehículo asignado.');
      return;
    }
    try {
      if (fondoActivo) {
        await detenerGpsFondo();
        setFondoActivo(false);
        Alert.alert('GPS en segundo plano detenido', 'Dejamos de reportar la posición.');
        return;
      }
      const estadoId =
        idEstado(viaje) === ESTADOS_VIAJE.EN_CURSO
          ? ESTADOS_VEHICULO.EN_RUTA
          : ESTADOS_VEHICULO.PROXIMO;
      const iniciado = await iniciarGpsFondo(
        viaje.vehiculo.id,
        viaje.id,
        estadoId,
      );
      if (!iniciado) {
        Alert.alert(
          'Permiso denegado',
          'Debes permitir la ubicación en segundo plano para usar esta opción.',
        );
        return;
      }
      setFondoActivo(true);
      Alert.alert(
        'GPS en segundo plano activo',
        'Reportaremos tu coordenada aunque salgas de la pantalla.',
      );
    } catch (error) {
      Alert.alert('Error', mensajeError(error));
    }
  };

  const puntosMapa: PuntoMapa[] = ultimoReporte
    ? [
        {
          latitud: ultimoReporte.latitud,
          longitud: ultimoReporte.longitud,
          etiqueta: `Vehículo ${viaje?.vehiculo?.placa ?? ''}`.trim(),
          tipo: 'vehiculo',
        },
      ]
    : [];

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />

      <ScrollView style={styles.container} contentContainerStyle={styles.contenido}>
        <Pressable style={styles.volver} onPress={() => volverSeguro()}>
          <Text style={styles.volverTexto}>← Volver</Text>
        </Pressable>

        <Text style={styles.marca}>RUTA GO</Text>
        <Text style={styles.titulo}>Reportar ubicación</Text>
        <Text style={styles.descripcion}>
          Envía tu coordenada real del GPS al backend y a los pasajeros del viaje.
        </Text>

        {rolId !== ROLES.CONDUCTOR ? (
          <View style={styles.vacio}>
            <Text style={styles.icono}>🔒</Text>
            <Text style={styles.vacioTitulo}>Acceso de conductor</Text>
            <Text style={styles.vacioTexto}>
              El reporte de GPS está disponible únicamente para conductores con un viaje activo.
            </Text>
          </View>
        ) : cargando ? (
          <View style={styles.estado}>
            <ActivityIndicator size="large" color="#07883F" />
            <Text style={styles.estadoTexto}>Consultando viajes activos...</Text>
          </View>
        ) : viajes.length === 0 ? (
          <View style={styles.vacio}>
            <Text style={styles.icono}>📍</Text>
            <Text style={styles.vacioTitulo}>No tienes viajes con vehículo asignado</Text>
            <Text style={styles.vacioTexto}>
              Acepta una solicitud y selecciona un vehículo para habilitar el GPS.
            </Text>
          </View>
        ) : (
          <>
            <Text style={styles.subtitulo}>Viaje activo</Text>
            {viajes.map((item) => (
              <Pressable
                key={item.id}
                style={[
                  styles.opcion,
                  viajeId === item.id && styles.opcionSeleccionada,
                ]}
                onPress={() => setViajeId(item.id)}>
                <Text style={styles.opcionTitulo}>{tituloRuta(item)}</Text>
                <Text style={styles.opcionDetalle}>
                  #{item.id} · {nombreEstado(item)} · Vehículo {item.vehiculo?.placa}
                </Text>
              </Pressable>
            ))}

            {viaje && (
              <>
                <View style={styles.tarjeta}>
                  <Text style={styles.dato}>Vehículo: {viaje.vehiculo?.placa ?? '—'}</Text>
                  <Text style={styles.dato}>Estado del viaje: {nombreEstado(viaje)}</Text>
                  <Pressable
                    style={[styles.boton, enviando && styles.botonDeshabilitado]}
                    onPress={() => void reportarUnaVez()}
                    disabled={enviando || monitoreando}>
                    {enviando ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <Text style={styles.textoBoton}>Enviar mi ubicación actual</Text>
                    )}
                  </Pressable>
                  <Pressable
                    style={[styles.botonSecundario, enviando && styles.botonDeshabilitado]}
                    onPress={() => void alternarMonitoreo()}
                    disabled={enviando}>
                    <Text style={styles.textoBotonSecundario}>
                      {monitoreando ? 'Detener reporte automático' : 'Reportar cada 10 segundos'}
                    </Text>
                  </Pressable>
                  <Pressable
                    style={styles.botonSecundario}
                    onPress={() => void alternarFondo()}>
                    <Text style={styles.textoBotonSecundario}>
                      {fondoActivo
                        ? 'Detener GPS en segundo plano'
                        : 'Activar GPS en segundo plano'}
                    </Text>
                  </Pressable>
                </View>

                {ultimoReporte && (
                  <View style={styles.tarjetaReporte}>
                    <Text style={styles.resumenTitulo}>Último reporte real</Text>
                    <Text style={styles.dato}>
                      Latitud: {ultimoReporte.latitud.toFixed(6)}
                    </Text>
                    <Text style={styles.dato}>
                      Longitud: {ultimoReporte.longitud.toFixed(6)}
                    </Text>
                    <Text style={styles.dato}>
                      Velocidad: {ultimoReporte.velocidadKmh ?? '—'} km/h
                    </Text>
                    <Text style={styles.dato}>Hora: {ultimoReporte.fecha}</Text>
                    <MapaIntegrado puntos={puntosMapa} altura={220} />
                  </View>
                )}
              </>
            )}
          </>
        )}
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  contenido: { padding: 24, paddingTop: 65, paddingBottom: 40 },
  volver: { marginBottom: 22 },
  volverTexto: { color: '#07883F', fontSize: 15, fontWeight: '700' },
  marca: { color: '#07883F', fontSize: 22, fontWeight: '900', letterSpacing: 4 },
  titulo: { color: '#202936', fontSize: 27, fontWeight: '800', marginTop: 16 },
  descripcion: { color: '#687385', fontSize: 14, marginTop: 8, lineHeight: 20 },
  estado: { alignItems: 'center', padding: 35 },
  estadoTexto: { color: '#687385', marginTop: 12 },
  vacio: {
    alignItems: 'center',
    padding: 25,
    marginTop: 28,
    backgroundColor: '#E6F4EC',
    borderRadius: 15,
  },
  icono: { fontSize: 38 },
  vacioTitulo: { color: '#07883F', fontWeight: '800', fontSize: 16, marginTop: 12 },
  vacioTexto: {
    color: '#687385',
    textAlign: 'center',
    fontSize: 13,
    marginTop: 8,
    lineHeight: 20,
  },
  subtitulo: {
    color: '#202936',
    fontSize: 17,
    fontWeight: '800',
    marginTop: 28,
    marginBottom: 12,
  },
  opcion: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 14,
    marginBottom: 9,
  },
  opcionSeleccionada: { borderColor: '#07883F', backgroundColor: '#E6F4EC' },
  opcionTitulo: { color: '#202936', fontSize: 15, fontWeight: '800' },
  opcionDetalle: { color: '#687385', fontSize: 13, marginTop: 4 },
  tarjeta: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 15,
    padding: 18,
    marginTop: 24,
  },
  tarjetaReporte: {
    backgroundColor: '#F3F8F5',
    borderRadius: 15,
    padding: 18,
    marginTop: 18,
  },
  resumenTitulo: { color: '#07883F', fontWeight: '800', marginBottom: 10 },
  dato: { color: '#374151', fontSize: 14, marginBottom: 7 },
  boton: {
    backgroundColor: '#07883F',
    borderRadius: 10,
    paddingVertical: 13,
    alignItems: 'center',
    marginTop: 14,
  },
  botonSecundario: {
    borderWidth: 1,
    borderColor: '#07883F',
    borderRadius: 10,
    paddingVertical: 13,
    alignItems: 'center',
    marginTop: 10,
  },
  botonDeshabilitado: { opacity: 0.7 },
  textoBoton: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
  textoBotonSecundario: { color: '#07883F', fontSize: 15, fontWeight: '700' },
  botonMapa: { alignSelf: 'flex-start', marginTop: 10 },
  textoBotonMapa: { color: '#07883F', fontSize: 13, fontWeight: '700' },
});
