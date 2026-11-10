import type { ReactNode } from 'react';
import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { Colores, Espacios, Radios, Sombras, Tipografia } from '@/constants/tema';

export type VarianteCard = 'elevada' | 'plana' | 'contorno';

export type CardProps = {
  children?: ReactNode;
  titulo?: string;
  variante?: VarianteCard;
  padding?: number;
  style?: StyleProp<ViewStyle>;
};

export function Card({
  children,
  titulo,
  variante = 'elevada',
  padding = Espacios.xxxl,
  style,
}: CardProps) {
  return (
    <View
      style={[
        styles.base,
        { padding },
        variante === 'elevada' && styles.elevada,
        variante === 'plana' && styles.plana,
        variante === 'contorno' && styles.contorno,
        style,
      ]}>
      {titulo ? <Text style={styles.titulo}>{titulo}</Text> : null}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: Radios.extra,
    backgroundColor: Colores.fondo,
  },
  elevada: {
    ...Sombras.tarjeta,
  },
  plana: {
    backgroundColor: Colores.fondoAlterno,
  },
  contorno: {
    borderWidth: 1,
    borderColor: Colores.bordeSuave,
  },
  titulo: {
    fontSize: Tipografia.subtitulo,
    fontWeight: '800',
    color: Colores.texto,
    marginBottom: Espacios.lg,
  },
});
