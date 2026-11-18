import {
  api,
  extraerDatos,
  extraerLista,
  type RespuestaApi,
} from '@/services/api';

export type Registro = Record<string, unknown>;

type CuerpoLista = RespuestaApi<unknown> & {
  paginacion?: { total?: number };
};

export type ListaRecurso = {
  items: Registro[];
  total: number | null;
};

export function texto(registro: Registro | null | undefined, ...claves: string[]): string {
  if (!registro) return '';
  for (const clave of claves) {
    const valor = registro[clave];
    if (typeof valor === 'string' && valor.trim()) return valor;
    if (typeof valor === 'number') return String(valor);
  }
  return '';
}

export function numero(registro: Registro | null | undefined, ...claves: string[]): number | null {
  if (!registro) return null;
  for (const clave of claves) {
    const valor = registro[clave];
    if (typeof valor === 'number' && Number.isFinite(valor)) return valor;
    if (typeof valor === 'string' && valor.trim() && Number.isFinite(Number(valor))) {
      return Number(valor);
    }
  }
  return null;
}

export function objeto(
  registro: Registro | null | undefined,
  ...claves: string[]
): Registro | null {
  if (!registro) return null;
  for (const clave of claves) {
    const valor = registro[clave];
    if (valor && typeof valor === 'object' && !Array.isArray(valor)) {
      return valor as Registro;
    }
  }
  return null;
}

export async function listarRecurso(
  endpoint: string,
  params?: Record<string, string | number>,
): Promise<ListaRecurso> {
  const respuesta = await api.get<unknown>(endpoint, {
    params: {
      paginaActual: 1,
      registrosPorPagina: 200,
      ...params,
    },
  });
  const cuerpo = respuesta.data as CuerpoLista;
  return {
    items: extraerLista<Registro>(cuerpo),
    total: cuerpo?.paginacion?.total ?? null,
  };
}

export async function obtenerRecurso(endpoint: string, id: number): Promise<Registro> {
  const respuesta = await api.get<unknown>(`${endpoint}/${id}`);
  return extraerDatos<Registro>(respuesta.data) ?? {};
}

export async function crearRecurso(endpoint: string, payload: Registro): Promise<Registro> {
  const respuesta = await api.post<unknown>(endpoint, payload);
  return extraerDatos<Registro>(respuesta.data) ?? {};
}

export async function actualizarRecurso(
  endpoint: string,
  id: number,
  payload: Registro,
): Promise<Registro> {
  const respuesta = await api.put<unknown>(`${endpoint}/${id}`, payload);
  return extraerDatos<Registro>(respuesta.data) ?? {};
}

export async function eliminarRecurso(endpoint: string, id: number): Promise<void> {
  await api.delete(`${endpoint}/${id}`);
}

export async function opcionesRemotas(
  endpoint: string,
  etiquetas: string[],
  rutaValor?: string[],
): Promise<{ id: number; etiqueta: string }[]> {
  const { items } = await listarRecurso(endpoint);
  return items
    .map((item) => {
      let fuenteValor: Registro | null = item;
      for (const clave of rutaValor ?? []) {
        fuenteValor = objeto(fuenteValor, clave);
        if (!fuenteValor) break;
      }
      const id = numero(fuenteValor, 'id') ?? numero(item, 'id');
      if (id == null) return null;
      const etiqueta =
        texto(item, ...etiquetas) ||
        texto(objeto(item, 'usuario'), 'nombres', 'nombre') ||
        `#${id}`;
      return { id, etiqueta };
    })
    .filter((opcion): opcion is { id: number; etiqueta: string } => Boolean(opcion));
}
