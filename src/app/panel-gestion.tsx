import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { isAxiosError, type AxiosError } from 'axios';
import { router, Stack } from 'expo-router';

import { volverSeguro } from '@/utils/navegacion';

import { RECURSOS } from '@/constants/gestion';
import { ROLES, esRolValido, nombreRol } from '@/constants/roles';
import { useSesion } from '@/hooks/useSesion';
import { listarRecurso } from '@/services/recursos';

type Modulo = {
  clave: string;
  titulo: string;
  descripcion: string;
  icono: string;
  ruta: string;
  recurso?: keyof typeof RECURSOS;
};

const MODULOS_ADMIN: Modulo[] = [
  { clave: 'usuarios', titulo: 'Usuarios', descripcion: 'Cuentas, roles y estado', icono: '👥', ruta: '/gestion?recurso=usuarios', recurso: 'usuarios' },
  { clave: 'conductores', titulo: 'Conductores', descripcion: 'Licencias y estados', icono: '🧑‍✈️', ruta: '/gestion?recurso=conductores', recurso: 'conductores' },
  { clave: 'pasajeros', titulo: 'Pasajeros', descripcion: 'Datos y documentos', icono: '🎫', ruta: '/gestion?recurso=pasajeros', recurso: 'pasajeros' },
  { clave: 'vehiculos', titulo: 'Vehículos', descripcion: 'Placas, estados y GPS', icono: '🚐', ruta: '/gestion?recurso=vehiculos', recurso: 'vehiculos' },
  { clave: 'rutas', titulo: 'Rutas', descripcion: 'Orígenes y destinos reales', icono: '🧭', ruta: '/gestion?recurso=rutas', recurso: 'rutas' },
  { clave: 'horarios', titulo: 'Horarios', descripcion: 'Salidas y frecuencias', icono: '🕒', ruta: '/gestion?recurso=horarios', recurso: 'horarios' },
  { clave: 'viajes', titulo: 'Viajes', descripcion: 'Estados y asignaciones', icono: '🚗', ruta: '/gestion?recurso=viajes', recurso: 'viajes' },
  { clave: 'comunas', titulo: 'Comunas', descripcion: 'Catálogo de ubicación', icono: '📍', ruta: '/gestion?recurso=comunas', recurso: 'comunas' },
  { clave: 'barrios', titulo: 'Barrios', descripcion: 'Catálogo de ubicación', icono: '🏘️', ruta: '/gestion?recurso=barrios', recurso: 'barrios' },
  { clave: 'notificacion', titulo: 'Enviar notificación', descripcion: 'Aviso interno real por usuario', icono: '🔔', ruta: '/crear-notificacion' },
];

function mensajeError(error: unknown): string {
  const err = error as AxiosError<{ message?: string }>;
  if (err.response?.data?.message) return err.response.data.message;
  if (isAxiosError(error)) {
    return `Error ${err.response?.status ?? 'de conexión'}: ${err.message}`;
  }
  return 'No se pudo consultar el panel.';
}

export default function PanelGestionScreen() {
  const { usuario } = useSesion();
  const rolId = Number(usuario?.rolId ?? usuario?.rol?.id);
  const modulos = useMemo(
    () => (rolId === ROLES.ADMINISTRADOR ? MODULOS_ADMIN : ([] as Modulo[])),
    [rolId],
  );

  const [conteos, setConteos] = useState<Record<string, number>>({});
  const [cargando, setCargando] = useState(true);
  const [refrescando, setRefrescando] = useState(false);

  const cargar = useCallback(async () => {
    if (modulos.length === 0) {
      setCargando(false);
      setRefrescando(false);
      return;
    }
    const conEndpoints = modulos.filter((modulo) => modulo.recurso);
    const resultados = await Promise.allSettled(
      conEndpoints.map((modulo) =>
        listarRecurso(RECURSOS[modulo.recurso as string].endpoint),
      ),
    );
    const nuevosConteos: Record<string, number> = {};
    resultados.forEach((resultado, indice) => {
      if (resultado.status === 'fulfilled') {
        nuevosConteos[conEndpoints[indice].clave] =
          resultado.value.total ?? resultado.value.items.length;
      } else {
        console.warn(
          `No se pudo contar ${conEndpoints[indice].clave}:`,
          mensajeError(resultado.reason),
        );
      }
    });
    setConteos(nuevosConteos);
    setCargando(false);
    setRefrescando(false);
  }, [modulos]);

  useEffect(() => {
    void Promise.resolve().then(cargar);
  }, [cargar]);

  if (!esRolValido(rolId) || rolId !== ROLES.ADMINISTRADOR) {
    return (
      <>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={[styles.container, styles.centro]}>
          <Text style={styles.titulo}>Acceso restringido</Text>
          <Text style={styles.descripcion}>
            Este panel sólo está disponible para el rol Administrador.
          </Text>
          <Pressable style={styles.boton} onPress={() => volverSeguro()}>
            <Text style={styles.textoBoton}>Volver</Text>
          </Pressable>
        </View>
      </>
    );
  }

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contenido}
        refreshControl={
          <RefreshControl
            refreshing={refrescando}
            onRefresh={() => {
              setRefrescando(true);
              void cargar();
            }}
            colors={['#087A35']}
          />
        }>
        <Pressable style={styles.volver} onPress={() => volverSeguro()}>
          <Text style={styles.volverTexto}>← Volver</Text>
        </Pressable>

        <Text style={styles.marca}>RUTA GO</Text>
        <Text style={styles.titulo}>Panel de gestión</Text>
        <Text style={styles.rol}>{nombreRol(rolId)}</Text>
        <Text style={styles.descripcion}>
          Los conteos se consultan a los endpoints reales del backend.
        </Text>

        {cargando ? (
          <View style={styles.cargando}>
            <ActivityIndicator size="large" color="#087A35" />
            <Text style={styles.ayuda}>Consultando módulos...</Text>
          </View>
        ) : (
          <View style={styles.rejilla}>
            {modulos.map((modulo) => (
              <Pressable
                key={modulo.clave}
                style={styles.tarjeta}
                onPress={() =>
                  router.push(modulo.ruta as Parameters<typeof router.push>[0])
                }>
                <Text style={styles.icono}>{modulo.icono}</Text>
                <Text style={styles.tarjetaTitulo}>{modulo.titulo}</Text>
                <Text style={styles.tarjetaDescripcion}>{modulo.descripcion}</Text>
                {modulo.clave in conteos && (
                  <Text style={styles.conteo}>
                    {conteos[modulo.clave]} registrado
                    {conteos[modulo.clave] === 1 ? '' : 's'}
                  </Text>
                )}
              </Pressable>
            ))}
          </View>
        )}
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  contenido: { padding: 24, paddingTop: 65, paddingBottom: 40 },
  centro: { justifyContent: 'center', padding: 30 },
  volver: { marginBottom: 22 },
  volverTexto: { color: '#087A35', fontSize: 15, fontWeight: '700' },
  marca: { color: '#087A35', fontSize: 22, fontWeight: '900', letterSpacing: 4 },
  titulo: { color: '#202936', fontSize: 27, fontWeight: '800', marginTop: 16 },
  rol: { color: '#687385', fontSize: 14, fontWeight: '700', marginTop: 8 },
  descripcion: { color: '#687385', fontSize: 14, marginTop: 8, lineHeight: 20 },
  cargando: { alignItems: 'center', padding: 45 },
  ayuda: { color: '#687385', marginTop: 12 },
  rejilla: { marginTop: 26 },
  tarjeta: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 15,
    padding: 17,
    marginBottom: 12,
  },
  icono: { fontSize: 26, marginBottom: 8 },
  tarjetaTitulo: { color: '#202936', fontSize: 17, fontWeight: '800' },
  tarjetaDescripcion: { color: '#687385', fontSize: 13, marginTop: 5, lineHeight: 19 },
  conteo: { color: '#087A35', fontSize: 13, fontWeight: '700', marginTop: 9 },
  boton: {
    backgroundColor: '#087A35',
    borderRadius: 10,
    paddingVertical: 13,
    alignItems: 'center',
    marginTop: 22,
  },
  textoBoton: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
});
