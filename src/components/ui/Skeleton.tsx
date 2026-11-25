import { useEffect, useState } from 'react';
import {
  Animated,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { Colores, Radios } from '@/constants/tema';

export type SkeletonProps = {
  ancho?: number | `${number}%`;
  alto?: number;
  radio?: number;
  etiqueta?: string;
  estilo?: StyleProp<ViewStyle>;
};

/** Bloque de carga anunciado como ocupado, sin fingir datos reales. */
export function Skeleton({
  ancho = '100%',
  alto = 14,
  radio = Radios.pequeno,
  etiqueta = 'Cargando contenido',
  estilo,
}: SkeletonProps) {
  const [opacidad] = useState(() => new Animated.Value(0.45));

  useEffect(() => {
    const pulso = Animated.loop(
      Animated.sequence([
        Animated.timing(opacidad, {
          toValue: 1,
          duration: 650,
          useNativeDriver: true,
        }),
        Animated.timing(opacidad, {
          toValue: 0.45,
          duration: 650,
          useNativeDriver: true,
        }),
      ]),
    );
    pulso.start();
    return () => pulso.stop();
  }, [opacidad]);

  return (
    <View
      testID="skeleton"
      accessible
      accessibilityRole="progressbar"
      accessibilityState={{ busy: true }}
      accessibilityLabel={etiqueta}
      style={[
        styles.bloque,
        { width: ancho, height: alto, borderRadius: radio },
        estilo,
      ]}>
      <Animated.View
        style={[styles.relleno, { borderRadius: radio, opacity: opacidad }]}
      />
    </View>
  );
}

/** Varias líneas de carga: útiles para listas sin datos previos. */
export function SkeletonLista({ cantidad = 3 }: { cantidad?: number }) {
  return (
    <View testID="skeleton-lista" style={styles.lista}>
      {Array.from({ length: cantidad }, (_, indice) => (
        <View key={indice} style={styles.fila}>
          <Skeleton ancho="70%" alto={14} etiqueta="Cargando título" />
          <Skeleton ancho="100%" alto={10} etiqueta="Cargando detalle" />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  bloque: {
    overflow: 'hidden',
  },
  relleno: {
    flex: 1,
    backgroundColor: Colores.bordeSuave,
  },
  lista: {
    gap: 12,
  },
  fila: {
    gap: 8,
    paddingVertical: 4,
  },
});