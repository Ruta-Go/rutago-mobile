import { create } from "zustand";

import {
  listarPendientes,
  type ResultadoElementoSincronizacion,
} from "@/services/colaOffline";

export type EstadoUnion = "enviando" | "pendiente" | "sincronizada" | "fallida";

export type UnionViaje = {
  viajeId: number;
  titulo?: string;
  estado: EstadoUnion;
  mensaje?: string;
  solicitadaEn: number;
};

type EstadoUniones = {
  uniones: Record<number, UnionViaje>;
  marcarEnviando: (viajeId: number, titulo?: string) => void;
  marcarPendiente: (viajeId: number, titulo?: string) => void;
  marcarSincronizada: (viajeId: number, titulo?: string) => void;
  marcarFallida: (viajeId: number, mensaje: string, titulo?: string) => void;
  quitar: (viajeId: number) => void;
  limpiar: () => void;
  aplicarResultados: (resultados: ResultadoElementoSincronizacion[]) => void;
  hidratarDesdeCola: () => Promise<void>;
};

const PATRON_UNIRSE = /\/viajes\/(\d+)\/unirse\/?$/;

function viajeIdDeUrl(url: string): number | null {
  const coincidencia = PATRON_UNIRSE.exec(url);
  if (!coincidencia) return null;
  const viajeId = Number(coincidencia[1]);
  return Number.isFinite(viajeId) ? viajeId : null;
}

export const useUnionesStore = create<EstadoUniones>((set, get) => ({
  uniones: {},

  marcarEnviando: (viajeId, titulo) =>
    set((estado) => {
      const previa = estado.uniones[viajeId];
      return {
        uniones: {
          ...estado.uniones,
          [viajeId]: {
            viajeId,
            titulo: titulo ?? previa?.titulo,
            estado: "enviando",
            solicitadaEn: previa?.solicitadaEn ?? Date.now(),
          },
        },
      };
    }),

  marcarPendiente: (viajeId, titulo) =>
    set((estado) => {
      const previa = estado.uniones[viajeId];
      return {
        uniones: {
          ...estado.uniones,
          [viajeId]: {
            viajeId,
            titulo: titulo ?? previa?.titulo,
            estado: "pendiente",
            solicitadaEn: previa?.solicitadaEn ?? Date.now(),
          },
        },
      };
    }),

  marcarSincronizada: (viajeId, titulo) =>
    set((estado) => {
      const previa = estado.uniones[viajeId];
      return {
        uniones: {
          ...estado.uniones,
          [viajeId]: {
            viajeId,
            titulo: titulo ?? previa?.titulo,
            estado: "sincronizada",
            solicitadaEn: previa?.solicitadaEn ?? Date.now(),
          },
        },
      };
    }),

  marcarFallida: (viajeId, mensaje, titulo) =>
    set((estado) => {
      const previa = estado.uniones[viajeId];
      return {
        uniones: {
          ...estado.uniones,
          [viajeId]: {
            viajeId,
            titulo: titulo ?? previa?.titulo,
            estado: "fallida",
            mensaje,
            solicitadaEn: previa?.solicitadaEn ?? Date.now(),
          },
        },
      };
    }),

  quitar: (viajeId) =>
    set((estado) => {
      if (!estado.uniones[viajeId]) return estado;
      const uniones = { ...estado.uniones };
      delete uniones[viajeId];
      return { uniones };
    }),

  limpiar: () => set({ uniones: {} }),

  aplicarResultados: (resultados) =>
    set((estado) => {
      const uniones = { ...estado.uniones };

      for (const resultado of resultados) {
        const viajeId = viajeIdDeUrl(resultado.url);
        if (viajeId === null) continue;

        if (resultado.ok) {
          const previa = uniones[viajeId];
          uniones[viajeId] = {
            viajeId,
            titulo: previa?.titulo,
            estado: "sincronizada",
            solicitadaEn: previa?.solicitadaEn ?? Date.now(),
          };
          continue;
        }

        if (resultado.descartada) {
          const previa = uniones[viajeId];
          uniones[viajeId] = {
            viajeId,
            titulo: previa?.titulo,
            estado: "fallida",
            mensaje:
              resultado.mensaje ??
              "El servidor rechazó la solicitud y no se reintentará.",
            solicitadaEn: previa?.solicitadaEn ?? Date.now(),
          };
        }
      }

      return { uniones };
    }),

  hidratarDesdeCola: async () => {
    let pendientes;
    try {
      pendientes = await listarPendientes();
    } catch {
      return;
    }

    const uniones = { ...get().uniones };
    for (const pendiente of pendientes) {
      if (pendiente.metodo !== "POST") continue;
      const viajeId = viajeIdDeUrl(pendiente.url);
      if (viajeId === null) continue;

      if (uniones[viajeId]) continue;
      uniones[viajeId] = {
        viajeId,
        estado: "pendiente",
        solicitadaEn: pendiente.creadaEn,
      };
    }

    set({ uniones });
  },
}));

export { viajeIdDeUrl };
