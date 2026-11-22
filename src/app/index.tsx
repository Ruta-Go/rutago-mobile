import { useState } from 'react';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Colores, Espacios, Radios, Tipografia } from '@/constants/tema';
import type { RolSeleccion } from '@/constants/roles';

const OPCIONES: {
  clave: RolSeleccion;
  etiqueta: string;
  descripcion: string;
  icono: string;
}[] = [
  {
    clave: 'pasajero',
    etiqueta: 'Pasajero',
    descripcion: 'Busca y toma tu viaje',
    icono: 'account-outline',
  },
  {
    clave: 'conductor',
    etiqueta: 'Conductor',
    descripcion: 'Conduce y reporta tu ruta',
    icono: 'steering',
  },
];

/**
 * Pantalla de bienvenida. La selección es sólo una pista visual: el backend
 * sigue siendo la fuente de verdad y valida el rol real al iniciar sesión.
 */
export default function PantallaBienvenida() {
  const [seleccion, setSeleccion] = useState<RolSeleccion | null>(null);

  const continuar = () => {
    if (!seleccion) return;
    router.push(
      `/iniciar-sesion?rol=${seleccion}` as Parameters<typeof router.push>[0],
    );
  };

  return (
    <SafeAreaView style={styles.seguro}>
      <ScrollView
        contentContainerStyle={styles.contenido}
        showsVerticalScrollIndicator={false}>
        <View style={styles.identidad}>
          <View style={styles.logo}>
            <MaterialCommunityIcons
              name="bus-side"
              size={26}
              color={Colores.blanco}
            />
          </View>
          <View>
            <Text style={styles.marca}>RutaGo</Text>
            <Text style={styles.marcaSecundaria}>Transporte</Text>
          </View>
        </View>

        <View style={styles.fotoContenedor}>
          <Image
            source={require('../../assets/images/unipacifico-buenaventura.jpg')}
            style={styles.foto}
            resizeMode="cover"
            accessible
            accessibilityLabel="Entrada principal de la Universidad del Pacífico en Buenaventura"
          />
          <View style={styles.fotoEtiqueta}>
            <Text style={styles.fotoTitulo}>Universidad del Pacífico</Text>
            <Text style={styles.fotoTexto}>Buenaventura · Colombia</Text>
          </View>
        </View>

        <Text style={styles.credito}>
          Foto: Albert Torres Bonilla / Wikimedia Commons · CC BY-SA 4.0
        </Text>

        <Text style={styles.titulo}>Selecciona tu rol</Text>
        <Text style={styles.subtitulo}>
          Elige cómo quieres usar RutaGo. Tu cuenta real se validará al entrar.
        </Text>

        <View style={styles.opciones}>
          {OPCIONES.map((opcion) => {
            const activo = seleccion === opcion.clave;
            return (
              <Pressable
                key={opcion.clave}
                testID={`rol-${opcion.clave}`}
                accessibilityRole="radio"
                accessibilityState={{ selected: activo }}
                accessibilityLabel={`Rol ${opcion.etiqueta}`}
                onPress={() => setSeleccion(opcion.clave)}
                style={({ pressed }) => [
                  styles.opcion,
                  activo && styles.opcionSeleccionada,
                  pressed && styles.opcionPresionada,
                ]}>
                <View
                  style={[
                    styles.iconoContenedor,
                    activo && styles.iconoSeleccionado,
                  ]}>
                  <MaterialCommunityIcons
                    name={opcion.icono as never}
                    size={24}
                    color={activo ? Colores.primario : Colores.blanco}
                  />
                </View>
                <View style={styles.opcionTexto}>
                  <Text
                    style={[
                      styles.opcionTitulo,
                      activo && styles.opcionTituloSeleccionado,
                    ]}>
                    {opcion.etiqueta}
                  </Text>
                  <Text
                    style={[
                      styles.opcionDescripcion,
                      activo && styles.opcionDescripcionSeleccionada,
                    ]}>
                    {opcion.descripcion}
                  </Text>
                </View>
                {activo ? (
                  <MaterialCommunityIcons
                    name="check-circle"
                    size={22}
                    color={Colores.primario}
                  />
                ) : null}
              </Pressable>
            );
          })}
        </View>

        <Pressable
          testID="boton-continuar"
          accessibilityRole="button"
          accessibilityState={{ disabled: !seleccion }}
          onPress={continuar}
          disabled={!seleccion}
          style={({ pressed }) => [
            styles.continuar,
            !seleccion && styles.continuarDeshabilitado,
            pressed && seleccion && styles.continuarPresionado,
          ]}>
          <Text style={styles.continuarTexto}>Continuar</Text>
          <MaterialCommunityIcons
            name="arrow-right"
            size={20}
            color={Colores.blanco}
          />
        </Pressable>

        <Text style={styles.pie}>
          Movilidad real entre los barrios de Buenaventura y la Universidad
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  seguro: {
    flex: 1,
    backgroundColor: Colores.blanco,
  },
  contenido: {
    flexGrow: 1,
    paddingHorizontal: Espacios.xxl,
    paddingTop: Espacios.lg,
    paddingBottom: Espacios.xxxl,
  },
  identidad: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Espacios.md,
    marginBottom: Espacios.xl,
  },
  logo: {
    width: 46,
    height: 46,
    borderRadius: Radios.grande,
    backgroundColor: Colores.primario,
    alignItems: 'center',
    justifyContent: 'center',
  },
  marca: {
    color: Colores.primario,
    fontSize: 24,
    fontWeight: '900',
    lineHeight: 26,
  },
  marcaSecundaria: {
    color: Colores.textoSecundario,
    fontSize: 13,
    letterSpacing: 1,
  },
  fotoContenedor: {
    height: 210,
    borderRadius: Radios.extra,
    overflow: 'hidden',
    backgroundColor: Colores.primarioSuave,
  },
  foto: {
    width: '100%',
    height: '100%',
  },
  fotoEtiqueta: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    padding: Espacios.lg,
    backgroundColor: 'rgba(8, 122, 53, 0.82)',
  },
  fotoTitulo: {
    color: Colores.blanco,
    fontSize: Tipografia.subtitulo,
    fontWeight: '800',
  },
  fotoTexto: {
    color: Colores.secundario,
    fontSize: Tipografia.ayuda,
    marginTop: 2,
  },
  credito: {
    color: Colores.textoTerciario,
    fontSize: 10,
    marginTop: 6,
    textAlign: 'right',
  },
  titulo: {
    color: Colores.texto,
    fontSize: 26,
    fontWeight: '900',
    marginTop: Espacios.xxl,
  },
  subtitulo: {
    color: Colores.textoSecundario,
    fontSize: Tipografia.cuerpo,
    lineHeight: 21,
    marginTop: Espacios.xs,
  },
  opciones: {
    gap: Espacios.md,
    marginTop: Espacios.xl,
  },
  opcion: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Espacios.md,
    padding: Espacios.lg,
    borderRadius: Radios.grande,
    borderWidth: 2,
    borderColor: Colores.primario,
    backgroundColor: Colores.blanco,
  },
  opcionSeleccionada: {
    backgroundColor: Colores.secundario,
    borderColor: Colores.secundarioPresionado,
  },
  opcionPresionada: {
    opacity: 0.85,
  },
  iconoContenedor: {
    width: 44,
    height: 44,
    borderRadius: Radios.medio,
    backgroundColor: Colores.primario,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconoSeleccionado: {
    backgroundColor: Colores.blanco,
  },
  opcionTexto: {
    flex: 1,
  },
  opcionTitulo: {
    color: Colores.texto,
    fontSize: Tipografia.subtitulo,
    fontWeight: '800',
  },
  opcionTituloSeleccionado: {
    color: Colores.negro,
  },
  opcionDescripcion: {
    color: Colores.textoSecundario,
    fontSize: Tipografia.ayuda,
    marginTop: 2,
  },
  opcionDescripcionSeleccionada: {
    color: Colores.carbon,
  },
  continuar: {
    minHeight: 54,
    marginTop: Espacios.xxl,
    borderRadius: Radios.medio,
    backgroundColor: Colores.primario,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Espacios.sm,
  },
  continuarPresionado: {
    backgroundColor: Colores.primarioPresionado,
  },
  continuarDeshabilitado: {
    opacity: 0.45,
  },
  continuarTexto: {
    color: Colores.blanco,
    fontSize: Tipografia.boton,
    fontWeight: '800',
  },
  pie: {
    color: Colores.textoTerciario,
    fontSize: Tipografia.ayuda,
    textAlign: 'center',
    marginTop: Espacios.xl,
  },
});
