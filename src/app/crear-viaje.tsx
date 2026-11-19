import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { isAxiosError, type AxiosError } from 'axios';
import { router, Stack, useLocalSearchParams } from 'expo-router';

import { volverSeguro } from '@/utils/navegacion';

import { etiquetaRuta, listarHorariosPorRuta, listarRutas } from '@/services/catalogos';
import { api } from '@/services/api';
import type { Horario, Ruta } from '@/types/rutago';

function mensajeError(error: unknown): string {
  const err = error as AxiosError<{ message?: string }>;
  if (err.response?.data?.message) return err.response.data.message;
  if (isAxiosError(error)) {
    return `Error ${err.response?.status ?? 'de conexión'}: ${err.message}`;
  }
  return 'No se pudo solicitar el viaje.';
}

export default function CrearViajeScreen() {
  const params = useLocalSearchParams<{ rutaId?: string }>();
  const [rutas, setRutas] = useState<Ruta[]>([]);
  const [horarios, setHorarios] = useState<Horario[]>([]);
  const [rutaId, setRutaId] = useState<number | null>(
    params.rutaId ? Number(params.rutaId) : null,
  );
  const [horarioId, setHorarioId] = useState<number | null>(null);
  const [precio, setPrecio] = useState('');
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    let activo = true;
    const cargar = async () => {
      try {
        const lista = await listarRutas();
        if (!activo) return;
        setRutas(lista);
        if (params.rutaId && !lista.some((ruta) => ruta.id === Number(params.rutaId))) {
          Alert.alert('Aviso', 'La ruta indicada ya no está disponible.');
          setRutaId(null);
        }
      } catch (error) {
        console.error('Error al cargar rutas:', mensajeError(error));
        Alert.alert('Error', mensajeError(error));
      } finally {
        if (activo) setCargando(false);
      }
    };
    void cargar();
    return () => {
      activo = false;
    };
  }, [params.rutaId]);

  const seleccionarRuta = (id: number) => {
    setRutaId(id);
    setHorarios([]);
    setHorarioId(null);
  };

  useEffect(() => {
    let activo = true;
    if (rutaId == null) return () => {
      activo = false;
    };

    const cargar = async () => {
      try {
        const lista = await listarHorariosPorRuta(rutaId);
        if (activo) setHorarios(lista);
      } catch (error) {
        console.error('Error al cargar horarios:', mensajeError(error));
        Alert.alert('Error', mensajeError(error));
      }
    };
    void cargar();
    return () => {
      activo = false;
    };
  }, [rutaId]);

  const enviar = useCallback(async () => {
    if (rutaId == null || horarioId == null) {
      Alert.alert('Datos incompletos', 'Selecciona una ruta y un horario.');
      return;
    }
    const precioNumero = precio.trim() ? Number(precio) : undefined;
    if (precioNumero !== undefined && (!Number.isFinite(precioNumero) || precioNumero <= 0)) {
      Alert.alert('Precio inválido', 'Ingresa un precio positivo o deja el campo vacío.');
      return;
    }

    try {
      setGuardando(true);
      const cuerpo: Record<string, number> = { rutaId, horarioId };
      if (precioNumero !== undefined) cuerpo.precioEstimado = precioNumero;
      const respuesta = await api.post('/viajes', cuerpo);
      const mensaje =
        (respuesta.data as { message?: string } | undefined)?.message ??
        'Tu solicitud fue registrada.';
      Alert.alert('Solicitud enviada', mensaje, [
        {
          text: 'Ver mis solicitudes',
          onPress: () =>
            router.replace('/mis-solicitudes' as Parameters<typeof router.push>[0]),
        },
      ]);
    } catch (error) {
      Alert.alert('Error', mensajeError(error));
    } finally {
      setGuardando(false);
    }
  }, [horarioId, precio, rutaId]);

  const rutaSeleccionada = rutas.find((ruta) => ruta.id === rutaId);

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
        <Text style={styles.titulo}>Solicitar viaje</Text>
        <Text style={styles.descripcion}>
          Elige una ruta y un horario reales del sistema.
        </Text>

        {cargando ? (
          <View style={styles.estado}>
            <ActivityIndicator size="large" color="#07883F" />
            <Text style={styles.estadoTexto}>Consultando rutas...</Text>
          </View>
        ) : (
          <>
            <Text style={styles.subtitulo}>1. Ruta</Text>
            {rutas.length === 0 ? (
              <Text style={styles.vacio}>
                No hay rutas registradas. Un administrador debe crearlas primero.
              </Text>
            ) : (
              rutas.map((ruta) => (
                <Pressable
                  key={ruta.id}
                  style={[
                    styles.opcion,
                    rutaId === ruta.id && styles.opcionSeleccionada,
                  ]}
                  onPress={() => seleccionarRuta(ruta.id)}>
                  <Text
                    style={[
                      styles.opcionTexto,
                      rutaId === ruta.id && styles.opcionTextoSeleccionada,
                    ]}>
                    {etiquetaRuta(ruta)}
                  </Text>
                </Pressable>
              ))
            )}

            <Text style={styles.subtitulo}>2. Horario</Text>
            {rutaId == null ? (
              <Text style={styles.vacio}>Selecciona primero una ruta.</Text>
            ) : horarios.length === 0 ? (
              <Text style={styles.vacio}>
                Esta ruta no tiene horarios registrados.
              </Text>
            ) : (
              horarios.map((horario) => (
                <Pressable
                  key={horario.id}
                  style={[
                    styles.opcion,
                    horarioId === horario.id && styles.opcionSeleccionada,
                  ]}
                  onPress={() => setHorarioId(horario.id)}>
                  <Text
                    style={[
                      styles.opcionTexto,
                      horarioId === horario.id && styles.opcionTextoSeleccionada,
                    ]}>
                    Salida {horario.horaSalida ?? 'sin hora'}
                    {horario.frecuenciaMinutos != null
                      ? ` · cada ${horario.frecuenciaMinutos} min`
                      : ''}
                  </Text>
                </Pressable>
              ))
            )}

            <Text style={styles.subtitulo}>3. Precio estimado (opcional)</Text>
            <TextInput
              style={styles.input}
              placeholder="Ej. 8500"
              placeholderTextColor="#9CA3AF"
              value={precio}
              onChangeText={setPrecio}
              keyboardType="decimal-pad"
            />

            {rutaSeleccionada != null && (
              <View style={styles.resumen}>
                <Text style={styles.resumenTitulo}>Resumen</Text>
                <Text style={styles.resumenTexto}>{etiquetaRuta(rutaSeleccionada)}</Text>
                <Text style={styles.resumenTexto}>
                  Horario: {horarios.find((h) => h.id === horarioId)?.horaSalida ?? 'sin seleccionar'}
                </Text>
              </View>
            )}

            <Pressable
              style={[styles.boton, guardando && styles.botonDeshabilitado]}
              onPress={() => void enviar()}
              disabled={guardando}>
              {guardando ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.textoBoton}>Enviar solicitud</Text>
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
  opcionTexto: { color: '#374151', fontSize: 14 },
  opcionTextoSeleccionada: { color: '#065F33', fontWeight: '700' },
  input: {
    height: 48,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 10,
    paddingHorizontal: 14,
    color: '#202936',
  },
  vacio: { color: '#687385', fontSize: 14, lineHeight: 20 },
  resumen: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 14,
    marginTop: 24,
  },
  resumenTitulo: { color: '#202936', fontWeight: '800', marginBottom: 8 },
  resumenTexto: { color: '#374151', fontSize: 14, marginBottom: 5 },
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
