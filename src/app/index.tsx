
import { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import { iniciarSesion } from '../services/authService';

export default function HomeScreen() {
  const [correo, setCorreo] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [mostrarContrasena, setMostrarContrasena] = useState(false);
  const [cargando, setCargando] = useState(false);

  const manejarInicioSesion = async () => {
    if (!correo.trim() || !contrasena) {
      Alert.alert(
        'Campos requeridos',
        'Ingresa tu correo electrónico y contraseña',
      );
      return;
    }

    try {
      setCargando(true);

      await iniciarSesion(correo, contrasena);

      router.replace('/dashboard');
    } catch (error) {
      Alert.alert(
        'No se pudo iniciar sesión',
        error instanceof Error
          ? error.message
          : 'No fue posible conectar con el servidor',
      );
    } finally {
      setCargando(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar style="light" />

      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <View style={styles.logo}>
            <Text style={styles.logoText}>R</Text>
          </View>

          <Text style={styles.brand}>RUTA GO</Text>
          <Text style={styles.tagline}>Tu camino, más fácil</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.title}>¡Bienvenido!</Text>
          <Text style={styles.subtitle}>
            Ingresa a tu cuenta para continuar
          </Text>

          <Text style={styles.label}>Correo electrónico</Text>

          <TextInput
            style={styles.input}
            placeholder="tucorreo@ejemplo.com"
            placeholderTextColor="#8993A4"
            value={correo}
            onChangeText={setCorreo}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="email"
          />

          <Text style={styles.label}>Contraseña</Text>

          <View style={styles.passwordContainer}>
            <TextInput
              style={styles.passwordInput}
              placeholder="Ingresa tu contraseña"
              placeholderTextColor="#8993A4"
              value={contrasena}
              onChangeText={setContrasena}
              secureTextEntry={!mostrarContrasena}
              autoCapitalize="none"
              autoComplete="current-password"
            />

            <TouchableOpacity
              onPress={() => setMostrarContrasena(!mostrarContrasena)}
              accessibilityRole="button"
              accessibilityLabel={
                mostrarContrasena
                  ? 'Ocultar contraseña'
                  : 'Mostrar contraseña'
              }
            >
              <Text style={styles.showPassword}>
                {mostrarContrasena ? 'Ocultar' : 'Ver'}
              </Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.forgotButton}
            onPress={() =>
              Alert.alert(
                'Recuperar contraseña',
                'La recuperación de contraseña todavía no está conectada.',
              )
            }
          >
            <Text style={styles.forgotText}>
              ¿Olvidaste tu contraseña?
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.loginButton,
              cargando && styles.loginButtonDisabled,
            ]}
            onPress={manejarInicioSesion}
            activeOpacity={0.85}
            disabled={cargando}
          >
            <Text style={styles.loginText}>
              {cargando ? 'Conectando...' : 'Iniciar sesión'}
            </Text>
          </TouchableOpacity>

          <View style={styles.registerRow}>
            <Text style={styles.registerLabel}>
              ¿No tienes una cuenta?{' '}
            </Text>

            <TouchableOpacity
              onPress={() =>
                Alert.alert(
                  'Registro',
                  'El registro desde esta pantalla todavía no está conectado.',
                )
              }
            >
              <Text style={styles.registerLink}>Regístrate</Text>
            </TouchableOpacity>
          </View>
        </View>

        <Text style={styles.footer}>
          RUTA GO · Movilidad para todos
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B1730',
  },
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 36,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  logo: {
    width: 76,
    height: 76,
    borderRadius: 24,
    backgroundColor: '#2F80ED',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  logoText: {
    color: '#FFFFFF',
    fontSize: 42,
    fontWeight: '900',
  },
  brand: {
    color: '#FFFFFF',
    fontSize: 27,
    fontWeight: '900',
    letterSpacing: 3,
  },
  tagline: {
    color: '#B7C8E5',
    fontSize: 14,
    marginTop: 7,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
  },
  title: {
    color: '#152544',
    fontSize: 27,
    fontWeight: '800',
    marginBottom: 8,
  },
  subtitle: {
    color: '#65728A',
    fontSize: 14,
    marginBottom: 27,
  },
  label: {
    color: '#263754',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 9,
  },
  input: {
    height: 52,
    borderWidth: 1,
    borderColor: '#DCE3ED',
    borderRadius: 12,
    paddingHorizontal: 14,
    color: '#17243B',
    fontSize: 15,
    marginBottom: 20,
    backgroundColor: '#FAFBFD',
  },
  passwordContainer: {
    minHeight: 52,
    borderWidth: 1,
    borderColor: '#DCE3ED',
    borderRadius: 12,
    paddingLeft: 14,
    paddingRight: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FAFBFD',
  },
  passwordInput: {
    flex: 1,
    height: 50,
    color: '#17243B',
    fontSize: 15,
  },
  showPassword: {
    color: '#2F80ED',
    fontWeight: '700',
    padding: 5,
  },
  forgotButton: {
    alignSelf: 'flex-end',
    marginTop: 14,
    marginBottom: 24,
  },
  forgotText: {
    color: '#2F80ED',
    fontSize: 13,
    fontWeight: '600',
  },
  loginButton: {
    height: 54,
    borderRadius: 14,
    backgroundColor: '#2F80ED',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginButtonDisabled: {
    opacity: 0.6,
  },
  loginText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  registerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
    marginTop: 24,
  },
  registerLabel: {
    color: '#65728A',
    fontSize: 13,
  },
  registerLink: {
    color: '#2F80ED',
    fontSize: 13,
    fontWeight: '800',
  },
  footer: {
    color: '#A9BAD6',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 24,
  },
});
