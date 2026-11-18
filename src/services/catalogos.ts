import { api, extraerLista } from '@/services/api';
import type { Comuna, Horario, Ruta, Vehiculo } from '@/types/rutago';

export async function listarRutas(): Promise<Ruta[]> {
  const respuesta = await api.get<unknown>('/rutas', {
    params: { paginaActual: 1, registrosPorPagina: 100 },
  });
  return extraerLista<Ruta>(respuesta.data);
}

export async function listarHorariosPorRuta(rutaId: number): Promise<Horario[]> {
  const respuesta = await api.get<unknown>(`/horarios/ruta/${rutaId}`);
  return extraerLista<Horario>(respuesta.data);
}

export async function listarComunas(): Promise<Comuna[]> {
  const respuesta = await api.get<unknown>('/comunas', {
    params: { paginaActual: 1, registrosPorPagina: 200 },
  });
  return extraerLista<Comuna>(respuesta.data);
}

export async function listarVehiculos(): Promise<Vehiculo[]> {
  const respuesta = await api.get<unknown>('/vehiculos', {
    params: { paginaActual: 1, registrosPorPagina: 100 },
  });
  return extraerLista<Vehiculo>(respuesta.data);
}

export function etiquetaRuta(ruta: Ruta): string {
  const origen = ruta.origen?.nombre;
  const destino = ruta.destino?.nombre;
  if (origen && destino) return `${origen} → ${destino} · ${ruta.nombre ?? `Ruta #${ruta.id}`}`;
  return ruta.nombre ?? `Ruta #${ruta.id}`;
}
