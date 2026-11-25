import type { Notificacion } from '@/types/rutago';
import { ESTADO_VIAJE } from '@/utils/viajes';

/** Colores del círculo de cada aviso, tomados del diseño de Figma (Notificación push). */
export const COLORES_AVISO = {
  azul: '#2563EB',
  verde: '#087A35',
  naranja: '#F59E0B',
  gris: '#6B7280',
  rojo: '#DC2626',
  amarillo: '#FFD900',
} as const;

const COLOR_POR_ESTADO: Record<number, string> = {
  [ESTADO_VIAJE.BUSCANDO]: COLORES_AVISO.amarillo,
  [ESTADO_VIAJE.ACEPTADO]: COLORES_AVISO.azul,
  [ESTADO_VIAJE.EN_CURSO]: COLORES_AVISO.naranja,
  [ESTADO_VIAJE.FINALIZADO]: COLORES_AVISO.gris,
  [ESTADO_VIAJE.CANCELADO]: COLORES_AVISO.rojo,
};

/** Elegí el color según lo que pasó: estado del viaje, pasajero nuevo o aviso del administrador. */
export function colorDeNotificacion(notificacion: Notificacion): string {
  if (notificacion.tipo === 'viaje_estado') {
    const estadoId = Number(notificacion.datos?.estadoId);
    return COLOR_POR_ESTADO[estadoId] ?? COLORES_AVISO.verde;
  }
  if (notificacion.tipo === 'administracion') return COLORES_AVISO.rojo;
  if (notificacion.tipo === 'sistema') return COLORES_AVISO.gris;
  return COLORES_AVISO.verde;
}

/** Viaje al que pertenece el aviso, venga en la columna viajeId o en sus datos. */
export function viajeDeNotificacion(notificacion: Notificacion): number | null {
  const id = Number(notificacion.viajeId ?? notificacion.datos?.viajeId);
  return Number.isInteger(id) && id > 0 ? id : null;
}

export type AvisoLocal = {
  titulo: string;
  cuerpo: string;
  datos: { viajeId: number } | { ruta: '/notificaciones' };
};

/**
 * Convertí el evento «notificacion» del WebSocket en el contenido de la
 * notificación del sistema. Siempre adjunto datos: con viaje, su id; sin
 * viaje, la ruta del centro de avisos, para que el toque sepa a dónde ir.
 */
export function avisoLocalDesdeEvento(
  payload: Record<string, unknown> | null | undefined,
): AvisoLocal {
  const datos = payload ?? {};
  const viajeId = Number(datos.viajeId);
  return {
    titulo:
      typeof datos.titulo === 'string' && datos.titulo.trim()
        ? datos.titulo
        : 'Nueva notificación',
    cuerpo:
      typeof datos.mensaje === 'string' && datos.mensaje.trim()
        ? datos.mensaje
        : 'Tienes un aviso real de RutaGo.',
    datos:
      Number.isInteger(viajeId) && viajeId > 0
        ? { viajeId }
        : { ruta: '/notificaciones' },
  };
}

/** Mostré el tiempo como en el diseño: "hace 2 min", "hace 1 h", "hace 3 d". */
export function tiempoRelativo(valor?: string, ahora: Date = new Date()): string {
  if (!valor) return '';
  const fecha = new Date(valor);
  if (Number.isNaN(fecha.getTime())) return '';

  const minutos = Math.floor((ahora.getTime() - fecha.getTime()) / 60000);
  if (minutos < 1) return 'ahora';
  if (minutos < 60) return `hace ${minutos} min`;
  const horas = Math.floor(minutos / 60);
  if (horas < 24) return `hace ${horas} h`;
  const dias = Math.floor(horas / 24);
  if (dias < 7) return `hace ${dias} d`;
  return fecha.toLocaleDateString('es-CO', { day: '2-digit', month: 'short' });
}
