export type Destinatario = {
  id: number;
  correo: string;
  nombre: string;
  rol: string;
};

type UsuarioCrudo = {
  id?: unknown;
  correo?: unknown;
  nombres?: unknown;
  apellidos?: unknown;
  rol?: { nombreRol?: unknown } | null;
};

const texto = (valor: unknown) => (typeof valor === 'string' ? valor.trim() : '');

/** Quité tildes y mayúsculas para que «maria» encuentre a «María». */
function normalizar(valor: string): string {
  return valor
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase();
}

/**
 * Convertí la lista de /usuarios en destinatarios identificados por correo,
 * ordenados alfabéticamente. Descarto los que no tienen id o correo: sin
 * correo el administrador no puede saber a quién le envía el aviso.
 */
export function destinatariosDesdeUsuarios(usuarios: unknown[]): Destinatario[] {
  return usuarios
    .map((crudo) => {
      const usuario = (crudo ?? {}) as UsuarioCrudo;
      const id = Number(usuario.id);
      const correo = texto(usuario.correo);
      if (!Number.isInteger(id) || id <= 0 || !correo) return null;
      return {
        id,
        correo,
        nombre: [texto(usuario.nombres), texto(usuario.apellidos)]
          .filter(Boolean)
          .join(' '),
        rol: texto(usuario.rol?.nombreRol),
      };
    })
    .filter((d): d is Destinatario => d !== null)
    .sort((a, b) => a.correo.localeCompare(b.correo, 'es', { sensitivity: 'base' }));
}

/** Filtré por correo o nombre, sin importar tildes ni mayúsculas. */
export function filtrarDestinatarios(
  destinatarios: Destinatario[],
  busqueda: string,
): Destinatario[] {
  const termino = normalizar(busqueda.trim());
  if (!termino) return destinatarios;
  return destinatarios.filter(
    (d) =>
      normalizar(d.correo).includes(termino) || normalizar(d.nombre).includes(termino),
  );
}
