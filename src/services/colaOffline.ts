import type { AxiosError } from "axios";
import * as SecureStore from "expo-secure-store";

import { api, extraerDatos } from "@/services/api";
import { hayConexion, suscribirConexion } from "@/services/conexion";

const CLAVE_COLA = "rutago_cola_offline";

/** Con varios intentos fallidos el cambio nunca va a salir bien: no lo repito. */
const MAXIMO_INTENTOS = 5;

export type MutacionPendiente = {
  id: string;
  metodo: "POST" | "PUT" | "PATCH" | "DELETE";
  url: string;
  cuerpo?: unknown;
  creadaEn: number;
  intentos: number;
};

type MutacionEntrante = Omit<MutacionPendiente, "id" | "creadaEn" | "intentos">;

export type ResultadoSincronizacion = {
  enviadas: number;

  descartadas: number;
  quedan: number;
};

export type ResultadoElementoSincronizacion = {
  id: string;
  metodo: MutacionPendiente["metodo"];
  url: string;
  ok: boolean;

  descartada: boolean;
  estado?: number;
  mensaje?: string;
};

export type ResultadoMutacion<T> = {
  ok: boolean;
  /** true cuando no había red y el cambio quedó guardado para después. */
  offline: boolean;
  datos?: T;
  pendiente?: MutacionPendiente;
  error?: unknown;
};

type SuscriptorResultados = (
  resultados: ResultadoElementoSincronizacion[],
) => void;

const suscriptoresResultados = new Set<SuscriptorResultados>();

export function suscribirResultadosSincronizacion(
  suscriptor: SuscriptorResultados,
): () => void {
  suscriptoresResultados.add(suscriptor);
  return () => {
    suscriptoresResultados.delete(suscriptor);
  };
}

function emitirResultados(resultados: ResultadoElementoSincronizacion[]): void {
  if (resultados.length === 0) return;
  suscriptoresResultados.forEach((suscriptor) => {
    try {
      suscriptor(resultados);
    } catch (error) {
      console.warn("[offline] un suscriptor de sincronización falló", error);
    }
  });
}

function mensajeDelServidor(error: unknown): string | undefined {
  const respuesta = (error as AxiosError<{ message?: string; error?: string }>)
    ?.response;
  return respuesta?.data?.message ?? respuesta?.data?.error;
}

async function leerCola(): Promise<MutacionPendiente[]> {
  try {
    const bruto = await SecureStore.getItemAsync(CLAVE_COLA);
    if (!bruto) return [];
    const lista: unknown = JSON.parse(bruto);
    return Array.isArray(lista) ? (lista as MutacionPendiente[]) : [];
  } catch {
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
    console.warn("[offline] no se pudo guardar la cola de pendientes", error);
  }
}

/** Cambios esperando red, en el orden en que se produjeron. */
export async function listarPendientes(): Promise<MutacionPendiente[]> {
  return leerCola();
}

export async function encolarMutacion(
  mutacion: MutacionEntrante,
): Promise<MutacionPendiente> {
  const cola = await leerCola();
  const existente = cola.find(
    (pendiente) =>
      pendiente.metodo === mutacion.metodo && pendiente.url === mutacion.url,
  );

  if (existente && (mutacion.metodo === "PUT" || mutacion.metodo === "PATCH")) {
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

export async function vaciarCola(): Promise<void> {
  await escribirCola([]);
}

let sincronizando = false;

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
    const resultados: ResultadoElementoSincronizacion[] = [];

    for (const pendiente of cola) {
      try {
        await api.request({
          url: pendiente.url,
          method: pendiente.metodo,
          data: pendiente.cuerpo,
        });
        enviadas++;
        resultados.push({
          id: pendiente.id,
          metodo: pendiente.metodo,
          url: pendiente.url,
          ok: true,
          descartada: false,
        });
      } catch (error) {
        const estado = (error as AxiosError)?.response?.status;

        if (estado !== undefined && estado >= 400 && estado < 500) {
          descartadas++;
          resultados.push({
            id: pendiente.id,
            metodo: pendiente.metodo,
            url: pendiente.url,
            ok: false,
            descartada: true,
            estado,
            mensaje: mensajeDelServidor(error),
          });
          continue;
        }

        const intentos = pendiente.intentos + 1;
        if (intentos >= MAXIMO_INTENTOS) {
          descartadas++;
          resultados.push({
            id: pendiente.id,
            metodo: pendiente.metodo,
            url: pendiente.url,
            ok: false,
            descartada: true,
            estado,
            mensaje: "Se agotaron los reintentos.",
          });
          continue;
        }
        quedan.push({ ...pendiente, intentos });
      }
    }

    await escribirCola(quedan);
    emitirResultados(resultados);
    return { enviadas, descartadas, quedan: quedan.length };
  } finally {
    sincronizando = false;
  }
}

function esFallaDeRed(error: unknown): boolean {
  const axError = error as AxiosError;
  return Boolean(axError?.isAxiosError) && !axError.response;
}

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
      if (!esFallaDeRed(error)) {
        return { ok: false, offline: false, error };
      }
    }
  }

  const pendiente = await encolarMutacion(mutacion);
  return { ok: true, offline: true, pendiente };
}

export function iniciarSincronizacionAutomatica(): () => void {
  const desuscribir = suscribirConexion((conRed) => {
    if (conRed) void sincronizarCola();
  });

  void hayConexion().then((conRed) => {
    if (conRed) void sincronizarCola();
  });

  return desuscribir;
}
