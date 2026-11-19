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
import { Stack } from 'expo-router';

import { volverSeguro } from '@/utils/navegacion';

import {
  OPCIONES_ESTADO_CONDUCTOR,
  NOMBRES_ESTADO_CONDUCTOR,
} from '@/constants/estados';
import { Input } from '@/components/ui';
import { ROLES, nombreRol } from '@/constants/roles';
import { useSesion } from '@/hooks/useSesion';
import {
  api,
  extraerDatos,
  guardarUsuarioSesion,
} from '@/services/api';
import type { Perfil } from '@/types/rutago';
import { MENSAJE_PASSWORD, validarPassword } from '@/utils/validacion';

type DatosPasajero = NonNullable<Perfil['pasajero']>;

function mensajeError(error: unknown): string {
  const err = error as AxiosError<{ message?: string }>;
  if (err.response?.data?.message) return err.response.data.message;
  if (isAxiosError(error)) {
    return `Error ${err.response?.status ?? 'de conexión'}: ${err.message}`;
  }
  return 'No se pudo completar la operación.';
}

export default function MiPerfilScreen() {
  const { usuario, refrescarSesion } = useSesion();
  const [perfil, setPerfil] = useState<Perfil | null>(null);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [nombres, setNombres] = useState('');
  const [apellidos, setApellidos] = useState('');
  const [correo, setCorreo] = useState('');
  const [contrasenaActual, setContrasenaActual] = useState('');
  const [nuevaContrasena, setNuevaContrasena] = useState('');
  const [confirmarContrasena, setConfirmarContrasena] = useState('');
  const [telefono, setTelefono] = useState('');
  const [direccion, setDireccion] = useState('');
  const [numeroDocumento, setNumeroDocumento] = useState('');
  const [fechaNacimiento, setFechaNacimiento] = useState('');
  const [licencia, setLicencia] = useState('');
  const [estadoConductorId, setEstadoConductorId] = useState<number | null>(null);
  const rolId = Number(usuario?.rolId ?? usuario?.rol?.id);

  const cargar = useCallback(async () => {
    try {
      const respuesta = await api.get<unknown>('/usuarios/me/perfil');
      const datos = extraerDatos<Perfil>(respuesta.data);
      setPerfil(datos);
      setNombres(datos.nombres ?? '');
      setApellidos(datos.apellidos ?? '');
      setCorreo(datos.correo ?? '');
      setTelefono(datos.pasajero?.telefono ?? '');
      setDireccion(datos.pasajero?.direccion ?? '');
      setNumeroDocumento(datos.pasajero?.numeroDocumento ?? '');
      setFechaNacimiento(datos.pasajero?.fechaNacimiento ?? '');
      setLicencia(datos.conductor?.licenciaConducir ?? '');
      setEstadoConductorId(datos.conductor?.estado?.id ?? null);
      if (rolId === ROLES.CONDUCTOR) {
        const conductor = await api.get<unknown>('/conductores/me/perfil');
        const datosConductor = extraerDatos<Perfil['conductor']>(conductor.data);
        setLicencia(datosConductor?.licenciaConducir ?? '');
        setEstadoConductorId(datosConductor?.estado?.id ?? null);
      }
    } catch (error) {
      console.error('Error al cargar perfil:', mensajeError(error));
      Alert.alert('Error', mensajeError(error));
    } finally {
      setCargando(false);
    }
  }, [rolId]);

  useEffect(() => {
    void Promise.resolve().then(cargar);
  }, [cargar]);

  const guardar = async () => {
    if (!nombres.trim() || !apellidos.trim() || !correo.trim()) {
      Alert.alert('Datos incompletos', 'Completa nombres, apellidos y correo.');
      return;
    }

    try {
      setGuardando(true);
      const respuesta = await api.put<unknown>('/usuarios/me/perfil', {
        nombres: nombres.trim(),
        apellidos: apellidos.trim(),
        correo: correo.trim(),
      });
      const datos = extraerDatos<Perfil>(respuesta.data);
      setPerfil(datos);
      await guardarUsuarioSesion(datos);
      await refrescarSesion();
      Alert.alert('Listo', 'Tus datos personales se actualizaron.');
    } catch (error) {
      Alert.alert('Error', mensajeError(error));
    } finally {
      setGuardando(false);
    }
  };

  const guardarLicencia = async () => {
    if (licencia.length > 50) {
      Alert.alert('Dato inválido', 'La licencia no puede exceder 50 caracteres.');
      return;
    }
    try {
      setGuardando(true);
      const respuesta = await api.put<unknown>('/conductores/me/perfil', {
        licenciaConducir: licencia.trim(),
      });
      const datos = extraerDatos<Perfil['conductor']>(respuesta.data);
      setPerfil((anterior) => ({ ...anterior, conductor: datos }));
      Alert.alert('Listo', 'Tu licencia se actualizó.');
    } catch (error) {
      Alert.alert('Error', mensajeError(error));
    } finally {
      setGuardando(false);
    }
  };

  const cambiarEstadoConductor = async (estadoId: number) => {
    if (!perfil?.conductor?.id) {
      Alert.alert('Error', 'No se encontró tu perfil de conductor.');
      return;
    }
    try {
      setGuardando(true);
      const respuesta = await api.patch<unknown>(
        `/conductores/${perfil.conductor.id}/estado`,
        { estadoId },
      );
      const datos = extraerDatos<Perfil['conductor']>(respuesta.data);
      setEstadoConductorId(datos?.estado?.id ?? estadoId);
      setPerfil((anterior) => ({ ...anterior, conductor: datos }));
      Alert.alert('Listo', 'Tu estado se actualizó.');
    } catch (error) {
      Alert.alert('Error', mensajeError(error));
    } finally {
      setGuardando(false);
    }
  };

  const guardarPerfilPasajero = async () => {
    if (numeroDocumento.length > 50 || telefono.length > 30 || direccion.length > 300) {
      Alert.alert(
        'Datos inválidos',
        'Revisa la longitud del documento, teléfono y dirección.',
      );
      return;
    }
    if (
      fechaNacimiento &&
      !/^\d{4}-\d{2}-\d{2}$/.test(fechaNacimiento)
    ) {
      Alert.alert('Fecha inválida', 'Usa el formato AAAA-MM-DD.');
      return;
    }

    try {
      setGuardando(true);
      const cuerpo: Record<string, string> = {
        telefono: telefono.trim(),
        direccion: direccion.trim(),
      };
      if (numeroDocumento.trim()) cuerpo.numeroDocumento = numeroDocumento.trim();
      if (fechaNacimiento) cuerpo.fechaNacimiento = fechaNacimiento;
      const respuesta = await api.put<unknown>('/pasajeros/me/perfil', cuerpo);
      const datos = extraerDatos<DatosPasajero>(respuesta.data);
      setPerfil((anterior) => ({ ...anterior, pasajero: datos }));
      Alert.alert('Listo', 'Tus datos de pasajero se actualizaron.');
    } catch (error) {
      Alert.alert('Error', mensajeError(error));
    } finally {
      setGuardando(false);
    }
  };

  const cambiarContrasena = async () => {
    if (guardando) return;
    if (!contrasenaActual || !nuevaContrasena) {
      Alert.alert(
        'Datos incompletos',
        'Ingresa tu contraseña actual y la nueva.',
      );
      return;
    }
    const mensajePassword = validarPassword(nuevaContrasena);
    if (mensajePassword) {
      Alert.alert('Contraseña insegura', MENSAJE_PASSWORD);
      return;
    }
    if (nuevaContrasena !== confirmarContrasena) {
      Alert.alert('Error', 'La nueva contraseña y la confirmación no coinciden.');
      return;
    }

    try {
      setGuardando(true);
      const respuesta = await api.put<{ message?: string }>(
        '/usuarios/me/contrasena',
        {
          contrasenaActual,
          nuevaContrasena,
        },
      );
      Alert.alert('Listo', respuesta.data?.message ?? 'Contraseña actualizada.');
      setContrasenaActual('');
      setNuevaContrasena('');
      setConfirmarContrasena('');
    } catch (error) {
      Alert.alert('Error', mensajeError(error));
    } finally {
      setGuardando(false);
    }
  };

  const rol = perfil?.rol?.nombreRol ?? nombreRol(rolId);

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />

      <ScrollView style={styles.container} contentContainerStyle={styles.contenido}>
        <Pressable style={styles.volver} onPress={() => volverSeguro()}>
          <Text style={styles.volverTexto}>← Volver</Text>
        </Pressable>

        <Text style={styles.marca}>RUTA GO</Text>
        <Text style={styles.titulo}>Mi perfil</Text>
        <Text style={styles.descripcion}>
          Datos reales de tu cuenta de RutaGo
        </Text>

        {cargando ? (
          <View style={styles.estado}>
            <ActivityIndicator size="large" color="#07883F" />
            <Text style={styles.estadoTexto}>Consultando tu perfil...</Text>
          </View>
        ) : (
          <>
            <View style={styles.tarjeta}>
              <Text style={styles.etiqueta}>Rol</Text>
              <Text style={styles.valor}>{rol}</Text>

              {perfil?.pasajero?.numeroDocumento ? (
                <>
                  <Text style={styles.etiqueta}>Documento</Text>
                  <Text style={styles.valor}>
                    {perfil.pasajero.numeroDocumento}
                  </Text>
                </>
              ) : null}

              {perfil?.pasajero?.telefono ? (
                <>
                  <Text style={styles.etiqueta}>Teléfono</Text>
                  <Text style={styles.valor}>{perfil.pasajero.telefono}</Text>
                </>
              ) : null}

              {perfil?.pasajero?.direccion ? (
                <>
                  <Text style={styles.etiqueta}>Dirección</Text>
                  <Text style={styles.valor}>{perfil.pasajero.direccion}</Text>
                </>
              ) : null}

              {perfil?.conductor?.licenciaConducir ? (
                <>
                  <Text style={styles.etiqueta}>Licencia</Text>
                  <Text style={styles.valor}>
                    {perfil.conductor.licenciaConducir}
                  </Text>
                </>
              ) : null}

              {perfil?.entidad?.razonSocial ? (
                <>
                  <Text style={styles.etiqueta}>Entidad</Text>
                  <Text style={styles.valor}>
                    {perfil.entidad.razonSocial}
                  </Text>
                </>
              ) : null}
            </View>

            <Text style={styles.subtitulo}>Datos personales</Text>
            <View style={styles.tarjeta}>
              <Text style={styles.etiqueta}>Nombres</Text>
              <TextInput
                style={styles.input}
                value={nombres}
                onChangeText={setNombres}
                autoCapitalize="words"
              />
              <Text style={styles.etiqueta}>Apellidos</Text>
              <TextInput
                style={styles.input}
                value={apellidos}
                onChangeText={setApellidos}
                autoCapitalize="words"
              />
              <Text style={styles.etiqueta}>Correo</Text>
              <TextInput
                style={styles.input}
                value={correo}
                onChangeText={setCorreo}
                autoCapitalize="none"
                keyboardType="email-address"
              />
              <Pressable
                style={[styles.boton, guardando && styles.botonDeshabilitado]}
                onPress={guardar}
                disabled={guardando}>
                <Text style={styles.textoBoton}>Guardar cambios</Text>
              </Pressable>
            </View>

            {rolId === ROLES.PASAJERO && (
              <>
                <Text style={styles.subtitulo}>Datos de pasajero</Text>
                <View style={styles.tarjeta}>
                  <Text style={styles.etiqueta}>Teléfono</Text>
                  <TextInput
                    style={styles.input}
                    value={telefono}
                    onChangeText={setTelefono}
                    keyboardType="phone-pad"
                    maxLength={30}
                  />
                  <Text style={styles.etiqueta}>Dirección</Text>
                  <TextInput
                    style={styles.input}
                    value={direccion}
                    onChangeText={setDireccion}
                    maxLength={300}
                  />
                  <Text style={styles.etiqueta}>Número de documento</Text>
                  <TextInput
                    style={styles.input}
                    value={numeroDocumento}
                    onChangeText={setNumeroDocumento}
                    maxLength={50}
                  />
                  <Text style={styles.etiqueta}>Fecha de nacimiento (AAAA-MM-DD)</Text>
                  <TextInput
                    style={styles.input}
                    value={fechaNacimiento}
                    onChangeText={setFechaNacimiento}
                    placeholder="1995-05-20"
                    placeholderTextColor="#9CA3AF"
                    keyboardType="numbers-and-punctuation"
                    maxLength={10}
                  />
                  <Pressable
                    style={[styles.boton, guardando && styles.botonDeshabilitado]}
                    onPress={() => void guardarPerfilPasajero()}
                    disabled={guardando}>
                    <Text style={styles.textoBoton}>Guardar datos de pasajero</Text>
                  </Pressable>
                </View>
              </>
            )}

            {rolId === ROLES.CONDUCTOR && (
              <>
                <Text style={styles.subtitulo}>Datos de conductor</Text>
                <View style={styles.tarjeta}>
                  <Text style={styles.etiqueta}>Licencia de conducción</Text>
                  <TextInput
                    style={styles.input}
                    value={licencia}
                    onChangeText={setLicencia}
                    maxLength={50}
                  />
                  <Pressable
                    style={[styles.boton, guardando && styles.botonDeshabilitado]}
                    onPress={() => void guardarLicencia()}
                    disabled={guardando}>
                    <Text style={styles.textoBoton}>Guardar licencia</Text>
                  </Pressable>

                  <Text style={styles.etiqueta}>Estado actual</Text>
                  <Text style={styles.valor}>
                    {estadoConductorId != null
                      ? NOMBRES_ESTADO_CONDUCTOR[estadoConductorId] ?? 'Sin estado'
                      : 'Sin estado'}
                  </Text>
                  {OPCIONES_ESTADO_CONDUCTOR.map((opcion) => (
                    <Pressable
                      key={opcion.id}
                      style={[
                        styles.opcionEstado,
                        estadoConductorId === opcion.id && styles.opcionEstadoSeleccionada,
                      ]}
                      onPress={() => void cambiarEstadoConductor(opcion.id)}
                      disabled={guardando}>
                      <Text style={styles.textoOpcionEstado}>{opcion.nombre}</Text>
                    </Pressable>
                  ))}
                </View>
              </>
            )}

            <Text style={styles.subtitulo}>Contraseña</Text>
            <View style={styles.tarjeta}>
              <Input
                etiqueta="Contraseña actual"
                esContrasena
                value={contrasenaActual}
                onChangeText={setContrasenaActual}
                autoCapitalize="none"
                autoComplete="current-password"
                contenedorStyle={styles.campo}
              />
              <Input
                etiqueta="Nueva contraseña"
                esContrasena
                value={nuevaContrasena}
                onChangeText={setNuevaContrasena}
                autoCapitalize="none"
                autoComplete="new-password"
                ayuda={MENSAJE_PASSWORD}
                contenedorStyle={styles.campo}
              />
              <Input
                etiqueta="Confirmar nueva contraseña"
                esContrasena
                value={confirmarContrasena}
                onChangeText={setConfirmarContrasena}
                autoCapitalize="none"
                autoComplete="new-password"
                contenedorStyle={styles.campo}
              />
              <Pressable
                style={[styles.boton, guardando && styles.botonDeshabilitado]}
                onPress={cambiarContrasena}
                disabled={guardando}>
                <Text style={styles.textoBoton}>Cambiar contraseña</Text>
              </Pressable>
            </View>
          </>
        )}
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
  tarjeta: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 15,
    padding: 18,
    marginTop: 24,
  },
  subtitulo: {
    color: '#202936',
    fontSize: 19,
    fontWeight: '800',
    marginTop: 30,
  },
  etiqueta: {
    color: '#202936',
    fontWeight: '700',
    marginBottom: 8,
    marginTop: 10,
  },
  valor: { color: '#374151', fontSize: 15, marginBottom: 8 },
  campo: { marginBottom: 12 },
  input: {
    height: 48,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 10,
    paddingHorizontal: 14,
    color: '#202936',
    marginBottom: 10,
  },
  boton: {
    backgroundColor: '#07883F',
    borderRadius: 10,
    paddingVertical: 13,
    alignItems: 'center',
    marginTop: 12,
  },
  botonDeshabilitado: { opacity: 0.7 },
  textoBoton: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
  opcionEstado: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginTop: 8,
  },
  opcionEstadoSeleccionada: {
    borderColor: '#07883F',
    backgroundColor: '#E6F4EC',
  },
  textoOpcionEstado: { color: '#374151', fontSize: 14, fontWeight: '600' },
});
