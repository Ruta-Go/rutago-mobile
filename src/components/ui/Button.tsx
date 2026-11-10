import type { ReactNode } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { Alturas, Colores, Espacios, Radios, Tipografia } from '@/constants/tema';

export type VarianteBoton = 'primario' | 'secundario' | 'contorno' | 'texto' | 'peligro';

export type TamanoBoton = 'pequeno' | 'mediano' | 'grande';

export type ButtonProps = {
  titulo: string;
  onPress?: () => void;
  variante?: VarianteBoton;
  tamano?: TamanoBoton;
  cargando?: boolean;
  deshabilitado?: boolean;
  icono?: ReactNode;
  anchoCompleto?: boolean;
  style?: StyleProp<ViewStyle>;
};

type EstiloVariante = {
  fondo: string;
  texto: string;
  borde?: string;
};

const ESTILOS_VARIANTE: Record<VarianteBoton, EstiloVariante> = {
  primario: { fondo: Colores.primario, texto: Colores.blanco },
  secundario: { fondo: Colores.carbon, texto: Colores.blanco },
  contorno: { fondo: Colores.blanco, texto: Colores.texto, borde: Colores.borde },
  texto: { fondo: Colores.transparente, texto: Colores.primario },
  peligro: { fondo: Colores.error, texto: Colores.blanco },
};

const ALTURAS: Record<TamanoBoton, number> = {
  pequeno: Alturas.botonPequeno,
  mediano: Alturas.botonMediano,
  grande: Alturas.botonGrande,
};

const TAMANO_TEXTO: Record<TamanoBoton, number> = {
  pequeno: Tipografia.etiqueta,
  mediano: Tipografia.boton,
  grande: Tipografia.boton,
};

export function Button({
  titulo,
  onPress,
  variante = 'primario',
  tamano = 'mediano',
  cargando = false,
  deshabilitado = false,
  icono,
  anchoCompleto = true,
  style,
}: ButtonProps) {
  const inactivo = deshabilitado || cargando;
  const colores = ESTILOS_VARIANTE[variante];

  return (
    <Pressable
      onPress={inactivo ? undefined : onPress}
      disabled={inactivo}
      accessibilityRole="button"
      accessibilityLabel={titulo}
      accessibilityState={{ disabled: inactivo, busy: cargando }}
      style={({ pressed }) => [
        styles.base,
        {
          backgroundColor: colores.fondo,
          borderColor: colores.borde ?? Colores.transparente,
          borderWidth: colores.borde ? 1 : 0,
          height: ALTURAS[tamano],
        },
        anchoCompleto && styles.anchoCompleto,
        pressed && !inactivo && styles.presionado,
        inactivo && styles.inactivo,
        style,
      ]}>
      {cargando ? (
        <ActivityIndicator size="small" color={colores.texto} />
      ) : (
        <>
          {icono}
          <Text
            style={[
              styles.texto,
              { color: colores.texto, fontSize: TAMANO_TEXTO[tamano] },
            ]}>
            {titulo}
          </Text>
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Espacios.sm,
    paddingHorizontal: Espacios.xxl,
    borderRadius: Radios.medio,
  },
  anchoCompleto: {
    alignSelf: 'stretch',
  },
  presionado: {
    opacity: 0.85,
  },
  inactivo: {
    opacity: 0.5,
  },
  texto: {
    fontWeight: '700',
    textAlign: 'center',
  },
});
