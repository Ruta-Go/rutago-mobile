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
import { Stack } from 'expo-router';

import { volverSeguro } from '@/utils/navegacion';

import { useRealtime } from '@/hooks/useRealtime';
import { api, extraerLista } from '@/services/api';
import type { Notificacion } from '@/types/rutago';

function mensajeError(error: unknown): string {
  const err = error as AxiosError<{ message?: string }>;
  if (err.response?.data?.message) return err.response.data.message;
  if (isAxiosError(error)) {
    return `Error ${err.response?.status ?? 'de conexión'}: ${err.message}`;
  }
  return 'No se pudo completar la operación.';
}

function fechaLegible(valor?: string): string {
  if (!valor) return '';
  const fecha = new Date(valor);
  return Number.isNaN(fecha.getTime())
    ? ''
    : fecha.toLocaleString('es-CO', {
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      });
}

export default function NotificacionesScreen() {
  const [notificaciones, setNotificaciones] = useState<Notificacion[]>([]);
  const [cargando, setCargando] = useState(true);
  const [refrescando, setRefrescando] = useState(false);
  const [marcandoId, setMarcandoId] = useState<number | null>(null);

  const cargar = useCallback(async () => {
    try {
      const respuesta = await api.get<unknown>('/notificaciones');
      setNotificaciones(extraerLista<Notificacion>(respuesta.data));
    } catch (error) {
      console.error('Error al cargar notificaciones:', mensajeError(error));
      Alert.alert('Error', mensajeError(error));
    } finally {
      setCargando(false);
      setRefrescando(false);
    }
  }, []);

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
    if (marcandoId !== null) return;
    setMarcandoId(notificacion.id);
    try {
      await api.patch(`/notificaciones/${notificacion.id}/leida`);
      await cargar();
    } catch (error) {
      Alert.alert('Error', mensajeError(error));
    } finally {
      setMarcandoId(null);
    }
  };

  const noLeidas = notificaciones.filter((n) => !n.leida).length;

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
        <Text style={styles.titulo}>Notificaciones</Text>
        <Text style={styles.descripcion}>
          Avisos reales de tus viajes. Sin leer: {noLeidas}
        </Text>

        {cargando && (
          <View style={styles.estado}>
            <ActivityIndicator size="large" color="#07883F" />
            <Text style={styles.estadoTexto}>Consultando notificaciones...</Text>
          </View>
        )}

        {!cargando && notificaciones.length === 0 && (
          <View style={styles.vacio}>
            <Text style={styles.icono}>🔔</Text>
            <Text style={styles.vacioTitulo}>No hay notificaciones</Text>
            <Text style={styles.vacioTexto}>
              Los cambios de estado de tus viajes aparecerán aquí automáticamente.
            </Text>
          </View>
        )}

        {!cargando &&
          notificaciones.map((notificacion) => (
            <View
              key={notificacion.id}
              style={[
                styles.tarjeta,
                !notificacion.leida && styles.tarjetaNoLeida,
              ]}>
              <View style={styles.cabecera}>
                <Text style={styles.tituloNotificacion}>
                  {notificacion.titulo ?? 'Aviso de RutaGo'}
                </Text>
                {!notificacion.leida ? <Text style={styles.punto}>●</Text> : null}
              </View>

              <Text style={styles.mensaje}>
                {notificacion.mensaje ?? 'Sin detalle'}
              </Text>
              <Text style={styles.fecha}>{fechaLegible(notificacion.createdAt)}</Text>

              {!notificacion.leida && (
                <Pressable
                  style={styles.boton}
                  disabled={marcandoId !== null}
                  onPress={() => void marcarLeida(notificacion)}>
                  {marcandoId === notificacion.id ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text style={styles.textoBoton}>Marcar como leída</Text>
                  )}
                </Pressable>
              )}
            </View>
          ))}
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  contenido: { padding: 24, paddingTop: 65 },
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
  tarjeta: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 15,
    padding: 18,
    marginTop: 18,
    backgroundColor: '#FFFFFF',
  },
  tarjetaNoLeida: {
    borderColor: '#07883F',
    backgroundColor: '#F6FBF8',
  },
  cabecera: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tituloNotificacion: {
    color: '#202936',
    fontSize: 16,
    fontWeight: '800',
    flex: 1,
  },
  punto: { color: '#07883F', fontSize: 16, marginLeft: 8 },
  mensaje: { color: '#374151', fontSize: 14, marginTop: 8, lineHeight: 20 },
  fecha: { color: '#9CA3AF', fontSize: 12, marginTop: 10 },
  boton: {
    backgroundColor: '#07883F',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
    marginTop: 14,
  },
  textoBoton: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
});
