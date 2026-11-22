import type { AxiosError } from 'axios';
import * as SecureStore from 'expo-secure-store';

import { api, extraerDatos } from '@/services/api';
import { hayConexion, suscribirConexion } from '@/services/conexion';

const CLAVE_COLA = 'rutago_cola_offline';

/** Con varios intentos fallidos el cambio nunca va a salir bien: no lo repito. */
const MAXIMO_INTENTOS = 5;

export type MutacionPendiente = {
  id: string;
  metodo: 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  url: string;
  cuerpo?: unknown;
  creadaEn: number;
  intentos: number;
};

type MutacionEntrante = Omit<MutacionPendiente, 'id' | 'creadaEn' | 'intentos'>;

export type ResultadoSincronizacion = {
  enviadas: number;
  /** 4xx del servidor o intentos agotados: ya no se van a reenviar. */
  descartadas: number;
  quedan: number;
};

export type ResultadoMutacion<T> = {
  ok: boolean;
  /** true cuando no había red y el cambio quedó guardado para después. */
  offline: boolean;
  datos?: T;
  pendiente?: MutacionPendiente;
  error?: unknown;
};

/* ── Almacenamiento de la cola (Tarea 2) ───────────────────────────── */

async function leerCola(): Promise<MutacionPendiente[]> {
  try {
    const bruto = await SecureStore.getItemAsync(CLAVE_COLA);
    if (!bruto) return [];
    const lista: unknown = JSON.parse(bruto);
    return Array.isArray(lista) ? (lista as MutacionPendiente[]) : [];
  } catch {
    // Un valor ilegible no puede dejar la app sin arrancar.
    return [];
  }
}

async function escribirCola(lista: MutacionPendiente[]): Promise<void> {
  try {
    if (lista.length === 0) {
      await SecureStore.deleteItemAsync(CLAVE_COLA);
      return;
    }
    await SecureStore.setItemAsync(CLAVE_COLA, JSON.stringify(lista));
  } catch (error) {
    console.warn('[offline] no se pudo guardar la cola de pendientes', error);
  }
}

/** Cambios esperando red, en el orden en que se produjeron. */
export async function listarPendientes(): Promise<MutacionPendiente[]> {
  return leerCola();
}

/**
 * Guardo un cambio que todavía no llegó al servidor (Tarea 2). Si ya existía
 * una escritura pendiente sobre el mismo recurso la reemplazo: es el criterio
 * de "último en ganar" que evita reenviar posiciones o estados viejos.
 */
export async function encolarMutacion(
  mutacion: MutacionEntrante,
): Promise<MutacionPendiente> {
  const cola = await leerCola();
  const existente = cola.find(
    (pendiente) =>
      pendiente.metodo === mutacion.metodo && pendiente.url === mutacion.url,
  );

  if (
    existente &&
    (mutacion.metodo === 'PUT' || mutacion.metodo === 'PATCH')
  ) {
    const actualizada: MutacionPendiente = {
      ...existente,
      cuerpo: mutacion.cuerpo,
      creadaEn: Date.now(),
      intentos: 0,
    };
    await escribirCola(
      cola.map((pendiente) =>
        pendiente.id === existente.id ? actualizada : pendiente,
      ),
    );
    return actualizada;
  }

  const nueva: MutacionPendiente = {
    ...mutacion,
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    creadaEn: Date.now(),
    intentos: 0,
  };
  await escribirCola([...cola, nueva]);
  return nueva;
}

/** Vacío la cola al cerrar sesión para no reenviar cambios de otra cuenta. */
export async function vaciarCola(): Promise<void> {
  await escribirCola([]);
}

/* ── Sincronización al recuperar la red (Tarea 3) ──────────────────── */

let sincronizando = false;

/**
 * Reenvío la cola al servidor. Conservo el orden original, descarto lo que el
 * servidor rechazó de forma definitiva y limito los reintentos de lo que
 * siguió fallando.
 */
export async function sincronizarCola(): Promise<ResultadoSincronizacion> {
  if (sincronizando) {
    return { enviadas: 0, descartadas: 0, quedan: (await leerCola()).length };
  }

  sincronizando = true;
  try {
    const cola = await leerCola();
    if (cola.length === 0) {
      return { enviadas: 0, descartadas: 0, quedan: 0 };
    }

    let enviadas = 0;
    let descartadas = 0;
    const quedan: MutacionPendiente[] = [];

    for (const pendiente of cola) {
      try {
        await api.request({
          url: pendiente.url,
          method: pendiente.metodo,
          data: pendiente.cuerpo,
        });
        enviadas++;
      } catch (error) {
        const estado = (error as AxiosError)?.response?.status;

        // 4xx: validación, recurso inexistente o conflicto. Repetir el envío
        // no cambia la respuesta, así que lo descarto en vez de enredarme.
        if (estado !== undefined && estado >= 400 && estado < 500) {
          descartadas++;
          continue;
        }

        // Sin respuesta o 5xx: pudo ser la red o el servidor. Reintento, pero
        // con límite, para no dejar la cola creciendo sin control.
        const intentos = pendiente.intentos + 1;
        if (intentos >= MAXIMO_INTENTOS) {
          descartadas++;
          continue;
        }
        quedan.push({ ...pendiente, intentos });
      }
    }

    await escribirCola(quedan);
    return { enviadas, descartadas, quedan: quedan.length };
  } finally {
    sincronizando = false;
  }
}

/* ── Uso desde las pantallas ───────────────────────────────────────── */

/** Un error de axios sin respuesta es red caída o tiempo agotado. */
function esFallaDeRed(error: unknown): boolean {
  const axError = error as AxiosError;
  return Boolean(axError?.isAxiosError) && !axError.response;
}

/**
 * Envío el cambio si hay red; si no, lo guardo para reenviarlo al reconectar
 * (Tarea 2). Devuelvo el error en vez de lanzarlo para que la pantalla decida
 * cómo avisarle al usuario.
 */
export async function mutarConCola<T>(
  mutacion: MutacionEntrante,
): Promise<ResultadoMutacion<T>> {
  const conRed = await hayConexion();

  if (conRed) {
    try {
      const respuesta = await api.request<T>({
        url: mutacion.url,
        method: mutacion.metodo,
        data: mutacion.cuerpo,
      });
      return {
        ok: true,
        offline: false,
        datos: extraerDatos<T>(respuesta.data),
      };
    } catch (error) {
      // NetInfo a veces aún no registró la caída: si no hubo respuesta, guardo
      // el cambio igual para que no se pierda el registro.
      if (!esFallaDeRed(error)) {
        return { ok: false, offline: false, error };
      }
    }
  }

  const pendiente = await encolarMutacion(mutacion);
  return { ok: true, offline: true, pendiente };
}

/**
 * Arranco la sincronización automática: reenvío lo pendiente al recuperar la
 * red y también al iniciar, por si quedó trabajo de una sesión anterior.
 * Devuelvo la función de baja para desmontarla con el resto de efectos.
 */
export function iniciarSincronizacionAutomatica(): () => void {
  const desuscribir = suscribirConexion((conRed) => {
    if (conRed) void sincronizarCola();
  });

  void hayConexion().then((conRed) => {
    if (conRed) void sincronizarCola();
  });

  return desuscribir;
}
