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
import { Stack, useLocalSearchParams } from 'expo-router';

import { ROLES } from '@/constants/roles';
import { useSesion } from '@/hooks/useSesion';
import { api, extraerDatos } from '@/services/api';
import type { UsuarioResumen, Viaje } from '@/types/rutago';
import { volverSeguro } from '@/utils/navegacion';
import { ESTADO_VIAJE, etiquetaEstado, idEstado } from '@/utils/viajes';

function mensajeError(error: unknown): string {
  const err = error as AxiosError<{ message?: string }>;
  if (err.response?.data?.message) return err.response.data.message;
  if (isAxiosError(error)) {
    return `Error ${err.response?.status ?? 'de conexión'}: ${err.message}`;
  }
  return 'No se pudo completar la operación.';
}

function nombrePersona(persona?: UsuarioResumen): string | null {
  const nombre = [persona?.nombres, persona?.apellidos].filter(Boolean).join(' ');
  return nombre || null;
}

function horaCorta(valor?: string): string | null {
  if (!valor) return null;
  const [horas, minutos] = valor.split(':');
  return horas && minutos ? `${horas}:${minutos}` : valor;
}

function precioLegible(valor?: number | null): string | null {
  if (valor == null || !Number.isFinite(Number(valor))) return null;
  return `$ ${Number(valor).toLocaleString('es-CO', { maximumFractionDigits: 0 })}`;
}

function textoRuta(viaje: Viaje): string | null {
  const nombre = viaje.ruta?.nombre;
  const origen = viaje.ruta?.origen?.nombre;
  const destino = viaje.ruta?.destino?.nombre;
  const trayecto = origen && destino ? `${origen} → ${destino}` : null;
  if (nombre && trayecto) return `${nombre} · ${trayecto}`;
  return nombre ?? trayecto;
}

function Campo({ etiqueta, valor }: { etiqueta: string; valor: string }) {
  return (
    <View style={styles.campo}>
      <Text style={styles.etiqueta}>{etiqueta.toUpperCase()}</Text>
      <Text style={styles.valor}>{valor}</Text>
    </View>
  );
}

export default function DetalleViajeScreen() {
  const params = useLocalSearchParams<{ viajeId?: string }>();
  const viajeId = Number(params.viajeId);
  const { usuario } = useSesion();
  const rolId = Number(usuario?.rolId ?? usuario?.rol?.id);

  const [viaje, setViaje] = useState<Viaje | null>(null);
  const [cargando, setCargando] = useState(true);
  const [refrescando, setRefrescando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cancelando, setCancelando] = useState(false);

  const cargar = useCallback(async () => {
    if (!Number.isInteger(viajeId) || viajeId <= 0) {
      setError('No se indicó un viaje válido.');
      setCargando(false);
      return;
    }
    try {
      const respuesta = await api.get<unknown>(`/viajes/${viajeId}`);
      setViaje(extraerDatos<Viaje>(respuesta.data) ?? null);
      setError(null);
    } catch (err) {
      setError(mensajeError(err));
    } finally {
      setCargando(false);
      setRefrescando(false);
    }
  }, [viajeId]);

  useEffect(() => {
    void Promise.resolve().then(cargar);
  }, [cargar]);

  const estado = viaje ? idEstado(viaje) : null;
  const puedeCancelar =
    (rolId === ROLES.PASAJERO || rolId === ROLES.CONDUCTOR) &&
    estado != null &&
    estado <= ESTADO_VIAJE.EN_CURSO;
  const viajeActivo =
    estado === ESTADO_VIAJE.ACEPTADO || estado === ESTADO_VIAJE.EN_CURSO;

  const cancelar = () => {
    if (!viaje) return;
    Alert.alert('Cancelar viaje', '¿Seguro que quieres cancelar este viaje?', [
      { text: 'Volver', style: 'cancel' },
      {
        text: 'Cancelar viaje',
        style: 'destructive',
        onPress: async () => {
          setCancelando(true);
          try {
            const respuesta = await api.patch<unknown>(`/viajes/${viaje.id}/cancelar`);
            const cuerpo = respuesta.data as { message?: string };
            Alert.alert('Listo', cuerpo?.message ?? 'Viaje cancelado.');
            await cargar();
          } catch (err) {
            Alert.alert('Error', mensajeError(err));
          } finally {
            setCancelando(false);
          }
        },
      },
    ]);
  };

  const capacidad = viaje?.vehiculo?.capacidadPasajeros;
  const ocupados = viaje?.pasajeros?.length ?? 0;

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />

      <View style={styles.encabezado}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Volver"
          hitSlop={12}
          onPress={() => volverSeguro('/notificaciones')}>
          <Text style={styles.atras}>‹</Text>
        </Pressable>
        <Text style={styles.titulo}>
          {Number.isInteger(viajeId) && viajeId > 0 ? `Viaje #${viajeId}` : 'Viaje'}
        </Text>
      </View>

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
        {cargando && (
          <View style={styles.estadoCarga}>
            <ActivityIndicator size="large" color="#087A35" />
            <Text style={styles.estadoTexto}>Consultando el viaje...</Text>
          </View>
        )}

        {!cargando && error && (
          <View style={styles.aviso}>
            <Text style={styles.avisoError}>{error}</Text>
          </View>
        )}

        {!cargando && viaje && (
          <>
            <Text style={styles.chip}>{etiquetaEstado(viaje)}</Text>

            <Campo etiqueta="Ruta" valor={textoRuta(viaje) ?? 'Sin ruta'} />
            <Campo
              etiqueta="Salida"
              valor={horaCorta(viaje.horario?.horaSalida) ?? 'Sin horario'}
            />
            <Campo
              etiqueta="Conductor"
              valor={nombrePersona(viaje.conductor) ?? 'Sin conductor asignado'}
            />
            <Campo
              etiqueta="Vehículo"
              valor={viaje.vehiculo?.placa ?? 'Sin vehículo asignado'}
            />
            <Campo
              etiqueta="Pasajeros"
              valor={capacidad ? `${ocupados} de ${capacidad}` : String(ocupados)}
            />
            <Campo
              etiqueta="Precio"
              valor={precioLegible(viaje.precioEstimado) ?? 'Por definir'}
            />

            <View style={[styles.estadoViaje, viajeActivo && styles.estadoActivo]}>
              <View style={[styles.punto, viajeActivo && styles.puntoActivo]} />
              <Text style={[styles.estadoViajeTexto, viajeActivo && styles.estadoActivoTexto]}>
                {estado === ESTADO_VIAJE.EN_CURSO
                  ? 'Viaje en curso · ubicación en vivo en Mis viajes'
                  : estado === ESTADO_VIAJE.ACEPTADO
                    ? 'Conductor asignado · esperando la salida'
                    : etiquetaEstado(viaje)}
              </Text>
            </View>

            {puedeCancelar && (
              <Pressable
                style={[styles.botonCancelar, cancelando && styles.botonDeshabilitado]}
                disabled={cancelando}
                onPress={cancelar}>
                {cancelando ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.textoCancelar}>Cancelar viaje</Text>
                )}
              </Pressable>
            )}
          </>
        )}
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  encabezado: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 20,
    paddingTop: 52,
    paddingBottom: 28,
    backgroundColor: '#FFFFFF',
  },
  atras: { fontSize: 30, lineHeight: 30, color: '#1F2937' },
  titulo: { fontSize: 20, fontWeight: '800', color: '#1F2937' },
  contenedor: { flex: 1, backgroundColor: '#F3F4F6' },
  contenido: { padding: 20, paddingBottom: 32 },
  estadoCarga: { alignItems: 'center', padding: 35 },
  estadoTexto: { color: '#6B7280', marginTop: 12 },
  aviso: {
    backgroundColor: '#FEE2E2',
    borderRadius: 12,
    padding: 16,
  },
  avisoError: { color: '#DC2626', fontSize: 14 },
  chip: {
    alignSelf: 'flex-start',
    backgroundColor: '#E7F4EC',
    color: '#087A35',
    fontSize: 12,
    fontWeight: '800',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    marginBottom: 14,
    overflow: 'hidden',
  },
  campo: { marginBottom: 14 },
  etiqueta: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6B7280',
    letterSpacing: 0.5,
  },
  valor: { fontSize: 15, color: '#1F2937', marginTop: 3 },
  estadoViaje: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 10,
    padding: 14,
    marginTop: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  estadoActivo: { backgroundColor: '#E7F4EC', borderColor: '#CBE7D5' },
  punto: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#9CA3AF' },
  puntoActivo: { backgroundColor: '#087A35' },
  estadoViajeTexto: { fontSize: 13, color: '#374151', flex: 1 },
  estadoActivoTexto: { color: '#065F28' },
  botonCancelar: {
    backgroundColor: '#EF4444',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 22,
  },
  botonDeshabilitado: { opacity: 0.6 },
  textoCancelar: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
});
