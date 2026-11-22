import { useEffect } from 'react';
import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { ToastProvider } from '@/components/ui';
import { ROLES } from '@/constants/roles';
import { SesionProvider, useSesion } from '@/hooks/useSesion';
import { iniciarSincronizacionAutomatica } from '@/services/colaOffline';
import { escucharTapPush } from '@/services/notificaciones';

function Navegador() {
  const { token, usuario, cargando } = useSesion();
  const rolId = Number(usuario?.rolId ?? usuario?.rol?.id);
  const autenticado = Boolean(token);
  const esAdministrador = autenticado && rolId === ROLES.ADMINISTRADOR;

  if (cargando) {
    return (
      <View style={styles.cargando}>
        <ActivityIndicator size="large" color="#07883F" />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Protected guard={!autenticado} redirectTo="/dashboard">
        <Stack.Screen name="index" />
        <Stack.Screen name="registro" />
        <Stack.Screen name="recuperar-password" />
      </Stack.Protected>

      <Stack.Protected guard={autenticado} redirectTo="/">
        <Stack.Screen name="dashboard" />
        <Stack.Screen name="buscar-viajes" />
        <Stack.Screen name="crear-viaje" />
        <Stack.Screen name="viajes-disponibles" />
        <Stack.Screen name="aceptar-viaje" />
        <Stack.Screen name="mis-viajes" />
        <Stack.Screen name="mis-solicitudes" />
        <Stack.Screen name="mi-perfil" />
        <Stack.Screen name="notificaciones" />
        <Stack.Screen name="reportar-ubicacion" />
      </Stack.Protected>

      <Stack.Protected guard={esAdministrador} redirectTo="/dashboard">
        <Stack.Screen name="panel-gestion" />
        <Stack.Screen name="gestion" />
        <Stack.Screen name="gestion-detalle" />
        <Stack.Screen name="crear-notificacion" />
      </Stack.Protected>
    </Stack>
  );
}

export default function RootLayout() {
  const router = useRouter();

  useEffect(
    () =>
      escucharTapPush((destino) => {
        router.push(destino as Parameters<typeof router.push>[0]);
      }),
    [router],
  );

  /** Reenvío los cambios guardados sin red en cuanto vuelve la conexión. */
  useEffect(() => iniciarSincronizacionAutomatica(), []);

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
