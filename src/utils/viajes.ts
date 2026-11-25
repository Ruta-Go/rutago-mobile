import type { Viaje } from '@/types/rutago';

export const ESTADO_VIAJE = {
  BUSCANDO: 1,
  ACEPTADO: 2,
  EN_CURSO: 3,
  FINALIZADO: 4,
  CANCELADO: 5,
} as const;

const NOMBRES_ESTADO: Record<number, string> = {
  [ESTADO_VIAJE.BUSCANDO]: 'Buscando conductor',
  [ESTADO_VIAJE.ACEPTADO]: 'Aceptado',
  [ESTADO_VIAJE.EN_CURSO]: 'En curso',
  [ESTADO_VIAJE.FINALIZADO]: 'Finalizado',
  [ESTADO_VIAJE.CANCELADO]: 'Cancelado',
};

export function nombreEstado(viaje: Viaje): string {
  return (
    viaje.estado?.nombre ?? NOMBRES_ESTADO[Number(viaje.estado?.id)] ?? 'Sin estado'
  );
}

/**
 * Nombre legible del estado para mostrar al usuario. El backend devuelve
 * códigos como «EN_CURSO»; priorizo el nombre en español según el id y, si
 * no lo conozco, convierto el código a «En curso».
 */
export function etiquetaEstado(viaje: Viaje): string {
  const conocido = NOMBRES_ESTADO[Number(viaje.estado?.id)];
  if (conocido) return conocido;
  const codigo = viaje.estado?.nombre?.replace(/_/g, ' ').trim().toLowerCase();
  return codigo ? codigo.charAt(0).toUpperCase() + codigo.slice(1) : 'Sin estado';
}

export function idEstado(viaje: Viaje): number | null {
  return viaje.estado?.id ?? null;
}

export function tituloRuta(viaje: Viaje): string {
  const origen = viaje.ruta?.origen?.nombre;
  const destino = viaje.ruta?.destino?.nombre;
  if (origen && destino) return `${origen} → ${destino}`;
  return viaje.ruta?.nombre ?? `Viaje #${viaje.id}`;
}

export function fechaLegible(valor?: string): string {
  if (!valor) return 'Fecha no disponible';
  const fecha = new Date(valor);
  if (Number.isNaN(fecha.getTime())) return 'Fecha no disponible';
  return fecha.toLocaleString('es-CO', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}
