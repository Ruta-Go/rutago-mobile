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
import { Colores, Espacios, Radios, Tipografia } from '@/constants/tema';
import { iniciarSesion } from '@/services/authService';

export default function HomeScreen() {
  const [correo, setCorreo] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [cargando, setCargando] = useState(false);
  const [errorCorreo, setErrorCorreo] = useState<string | undefined>();
  const [errorContrasena, setErrorContrasena] = useState<string | undefined>();
  const { mostrar } = useToast();

  const manejarInicioSesion = async () => {
    setErrorCorreo(undefined);
    setErrorContrasena(undefined);

    let valido = true;

    if (!correo.trim()) {
      setErrorCorreo('Ingresa tu correo electrónico');
      valido = false;
    }

    if (!contrasena) {
      setErrorContrasena('Ingresa tu contraseña');
      valido = false;
    }

    if (!valido) return;

    try {
      setCargando(true);

      await iniciarSesion(correo.trim(), contrasena);

      mostrar('Sesión iniciada correctamente', { tipo: 'exito' });
      router.replace('/dashboard');
    } catch (error) {
      mostrar(
        error instanceof Error
          ? error.message
          : 'No fue posible conectar con el servidor',
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
            Ingresa a tu cuenta para continuar
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
            onPress={() =>
              mostrar('La recuperación de contraseña aún no está conectada', {
                tipo: 'info',
              })
            }>
            <Text style={styles.olvidoTexto}>¿Olvidaste tu contraseña?</Text>
          </Pressable>

          <Button
            titulo="Iniciar sesión"
            variante="primario"
            cargando={cargando}
            onPress={manejarInicioSesion}
          />

          <View style={styles.registro}>
            <Text style={styles.registroEtiqueta}>¿No tienes una cuenta? </Text>

            <Pressable
              onPress={() =>
                mostrar('El registro desde esta pantalla aún no está conectado', {
                  tipo: 'info',
                })
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
