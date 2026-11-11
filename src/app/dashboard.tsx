
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { Stack, router } from 'expo-router';

type Usuario = {
  nombres?: string;
  rol?: {
    nombreRol?: string;
  } | null;
};

const OPCIONES_PASAJERO = [
  { titulo: 'Buscar viajes', descripcion: 'Encuentra viajes disponibles', icono: '🔎' },
  { titulo: 'Mis viajes', descripcion: 'Consulta tus viajes', icono: '🚗' },
  { titulo: 'Mis solicitudes', descripcion: 'Revisa tus solicitudes', icono: '📋' },
  { titulo: 'Mi perfil', descripcion: 'Consulta tus datos personales', icono: '👤' },
];

const OPCIONES_CONDUCTOR = [
  { titulo: 'Publicar viaje', descripcion: 'Ofrece un nuevo recorrido', icono: '➕' },
  { titulo: 'Mis viajes', descripcion: 'Administra tus recorridos', icono: '🚘' },
  { titulo: 'Solicitudes recibidas', descripcion: 'Gestiona pasajeros interesados', icono: '📩' },
  { titulo: 'Mi perfil', descripcion: 'Consulta tus datos personales', icono: '👤' },
];

export default function DashboardScreen() {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    async function cargarUsuario() {
      try {
        const datos = await SecureStore.getItemAsync('rutago_user');
        if (datos) setUsuario(JSON.parse(datos));
      } catch {
        Alert.alert('Error', 'No fue posible cargar los datos del usuario');
      } finally {
        setCargando(false);
      }
    }

    cargarUsuario();
  }, []);

  if (cargando) {
    return (
      <View style={styles.cargando}>
        <ActivityIndicator size="large" color="#07883F" />
      </View>
    );
  }

  const rol = usuario?.rol?.nombreRol?.toLowerCase() ?? '';
  const esConductor = rol.includes('conductor');
  const opciones = esConductor ? OPCIONES_CONDUCTOR : OPCIONES_PASAJERO;
  const nombreRol = esConductor ? 'Conductor' : 'Pasajero';

  const manejarOpcion = (titulo: string) => {
    if (titulo === 'Buscar viajes' && !esConductor) {
      router.push('/buscar-viajes');
      return;
    }

    Alert.alert(
      titulo,
      'Esta función la conectaremos próximamente.',
    );
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />

      <ScrollView style={styles.container} contentContainerStyle={styles.contenido}>
        <View style={styles.encabezado}>
          <Text style={styles.marca}>RUTA GO</Text>
          <Text style={styles.acento}>━━━━━━━━</Text>
          <Text style={styles.bienvenida}>
            ¡Hola{usuario?.nombres ? `, ${usuario.nombres}` : ''}!
          </Text>
          <Text style={styles.rol}>{nombreRol}</Text>
          <Text style={styles.descripcion}>
            ¿A dónde quieres ir hoy?
          </Text>
        </View>

        <Text style={styles.tituloSeccion}>Mi espacio</Text>

        {opciones.map((opcion) => (
          <Pressable
            key={opcion.titulo}
            style={({ pressed }) => [
              styles.opcion,
              pressed && styles.opcionPresionada,
            ]}
            onPress={() => manejarOpcion(opcion.titulo)}>
            <View style={styles.icono}>
              <Text style={styles.iconoTexto}>{opcion.icono}</Text>
            </View>

            <View style={styles.textosOpcion}>
              <Text style={styles.tituloOpcion}>{opcion.titulo}</Text>
              <Text style={styles.descripcionOpcion}>{opcion.descripcion}</Text>
            </View>

            <Text style={styles.flecha}>›</Text>
          </Pressable>
        ))}

        <Text style={styles.pie}>RUTA GO · Movilidad para todos</Text>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  cargando: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  contenido: {
    padding: 24,
    paddingTop: 65,
  },
  encabezado: {
    alignItems: 'center',
    marginBottom: 38,
  },
  marca: {
    color: '#07883F',
    fontSize: 25,
    fontWeight: '900',
    letterSpacing: 5,
  },
  acento: {
    color: '#F5C400',
    marginTop: 8,
    marginBottom: 25,
  },
  bienvenida: {
    color: '#202936',
    fontSize: 27,
    fontWeight: '800',
    textAlign: 'center',
  },
  rol: {
    color: '#07883F',
    fontSize: 17,
    fontWeight: '700',
    marginTop: 8,
  },
  descripcion: {
    color: '#687385',
    fontSize: 15,
    marginTop: 15,
  },
  tituloSeccion: {
    color: '#202936',
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 16,
  },
  opcion: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 14,
    padding: 16,
    marginBottom: 13,
  },
  opcionPresionada: {
    backgroundColor: '#E6F4EC',
  },
  icono: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#E6F4EC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconoTexto: {
    fontSize: 23,
  },
  textosOpcion: {
    flex: 1,
    marginLeft: 14,
  },
  tituloOpcion: {
    color: '#202936',
    fontSize: 16,
    fontWeight: '700',
  },
  descripcionOpcion: {
    color: '#687385',
    fontSize: 12,
    marginTop: 5,
  },
  flecha: {
    color: '#07883F',
    fontSize: 28,
    fontWeight: '700',
  },
  pie: {
    color: '#9CA3AF',
    textAlign: 'center',
    marginTop: 25,
    marginBottom: 20,
    fontSize: 12,
  },
});
