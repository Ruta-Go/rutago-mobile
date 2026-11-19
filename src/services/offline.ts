import * as SecureStore from 'expo-secure-store';

const PREFIJO = 'rutago_cache_';

/** Normalicé la clave porque SecureStore sólo admite caracteres simples. */
function claveSegura(clave: string): string {
  return `${PREFIJO}${clave.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
}

/**
 * Guardé la última respuesta válida de una consulta de sólo lectura.
 * Si falla el almacenamiento, la app sigue funcionando en línea.
 */
async function guardarCache<T>(clave: string, datos: T): Promise<void> {
  try {
    await SecureStore.setItemAsync(claveSegura(clave), JSON.stringify(datos));
  } catch (error) {
    console.warn('[offline] no se pudo guardar la caché', error);
  }
}

async function leerCache<T>(clave: string): Promise<T | null> {
  try {
    const valor = await SecureStore.getItemAsync(claveSegura(clave));
    return valor ? (JSON.parse(valor) as T) : null;
  } catch {
    return null;
  }
}

/**
 * Intenté la red primero y, si no hay conexión, devolví datos reales guardados.
 * Nunca inventé registros: sin caché propagué el error original.
 */
export async function obtenerConCache<T>(
  clave: string,
  consulta: () => Promise<T>,
): Promise<{ datos: T; offline: boolean }> {
  try {
    const datos = await consulta();
    await guardarCache(clave, datos);
    return { datos, offline: false };
  } catch (error) {
    const datos = await leerCache<T>(clave);
    if (datos !== null) return { datos, offline: true };
    throw error;
  }
}
