import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  Pressable,
  View,
} from 'react-native';
import { isAxiosError, type AxiosError } from 'axios';
import { router, Stack } from 'expo-router';

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
};

export default function BuscarViajesScreen() {
  const [origen, setOrigen] = useState('');
  const [destino, setDestino] = useState('');
  const [resultados, setResultados] = useState<Ruta[]>([]);
  const [cargando, setCargando] = useState(false);
  const [busquedaRealizada, setBusquedaRealizada] = useState(false);

  const normalizarTexto = (texto: string) =>
    texto
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim()
      .toLowerCase();

  const buscarViajes = async () => {
    if (!origen.trim() || !destino.trim()) {
      Alert.alert('Datos incompletos', 'Ingresa el origen y el destino.');
      return;
    }

    try {
      setCargando(true);
      setBusquedaRealizada(false);
      setResultados([]);

      const respuesta = await api.get<unknown>(
        `/rutas/destino/${encodeURIComponent(destino.trim())}`,
      );
      const rutas = extraerLista<Ruta>(respuesta.data);
      const origenBuscado = normalizarTexto(origen);

      const rutasFiltradas = rutas.filter((ruta) =>
        normalizarTexto(ruta.origen?.nombre ?? '').includes(origenBuscado),
      );

      setResultados(rutasFiltradas);
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

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contenido}
        keyboardShouldPersistTaps="handled">
        <Pressable style={styles.volver} onPress={() => router.back()}>
          <Text style={styles.volverTexto}>← Volver</Text>
        </Pressable>

        <Text style={styles.marca}>RUTA GO</Text>
        <Text style={styles.titulo}>Buscar viajes</Text>
        <Text style={styles.descripcion}>
          Encuentra un viaje que se adapte a tu destino
        </Text>

        <View style={styles.tarjeta}>
          <Text style={styles.etiqueta}>Ciudad de origen</Text>
          <TextInput
            style={styles.input}
            placeholder="¿Desde dónde sales?"
            placeholderTextColor="#9CA3AF"
            value={origen}
            onChangeText={setOrigen}
            autoCapitalize="words"
          />

          <Text style={styles.etiqueta}>Ciudad de destino</Text>
          <TextInput
            style={styles.input}
            placeholder="¿Hacia dónde vas?"
            placeholderTextColor="#9CA3AF"
            value={destino}
            onChangeText={setDestino}
            autoCapitalize="words"
          />

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
        </View>

        <Text style={styles.resultados}>Viajes disponibles</Text>

        {cargando && (
          <View style={styles.estado}>
            <ActivityIndicator size="large" color="#07883F" />
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
              No hay recorridos registrados desde {origen} hasta {destino}.
              Intenta con otras ciudades.
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

              {!!ruta.descripcion && (
                <Text style={styles.dato}>Descripción: {ruta.descripcion}</Text>
              )}
              {ruta.distanciaKm != null && (
                <Text style={styles.dato}>Distancia: {ruta.distanciaKm} km</Text>
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
    color: '#07883F',
    fontSize: 14,
    fontWeight: '700',
  },
  marca: {
    color: '#07883F',
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
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 10,
    paddingHorizontal: 14,
    color: '#202936',
    marginBottom: 17,
  },
  boton: {
    height: 50,
    backgroundColor: '#07883F',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  botonPresionado: {
    backgroundColor: '#066C32',
  },
  botonDeshabilitado: {
    opacity: 0.7,
  },
  textoBoton: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
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
    color: '#07883F',
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
    color: '#07883F',
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
