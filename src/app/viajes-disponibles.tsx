import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { isAxiosError, type AxiosError } from 'axios';
import { router, Stack } from 'expo-router';

import { volverSeguro } from '@/utils/navegacion';

import { api, extraerLista } from '@/services/api';
import type { Viaje } from '@/types/rutago';
import {
  fechaLegible,
  idEstado,
  nombreEstado,
  tituloRuta,
} from '@/utils/viajes';

function mensajeError(error: unknown): string {
  const err = error as AxiosError<{ message?: string; error?: string }>;
  if (err.response?.data?.message) return err.response.data.message;
  if (err.response?.data?.error) return err.response.data.error;
  if (isAxiosError(error)) {
    return `Error ${err.response?.status ?? 'de conexión'}: ${err.message}`;
  }
  return 'No se pudo completar la operación.';
}

export default function ViajesDisponiblesScreen() {
  const [viajes, setViajes] = useState<Viaje[]>([]);
  const [cargando, setCargando] = useState(true);
  const [refrescando, setRefrescando] = useState(false);
  const [procesando, setProcesando] = useState<number | null>(null);

  const cargar = useCallback(async () => {
    try {
      const respuesta = await api.get<unknown>('/viajes/disponibles-pasajero');
      const lista = extraerLista<Viaje>(respuesta.data).filter(
        (viaje) => idEstado(viaje) === 1,
      );
      setViajes(lista);
    } catch (error) {
      console.error('Error al cargar viajes disponibles:', mensajeError(error));
      Alert.alert('Error', mensajeError(error));
    } finally {
      setCargando(false);
      setRefrescando(false);
    }
  }, []);

  const unirse = (viaje: Viaje) => {
    Alert.alert('Unirse al viaje', `¿Quieres unirte al viaje #${viaje.id}?`, [
      { text: 'Volver', style: 'cancel' },
      {
        text: 'Unirme',
        onPress: async () => {
          try {
            setProcesando(viaje.id);
            const respuesta = await api.post<{ message?: string }>(
              `/viajes/${viaje.id}/unirse`,
            );
            Alert.alert('Listo', respuesta.data?.message ?? 'Te uniste al viaje.');
            await cargar();
          } catch (error) {
            Alert.alert('Error', mensajeError(error));
          } finally {
            setProcesando(null);
          }
        },
      },
    ]);
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contenido}
        refreshControl={
          <RefreshControl
            refreshing={refrescando}
            onRefresh={() => {
              setRefrescando(true);
              void cargar();
            }}
            colors={['#07883F']}
          />
        }>
        <Pressable style={styles.volver} onPress={() => volverSeguro()}>
          <Text style={styles.volverTexto}>← Volver</Text>
        </Pressable>

        <Text style={styles.marca}>RUTA GO</Text>
        <Text style={styles.titulo}>Viajes disponibles</Text>
        <Text style={styles.descripcion}>
          Viajes reales en estado «Buscando conductor» a los que todavía no te has unido.
        </Text>

        <Pressable
          style={styles.botonPrimario}
          onPress={() =>
            router.push('/crear-viaje' as Parameters<typeof router.push>[0])
          }>
          <Text style={styles.textoBoton}>Solicitar un viaje nuevo</Text>
        </Pressable>

        {cargando && (
          <View style={styles.estado}>
            <ActivityIndicator size="large" color="#07883F" />
            <Text style={styles.estadoTexto}>Consultando viajes...</Text>
          </View>
        )}

        {!cargando && viajes.length === 0 && (
          <View style={styles.vacio}>
            <Text style={styles.icono}>🚐</Text>
            <Text style={styles.vacioTitulo}>No hay viajes disponibles</Text>
            <Text style={styles.vacioTexto}>
              Cuando haya solicitudes abiertas, aparecerán aquí.
            </Text>
          </View>
        )}

        {!cargando &&
          viajes.map((viaje) => (
            <View key={viaje.id} style={styles.tarjeta}>
              <View style={styles.cabecera}>
                <Text style={styles.nombreRuta}>{tituloRuta(viaje)}</Text>
                <Text style={styles.estadoChip}>{nombreEstado(viaje)}</Text>
              </View>
              <Text style={styles.dato}>Solicitud #{viaje.id}</Text>
              <Text style={styles.dato}>
                Horario: {viaje.horario?.horaSalida ?? 'No disponible'}
              </Text>
              <Text style={styles.dato}>Creado: {fechaLegible(viaje.createdAt)}</Text>
              <Text style={styles.dato}>
                Pasajeros: {viaje.pasajeros?.length ?? 0}
              </Text>
              <Pressable
                style={[styles.boton, procesando === viaje.id && styles.botonDeshabilitado]}
                onPress={() => unirse(viaje)}
                disabled={procesando === viaje.id}>
                {procesando === viaje.id ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.textoBoton}>Unirme a este viaje</Text>
                )}
              </Pressable>
            </View>
          ))}
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
  botonPrimario: {
    backgroundColor: '#07883F',
    borderRadius: 10,
    paddingVertical: 13,
    alignItems: 'center',
    marginTop: 22,
  },
  textoBoton: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
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
  tarjeta: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 15,
    padding: 18,
    marginTop: 20,
  },
  cabecera: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  nombreRuta: { color: '#07883F', fontSize: 17, fontWeight: '800', flex: 1, marginRight: 8 },
  estadoChip: {
    color: '#202936',
    fontSize: 11,
    fontWeight: '700',
    backgroundColor: '#E6F4EC',
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 10,
  },
  dato: { color: '#374151', fontSize: 14, marginBottom: 7 },
  boton: {
    backgroundColor: '#07883F',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 14,
  },
  botonDeshabilitado: { opacity: 0.7 },
});
