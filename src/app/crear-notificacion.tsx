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
import { router, Stack } from 'expo-router';

import { volverSeguro } from '@/utils/navegacion';

import { ROLES } from '@/constants/roles';
import { useSesion } from '@/hooks/useSesion';
import { api, extraerDatos } from '@/services/api';
import { opcionesRemotas } from '@/services/recursos';

type Opcion = { id: number; etiqueta: string };

const TIPOS_NOTIFICACION = ['sistema', 'viaje', 'administracion'] as const;

function mensajeError(error: unknown): string {
  const err = error as AxiosError<{ message?: string }>;
  if (err.response?.data?.message) return err.response.data.message;
  if (isAxiosError(error)) {
    return `Error ${err.response?.status ?? 'de conexión'}: ${err.message}`;
  }
  return 'No se pudo crear la notificación.';
}

export default function CrearNotificacionScreen() {
  const { usuario } = useSesion();
  const rolId = Number(usuario?.rolId ?? usuario?.rol?.id);
  const [usuarios, setUsuarios] = useState<Opcion[]>([]);
  const [viajes, setViajes] = useState<Opcion[]>([]);
  const [usuarioId, setUsuarioId] = useState<number | null>(null);
  const [viajeId, setViajeId] = useState<number | null>(null);
  const [tipo, setTipo] = useState<string>(TIPOS_NOTIFICACION[0]);
  const [titulo, setTitulo] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);

  const cargar = useCallback(async () => {
    try {
      const [listaUsuarios, listaViajes] = await Promise.all([
        opcionesRemotas('/usuarios', ['nombres', 'apellidos', 'correo']),
        opcionesRemotas('/viajes', ['id']),
      ]);
      setUsuarios(listaUsuarios);
      setViajes(listaViajes);
    } catch (error) {
      console.error('Error al cargar destinatarios:', mensajeError(error));
      Alert.alert('Error', mensajeError(error));
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    if (rolId === ROLES.ADMINISTRADOR) void Promise.resolve().then(cargar);
  }, [cargar, rolId]);

  if (rolId !== ROLES.ADMINISTRADOR) {
    return (
      <>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={[styles.container, styles.centro]}>
          <Text style={styles.titulo}>Acceso restringido</Text>
          <Text style={styles.descripcion}>
            Sólo un administrador puede enviar notificaciones internas.
          </Text>
          <Pressable style={styles.boton} onPress={() => volverSeguro()}>
            <Text style={styles.textoBoton}>Volver</Text>
          </Pressable>
        </View>
      </>
    );
  }

  const enviar = async () => {
    if (guardando) return;
    if (usuarioId == null) {
      Alert.alert('Destinatario requerido', 'Selecciona un usuario real.');
      return;
    }
    const tipoValido = (TIPOS_NOTIFICACION as readonly string[]).includes(tipo);
    const tituloValido = titulo.trim().length >= 2 && titulo.trim().length <= 150;
    const mensajeValido =
      mensaje.trim().length >= 2 && mensaje.trim().length <= 1000;
    if (!tipoValido || !tituloValido || !mensajeValido) {
      Alert.alert(
        'Datos inválidos',
        'Selecciona un tipo válido y completa el título (2-150) y el mensaje (2-1000 caracteres).',
      );
      return;
    }
    try {
      setGuardando(true);
      const cuerpo: Record<string, string | number> = {
        usuarioId,
        tipo: tipo.trim(),
        titulo: titulo.trim(),
        mensaje: mensaje.trim(),
      };
      if (viajeId != null) cuerpo.viajeId = viajeId;
      const respuesta = await api.post<unknown>('/notificaciones', cuerpo);
      const creada = extraerDatos<{ titulo?: string }>(respuesta.data);
      Alert.alert('Listo', `Notificación enviada: ${creada?.titulo ?? titulo.trim()}`, [
        {
          text: 'Volver al panel',
          onPress: () =>
            router.replace('/panel-gestion' as Parameters<typeof router.push>[0]),
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

      <ScrollView style={styles.container} contentContainerStyle={styles.contenido}>
        <Pressable style={styles.volver} onPress={() => volverSeguro()}>
          <Text style={styles.volverTexto}>← Volver</Text>
        </Pressable>

        <Text style={styles.marca}>RUTA GO</Text>
        <Text style={styles.titulo}>Enviar notificación</Text>
        <Text style={styles.descripcion}>
          La notificación se guarda en la base de datos y se difunde por WebSocket al
          usuario seleccionado.
        </Text>

        {cargando ? (
          <View style={styles.cargando}>
            <ActivityIndicator size="large" color="#087A35" />
            <Text style={styles.ayuda}>Consultando usuarios y viajes...</Text>
          </View>
        ) : (
          <View style={styles.formulario}>
            <Text style={styles.etiqueta}>Usuario destinatario *</Text>
            <View style={styles.opciones}>
              {usuarios.map((opcion) => (
                <Pressable
                  key={opcion.id}
                  style={[
                    styles.opcion,
                    usuarioId === opcion.id && styles.opcionSeleccionada,
                  ]}
                  onPress={() => setUsuarioId(opcion.id)}>
                  <Text style={styles.textoOpcion}>{opcion.etiqueta}</Text>
                </Pressable>
              ))}
            </View>

            <Text style={styles.etiqueta}>Viaje relacionado (opcional)</Text>
            <View style={styles.opciones}>
              <Pressable
                style={[styles.opcion, viajeId == null && styles.opcionSeleccionada]}
                onPress={() => setViajeId(null)}>
                <Text style={styles.textoOpcion}>Sin viaje</Text>
              </Pressable>
              {viajes.map((opcion) => (
                <Pressable
                  key={opcion.id}
                  style={[
                    styles.opcion,
                    viajeId === opcion.id && styles.opcionSeleccionada,
                  ]}
                  onPress={() => setViajeId(opcion.id)}>
                  <Text style={styles.textoOpcion}>{opcion.etiqueta}</Text>
                </Pressable>
              ))}
            </View>

            <Text style={styles.etiqueta}>Tipo *</Text>
            <View style={styles.opciones}>
              {TIPOS_NOTIFICACION.map((opcion) => (
                <Pressable
                  key={opcion}
                  style={[styles.opcion, tipo === opcion && styles.opcionSeleccionada]}
                  onPress={() => setTipo(opcion)}>
                  <Text
                    style={[
                      styles.textoOpcion,
                      tipo === opcion && styles.textoOpcionSeleccionado,
                    ]}>
                    {opcion}
                  </Text>
                </Pressable>
              ))}
            </View>

            <Text style={styles.etiqueta}>Título *</Text>
            <TextInput
              style={styles.input}
              value={titulo}
              onChangeText={setTitulo}
              maxLength={150}
            />

            <Text style={styles.etiqueta}>Mensaje *</Text>
            <TextInput
              style={[styles.input, styles.textoMultiple]}
              value={mensaje}
              onChangeText={setMensaje}
              multiline
              maxLength={1000}
            />

            <Pressable
              style={[styles.boton, guardando && styles.botonDeshabilitado]}
              onPress={() => void enviar()}
              disabled={guardando}>
              {guardando ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.textoBoton}>Enviar notificación</Text>
              )}
            </Pressable>
          </View>
        )}
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  contenido: { padding: 24, paddingTop: 65, paddingBottom: 40 },
  centro: { justifyContent: 'center', padding: 30 },
  volver: { marginBottom: 22 },
  volverTexto: { color: '#087A35', fontSize: 15, fontWeight: '700' },
  marca: { color: '#087A35', fontSize: 22, fontWeight: '900', letterSpacing: 4 },
  titulo: { color: '#202936', fontSize: 27, fontWeight: '800', marginTop: 16 },
  descripcion: { color: '#687385', fontSize: 14, marginTop: 8, lineHeight: 20 },
  cargando: { alignItems: 'center', padding: 45 },
  ayuda: { color: '#687385', marginTop: 12 },
  formulario: { marginTop: 22 },
  etiqueta: { color: '#374151', fontSize: 14, fontWeight: '700', marginTop: 16, marginBottom: 8 },
  opciones: { flexDirection: 'row', flexWrap: 'wrap' },
  opcion: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginRight: 7,
    marginBottom: 7,
  },
  opcionSeleccionada: { borderColor: '#087A35', backgroundColor: '#E6F4EC' },
  textoOpcion: { color: '#374151', fontSize: 13 },
  textoOpcionSeleccionado: { color: '#FFFFFF', fontWeight: '800' },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: '#202936',
  },
  textoMultiple: { minHeight: 100, textAlignVertical: 'top' },
  boton: {
    backgroundColor: '#087A35',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 24,
  },
  botonDeshabilitado: { opacity: 0.7 },
  textoBoton: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
});
