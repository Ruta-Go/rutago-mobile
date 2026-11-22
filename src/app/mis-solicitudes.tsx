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
import { Stack, router } from 'expo-router';

import { volverSeguro } from '@/utils/navegacion';

import { ROLES } from '@/constants/roles';
import { useSesion } from '@/hooks/useSesion';
import { api, extraerLista } from '@/services/api';
import type { Viaje } from '@/types/rutago';
import {
  ESTADO_VIAJE,
  fechaLegible,
  idEstado,
  nombreEstado,
  tituloRuta,
} from '@/utils/viajes';

function mensajeError(error: unknown): string {
  const err = error as AxiosError<{ message?: string }>;
  if (err.response?.data?.message) return err.response.data.message;
  if (isAxiosError(error)) {
    return `Error ${err.response?.status ?? 'de conexión'}: ${err.message}`;
  }
  return 'No se pudo completar la operación.';
}

export default function MisSolicitudesScreen() {
  const { usuario } = useSesion();
  const rolId = Number(usuario?.rolId ?? usuario?.rol?.id);
  const esConductor = rolId === ROLES.CONDUCTOR;
  const esPasajero = rolId === ROLES.PASAJERO;

  const [solicitudes, setSolicitudes] = useState<Viaje[]>([]);
  const [cargando, setCargando] = useState(true);
  const [refrescando, setRefrescando] = useState(false);
  const [accionEnCurso, setAccionEnCurso] = useState<string | null>(null);

  const cargar = useCallback(async () => {
    try {
      const endpoint = esConductor
        ? '/viajes/disponibles'
        : '/viajes/me/mis-viajes';
      const respuesta = await api.get<unknown>(endpoint);
      const lista = extraerLista<Viaje>(respuesta.data);
      const pendientes = esPasajero
        ? lista.filter((viaje) => {
            const id = idEstado(viaje);
            return (
              id === ESTADO_VIAJE.BUSCANDO || id === ESTADO_VIAJE.ACEPTADO
            );
          })
        : lista;
      setSolicitudes(pendientes);
    } catch (error) {
      console.error('Error al cargar solicitudes:', mensajeError(error));
      Alert.alert('Error', mensajeError(error));
    } finally {
      setCargando(false);
      setRefrescando(false);
    }
  }, [esConductor, esPasajero]);

  useEffect(() => {
    void Promise.resolve().then(cargar);
  }, [cargar]);

  const aceptar = (viaje: Viaje) => {
    router.push(
      `/aceptar-viaje?viajeId=${viaje.id}` as Parameters<typeof router.push>[0],
    );
  };

  const bajarse = (viaje: Viaje) => {
    Alert.alert(
      'Salir del viaje',
      `¿Quieres bajarte del viaje #${viaje.id}?`,
      [
        { text: 'Volver', style: 'cancel' },
        {
          text: 'Bajarme',
          style: 'destructive',
          onPress: async () => {
            if (accionEnCurso) return;
            setAccionEnCurso(`${viaje.id}-bajarse`);
            try {
              const respuesta = await api.delete<{ message?: string }>(
                `/viajes/${viaje.id}/bajarse`,
              );
              Alert.alert('Listo', respuesta.data?.message ?? 'Saliste del viaje.');
              await cargar();
            } catch (error) {
              Alert.alert('Error', mensajeError(error));
            } finally {
              setAccionEnCurso(null);
            }
          },
        },
      ],
    );
  };

  const cancelar = (viaje: Viaje) => {
    Alert.alert(
      'Cancelar solicitud',
      `¿Quieres cancelar el viaje #${viaje.id}?`,
      [
        { text: 'Volver', style: 'cancel' },
        {
          text: 'Cancelar viaje',
          style: 'destructive',
          onPress: async () => {
            if (accionEnCurso) return;
            setAccionEnCurso(`${viaje.id}-cancelar`);
            try {
              const respuesta = await api.patch<{ message?: string }>(
                `/viajes/${viaje.id}/cancelar`,
              );
              Alert.alert('Listo', respuesta.data?.message ?? 'Solicitud cancelada.');
              await cargar();
            } catch (error) {
              Alert.alert('Error', mensajeError(error));
            } finally {
              setAccionEnCurso(null);
            }
          },
        },
      ],
    );
  };

  const titulo = esConductor ? 'Solicitudes recibidas' : 'Mis solicitudes';
  const descripcion = esConductor
    ? 'Viajes reales que están buscando conductor.'
    : 'Tus viajes pendientes, tomados del historial real del sistema.';

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
            colors={['#087A35']}
          />
        }>
        <Pressable style={styles.volver} onPress={() => volverSeguro()}>
          <Text style={styles.volverTexto}>← Volver</Text>
        </Pressable>

        <Text style={styles.marca}>RUTA GO</Text>
        <Text style={styles.titulo}>{titulo}</Text>
        <Text style={styles.descripcion}>{descripcion}</Text>

        {cargando && (
          <View style={styles.estado}>
            <ActivityIndicator size="large" color="#087A35" />
            <Text style={styles.estadoTexto}>Consultando solicitudes...</Text>
          </View>
        )}

        {!cargando && solicitudes.length === 0 && (
          <View style={styles.vacio}>
            <Text style={styles.icono}>📋</Text>
            <Text style={styles.vacioTitulo}>No hay solicitudes pendientes</Text>
            <Text style={styles.vacioTexto}>
              {esConductor
                ? 'Cuando haya viajes esperando conductor, aparecerán aquí.'
                : 'Cuando solicites un viaje, su estado aparecerá aquí.'}
            </Text>
          </View>
        )}

        {!cargando &&
          solicitudes.map((viaje) => {
            const ocupados = viaje.pasajeros?.length ?? 0;
            const capacidad = viaje.vehiculo?.capacidadPasajeros;
            return (
              <View key={viaje.id} style={styles.tarjeta}>
                <View style={styles.cabecera}>
                  <Text style={styles.nombreRuta}>{tituloRuta(viaje)}</Text>
                  <Text style={styles.estadoChip}>{nombreEstado(viaje)}</Text>
                </View>

                <Text style={styles.dato}>Solicitud #{viaje.id}</Text>
                <Text style={styles.dato}>
                  Horario: {viaje.horario?.horaSalida ?? 'No disponible'}
                </Text>
                <Text style={styles.dato}>
                  Fecha: {fechaLegible(viaje.createdAt)}
                </Text>
                <Text style={styles.dato}>
                  Ocupación: {ocupados}
                  {capacidad != null ? ` / ${capacidad}` : ''}
                </Text>

                {esConductor && (
                  <Pressable
                    style={styles.boton}
                    onPress={() => aceptar(viaje)}>
                    <Text style={styles.textoBoton}>Aceptar viaje</Text>
                  </Pressable>
                )}

                {esPasajero && idEstado(viaje) !== ESTADO_VIAJE.CANCELADO && (
                  <>
                    <Pressable
                      style={styles.botonSecundario}
                      disabled={accionEnCurso !== null}
                      onPress={() => bajarse(viaje)}>
                      {accionEnCurso === `${viaje.id}-bajarse` ? (
                        <ActivityIndicator size="small" color="#087A35" />
                      ) : (
                        <Text style={styles.textoBotonSecundario}>
                          Bajarme del viaje
                        </Text>
                      )}
                    </Pressable>
                    <Pressable
                      style={styles.botonSecundario}
                      disabled={accionEnCurso !== null}
                      onPress={() => cancelar(viaje)}>
                      {accionEnCurso === `${viaje.id}-cancelar` ? (
                        <ActivityIndicator size="small" color="#087A35" />
                      ) : (
                        <Text style={styles.textoBotonSecundario}>
                          Cancelar solicitud
                        </Text>
                      )}
                    </Pressable>
                  </>
                )}
              </View>
            );
          })}
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  contenido: { padding: 24, paddingTop: 65 },
  volver: { marginBottom: 22 },
  volverTexto: { color: '#087A35', fontSize: 15, fontWeight: '700' },
  marca: { color: '#087A35', fontSize: 22, fontWeight: '900', letterSpacing: 4 },
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
  vacioTitulo: { color: '#087A35', fontWeight: '800', fontSize: 16, marginTop: 12 },
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
    backgroundColor: '#FFFFFF',
  },
  cabecera: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  nombreRuta: {
    color: '#087A35',
    fontSize: 17,
    fontWeight: '800',
    flex: 1,
    marginRight: 8,
  },
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
    backgroundColor: '#087A35',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 14,
  },
  botonSecundario: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 12,
  },
  textoBoton: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
  textoBotonSecundario: { color: '#374151', fontSize: 15, fontWeight: '700' },
});
