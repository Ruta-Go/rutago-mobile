import { useCallback, useEffect, useState } from 'react';
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
import { router, Stack, useLocalSearchParams } from 'expo-router';

import { NOMBRES_ESTADO_VEHICULO } from '@/constants/estados';
import { api } from '@/services/api';
import { listarVehiculos } from '@/services/catalogos';
import type { Vehiculo, Viaje } from '@/types/rutago';
import { tituloRuta } from '@/utils/viajes';

function mensajeError(error: unknown): string {
  const err = error as AxiosError<{ message?: string }>;
  if (err.response?.data?.message) return err.response.data.message;
  if (isAxiosError(error)) {
    return `Error ${err.response?.status ?? 'de conexión'}: ${err.message}`;
  }
  return 'No se pudo aceptar el viaje.';
}

export default function AceptarViajeScreen() {
  const params = useLocalSearchParams<{ viajeId?: string }>();
  const viajeId = Number(params.viajeId);
  const [viaje, setViaje] = useState<Viaje | null>(null);
  const [vehiculos, setVehiculos] = useState<Vehiculo[]>([]);
  const [vehiculoId, setVehiculoId] = useState<number | null>(null);
  const [cargando, setCargando] = useState(true);
  const [refrescando, setRefrescando] = useState(false);
  const [guardando, setGuardando] = useState(false);

  const cargar = useCallback(async () => {
    if (!Number.isFinite(viajeId) || viajeId <= 0) {
      Alert.alert('Error', 'No se indicó un viaje válido.');
      setCargando(false);
      return;
    }
    try {
      const [viajeRespuesta, lista] = await Promise.all([
        api.get<unknown>(`/viajes/${viajeId}`),
        listarVehiculos(),
      ]);
      const datosViaje = (viajeRespuesta.data as { data?: Viaje }).data as
        | Viaje
        | undefined;
      setViaje(datosViaje ?? null);
      setVehiculos(lista);
      if (datosViaje?.vehiculo?.id) setVehiculoId(datosViaje.vehiculo.id);
    } catch (error) {
      console.error('Error al preparar aceptación:', mensajeError(error));
      Alert.alert('Error', mensajeError(error));
    } finally {
      setCargando(false);
      setRefrescando(false);
    }
  }, [viajeId]);

  useEffect(() => {
    void Promise.resolve().then(cargar);
  }, [cargar]);

  const confirmar = async () => {
    if (vehiculoId == null) {
      Alert.alert('Vehículo requerido', 'Selecciona el vehículo que usarás.');
      return;
    }
    try {
      setGuardando(true);
      const respuesta = await api.patch<{ message?: string }>(
        `/viajes/${viajeId}/aceptar`,
        { vehiculoId },
      );
      Alert.alert('Listo', respuesta.data?.message ?? 'Viaje aceptado.', [
        {
          text: 'Ver mis viajes',
          onPress: () =>
            router.replace('/mis-viajes' as Parameters<typeof router.push>[0]),
        },
      ]);
    } catch (error) {
      Alert.alert('Error', mensajeError(error));
    } finally {
      setGuardando(false);
    }
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
        <Pressable style={styles.volver} onPress={() => router.back()}>
          <Text style={styles.volverTexto}>← Volver</Text>
        </Pressable>

        <Text style={styles.marca}>RUTA GO</Text>
        <Text style={styles.titulo}>Aceptar viaje</Text>
        <Text style={styles.descripcion}>
          Selecciona un vehículo real para que los pasajeros puedan seguir tu ubicación.
        </Text>

        {cargando ? (
          <View style={styles.estado}>
            <ActivityIndicator size="large" color="#07883F" />
            <Text style={styles.estadoTexto}>Consultando viaje y flota...</Text>
          </View>
        ) : (
          <>
            {viaje && (
              <View style={styles.tarjetaViaje}>
                <Text style={styles.nombreRuta}>{tituloRuta(viaje)}</Text>
                <Text style={styles.dato}>Solicitud #{viaje.id}</Text>
                <Text style={styles.dato}>
                  Horario: {viaje.horario?.horaSalida ?? 'No disponible'}
                </Text>
                <Text style={styles.dato}>
                  Pasajeros: {viaje.pasajeros?.length ?? 0}
                </Text>
              </View>
            )}

            <Text style={styles.subtitulo}>Vehículos registrados</Text>
            {vehiculos.length === 0 ? (
              <Text style={styles.vacio}>
                No hay vehículos registrados. Pide a un administrador o entidad que
                los creе antes de aceptar.
              </Text>
            ) : (
              vehiculos.map((vehiculo) => {
                const estadoId = Number(vehiculo.estado?.id);
                return (
                  <Pressable
                    key={vehiculo.id}
                    style={[
                      styles.opcion,
                      vehiculoId === vehiculo.id && styles.opcionSeleccionada,
                    ]}
                    onPress={() => setVehiculoId(vehiculo.id)}>
                    <Text
                      style={[
                        styles.opcionTitulo,
                        vehiculoId === vehiculo.id && styles.opcionTextoSeleccionado,
                      ]}>
                      {vehiculo.placa ?? `Vehículo #${vehiculo.id}`}
                    </Text>
                    <Text style={styles.opcionDetalle}>
                      {[vehiculo.marca, vehiculo.modelo, vehiculo.color]
                        .filter(Boolean)
                        .join(' · ')}
                    </Text>
                    <Text style={styles.opcionDetalle}>
                      Estado: {vehiculo.estado?.nombre ?? NOMBRES_ESTADO_VEHICULO[estadoId] ?? 'Sin estado'}
                    </Text>
                  </Pressable>
                );
              })
            )}

            <Pressable
              style={[styles.boton, guardando && styles.botonDeshabilitado]}
              onPress={() => void confirmar()}
              disabled={guardando || vehiculos.length === 0}>
              {guardando ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.textoBoton}>Confirmar aceptación</Text>
              )}
            </Pressable>
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
  tarjetaViaje: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 15,
    padding: 18,
    marginTop: 24,
  },
  nombreRuta: { color: '#07883F', fontSize: 17, fontWeight: '800', marginBottom: 10 },
  dato: { color: '#374151', fontSize: 14, marginBottom: 7 },
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
  opcionTextoSeleccionado: { color: '#065F33' },
  vacio: { color: '#687385', fontSize: 14, lineHeight: 20 },
  boton: {
    backgroundColor: '#07883F',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 26,
  },
  botonDeshabilitado: { opacity: 0.7 },
  textoBoton: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
});
