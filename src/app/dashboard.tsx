
import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { Stack } from 'expo-router';

type Usuario = {
  nombres?: string;
  rol?: {
    nombreRol?: string;
  } | null;
};

export default function DashboardScreen() {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    async function cargarUsuario() {
      try {
        const datos = await SecureStore.getItemAsync('rutago_user');
        if (datos) {
          setUsuario(JSON.parse(datos));
        }
      } finally {
        setCargando(false);
      }
    }

    cargarUsuario();
  }, []);

  if (cargando) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#07883F" />
      </View>
    );
  }

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.container}>
        <Text style={styles.brand}>RUTA GO</Text>

        <View style={styles.accent} />

        <Text style={styles.title}>
          ¡Bienvenido{usuario?.nombres ? `, ${usuario.nombres}` : ''}!
        </Text>

        <Text style={styles.subtitle}>
          {usuario?.rol?.nombreRol ?? 'Usuario'}
        </Text>

        <Text style={styles.description}>
          Tu espacio de movilidad está listo para continuar.
        </Text>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  brand: {
    color: '#07883F',
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: 5,
    marginBottom: 18,
  },
  accent: {
    width: 55,
    height: 5,
    backgroundColor: '#F5C400',
    borderRadius: 10,
    marginBottom: 28,
  },
  title: {
    color: '#202936',
    fontSize: 28,
    fontWeight: '800',
    textAlign: 'center',
  },
  subtitle: {
    color: '#07883F',
    fontSize: 18,
    fontWeight: '600',
    marginTop: 12,
  },
  description: {
    color: '#687385',
    fontSize: 15,
    textAlign: 'center',
    marginTop: 20,
  },
});
