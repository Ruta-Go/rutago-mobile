import { useState, type ReactNode } from 'react';
import Ionicons from '@expo/vector-icons/Ionicons';
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type StyleProp,
  type TextInputProps,
  type ViewStyle,
} from 'react-native';

import { Alturas, Colores, Espacios, Radios, Tipografia } from '@/constants/tema';

export type InputProps = {
  etiqueta?: string;
  requerido?: boolean;
  error?: string;
  ayuda?: string;
  esContrasena?: boolean;
  iconoIzquierdo?: ReactNode;
  contenedorStyle?: StyleProp<ViewStyle>;
} & Omit<TextInputProps, 'style'>;

export function Input({
  etiqueta,
  requerido = false,
  error,
  ayuda,
  esContrasena = false,
  iconoIzquierdo,
  contenedorStyle,
  editable = true,
  onFocus,
  onBlur,
  secureTextEntry,
  ...resto
}: InputProps) {
  const [contrasenaVisible, setContrasenaVisible] = useState(false);
  const [enfocado, setEnfocado] = useState(false);
  const tieneError = Boolean(error);

  const colorBorde = tieneError
    ? Colores.error
    : enfocado
      ? Colores.primario
      : Colores.borde;
  const colorTexto = editable ? Colores.texto : Colores.textoTerciario;

  // Expuse la etiqueta visual como nombre accesible del campo y respeté el estado externo.
  const nombreAccesible =
    resto.accessibilityLabel ?? etiqueta ?? resto.placeholder;
  const estadoAccesible = {
    ...resto.accessibilityState,
    disabled: !editable,
  };

  return (
    <View style={[styles.contenedor, contenedorStyle]}>
      {etiqueta ? (
        <Text style={styles.etiqueta}>
          {etiqueta}
          {requerido ? <Text style={styles.asterisco}> *</Text> : null}
        </Text>
      ) : null}

      <View
        style={[
          styles.caja,
          { borderColor: colorBorde },
          !editable && styles.cajaDeshabilitada,
        ]}>
        {iconoIzquierdo ? <View style={styles.icono}>{iconoIzquierdo}</View> : null}

        <TextInput
          {...resto}
          accessibilityLabel={nombreAccesible}
          accessibilityState={estadoAccesible}
          style={[styles.entrada, { color: colorTexto }]}
          placeholderTextColor={Colores.textoTerciario}
          editable={editable}
          secureTextEntry={esContrasena ? !contrasenaVisible : secureTextEntry}
          onFocus={(evento) => {
            setEnfocado(true);
            onFocus?.(evento);
          }}
          onBlur={(evento) => {
            setEnfocado(false);
            onBlur?.(evento);
          }}
        />

        {esContrasena ? (
          <Pressable
            onPress={() => setContrasenaVisible((valor) => !valor)}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel={
              contrasenaVisible ? 'Ocultar contraseña' : 'Mostrar contraseña'
            }
            style={styles.accion}>
            <Ionicons
              name={contrasenaVisible ? 'eye-off-outline' : 'eye-outline'}
              size={22}
              color={Colores.primario}
            />
          </Pressable>
        ) : null}
      </View>

      {tieneError ? (
        // Marqué el error como alerta para que el lector de pantalla lo anuncie al aparecer.
        <Text
          accessibilityRole="alert"
          accessibilityLiveRegion="polite"
          style={styles.error}>
          {error}
        </Text>
      ) : ayuda ? (
        <Text style={styles.ayuda}>{ayuda}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: {
    alignSelf: 'stretch',
  },
  etiqueta: {
    fontSize: Tipografia.etiqueta,
    fontWeight: '700',
    color: Colores.texto,
    marginBottom: Espacios.sm,
  },
  asterisco: {
    color: Colores.error,
  },
  caja: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: Alturas.input,
    borderWidth: 1,
    borderRadius: Radios.medio,
    backgroundColor: Colores.fondo,
    paddingHorizontal: Espacios.md,
  },
  cajaDeshabilitada: {
    backgroundColor: Colores.fondoAlterno,
  },
  icono: {
    marginRight: Espacios.sm,
  },
  entrada: {
    flex: 1,
    fontSize: Tipografia.cuerpo,
    paddingVertical: Espacios.md,
  },
  accion: {
    marginLeft: Espacios.sm,
  },
  accionTexto: {
    fontSize: Tipografia.etiqueta,
    fontWeight: '700',
    color: Colores.primario,
  },
  error: {
    marginTop: Espacios.xs,
    fontSize: Tipografia.ayuda,
    color: Colores.error,
  },
  ayuda: {
    marginTop: Espacios.xs,
    fontSize: Tipografia.ayuda,
    color: Colores.textoSecundario,
  },
});
