import { useEffect, useState } from 'react';
import { MaterialCommunityIcons } from '@expo/vector-icons';
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
import { nombreRol, rolDesdeSeleccion } from '@/constants/roles';
import { Colores, Espacios, Radios, Tipografia } from '@/constants/tema';
import { useAuth } from '@/hooks/useAuth';
import {
  obtenerEstadoBiometria,
  type EstadoBiometria,
} from '@/services/biometria';
import { mensajeDeInicioSesion } from '@/utils/mensajes';
import { esCorreoValido } from '@/utils/validacion';

export default function HomeScreen() {
  const parametros = useLocalSearchParams<{ correo?: string; rol?: string }>();
  const { iniciarSesion, iniciarSesionBiometrica } = useAuth();
  const rolEsperado = rolDesdeSeleccion(parametros.rol);
  const etiquetaRol = rolEsperado ? nombreRol(rolEsperado) : null;
  const [correo, setCorreo] = useState(
    typeof parametros.correo === 'string' ? parametros.correo : '',
  );
  const [contrasena, setContrasena] = useState('');
  const [cargando, setCargando] = useState(false);
  const [cargandoBiometria, setCargandoBiometria] = useState(false);
  const [biometria, setBiometria] = useState<EstadoBiometria>({
    disponible: false,
    tipo: 'ninguna',
    etiqueta: '',
  });
  const [errorCorreo, setErrorCorreo] = useState<string | undefined>();
  const [errorContrasena, setErrorContrasena] = useState<string | undefined>();
  const { mostrar } = useToast();

  /** Consulté el hardware real para mostrar el acceso biométrico sólo cuando existe. */
  useEffect(() => {
    let activo = true;
    void obtenerEstadoBiometria().then((estado) => {
      if (activo) setBiometria(estado);
    });
    return () => {
      activo = false;
    };
  }, []);

  const manejarInicioSesion = async () => {
    if (cargando) return;

    setErrorCorreo(undefined);
    setErrorContrasena(undefined);

    let valido = true;

    if (!correo.trim()) {
      setErrorCorreo('Ingresa tu correo electrónico');
      valido = false;
    } else if (!esCorreoValido(correo)) {
      setErrorCorreo('Ingresa un correo electrónico válido');
      valido = false;
    }

    if (!contrasena) {
      setErrorContrasena('Ingresa tu contraseña');
      valido = false;
    }

    if (!valido) return;

    try {
      setCargando(true);

      if (rolEsperado === undefined) {
        await iniciarSesion(correo.trim(), contrasena);
      } else {
        await iniciarSesion(correo.trim(), contrasena, rolEsperado);
      }

      mostrar('Sesión iniciada correctamente', { tipo: 'exito' });
      router.replace('/dashboard');
    } catch (error) {
      mostrar(mensajeDeInicioSesion(error), { tipo: 'error' });
    } finally {
      setCargando(false);
    }
  };

  /** Conecté el botón biométrico con la reanudación real de sesión del backend. */
  const manejarBiometria = async () => {
    if (cargandoBiometria || cargando) return;
    setCargandoBiometria(true);
    try {
      await iniciarSesionBiometrica();
      mostrar('Sesión iniciada con biometría', { tipo: 'exito' });
      router.replace('/dashboard');
    } catch (error) {
      mostrar(
        error instanceof Error
          ? error.message
          : 'No se pudo iniciar sesión con biometría',
        { tipo: 'error' },
      );
    } finally {
      setCargandoBiometria(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <View style={styles.logo}>
            <Text style={styles.logoTexto}>R</Text>
          </View>

          <Text style={styles.marca}>RUTA GO</Text>
          <Text style={styles.lema}>Tu camino, más fácil</Text>
        </View>

        <Card style={styles.tarjeta}>
          <Text style={styles.titulo}>¡Bienvenido!</Text>
          <Text style={styles.subtitulo}>
            {etiquetaRol
              ? `Ingresa con tu cuenta de ${etiquetaRol} para continuar`
              : 'Ingresa a tu cuenta para continuar'}
          </Text>

          <Input
            etiqueta="Correo electrónico"
            requerido
            placeholder="tucorreo@ejemplo.com"
            value={correo}
            onChangeText={setCorreo}
            error={errorCorreo}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="email"
            contenedorStyle={styles.campo}
          />

          <Input
            etiqueta="Contraseña"
            requerido
            placeholder="Ingresa tu contraseña"
            value={contrasena}
            onChangeText={setContrasena}
            error={errorContrasena}
            esContrasena
            autoCapitalize="none"
            autoComplete="current-password"
            contenedorStyle={styles.campo}
          />

          <Pressable
            style={styles.olvido}
            onPress={() => router.push('/recuperar-password')}>
            <Text style={styles.olvidoTexto}>¿Olvidaste tu contraseña?</Text>
          </Pressable>

          <Button
            titulo="Iniciar sesión"
            variante="primario"
            cargando={cargando}
            onPress={manejarInicioSesion}
          />

          {biometria.disponible ? (
            <Pressable
              testID="boton-biometria"
              style={styles.biometria}
              disabled={cargandoBiometria || cargando}
              onPress={manejarBiometria}>
              <MaterialCommunityIcons
                name={
                  biometria.tipo === 'faceid'
                    ? 'face-recognition'
                    : 'fingerprint'
                }
                size={22}
                color={Colores.primario}
              />
              <Text style={styles.biometriaTexto}>
                {cargandoBiometria
                  ? 'Verificando identidad...'
                  : `Entrar con ${biometria.etiqueta}`}
              </Text>
            </Pressable>
          ) : null}

          <View style={styles.registro}>
            <Text style={styles.registroEtiqueta}>¿No tienes una cuenta? </Text>

            <Pressable
              onPress={() =>
                router.push('/registro' as Parameters<typeof router.push>[0])
              }>
              <Text style={styles.registroEnlace}>Regístrate</Text>
            </Pressable>
          </View>
        </Card>

        <Text style={styles.pie}>RUTA GO · Movilidad para todos</Text>
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
  header: {
    alignItems: 'center',
    marginBottom: Espacios.xxxl,
  },
  logo: {
    width: 76,
    height: 76,
    borderRadius: Radios.extra,
    backgroundColor: Colores.primario,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Espacios.md,
  },
  logoTexto: {
    color: Colores.blanco,
    fontSize: 42,
    fontWeight: '900',
  },
  marca: {
    color: Colores.primario,
    fontSize: 27,
    fontWeight: '900',
    letterSpacing: 3,
  },
  lema: {
    color: Colores.textoSecundario,
    fontSize: 14,
    marginTop: 7,
  },
  tarjeta: {
    padding: Espacios.xxxl,
  },
  titulo: {
    color: Colores.texto,
    fontSize: 27,
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
  olvido: {
    alignSelf: 'flex-end',
    marginTop: Espacios.xs,
    marginBottom: Espacios.xxl,
  },
  olvidoTexto: {
    color: Colores.primario,
    fontSize: Tipografia.etiqueta,
    fontWeight: '600',
  },
  biometria: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Espacios.sm,
    minHeight: 48,
    marginTop: Espacios.md,
    borderRadius: Radios.grande,
    borderWidth: 1,
    borderColor: Colores.borde,
    backgroundColor: Colores.fondo,
  },
  biometriaTexto: {
    color: Colores.primario,
    fontSize: Tipografia.etiqueta,
    fontWeight: '700',
  },
  registro: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
    marginTop: Espacios.xxl,
  },
  registroEtiqueta: {
    color: Colores.textoSecundario,
    fontSize: Tipografia.etiqueta,
  },
  registroEnlace: {
    color: Colores.primario,
    fontSize: Tipografia.etiqueta,
    fontWeight: '800',
  },
  pie: {
    color: Colores.textoTerciario,
    fontSize: Tipografia.ayuda,
    textAlign: 'center',
    marginTop: Espacios.xxl,
  },
});
