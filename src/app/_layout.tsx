import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { TabBarPorRol } from '@/components/navegacion/TabBarPorRol';
import { ToastProvider } from '@/components/ui';
import { ROLES } from '@/constants/roles';
import { Colores } from '@/constants/tema';
import { SesionProvider, useSesion } from '@/hooks/useSesion';
import { useSincronizacionUniones } from '@/hooks/useSincronizacionUniones';
import { iniciarSincronizacionAutomatica } from '@/services/colaOffline';
import { FUENTES_ICONOS } from '@/services/fuentes';
import { GestorNotificaciones } from '@/components/notificaciones/GestorNotificaciones';

void SplashScreen.preventAutoHideAsync();

function Navegador() {
  const { token, usuario, cargando } = useSesion();
  const rolId = Number(usuario?.rolId ?? usuario?.rol?.id);
  const autenticado = Boolean(token);
  const esAdministrador = autenticado && rolId === ROLES.ADMINISTRADOR;

  if (cargando) {
    return (
      <View style={styles.cargando}>
        <ActivityIndicator size="large" color={Colores.primario} />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Protected guard={!autenticado} redirectTo="/dashboard">
        <Stack.Screen name="index" />
        <Stack.Screen name="iniciar-sesion" />
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
        <Stack.Screen name="detalle-viaje" />
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
  const [fuentesListas, errorFuentes] = useFonts(FUENTES_ICONOS);

  useSincronizacionUniones();

  useEffect(() => iniciarSincronizacionAutomatica(), []);

  useEffect(() => {
    if (fuentesListas || errorFuentes) {
      void SplashScreen.hideAsync();
    }
  }, [fuentesListas, errorFuentes]);

  return (
    <ToastProvider>
      <SesionProvider>
        <StatusBar style="dark" />
        <GestorNotificaciones />
        <View style={styles.contenedorAplicacion}>
          <View style={styles.franjaIdentidad} />
          {!fuentesListas && !errorFuentes ? (
            <View style={styles.cargando}>
              <ActivityIndicator size="large" color={Colores.primario} />
            </View>
          ) : (
            <>
              <View style={styles.cuerpo}>
                <Navegador />
              </View>
              <TabBarPorRol />
            </>
          )}
        </View>
      </SesionProvider>
    </ToastProvider>
  );
}

const styles = StyleSheet.create({
  contenedorAplicacion: {
    flex: 1,
    backgroundColor: Colores.blanco,
  },
  franjaIdentidad: {
    height: 4,
    backgroundColor: Colores.secundario,
  },
  cuerpo: {
    flex: 1,
  },
  cargando: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colores.blanco,
  },
});