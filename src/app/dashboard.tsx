import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Stack, router } from 'expo-router';

import { ROLES, esRolValido, nombreRol } from '@/constants/roles';
import { useRealtime } from '@/hooks/useRealtime';
import { useResponsivo } from '@/hooks/useResponsivo';
import { useSesion } from '@/hooks/useSesion';
import { api, extraerLista } from '@/services/api';

type Opcion = {
  titulo: string;
  descripcion: string;
  icono: string;
  badge?: number;
  ruta?:
    | '/buscar-viajes'
    | '/aceptar-viaje'
    | '/reportar-ubicacion'
    | '/crear-viaje'
    | '/viajes-disponibles'
    | '/mis-viajes'
    | '/mis-solicitudes'
    | '/mi-perfil'
    | '/panel-gestion'
    | '/notificaciones';
};

const OPCIONES_PASAJERO: Opcion[] = [
  {
    titulo: 'Buscar viajes',
    descripcion: 'Encuentra rutas por origen y destino',
    icono: '🔎',
    ruta: '/buscar-viajes',
  },
  {
    titulo: 'Solicitar viaje',
    descripcion: 'Crea una solicitud con ruta y horario reales',
    icono: '➕',
    ruta: '/crear-viaje',
  },
  {
    titulo: 'Viajes disponibles',
    descripcion: 'Únete a solicitudes abiertas',
    icono: '🚐',
    ruta: '/viajes-disponibles',
  },
  {
    titulo: 'Mis viajes',
    descripcion: 'Consulta tus viajes',
    icono: '🚗',
    ruta: '/mis-viajes',
  },
  {
    titulo: 'Mis solicitudes',
    descripcion: 'Revisa tus solicitudes',
    icono: '📋',
    ruta: '/mis-solicitudes',
  },
  {
    titulo: 'Notificaciones',
    descripcion: 'Avisos de tus viajes',
    icono: '🔔',
    ruta: '/notificaciones',
  },
  {
    titulo: 'Mi perfil',
    descripcion: 'Consulta y actualiza tus datos',
    icono: '👤',
    ruta: '/mi-perfil',
  },
];

const OPCIONES_CONDUCTOR: Opcion[] = [
  {
    titulo: 'Solicitudes recibidas',
    descripcion: 'Acepta viajes que buscan conductor',
    icono: '📩',
    ruta: '/mis-solicitudes',
  },
  {
    titulo: 'Mis viajes',
    descripcion: 'Administra tus recorridos',
    icono: '🚘',
    ruta: '/mis-viajes',
  },
  {
    titulo: 'Reportar ubicación',
    descripcion: 'Envía tu GPS real del vehículo asignado',
    icono: '📍',
    ruta: '/reportar-ubicacion',
  },
  {
    titulo: 'Notificaciones',
    descripcion: 'Avisos de tus viajes',
    icono: '🔔',
    ruta: '/notificaciones',
  },
  {
    titulo: 'Mi perfil',
    descripcion: 'Consulta y actualiza tus datos',
    icono: '👤',
    ruta: '/mi-perfil',
  },
];

const OPCIONES_GESTION: Opcion[] = [
  {
    titulo: 'Panel de gestión',
    descripcion: 'Administra entidades, rutas y viajes',
    icono: '🛠️',
    ruta: '/panel-gestion',
  },
  {
    titulo: 'Mis viajes',
    descripcion: 'Consulta tus viajes registrados',
    icono: '🚗',
    ruta: '/mis-viajes',
  },
  {
    titulo: 'Notificaciones',
    descripcion: 'Avisos de tus viajes',
    icono: '🔔',
    ruta: '/notificaciones',
  },
  {
    titulo: 'Mi perfil',
    descripcion: 'Consulta y actualiza tus datos',
    icono: '👤',
    ruta: '/mi-perfil',
  },
];

export default function DashboardScreen() {
  const { usuario, cerrarSesion } = useSesion();
  const rolId = Number(usuario?.rolId ?? usuario?.rol?.id);
  const rolValido = esRolValido(rolId);
  const diseno = useResponsivo();
  const [noLeidas, setNoLeidas] = useState(0);

  const cargarNoLeidas = useCallback(async () => {
    if (!rolValido) return;
    try {
      const respuesta = await api.get<unknown>('/notificaciones');
      const lista = extraerLista<{ leida?: boolean }>(respuesta.data);
      setNoLeidas(lista.filter((item) => !item.leida).length);
    } catch {
      // Sin conexión no se muestra un número inventado.
    }
  }, [rolValido]);

  useEffect(() => {
    void Promise.resolve().then(cargarNoLeidas);
  }, [cargarNoLeidas]);

  useRealtime((evento) => {
    if (
      evento.tipo === 'notificacion' ||
      evento.tipo === 'notificacion_leida'
    ) {
      void cargarNoLeidas();
    }
  });

  const opciones = useMemo(() => {
    if (rolId === ROLES.PASAJERO) return OPCIONES_PASAJERO;
    if (rolId === ROLES.CONDUCTOR) return OPCIONES_CONDUCTOR;
    if (rolId === ROLES.ADMINISTRADOR) return OPCIONES_GESTION;
    return [] as Opcion[];
  }, [rolId]);

  const opcionesVisibles = useMemo(
    () =>
      opciones.map((opcion) =>
        opcion.ruta === '/notificaciones' && noLeidas > 0
          ? { ...opcion, badge: noLeidas }
          : opcion,
      ),
    [opciones, noLeidas],
  );

  const manejarOpcion = (opcion: Opcion) => {
    if (opcion.ruta) {
      router.push(opcion.ruta as Parameters<typeof router.push>[0]);
    }
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />

      <ScrollView
        style={styles.container}
        contentContainerStyle={[
          styles.contenido,
          {
            padding: diseno.padding,
            paddingTop: diseno.esCompacto ? 40 : 65,
          },
        ]}>
        <View style={styles.encabezado}>
          <Text style={styles.marca}>RUTA GO</Text>
          <Text style={styles.acento}>━━━━━━━━</Text>
          <Text style={[styles.bienvenida, { fontSize: diseno.tamanoTitulo }]}>
            ¡Hola{usuario?.nombres ? `, ${usuario.nombres}` : ''}!
          </Text>
          <Text style={styles.rol}>{rolValido ? nombreRol(rolId) : 'Rol no reconocido'}</Text>
          <Text style={styles.descripcion}>
            {rolId === ROLES.PASAJERO
              ? '¿A dónde quieres ir hoy?'
              : 'Bienvenido a tu espacio en RutaGo.'}
          </Text>
        </View>

        {!rolValido && (
          <View style={styles.advertencia}>
            <Text style={styles.advertenciaTexto}>
              Tu cuenta no tiene un rol válido. Cierra sesión y contacta al
              administrador.
            </Text>
          </View>
        )}

        <Text style={styles.tituloSeccion}>Mi espacio</Text>

        {opcionesVisibles.map((opcion) => (
          <Pressable
            key={opcion.titulo}
            accessible
            accessibilityRole="button"
            accessibilityLabel={`${opcion.titulo}. ${opcion.descripcion}`}
            style={({ pressed }) => [
              styles.opcion,
              pressed && styles.opcionPresionada,
              diseno.esCompacto && styles.opcionCompacta,
            ]}
            onPress={() => manejarOpcion(opcion)}>
            <View style={styles.icono}>
              <Text style={styles.iconoTexto}>{opcion.icono}</Text>
              {opcion.badge ? (
                <View style={styles.badge}>
                  <Text style={styles.badgeTexto}>
                    {opcion.badge > 9 ? '9+' : opcion.badge}
                  </Text>
                </View>
              ) : null}
            </View>

            <View style={styles.textosOpcion}>
              <Text style={styles.tituloOpcion}>{opcion.titulo}</Text>
              <Text style={styles.descripcionOpcion}>{opcion.descripcion}</Text>
            </View>

            <Text style={styles.flecha}>›</Text>
          </Pressable>
        ))}

        <Pressable
          style={({ pressed }) => [styles.cerrarSesion, pressed && styles.opcionPresionada]}
          onPress={() => {
            void cerrarSesion();
          }}>
          <Text style={styles.cerrarSesionTexto}>Cerrar sesión</Text>
        </Pressable>

        <Text style={styles.pie}>RUTA GO · Movilidad para todos</Text>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
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
    color: '#087A35',
    fontSize: 25,
    fontWeight: '900',
    letterSpacing: 5,
  },
  acento: {
    color: '#FFD900',
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
    color: '#087A35',
    fontSize: 17,
    fontWeight: '700',
    marginTop: 8,
  },
  descripcion: {
    color: '#687385',
    fontSize: 15,
    marginTop: 15,
  },
  advertencia: {
    backgroundColor: '#FFF4E5',
    borderColor: '#FFD900',
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    marginBottom: 20,
  },
  advertenciaTexto: {
    color: '#8A5A00',
    fontSize: 13,
    textAlign: 'center',
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
  opcionCompacta: {
    padding: 12,
    marginBottom: 10,
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
  badge: {
    position: 'absolute',
    top: -6,
    right: -6,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#FFD900',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeTexto: {
    color: '#1F2937',
    fontSize: 11,
    fontWeight: '900',
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
    color: '#087A35',
    fontSize: 28,
    fontWeight: '700',
  },
  cerrarSesion: {
    marginTop: 20,
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FCA5A5',
    alignItems: 'center',
  },
  cerrarSesionTexto: {
    color: '#B91C1C',
    fontSize: 15,
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
