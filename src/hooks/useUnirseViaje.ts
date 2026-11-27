import { isAxiosError, type AxiosError } from "axios";

import { useMutation } from "@/hooks/useMutation";
import { mutarConCola } from "@/services/colaOffline";
import { useUnionesStore } from "@/store/unionesStore";
import type { Viaje } from "@/types/rutago";
import { tituloRuta } from "@/utils/viajes";

export type ResultadoUnion = {
  viajeId: number;

  offline: boolean;
  mensaje: string;
};

type OpcionesUnion = {
  onExito?: (resultado: ResultadoUnion, viaje: Viaje) => void;
  onFallo?: (mensaje: string, viaje: Viaje) => void;
  onTerminado?: (
    resultado: ResultadoUnion | null,
    error: unknown | null,
    viaje: Viaje,
  ) => void;
};

function mensajeDeError(error: unknown): string {
  const err = error as AxiosError<{ message?: string; error?: string }>;
  if (err?.response?.data?.message) return err.response.data.message;
  if (err?.response?.data?.error) return err.response.data.error;
  if (isAxiosError(error)) {
    return `Error ${err.response?.status ?? "de conexión"}: ${err.message}`;
  }
  if (error instanceof Error && error.message) return error.message;
  return "No se pudo unir al viaje.";
}

export function useUnirseViaje(opciones: OpcionesUnion = {}) {
  return useMutation<ResultadoUnion, Viaje, void>({
    mutationFn: async (viaje) => {
      const resultado = await mutarConCola<{ message?: string }>({
        metodo: "POST",
        url: `/viajes/${viaje.id}/unirse`,
      });

      if (!resultado.ok) {
        throw resultado.error ?? new Error("No se pudo unir al viaje.");
      }

      return {
        viajeId: viaje.id,
        offline: resultado.offline,
        mensaje: resultado.offline
          ? "Guardamos tu solicitud. Se enviará sola cuando vuelva la conexión."
          : (resultado.datos?.message ?? "Te uniste al viaje."),
      };
    },

    onMutate: (viaje) => {
      useUnionesStore.getState().marcarEnviando(viaje.id, tituloRuta(viaje));
    },

    onSuccess: (resultado, viaje) => {
      const store = useUnionesStore.getState();
      if (resultado.offline) {
        store.marcarPendiente(viaje.id, tituloRuta(viaje));
      } else {
        store.marcarSincronizada(viaje.id, tituloRuta(viaje));
      }
      opciones.onExito?.(resultado, viaje);
    },

    onError: (error, viaje) => {
      useUnionesStore.getState().quitar(viaje.id);
      opciones.onFallo?.(mensajeDeError(error), viaje);
    },

    onSettled: (resultado, error, viaje) => {
      opciones.onTerminado?.(resultado ?? null, error, viaje);
    },
  });
}
