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
import { router, useLocalSearchParams } from 'expo-router';

import { Button, Card, Input, useToast } from '@/components/ui';
import { Colores, Espacios, Radios, Tipografia } from '@/constants/tema';
import {
  cambiarContrasenaConToken,
  solicitarRecuperacion,
} from '@/services/authService';

const PASSWORD_REGEX = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/;

export default function RecuperarPasswordScreen() {
  const parametros = useLocalSearchParams<{ token?: string }>();
  const token = typeof parametros.token === 'string' ? parametros.token.trim() : '';
  const esRestablecimiento = Boolean(token);

  const [correo, setCorreo] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [confirmacion, setConfirmacion] = useState('');
  const [cargando, setCargando] = useState(false);
  const [listo, setListo] = useState(false);
  const { mostrar } = useToast();

  const enviarSolicitud = async () => {
    if (!correo.trim()) {
      mostrar('Ingresa tu correo electrónico', { tipo: 'error' });
      return;
    }

    try {
      setCargando(true);
      await solicitarRecuperacion(correo);
      setListo(true);
      mostrar('Revisa tu correo para continuar', { tipo: 'exito' });
    } catch (error) {
      mostrar(
        error instanceof Error
          ? error.message
          : 'No se pudo solicitar la recuperación',
        { tipo: 'error' },
      );
    } finally {
      setCargando(false);
    }
  };

  const guardarContrasena = async () => {
    if (!PASSWORD_REGEX.test(contrasena)) {
      mostrar('Mínimo 8 caracteres, una letra y un número', { tipo: 'error' });
      return;
    }
    if (contrasena !== confirmacion) {
      mostrar('Las contraseñas no coinciden', { tipo: 'error' });
      return;
    }

    try {
      setCargando(true);
      await cambiarContrasenaConToken(token, contrasena);
      setListo(true);
      mostrar('Contraseña actualizada correctamente', { tipo: 'exito' });
    } catch (error) {
      mostrar(
        error instanceof Error
          ? error.message
          : 'El enlace no es válido o ya expiró',
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
          <Text style={styles.titulo}>
            {esRestablecimiento ? 'Restablecer contraseña' : 'Recuperar contraseña'}
          </Text>
          <Text style={styles.subtitulo}>
            {esRestablecimiento
              ? 'Elige una nueva contraseña para tu cuenta RutaGo.'
              : 'Te enviaremos un enlace para restablecer tu contraseña.'}
          </Text>

          {listo ? (
            <View style={styles.estado}>
              <Text style={styles.mensaje}>
                {esRestablecimiento
                  ? 'Tu contraseña fue actualizada. Ya puedes iniciar sesión.'
                  : 'Si el correo está registrado, recibirás las instrucciones.'}
              </Text>
              <Button
                titulo="Ir al inicio"
                variante="primario"
                onPress={() => router.replace('/')}
              />
            </View>
          ) : esRestablecimiento ? (
            <View>
              <Input
                etiqueta="Nueva contraseña"
                requerido
                esContrasena
                value={contrasena}
                onChangeText={setContrasena}
                placeholder="Mínimo 8 caracteres, letra y número"
                autoComplete="new-password"
                ayuda="8 caracteres mínimo, con al menos una letra y un número."
                contenedorStyle={styles.campo}
              />
              <Input
                etiqueta="Confirmar contraseña"
                requerido
                esContrasena
                value={confirmacion}
                onChangeText={setConfirmacion}
                placeholder="Repite la nueva contraseña"
                autoComplete="new-password"
                contenedorStyle={styles.campo}
              />
              <Button
                titulo="Guardar contraseña"
                cargando={cargando}
                onPress={guardarContrasena}
              />
            </View>
          ) : (
            <View>
              <Input
                etiqueta="Correo electrónico"
                requerido
                value={correo}
                onChangeText={setCorreo}
                placeholder="tucorreo@ejemplo.com"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="email"
                contenedorStyle={styles.campo}
              />
              <Button
                titulo="Enviar instrucciones"
                cargando={cargando}
                onPress={enviarSolicitud}
              />
            </View>
          )}
        </Card>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colores.fondoAlterno,
  },
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: Espacios.xxl,
    paddingVertical: Espacios.enorme,
  },
  volver: {
    alignSelf: 'flex-start',
    marginBottom: Espacios.lg,
  },
  volverTexto: {
    color: Colores.primario,
    fontSize: Tipografia.etiqueta,
    fontWeight: '700',
  },
  tarjeta: {
    padding: Espacios.xxxl,
  },
  titulo: {
    color: Colores.texto,
    fontSize: 24,
    fontWeight: '800',
    marginBottom: Espacios.sm,
  },
  subtitulo: {
    color: Colores.textoSecundario,
    fontSize: Tipografia.cuerpo,
    marginBottom: Espacios.xxl,
  },
  campo: {
    marginBottom: Espacios.lg,
  },
  estado: {
    alignItems: 'stretch',
    gap: Espacios.lg,
  },
  mensaje: {
    color: Colores.texto,
    fontSize: Tipografia.cuerpo,
    textAlign: 'center',
    borderRadius: Radios.medio,
    backgroundColor: Colores.fondoAlterno,
    padding: Espacios.md,
  },
});
