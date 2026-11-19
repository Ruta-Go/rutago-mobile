import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { ToastProvider } from '@/components/ui';
import { SesionProvider, useSesion } from '@/hooks/useSesion';

function Navegador() {
  const { token, cargando } = useSesion();

  if (cargando) {
    return (
      <View style={styles.cargando}>
        <ActivityIndicator size="large" color="#07883F" />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Protected guard={!token} redirectTo="/dashboard">
        <Stack.Screen name="index" />
        <Stack.Screen name="registro" />
        <Stack.Screen name="recuperar-password" />
      </Stack.Protected>

      <Stack.Protected guard={Boolean(token)} redirectTo="/">
        <Stack.Screen name="dashboard" />
        <Stack.Screen name="buscar-viajes" />
        <Stack.Screen name="mis-viajes" />
        <Stack.Screen name="mis-solicitudes" />
        <Stack.Screen name="mi-perfil" />
        <Stack.Screen name="notificaciones" />
      </Stack.Protected>

      <Stack.Screen name="explore" />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <ToastProvider>
      <SesionProvider>
        <StatusBar style="dark" />
        <Navegador />
      </SesionProvider>
    </ToastProvider>
  );
}

const styles = StyleSheet.create({
  cargando: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
});
