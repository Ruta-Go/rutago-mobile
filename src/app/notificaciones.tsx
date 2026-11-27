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
import { router, Stack } from 'expo-router';

import { useRealtime } from '@/hooks/useRealtime';
import { useSesion } from '@/hooks/useSesion';
import { api, extraerLista } from '@/services/api';
import { mutarConCola } from '@/services/colaOffline';
import { obtenerConCache } from '@/services/offline';
import type { Notificacion } from '@/types/rutago';
import {
  colorDeNotificacion,
  tiempoRelativo,
  viajeDeNotificacion,
} from '@/utils/notificaciones';

function mensajeError(error: unknown): string {
  const err = error as AxiosError<{ message?: string }>;
  if (err.response?.data?.message) return err.response.data.message;
  if (isAxiosError(error)) {
    return `Error ${err.response?.status ?? 'de conexión'}: ${err.message}`;
  }
  return 'No se pudo completar la operación.';
}

export default function NotificacionesScreen() {
  const { usuario } = useSesion();
  const [notificaciones, setNotificaciones] = useState<Notificacion[]>([]);
  const [cargando, setCargando] = useState(true);
  const [refrescando, setRefrescando] = useState(false);
  const [marcandoTodas, setMarcandoTodas] = useState(false);

  const cargar = useCallback(async () => {
    try {
      const { datos } = await obtenerConCache<Notificacion[]>(
        `notificaciones-${usuario?.id ?? 'anon'}`,
        async () => {
          const respuesta = await api.get<unknown>('/notificaciones');
          return extraerLista<Notificacion>(respuesta.data);
        },
      );
      setNotificaciones(datos);
    } catch (error) {
      console.error('Error al cargar notificaciones:', mensajeError(error));
      Alert.alert('Error', mensajeError(error));
    } finally {
      setCargando(false);
      setRefrescando(false);
    }
  }, [usuario]);

  useEffect(() => {
    void Promise.resolve().then(cargar);
  }, [cargar]);

  useRealtime((evento) => {
    if (
      evento.tipo === 'notificacion' ||
      evento.tipo === 'notificacion_leida'
    ) {
      void cargar();
    }
  });

  const marcarLeida = async (notificacion: Notificacion) => {
    setNotificaciones((actuales) =>
      actuales.map((n) => (n.id === notificacion.id ? { ...n, leida: true } : n)),
    );
    const resultado = await mutarConCola({
      metodo: 'PATCH',
      url: `/notificaciones/${notificacion.id}/leida`,
    });
    if (!resultado.ok) {
      setNotificaciones((actuales) =>
        actuales.map((n) => (n.id === notificacion.id ? { ...n, leida: false } : n)),
      );
    }
    return resultado;
  };

  const abrir = (notificacion: Notificacion) => {
    if (!notificacion.leida) void marcarLeida(notificacion);
    const viajeId = viajeDeNotificacion(notificacion);
    if (viajeId) {
      router.push(
        `/detalle-viaje?viajeId=${viajeId}` as Parameters<typeof router.push>[0],
      );
    }
  };

  const marcarTodas = async () => {
    const pendientes = notificaciones.filter((n) => !n.leida);
    if (pendientes.length === 0 || marcandoTodas) return;
    setMarcandoTodas(true);
    try {
      const resultados = await Promise.all(pendientes.map(marcarLeida));
      if (resultados.some((r) => !r.ok)) {
        Alert.alert('Error', 'Algunos avisos no se pudieron marcar como leídos.');
      } else if (resultados.some((r) => r.offline)) {
        Alert.alert(
          'Sin conexión',
          'Los avisos se marcarán como leídos cuando vuelva la red.',
        );
      }
    } finally {
      setMarcandoTodas(false);
    }
  };

  const hayNoLeidas = notificaciones.some((n) => !n.leida);

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />

      <ScrollView
        style={styles.contenedor}
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
        <View style={styles.encabezado}>
          <Text style={styles.titulo}>Notificaciones</Text>
          {hayNoLeidas && (
            <Pressable
              accessibilityRole="button"
              disabled={marcandoTodas}
              hitSlop={8}
              onPress={() => void marcarTodas()}>
              {marcandoTodas ? (
                <ActivityIndicator size="small" color="#087A35" />
              ) : (
                <Text style={styles.marcarTodas}>Marcar todas como leídas</Text>
              )}
            </Pressable>
          )}
        </View>

        {cargando && (
          <View style={styles.estado}>
            <ActivityIndicator size="large" color="#087A35" />
            <Text style={styles.estadoTexto}>Consultando notificaciones...</Text>
          </View>
        )}

        {!cargando && notificaciones.length === 0 && (
          <View style={styles.vacio}>
            <Text style={styles.vacioTitulo}>No hay notificaciones</Text>
            <Text style={styles.vacioTexto}>
              Los cambios de estado de tus viajes aparecerán aquí automáticamente.
            </Text>
          </View>
        )}

        {!cargando &&
          notificaciones.map((notificacion) => (
            <Pressable
              key={notificacion.id}
              accessibilityRole="button"
              accessibilityHint={
                viajeDeNotificacion(notificacion)
                  ? 'Abre el detalle del viaje'
                  : 'Marca el aviso como leído'
              }
              onPress={() => abrir(notificacion)}
              style={({ pressed }) => [
                styles.tarjeta,
                !notificacion.leida && styles.tarjetaNoLeida,
                pressed && styles.tarjetaPresionada,
              ]}>
              <View
                style={[
                  styles.circulo,
                  { backgroundColor: colorDeNotificacion(notificacion) },
                ]}
              />
              <View style={styles.cuerpo}>
                <Text style={styles.tituloAviso} numberOfLines={1}>
                  {notificacion.titulo ?? 'Aviso de RutaGo'}
                </Text>
                <Text style={styles.mensaje} numberOfLines={2}>
                  {notificacion.mensaje ?? 'Sin detalle'}
                </Text>
                <Text style={styles.tiempo}>
                  {tiempoRelativo(notificacion.createdAt)}
                </Text>
              </View>
              {!notificacion.leida && (
                <View style={styles.puntoNoLeida} accessibilityLabel="Sin leer" />
              )}
            </Pressable>
          ))}
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  contenedor: { flex: 1, backgroundColor: '#F3F4F6' },
  contenido: { paddingHorizontal: 16, paddingTop: 56, paddingBottom: 24 },
  encabezado: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  titulo: { color: '#1F2937', fontSize: 22, fontWeight: '800' },
  marcarTodas: { color: '#087A35', fontSize: 13, fontWeight: '600' },
  estado: { alignItems: 'center', padding: 35 },
  estadoTexto: { color: '#6B7280', marginTop: 12 },
  vacio: {
    alignItems: 'center',
    padding: 25,
    marginTop: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
  },
  vacioTitulo: { color: '#1F2937', fontWeight: '800', fontSize: 16 },
  vacioTexto: {
    color: '#6B7280',
    textAlign: 'center',
    fontSize: 13,
    marginTop: 8,
    lineHeight: 20,
  },
  tarjeta: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: 12,
    marginBottom: 10,
    shadowColor: '#000000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  tarjetaNoLeida: { backgroundColor: '#E7F4EC' },
  tarjetaPresionada: { opacity: 0.75 },
  circulo: { width: 36, height: 36, borderRadius: 18, marginRight: 12 },
  cuerpo: { flex: 1 },
  tituloAviso: { color: '#1F2937', fontSize: 15, fontWeight: '700' },
  mensaje: { color: '#4B5563', fontSize: 13, marginTop: 2, lineHeight: 18 },
  tiempo: { color: '#9CA3AF', fontSize: 11, marginTop: 4 },
  puntoNoLeida: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#087A35',
    alignSelf: 'flex-start',
    marginLeft: 8,
    marginTop: 4,
  },
});
