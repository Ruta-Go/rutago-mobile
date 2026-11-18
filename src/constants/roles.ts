export const ROLES = {
  ADMINISTRADOR: 1,
  CONDUCTOR: 2,
  PASAJERO: 3,
  ENTIDAD: 4,
} as const;

const NOMBRES_ROL: Record<number, string> = {
  [ROLES.ADMINISTRADOR]: 'Administrador',
  [ROLES.CONDUCTOR]: 'Conductor',
  [ROLES.PASAJERO]: 'Pasajero',
  [ROLES.ENTIDAD]: 'Entidad Externa',
};

export function nombreRol(rolId: number | string | null | undefined): string {
  const id = Number(rolId);
  return NOMBRES_ROL[id] ?? 'Rol no reconocido';
}

export function esRolValido(rolId: number | string | null | undefined): boolean {
  return Number(rolId) in NOMBRES_ROL;
}
