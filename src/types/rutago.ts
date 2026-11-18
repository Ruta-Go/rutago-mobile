export type UsuarioResumen = {
  id?: number;
  nombres?: string;
  apellidos?: string;
  correo?: string;
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
  };
  estado?: { id?: number; nombre?: string };
  precioEstimado?: number | null;
  createdAt?: string;
  updatedAt?: string;
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
  };
  conductor?: { id?: number; licenciaConducir?: string };
  entidad?: {
    id?: number;
    razonSocial?: string;
    nit?: string;
    telefonoContacto?: string;
  };
  createdAt?: string;
  updatedAt?: string;
};
