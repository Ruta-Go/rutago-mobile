import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  Pressable,
  View,
} from 'react-native';
import * as Location from 'expo-location';
import { isAxiosError, type AxiosError } from 'axios';
import { router, Stack } from 'expo-router';

import { MapaIntegrado, type PuntoMapa } from '@/components/mapa/MapaIntegrado';
import { volverSeguro } from '@/utils/navegacion';

import { api, extraerLista } from '../services/api';

/** Contrato real de /rutas/destino: horarios es un arreglo de horas (string). */
type Ruta = {
  id: number;
  nombre?: string;
  origen?: { nombre?: string };
  destino?: { nombre?: string };
  descripcion?: string;
  distanciaKm?: number;
  tiempoEstimadoMinutos?: number;
  costo?: number | null;
  horarios?: string[] | null;
  distanciaMetros?: number;
  paradas?: string[];
};

const UNIVERSIDAD = 'Universidad del Pacífico';

type BarrioCatalogo = { id: number; nombre: string; comuna?: { nombre?: string } };

export default function BuscarViajesScreen() {
  const [origen, setOrigen] = useState(UNIVERSIDAD);
  const [destino, setDestino] = useState('');
  const [barrios, setBarrios] = useState<BarrioCatalogo[]>([]);
  const [resultados, setResultados] = useState<Ruta[]>([]);
  const [cargando, setCargando] = useState(false);
  const [busquedaRealizada, setBusquedaRealizada] = useState(false);
  const [ubicacion, setUbicacion] = useState<{
    latitud: number;
    longitud: number;
  } | null>(null);
  const [motorGeo, setMotorGeo] = useState<string | null>(null);

  /** Catálogo real del backend: barrios de Buenaventura con su comuna. */
  useEffect(() => {
    let activo = true;
    const cargar = async () => {
      try {
        const respuesta = await api.get<unknown>('/barrios', {
          params: { paginaActual: 1, registrosPorPagina: 200 },
        });
        if (activo) setBarrios(extraerLista<BarrioCatalogo>(respuesta.data));
      } catch (error) {
        console.error('No se pudo cargar el catálogo de barrios:', error);
      }
    };
    void cargar();
    return () => {
      activo = false;
    };
  }, []);

  const opciones = [UNIVERSIDAD, ...barrios.map((barrio) => barrio.nombre)].filter(
    (nombre, indice, lista) => lista.indexOf(nombre) === indice,
  );

  const buscarViajes = async () => {
    if (!origen.trim() || !destino.trim()) {
      Alert.alert('Datos incompletos', 'Ingresa el origen y el destino.');
      return;
    }

    try {
      setCargando(true);
      setBusquedaRealizada(false);
      setResultados([]);

      const respuesta = await api.get<unknown>('/rutas/por-paradas', {
        params: { origen: origen.trim(), destino: destino.trim() },
      });

      setResultados(extraerLista<Ruta>(respuesta.data));
      setBusquedaRealizada(true);
    } catch (error) {
      if (isAxiosError(error) && error.response?.status === 404) {
        setResultados([]);
        setBusquedaRealizada(true);
        return;
      }

      const err = error as AxiosError<{ message?: string }>;
      console.error(
        'Error al buscar viajes:',
        err.response?.status,
        err.response?.data,
      );

      Alert.alert(
        'Error de búsqueda',
        err.response?.data?.message ??
          `Error ${err.response?.status ?? 'de conexión'}: ${err.message}`,
      );
    } finally {
      setCargando(false);
    }
  };

  const buscarCercanas = async () => {
    if (cargando) return;

    try {
      setCargando(true);
      const permiso = await Location.requestForegroundPermissionsAsync();
      if (permiso.status !== 'granted') {
        Alert.alert(
          'Permiso de ubicación',
          'Debes permitir el uso de la ubicación para buscar rutas cercanas reales.',
        );
        return;
      }

      const posicion = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      const latitud = posicion.coords.latitude;
      const longitud = posicion.coords.longitude;

      const respuesta = await api.post<unknown>('/rutas/cercanas', {
        latitud,
        longitud,
        radioMetros: 15000,
        limite: 20,
      });
      const cuerpo = respuesta.data as { motor?: string };
      setMotorGeo(cuerpo?.motor ?? null);
      setUbicacion({ latitud, longitud });
      setResultados(extraerLista<Ruta>(respuesta.data));
      setBusquedaRealizada(true);
    } catch (error) {
      const err = error as AxiosError<{ message?: string }>;
      Alert.alert(
        'No se pudo buscar',
        err.response?.data?.message ??
          `Error ${err.response?.status ?? 'de conexión'}: ${err.message}`,
      );
    } finally {
      setCargando(false);
    }
  };

  const puntosMapa: PuntoMapa[] = ubicacion
    ? [
        {
          latitud: ubicacion.latitud,
          longitud: ubicacion.longitud,
          etiqueta: 'Tu ubicación actual',
          tipo: 'pasajero',
        },
      ]
    : [];

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contenido}
        keyboardShouldPersistTaps="handled">
        <Pressable style={styles.volver} onPress={() => volverSeguro()}>
          <Text style={styles.volverTexto}>← Volver</Text>
        </Pressable>

        <Text style={styles.marca}>RUTA GO</Text>
        <Text style={styles.titulo}>Buscar viajes</Text>
        <Text style={styles.descripcion}>
          Encuentra un viaje que se adapte a tu destino
        </Text>

        <View style={styles.tarjeta}>
          <Text style={styles.etiqueta}>Barrio o punto de origen</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.selector}>
            {opciones.map((nombre) => (
              <Pressable
                key={`origen-${nombre}`}
                testID={`origen-${nombre}`}
                onPress={() => setOrigen(nombre)}
                style={[
                  styles.opcion,
                  origen === nombre && styles.opcionSeleccionada,
                ]}>
                <Text
                  style={[
                    styles.opcionTexto,
                    origen === nombre && styles.opcionTextoSeleccionado,
                  ]}>
                  {nombre}
                </Text>
              </Pressable>
            ))}
          </ScrollView>

          <Text style={styles.etiqueta}>Barrio, Universidad o destino</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.selector}>
            {opciones.map((nombre) => (
              <Pressable
                key={`destino-${nombre}`}
                testID={`destino-${nombre}`}
                onPress={() => setDestino(nombre)}
                style={[
                  styles.opcion,
                  destino === nombre && styles.opcionSeleccionada,
                ]}>
                <Text
                  style={[
                    styles.opcionTexto,
                    destino === nombre && styles.opcionTextoSeleccionado,
                  ]}>
                  {nombre}
                </Text>
              </Pressable>
            ))}
          </ScrollView>

          <Pressable
            style={({ pressed }) => [
              styles.boton,
              pressed && styles.botonPresionado,
              cargando && styles.botonDeshabilitado,
            ]}
            onPress={buscarViajes}
            disabled={cargando}>
            {cargando ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.textoBoton}>Buscar viajes</Text>
            )}
          </Pressable>

          <Pressable
            style={({ pressed }) => [
              styles.botonSecundario,
              pressed && styles.botonPresionado,
              cargando && styles.botonDeshabilitado,
            ]}
            onPress={() => void buscarCercanas()}
            disabled={cargando}>
            <Text style={styles.textoBotonSecundario}>
              Buscar rutas cerca de mí
            </Text>
          </Pressable>
        </View>

        {ubicacion ? (
          <View style={styles.tarjetaResultado}>
            <Text style={styles.nombreRuta}>Tu ubicación real</Text>
            <Text style={styles.dato}>
              Latitud: {ubicacion.latitud.toFixed(5)} · Longitud:{' '}
              {ubicacion.longitud.toFixed(5)}
            </Text>
            {motorGeo ? (
              <Text style={styles.dato}>
                Cálculo del backend: {motorGeo === 'postgis' ? 'PostGIS' : 'JavaScript'}
              </Text>
            ) : null}
            <MapaIntegrado puntos={puntosMapa} altura={200} />
          </View>
        ) : null}

        <Text style={styles.resultados}>Viajes disponibles</Text>

        {cargando && (
          <View style={styles.estado}>
            <ActivityIndicator size="large" color="#087A35" />
            <Text style={styles.estadoTexto}>
              Consultando rutas disponibles...
            </Text>
          </View>
        )}

        {!cargando && busquedaRealizada && resultados.length === 0 && (
          <View style={styles.vacio}>
            <Text style={styles.icono}>🚗</Text>
            <Text style={styles.vacioTitulo}>No encontramos rutas</Text>
            <Text style={styles.vacioTexto}>
              {ubicacion
                ? 'No hay rutas registradas dentro de 15 km de tu ubicación real.'
                : `No hay recorridos configurados entre ${origen} y ${destino}. Prueba con otro barrio o con la Universidad del Pacífico.`}
            </Text>
          </View>
        )}

        {!cargando &&
          resultados.map((ruta) => (
            <View key={ruta.id} style={styles.tarjetaResultado}>
              <Text style={styles.nombreRuta}>
                {ruta.nombre ?? 'Ruta disponible'}
              </Text>

              <Text style={styles.dato}>
                Origen: {ruta.origen?.nombre ?? 'No disponible'}
              </Text>
              <Text style={styles.dato}>
                Destino: {ruta.destino?.nombre ?? 'No disponible'}
              </Text>
              {ruta.paradas && ruta.paradas.length > 0 ? (
                <Text style={styles.dato}>
                  Paradas: {ruta.paradas.join(' · ')}
                </Text>
              ) : null}

              {!!ruta.descripcion && (
                <Text style={styles.dato}>Descripción: {ruta.descripcion}</Text>
              )}
              {ruta.distanciaKm != null && (
                <Text style={styles.dato}>Distancia: {ruta.distanciaKm} km</Text>
              )}
              {ruta.distanciaMetros != null && (
                <Text style={styles.dato}>
                  Cerca de ti: {ruta.distanciaMetros} m
                </Text>
              )}
              {ruta.tiempoEstimadoMinutos != null && (
                <Text style={styles.dato}>
                  Tiempo estimado: {ruta.tiempoEstimadoMinutos} minutos
                </Text>
              )}
              {ruta.costo != null && (
                <Text style={styles.dato}>Costo: ${ruta.costo}</Text>
              )}

              <Pressable
                style={styles.boton}
                onPress={() =>
                  router.push(
                    `/crear-viaje?rutaId=${ruta.id}` as Parameters<
                      typeof router.push
                    >[0],
                  )
                }>
                <Text style={styles.textoBoton}>Solicitar este viaje</Text>
              </Pressable>

              <View style={styles.separador} />
              <Text style={styles.subtitulo}>Horarios disponibles</Text>

              {ruta.horarios && ruta.horarios.length > 0 ? (
                <View style={styles.tarjetaHorario}>
                  {ruta.horarios.map((hora, indice) => (
                    <Text key={`${hora}-${indice}`} style={styles.dato}>
                      Salida {indice + 1}: {hora}
                    </Text>
                  ))}
                </View>
              ) : (
                <Text style={styles.vacioTexto}>
                  No hay horarios registrados para esta ruta.
                </Text>
              )}
            </View>
          ))}
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  contenido: {
    padding: 24,
    paddingTop: 45,
    paddingBottom: 35,
  },
  volver: {
    alignSelf: 'flex-start',
    marginBottom: 18,
  },
  volverTexto: {
    color: '#087A35',
    fontSize: 14,
    fontWeight: '700',
  },
  marca: {
    color: '#087A35',
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: 4,
  },
  titulo: {
    color: '#202936',
    fontSize: 27,
    fontWeight: '800',
    marginTop: 24,
  },
  descripcion: {
    color: '#687385',
    fontSize: 14,
    marginTop: 8,
  },
  tarjeta: {
    marginTop: 28,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 16,
  },
  etiqueta: {
    color: '#202936',
    fontWeight: '700',
    marginBottom: 9,
    marginTop: 8,
  },
  selector: {
    marginBottom: 12,
  },
  opcion: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#087A35',
    backgroundColor: '#FFFFFF',
    marginRight: 8,
  },
  opcionSeleccionada: {
    backgroundColor: '#FFD900',
    borderColor: '#E6C200',
  },
  opcionTexto: {
    color: '#1F2937',
    fontSize: 13,
    fontWeight: '700',
  },
  opcionTextoSeleccionado: {
    color: '#111827',
  },
  boton: {
    height: 50,
    backgroundColor: '#087A35',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  botonPresionado: {
    backgroundColor: '#065F28',
  },
  botonDeshabilitado: {
    opacity: 0.7,
  },
  textoBoton: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  botonSecundario: {
    height: 46,
    borderWidth: 1,
    borderColor: '#FFD900',
    backgroundColor: '#FFF9CC',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  textoBotonSecundario: {
    color: '#1F2937',
    fontSize: 14,
    fontWeight: '800',
  },
  resultados: {
    color: '#202936',
    fontSize: 19,
    fontWeight: '800',
    marginTop: 32,
    marginBottom: 15,
  },
  estado: {
    alignItems: 'center',
    padding: 30,
  },
  estadoTexto: {
    color: '#687385',
    marginTop: 12,
  },
  vacio: {
    alignItems: 'center',
    padding: 25,
    marginTop: 5,
    backgroundColor: '#E6F4EC',
    borderRadius: 15,
  },
  icono: {
    fontSize: 38,
  },
  vacioTitulo: {
    color: '#087A35',
    fontWeight: '800',
    fontSize: 16,
    marginTop: 12,
  },
  vacioTexto: {
    color: '#687385',
    textAlign: 'center',
    fontSize: 13,
    marginTop: 8,
    lineHeight: 20,
  },
  tarjetaResultado: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 15,
    padding: 18,
    marginBottom: 18,
    backgroundColor: '#FFFFFF',
  },
  nombreRuta: {
    color: '#087A35',
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 12,
  },
  dato: {
    color: '#374151',
    fontSize: 14,
    marginBottom: 8,
  },
  separador: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 14,
  },
  subtitulo: {
    color: '#202936',
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 12,
  },
  tarjetaHorario: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 14,
    marginBottom: 4,
  },
});
