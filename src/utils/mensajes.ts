/** Texto de contacto que debe acompañar a todo mensaje de error de la app. */
export const CONTACTO_ERROR = 'Llamar a ANGEL ESTUPIÑAN';

/** Normaliza un error cualquiera a un texto legible para el usuario. */
export function textoDeError(error: unknown, respaldo: string): string {
  return error instanceof Error && error.message.trim()
    ? error.message
    : respaldo;
}

/**
 * Traduce el mensaje del backend cuando las credenciales no son válidas.
 * El backend responde "Correo o contraseña incorrectos." y la app debe decir
 * "Clave o correo incorrecto".
 */
export function mensajeDeInicioSesion(error: unknown): string {
  const texto = textoDeError(error, 'No fue posible conectar con el servidor');
  if (/correo o contraseña incorrectos/i.test(texto)) {
    return 'Clave o correo incorrecto';
  }
  return texto;
}

/**
 * Agrega el contacto de soporte a los errores. Es idempotente: si el mensaje
 * ya lo trae, no lo duplica. Los mensajes que no son de error se dejan igual.
 */
export function conContactoSiError(
  mensaje: string,
  tipo: 'exito' | 'error' | 'advertencia' | 'info',
): string {
  if (tipo !== 'error') return mensaje;
  if (mensaje.includes(CONTACTO_ERROR)) return mensaje;
  return `${mensaje.trim().replace(/\.$/, '')}. ${CONTACTO_ERROR}`;
}
