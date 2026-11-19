/** IDs y nombres tomados de src/config/estados.js del backend. */
export const ESTADOS_VEHICULO = {
  EN_TERMINAL: 1,
  EN_RUTA: 2,
  PROXIMO: 3,
} as const;

export const NOMBRES_ESTADO_VEHICULO: Record<number, string> = {
  [ESTADOS_VEHICULO.EN_TERMINAL]: 'En terminal',
  [ESTADOS_VEHICULO.EN_RUTA]: 'En ruta',
  [ESTADOS_VEHICULO.PROXIMO]: 'Próximo',
};

export const ESTADOS_VIAJE = {
  BUSCANDO: 1,
  ACEPTADO: 2,
  EN_CURSO: 3,
  FINALIZADO: 4,
  CANCELADO: 5,
} as const;

export const ESTADOS_CONDUCTOR = {
  DISPONIBLE: 1,
  EN_VIAJE: 2,
  INACTIVO: 3,
} as const;

export const NOMBRES_ESTADO_CONDUCTOR: Record<number, string> = {
  [ESTADOS_CONDUCTOR.DISPONIBLE]: 'Disponible',
  [ESTADOS_CONDUCTOR.EN_VIAJE]: 'En viaje',
  [ESTADOS_CONDUCTOR.INACTIVO]: 'Inactivo',
};

export const OPCIONES_ESTADO_CONDUCTOR = [
  { id: ESTADOS_CONDUCTOR.DISPONIBLE, nombre: 'Disponible' },
  { id: ESTADOS_CONDUCTOR.EN_VIAJE, nombre: 'En viaje' },
  { id: ESTADOS_CONDUCTOR.INACTIVO, nombre: 'Inactivo' },
];
