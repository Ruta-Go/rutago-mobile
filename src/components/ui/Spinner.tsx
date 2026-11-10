import {
  ActivityIndicator,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { Colores, Espacios, Tipografia } from '@/constants/tema';

export type TamanoSpinner = 'pequeno' | 'mediano' | 'grande';

export type SpinnerProps = {
  tamano?: TamanoSpinner;
  color?: string;
  texto?: string;
  centrado?: boolean;
  style?: StyleProp<ViewStyle>;
};

const TAMANO_INDICADOR: Record<TamanoSpinner, 'small' | 'large'> = {
  pequeno: 'small',
  mediano: 'small',
  grande: 'large',
};

export function Spinner({
  tamano = 'mediano',
  color = Colores.primario,
  texto,
  centrado = false,
  style,
}: SpinnerProps) {
  return (
    <View
      accessibilityRole="progressbar"
      accessibilityLabel={texto ?? 'Cargando'}
      style={[
        styles.contenedor,
        centrado && styles.centrado,
        tamano === 'grande' && styles.grande,
        style,
      ]}>
      <ActivityIndicator
        size={TAMANO_INDICADOR[tamano]}
        color={color}
        animating
      />
      {texto ? (
        <Text
          style={[
            styles.texto,
            { color: color === Colores.primario ? Colores.textoSecundario : color },
          ]}>
          {texto}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Espacios.md,
  },
  centrado: {
    justifyContent: 'center',
    paddingVertical: Espacios.enorme,
  },
  grande: {
    flexDirection: 'column',
  },
  texto: {
    fontSize: Tipografia.cuerpo,
    fontWeight: '600',
  },
});
