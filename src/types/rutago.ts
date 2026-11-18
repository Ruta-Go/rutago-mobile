export type UsuarioResumen = {
  id?: number;
  usuarioId?: number;
  nombres?: string;
  apellidos?: string;
  correo?: string;
};

export type Comuna = {
  id: number;
  nombre?: string;
};

export type Horario = {
  id: number;
  rutaId?: number;
  horaSalida?: string;
  frecuenciaMinutos?: number | null;
};

export type Ruta = {
  id: number;
  nombre?: string;
  origen?: Comuna;
  destino?: Comuna;
  descripcion?: string;
  distanciaKm?: number | null;
  tiempoEstimadoMinutos?: number | null;
  costo?: number | null;
  horarios?: string[] | Horario[] | null;
};

export type Viaje = {
  id: number;
  pasajeros?: UsuarioResumen[];
  conductor?: UsuarioResumen;
  ruta?: {
    id?: number;
    nombre?: string;
    distanciaKm?: number | null;
    tiempoEstimadoMinutos?: number | null;
    origen?: { id?: number; nombre?: string };
    destino?: { id?: number; nombre?: string };
  };
  horario?: {
    id?: number;
    horaSalida?: string;
    frecuenciaMinutos?: number | null;
  };
  vehiculo?: {
    id?: number;
    placa?: string;
    capacidadPasajeros?: number | null;
    latitud?: number | null;
    longitud?: number | null;
    ultimaActualizacion?: string;
  };
  estado?: { id?: number; nombre?: string };
  precioEstimado?: number | null;
  createdAt?: string;
  updatedAt?: string;
};

export type Vehiculo = {
  id: number;
  placa?: string;
  marca?: string;
  modelo?: string;
  color?: string;
  capacidadPasajeros?: number | null;
  estado?: { id?: number; nombre?: string };
  entidad?: {
    id?: number;
    razonSocial?: string;
    usuario?: { id?: number; nombres?: string };
  };
  latitud?: number | null;
  longitud?: number | null;
  ultimaActualizacion?: string;
};

export type Notificacion = {
  id: number;
  usuarioId?: number;
  viajeId?: number | null;
  tipo?: string;
  titulo?: string;
  mensaje?: string;
  datos?: Record<string, unknown> | null;
  leida?: boolean;
  createdAt?: string;
};

export type Perfil = {
  id?: number;
  nombres?: string;
  apellidos?: string;
  correo?: string;
  rol?: { id?: number; nombreRol?: string };
  pasajero?: {
    id?: number;
    telefono?: string;
    direccion?: string;
    numeroDocumento?: string;
    fechaNacimiento?: string;
    tipoDocumentoId?: number;
  };
  conductor?: {
    id?: number;
    licenciaConducir?: string;
    estado?: { id?: number; nombre?: string };
  };
  entidad?: {
    id?: number;
    razonSocial?: string;
    nit?: string;
    telefonoContacto?: string;
  };
  createdAt?: string;
  updatedAt?: string;
};
