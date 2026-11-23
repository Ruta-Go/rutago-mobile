import { usePathname, useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { ROLES } from '@/constants/roles';
import { Colores, Espacios, Radios, Tipografia } from '@/constants/tema';
import { useSesion } from '@/hooks/useSesion';

export type Pestana = {
  etiqueta: string;
  icono: string;
  ruta:
    | '/dashboard'
    | '/buscar-viajes'
    | '/mis-viajes'
    | '/mis-solicitudes'
    | '/reportar-ubicacion'
    | '/notificaciones'
    | '/mi-perfil'
    | '/panel-gestion';
};

/**
 * Rutas de la barra inferior por rol real del backend.
 * No sustituye a los guards de `_layout.tsx`: sólo ofrece accesos rápidos.
 */
export const PESTANAS_POR_ROL: Record<number, Pestana[]> = {
  [ROLES.PASAJERO]: [
    { etiqueta: 'Inicio', icono: '🏠', ruta: '/dashboard' },
    { etiqueta: 'Buscar', icono: '🔎', ruta: '/buscar-viajes' },
    { etiqueta: 'Mis viajes', icono: '🚗', ruta: '/mis-viajes' },
    { etiqueta: 'Avisos', icono: '🔔', ruta: '/notificaciones' },
    { etiqueta: 'Perfil', icono: '👤', ruta: '/mi-perfil' },
  ],
  [ROLES.CONDUCTOR]: [
    { etiqueta: 'Inicio', icono: '🏠', ruta: '/dashboard' },
    { etiqueta: 'Solicitudes', icono: '📩', ruta: '/mis-solicitudes' },
    { etiqueta: 'Mis viajes', icono: '🚘', ruta: '/mis-viajes' },
    { etiqueta: 'Ubicación', icono: '📍', ruta: '/reportar-ubicacion' },
    { etiqueta: 'Perfil', icono: '👤', ruta: '/mi-perfil' },
  ],
  [ROLES.ADMINISTRADOR]: [
    { etiqueta: 'Inicio', icono: '🏠', ruta: '/dashboard' },
    { etiqueta: 'Gestión', icono: '🛠️', ruta: '/panel-gestion' },
    { etiqueta: 'Avisos', icono: '🔔', ruta: '/notificaciones' },
    { etiqueta: 'Perfil', icono: '👤', ruta: '/mi-perfil' },
  ],
};

export function TabBarPorRol() {
  const router = useRouter();
  const rutaActual = usePathname();
  const { token, usuario } = useSesion();
  const rolId = Number(usuario?.rolId ?? usuario?.rol?.id);
  const pestanas = token ? PESTANAS_POR_ROL[rolId] ?? [] : [];

  if (pestanas.length === 0) return null;

  return (
    <View style={styles.barra} testID="tab-bar-por-rol">
      {pestanas.map((pestana) => {
        const seleccionada = rutaActual === pestana.ruta;
        return (
          <Pressable
            key={pestana.ruta}
            testID={`tab-${pestana.ruta.slice(1)}`}
            accessibilityRole="tab"
            accessibilityLabel={pestana.etiqueta}
            accessibilityState={{ selected: seleccionada }}
            onPress={() =>
              router.push(pestana.ruta as Parameters<typeof router.push>[0])
            }
            style={({ pressed }) => [
              styles.pestana,
              seleccionada && styles.pestanaSeleccionada,
              pressed && styles.pestanaPresionada,
            ]}>
            <Text
              style={[
                styles.icono,
                seleccionada && styles.iconoSeleccionado,
              ]}>
              {pestana.icono}
            </Text>
            <Text
              style={[
                styles.etiqueta,
                seleccionada && styles.etiquetaSeleccionada,
              ]}
              numberOfLines={1}>
              {pestana.etiqueta}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  barra: {
    flexDirection: 'row',
    alignItems: 'stretch',
    justifyContent: 'space-around',
    backgroundColor: Colores.blanco,
    borderTopWidth: 1,
    borderTopColor: Colores.bordeSuave,
    paddingVertical: Espacios.sm,
    paddingHorizontal: Espacios.xs,
  },
  pestana: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    paddingVertical: Espacios.xs,
    borderRadius: Radios.pequeno,
  },
  pestanaSeleccionada: {
    backgroundColor: Colores.primarioSuave,
  },
  pestanaPresionada: {
    opacity: 0.75,
  },
  icono: {
    fontSize: 18,
    color: Colores.textoSecundario,
  },
  iconoSeleccionado: {
    color: Colores.primario,
  },
  etiqueta: {
    fontSize: Tipografia.ayuda,
    color: Colores.textoSecundario,
    fontWeight: '600',
  },
  etiquetaSeleccionada: {
    color: Colores.primario,
  },
});
