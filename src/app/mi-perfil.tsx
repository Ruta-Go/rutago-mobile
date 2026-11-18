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
import { Stack, router } from 'expo-router';

import { nombreRol } from '@/constants/roles';
import { useSesion } from '@/hooks/useSesion';
import {
  api,
  extraerDatos,
  guardarUsuarioSesion,
} from '@/services/api';
import type { Perfil } from '@/types/rutago';

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

  const cargar = useCallback(async () => {
    try {
      const respuesta = await api.get<unknown>('/usuarios/me/perfil');
      const datos = extraerDatos<Perfil>(respuesta.data);
      setPerfil(datos);
      setNombres(datos.nombres ?? '');
      setApellidos(datos.apellidos ?? '');
      setCorreo(datos.correo ?? '');
    } catch (error) {
      console.error('Error al cargar perfil:', mensajeError(error));
      Alert.alert('Error', mensajeError(error));
    } finally {
      setCargando(false);
    }
  }, []);

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

  const cambiarContrasena = async () => {
    if (!contrasenaActual || !nuevaContrasena) {
      Alert.alert(
        'Datos incompletos',
        'Ingresa tu contraseña actual y la nueva.',
      );
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

  const rol = perfil?.rol?.nombreRol ?? nombreRol(usuario?.rolId ?? usuario?.rol?.id);

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />

      <ScrollView style={styles.container} contentContainerStyle={styles.contenido}>
        <Pressable style={styles.volver} onPress={() => router.back()}>
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

            <Text style={styles.subtitulo}>Contraseña</Text>
            <View style={styles.tarjeta}>
              <Text style={styles.etiqueta}>Contraseña actual</Text>
              <TextInput
                style={styles.input}
                value={contrasenaActual}
                onChangeText={setContrasenaActual}
                secureTextEntry
                autoCapitalize="none"
              />
              <Text style={styles.etiqueta}>Nueva contraseña</Text>
              <TextInput
                style={styles.input}
                value={nuevaContrasena}
                onChangeText={setNuevaContrasena}
                secureTextEntry
                autoCapitalize="none"
              />
              <Text style={styles.etiqueta}>Confirmar nueva contraseña</Text>
              <TextInput
                style={styles.input}
                value={confirmarContrasena}
                onChangeText={setConfirmarContrasena}
                secureTextEntry
                autoCapitalize="none"
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
});
