import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { router } from 'expo-router';

import { Button, Card, Input, useToast } from '@/components/ui';
import { Colores, Espacios, Tipografia } from '@/constants/tema';
import { registrarUsuario } from '@/services/authService';
import { esCorreoValido, validarPassword } from '@/utils/validacion';

export default function RegistroScreen() {
  const { mostrar } = useToast();
  const [nombres, setNombres] = useState('');
  const [apellidos, setApellidos] = useState('');
  const [correo, setCorreo] = useState('');
  const [telefono, setTelefono] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [confirmacion, setConfirmacion] = useState('');
  const [errores, setErrores] = useState<Record<string, string | undefined>>({});
  const [cargando, setCargando] = useState(false);

  const registrar = async () => {
    if (cargando) return;

    const nuevosErrores: Record<string, string | undefined> = {};
    if (nombres.trim().length < 2) nuevosErrores.nombres = 'Escribe tus nombres.';
    if (apellidos.trim().length < 2) nuevosErrores.apellidos = 'Escribe tus apellidos.';
    if (!esCorreoValido(correo)) nuevosErrores.correo = 'Ingresa un correo válido.';
    const errorPassword = validarPassword(contrasena);
    if (errorPassword) nuevosErrores.contrasena = errorPassword;
    if (contrasena !== confirmacion) {
      nuevosErrores.confirmacion = 'Las contraseñas no coinciden.';
    }
    setErrores(nuevosErrores);
    if (Object.keys(nuevosErrores).length > 0) return;

    try {
      setCargando(true);
      const respuesta = await registrarUsuario({
        nombres,
        apellidos,
        correo,
        telefono,
        contrasena,
      });
      mostrar(respuesta.mensaje, { tipo: 'exito' });
      router.replace(
        `/?correo=${encodeURIComponent(correo.trim())}` as Parameters<
          typeof router.replace
        >[0],
      );
    } catch (error) {
      mostrar(
        error instanceof Error ? error.message : 'No se pudo completar el registro',
        { tipo: 'error' },
      );
    } finally {
      setCargando(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <Pressable style={styles.volver} onPress={() => router.replace('/')}>
          <Text style={styles.volverTexto}>← Volver al inicio</Text>
        </Pressable>

        <Card style={styles.tarjeta}>
          <Text style={styles.marca}>RUTA GO</Text>
          <Text style={styles.titulo}>Crea tu cuenta</Text>
          <Text style={styles.subtitulo}>
            El registro público crea una cuenta de Pasajero. Los otros roles los
            asigna el administrador.
          </Text>

          <Input
            etiqueta="Nombres"
            requerido
            value={nombres}
            onChangeText={setNombres}
            placeholder="Tus nombres"
            error={errores.nombres}
            autoCapitalize="words"
            contenedorStyle={styles.campo}
          />
          <Input
            etiqueta="Apellidos"
            requerido
            value={apellidos}
            onChangeText={setApellidos}
            placeholder="Tus apellidos"
            error={errores.apellidos}
            autoCapitalize="words"
            contenedorStyle={styles.campo}
          />
          <Input
            etiqueta="Correo electrónico"
            requerido
            value={correo}
            onChangeText={setCorreo}
            placeholder="tucorreo@ejemplo.com"
            error={errores.correo}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="email"
            contenedorStyle={styles.campo}
          />
          <Input
            etiqueta="Teléfono (opcional)"
            value={telefono}
            onChangeText={setTelefono}
            placeholder="300 000 0000"
            keyboardType="phone-pad"
            contenedorStyle={styles.campo}
          />
          <Input
            etiqueta="Contraseña"
            requerido
            esContrasena
            value={contrasena}
            onChangeText={setContrasena}
            placeholder="Mínimo 8 caracteres, letra y número"
            error={errores.contrasena}
            autoComplete="new-password"
            contenedorStyle={styles.campo}
          />
          <Input
            etiqueta="Confirmar contraseña"
            requerido
            esContrasena
            value={confirmacion}
            onChangeText={setConfirmacion}
            placeholder="Repite la contraseña"
            error={errores.confirmacion}
            autoComplete="new-password"
            contenedorStyle={styles.campo}
          />

          <Button
            titulo="Crear cuenta"
            variante="primario"
            cargando={cargando}
            onPress={() => void registrar()}
          />

          <View style={styles.ingreso}>
            <Text style={styles.ingresoEtiqueta}>¿Ya tienes cuenta? </Text>
            <Pressable onPress={() => router.replace('/')}>
              <Text style={styles.ingresoEnlace}>Inicia sesión</Text>
            </Pressable>
          </View>
        </Card>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colores.fondoAlterno },
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: Espacios.xxl,
    paddingVertical: Espacios.enorme,
  },
  volver: { alignSelf: 'flex-start', marginBottom: Espacios.lg },
  volverTexto: {
    color: Colores.primario,
    fontSize: Tipografia.etiqueta,
    fontWeight: '700',
  },
  tarjeta: { padding: Espacios.xxxl },
  marca: {
    color: Colores.primario,
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: 4,
    marginBottom: Espacios.md,
  },
  titulo: {
    color: Colores.texto,
    fontSize: 25,
    fontWeight: '800',
    marginBottom: Espacios.sm,
  },
  subtitulo: {
    color: Colores.textoSecundario,
    fontSize: Tipografia.cuerpo,
    marginBottom: Espacios.xxl,
    lineHeight: 21,
  },
  campo: { marginBottom: Espacios.lg },
  ingreso: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
    marginTop: Espacios.xxl,
  },
  ingresoEtiqueta: {
    color: Colores.textoSecundario,
    fontSize: Tipografia.etiqueta,
  },
  ingresoEnlace: {
    color: Colores.primario,
    fontSize: Tipografia.etiqueta,
    fontWeight: '800',
  },
});
