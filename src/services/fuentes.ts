import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

/**
 * Registro único de las fuentes de iconos.
 *
 * `@expo/vector-icons` carga cada fuente por separado cuando monta el primer
 * icono de esa familia. En iOS eso puede registrar dos veces el mismo nombre
 * (CTFontManagerError 104). Al precargar ambas familias aquí, antes de mostrar
 * cualquier pantalla, los componentes encuentran `Font.isLoaded() === true` y
 * no vuelven a llamar a `Font.loadAsync()`.
 */
export const FUENTES_ICONOS = {
  ...MaterialCommunityIcons.font,
  ...Ionicons.font,
};
