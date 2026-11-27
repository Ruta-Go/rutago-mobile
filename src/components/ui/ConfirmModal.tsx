import type { ReactNode } from 'react';
import { StyleSheet, type StyleProp, type ViewStyle } from 'react-native';

import { Colores } from '@/constants/tema';
import { Modal, type ModalProps } from '@/components/ui/Modal';

export type ConfirmModalProps = Omit<ModalProps, 'textoCerrar'> & {
  textoCerrar?: string;
  contenido?: ReactNode;
  style?: StyleProp<ViewStyle>;
};

/**
 * Confirmación consistente para acciones destructivas.
 * Reutiliza el Modal compartido para heredar foco, fondo, botones y estados.
 * Paleta oficial: verde #087A35 en el botón principal, amarillo #FFD900 como
 * acento superior y blanco #FFFFFF en la tarjeta.
 */
export function ConfirmModal({
  textoCerrar = 'Cancelar',
  textoConfirmar = 'Confirmar',
  varianteConfirmar = 'primario',
  cerrarAlTocarFondo = false,
  children,
  contenido,
  style,
  ...props
}: ConfirmModalProps) {
  return (
    <Modal
      {...props}
      textoCerrar={textoCerrar}
      textoConfirmar={textoConfirmar}
      varianteConfirmar={varianteConfirmar}
      cerrarAlTocarFondo={cerrarAlTocarFondo}
      style={[styles.tarjeta, style]}>
      {children ?? contenido}
    </Modal>
  );
}

const styles = StyleSheet.create({
  tarjeta: {
    borderTopWidth: 4,
    borderTopColor: Colores.secundario,
    backgroundColor: Colores.blanco,
  },
});
