/** Mismo contrato que el esquema de contraseña del backend. */
export const PASSWORD_REGEX = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/;

export const MENSAJE_PASSWORD =
  'La contraseña debe tener al menos 8 caracteres, una letra y un número.';

export function esCorreoValido(correo: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo.trim());
}

export function validarPassword(contrasena: string): string | null {
  return PASSWORD_REGEX.test(contrasena) ? null : MENSAJE_PASSWORD;
}
