import type { ReactNode } from 'react';
import {
  Modal as ModalNativo,
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { Colores, Espacios, Radios, Sombras, Tipografia } from '@/constants/tema';
import { Button, type VarianteBoton } from '@/components/ui/Button';

export type ModalProps = {
  visible: boolean;
  titulo?: string;
  mensaje?: string;
  children?: ReactNode;
  onCerrar?: () => void;
  textoCerrar?: string;
  textoConfirmar?: string;
  onConfirmar?: () => void;
  varianteConfirmar?: VarianteBoton;
  cargando?: boolean;
  cerrarAlTocarFondo?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function Modal({
  visible,
  titulo,
  mensaje,
  children,
  onCerrar,
  textoCerrar,
  textoConfirmar,
  onConfirmar,
  varianteConfirmar = 'primario',
  cargando = false,
  cerrarAlTocarFondo = true,
  style,
}: ModalProps) {
  const hayAcciones = Boolean(textoCerrar ?? textoConfirmar);

  return (
    <ModalNativo
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={() => onCerrar?.()}>
      <Pressable
        style={styles.fondo}
        accessibilityRole="button"
        accessibilityLabel="Cerrar ventana"
        onPress={cerrarAlTocarFondo && !cargando ? onCerrar : undefined}>
        <Pressable
          style={[styles.tarjeta, style]}
          onPress={(evento) => evento.stopPropagation()}>
          {titulo ? <Text style={styles.titulo}>{titulo}</Text> : null}
          {mensaje ? <Text style={styles.mensaje}>{mensaje}</Text> : null}
          {children ? <View style={styles.contenido}>{children}</View> : null}

          {hayAcciones ? (
            <View style={styles.acciones}>
              {textoCerrar ? (
                <View style={styles.accion}>
                  <Button
                    titulo={textoCerrar}
                    variante="contorno"
                    onPress={onCerrar}
                    deshabilitado={cargando}
                  />
                </View>
              ) : null}
              {textoConfirmar ? (
                <View style={styles.accion}>
                  <Button
                    titulo={textoConfirmar}
                    variante={varianteConfirmar}
                    onPress={onConfirmar}
                    cargando={cargando}
                  />
                </View>
              ) : null}
            </View>
          ) : null}
        </Pressable>
      </Pressable>
    </ModalNativo>
  );
}

const styles = StyleSheet.create({
  fondo: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(17, 24, 39, 0.55)',
    padding: Espacios.xxl,
  },
  tarjeta: {
    width: '100%',
    maxWidth: 400,
    borderRadius: Radios.extra,
    backgroundColor: Colores.fondo,
    padding: Espacios.xxxl,
    ...Sombras.modal,
  },
  titulo: {
    fontSize: Tipografia.subtitulo,
    fontWeight: '800',
    color: Colores.texto,
    textAlign: 'center',
    marginBottom: Espacios.md,
  },
  mensaje: {
    fontSize: Tipografia.cuerpo,
    color: Colores.textoSecundario,
    textAlign: 'center',
    lineHeight: 22,
  },
  contenido: {
    marginTop: Espacios.lg,
  },
  acciones: {
    flexDirection: 'row',
    gap: Espacios.md,
    marginTop: Espacios.xxl,
  },
  accion: {
    flex: 1,
  },
});
