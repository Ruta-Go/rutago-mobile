import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
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
  verificarTokenRecuperacion,
} from '@/services/authService';
import { esCorreoValido, validarPassword } from '@/utils/validacion';

export default function RecuperarPasswordScreen() {
  const parametros = useLocalSearchParams<{ token?: string }>();
  const token = typeof parametros.token === 'string' ? parametros.token.trim() : '';
  const esRestablecimiento = Boolean(token);
  const { mostrar } = useToast();

  const [correo, setCorreo] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [confirmacion, setConfirmacion] = useState('');
  const [cargando, setCargando] = useState(false);
  const [verificando, setVerificando] = useState(esRestablecimiento);
  const [tokenValido, setTokenValido] = useState<boolean | null>(
    esRestablecimiento ? null : true,
  );
  const [expira, setExpira] = useState<string | null>(null);
  const [listo, setListo] = useState(false);
  const [errorCorreo, setErrorCorreo] = useState<string | undefined>();
  const [errorPassword, setErrorPassword] = useState<string | undefined>();
  const [errorConfirmacion, setErrorConfirmacion] = useState<string | undefined>();

  useEffect(() => {
    if (!token) return;

    let activo = true;
    (async () => {
      try {
        const resultado = await verificarTokenRecuperacion(token);
        if (!activo) return;
        setTokenValido(true);
        setExpira(resultado.expira ?? null);
      } catch (error) {
        if (!activo) return;
        setTokenValido(false);
        mostrar(
          error instanceof Error ? error.message : 'El enlace no es válido o ya expiró',
          { tipo: 'error' },
        );
      } finally {
        if (activo) setVerificando(false);
      }
    })();

    return () => {
      activo = false;
    };
  }, [mostrar, token]);

  const enviarSolicitud = async () => {
    if (cargando) return;
    setErrorCorreo(undefined);

    if (!esCorreoValido(correo)) {
      setErrorCorreo('Ingresa un correo electrónico válido.');
      return;
    }

    try {
      setCargando(true);
      const mensaje = await solicitarRecuperacion(correo);
      setListo(true);
      mostrar(mensaje, { tipo: 'exito' });
    } catch (error) {
      mostrar(
        error instanceof Error ? error.message : 'No se pudo solicitar la recuperación',
        { tipo: 'error' },
      );
    } finally {
      setCargando(false);
    }
  };

  const guardarContrasena = async () => {
    if (cargando || verificando || tokenValido !== true) return;

    setErrorPassword(undefined);
    setErrorConfirmacion(undefined);
    const mensajePassword = validarPassword(contrasena);
    if (mensajePassword) setErrorPassword(mensajePassword);
    if (contrasena !== confirmacion) {
      setErrorConfirmacion('Las contraseñas no coinciden.');
    }
    if (mensajePassword || contrasena !== confirmacion) return;

    try {
      setCargando(true);
      await cambiarContrasenaConToken(token, contrasena);
      setListo(true);
      mostrar('Contraseña actualizada correctamente', { tipo: 'exito' });
    } catch (error) {
      mostrar(
        error instanceof Error ? error.message : 'El enlace no es válido o ya expiró',
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
              : 'Te enviaremos un enlace para restablecer tu contraseña con el proveedor configurado en el servidor.'}
          </Text>

          {verificando ? (
            <View style={styles.estado}>
              <ActivityIndicator size="large" color={Colores.primario} />
              <Text style={styles.mensaje}>Validando el enlace con el servidor...</Text>
            </View>
          ) : tokenValido === false ? (
            <View style={styles.estado}>
              <Text style={styles.mensajeError}>
                El enlace no es válido o ya expiró. Solicita uno nuevo para continuar.
              </Text>
              <Button
                titulo="Solicitar nuevo enlace"
                variante="primario"
                onPress={() =>
                  router.replace(
                    '/recuperar-password' as Parameters<typeof router.replace>[0],
                  )
                }
              />
            </View>
          ) : listo ? (
            <View style={styles.estado}>
              <Text style={styles.mensaje}>
                {esRestablecimiento
                  ? 'Tu contraseña fue actualizada. Ya puedes iniciar sesión.'
                  : 'Revisa tu correo para continuar con el enlace de recuperación.'}
              </Text>
              <Button
                titulo="Ir al inicio"
                variante="primario"
                onPress={() => router.replace('/')}
              />
            </View>
          ) : esRestablecimiento ? (
            <View>
              {expira ? (
                <Text style={styles.vigencia}>
                  Enlace vigente hasta: {new Date(expira).toLocaleString('es-CO')}
                </Text>
              ) : null}
              <Input
                etiqueta="Nueva contraseña"
                requerido
                esContrasena
                value={contrasena}
                onChangeText={setContrasena}
                placeholder="Mínimo 8 caracteres, letra y número"
                error={errorPassword}
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
                error={errorConfirmacion}
                autoComplete="new-password"
                contenedorStyle={styles.campo}
              />
              <Button
                titulo="Guardar contraseña"
                cargando={cargando}
                deshabilitado={cargando}
                onPress={() => void guardarContrasena()}
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
                error={errorCorreo}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="email"
                contenedorStyle={styles.campo}
              />
              <Button
                titulo="Enviar instrucciones"
                cargando={cargando}
                deshabilitado={cargando}
                onPress={() => void enviarSolicitud()}
              />
            </View>
          )}
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
    lineHeight: 21,
  },
  campo: { marginBottom: Espacios.lg },
  estado: { alignItems: 'stretch', gap: Espacios.lg },
  mensaje: {
    color: Colores.texto,
    fontSize: Tipografia.cuerpo,
    textAlign: 'center',
    borderRadius: Radios.medio,
    backgroundColor: Colores.fondoAlterno,
    padding: Espacios.md,
    lineHeight: 21,
  },
  mensajeError: {
    color: Colores.error,
    fontSize: Tipografia.cuerpo,
    textAlign: 'center',
    borderRadius: Radios.medio,
    backgroundColor: Colores.fondoAlterno,
    padding: Espacios.md,
    lineHeight: 21,
  },
  vigencia: {
    color: Colores.textoSecundario,
    fontSize: Tipografia.ayuda,
    marginBottom: Espacios.md,
  },
});
