export type RolSeleccion = 'pasajero' | 'conductor';

export const ROLES = {
  ADMINISTRADOR: 1,
  CONDUCTOR: 2,
  PASAJERO: 3,
} as const;

const NOMBRES_ROL: Record<number, string> = {
  [ROLES.ADMINISTRADOR]: 'Administrador',
  [ROLES.CONDUCTOR]: 'Conductor',
  [ROLES.PASAJERO]: 'Pasajero',
};

export function nombreRol(rolId: number | string | null | undefined): string {
  const id = Number(rolId);
  return NOMBRES_ROL[id] ?? 'Rol no reconocido';
}

/** La app móvil sólo atiende estos tres roles. Entidad Externa queda fuera del alcance móvil. */
export const ROLES_MOVILES = [
  ROLES.ADMINISTRADOR,
  ROLES.CONDUCTOR,
  ROLES.PASAJERO,
] as const;

export function esRolValido(rolId: number | string | null | undefined): boolean {
  return ROLES_MOVILES.includes(Number(rolId) as (typeof ROLES_MOVILES)[number]);
}

/** Convierte la selección visual en el rol numérico que espera el backend. */
export function rolDesdeSeleccion(
  valor: string | string[] | undefined,
): number | undefined {
  const texto = Array.isArray(valor) ? valor[0] : valor;
  if (texto === 'pasajero') return ROLES.PASAJERO;
  if (texto === 'conductor') return ROLES.CONDUCTOR;
  return undefined;
}
