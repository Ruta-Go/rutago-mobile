import { ROLES } from '@/constants/roles';
import {
  numero,
  objeto,
  texto,
  type Registro,
} from '@/services/recursos';

export type TipoCampo =
  | 'texto'
  | 'numero'
  | 'correo'
  | 'password'
  | 'fecha'
  | 'hora'
  | 'opciones';

export type OpcionFija = { id: number | string; etiqueta: string };

export type CampoForm = {
  nombre: string;
  etiqueta: string;
  tipo: TipoCampo;
  requerido?: boolean;
  soloCrear?: boolean;
  soloAdmin?: boolean;
  maxLength?: number;
  placeholder?: string;
  endpointOpciones?: string;
  etiquetasOpcion?: string[];
  rutaValorOpcion?: string[];
  opcionesFijas?: OpcionFija[];
};

export type Permiso = 'admin' | 'none';

export type ConfigRecurso = {
  titulo: string;
  singular: string;
  endpoint: string;
  endpointCrear?: string;
  campos: CampoForm[];
  columnas: (registro: Registro) => string[];
  crear: Permiso;
  editar: Permiso;
  eliminar: Permiso;
};

const idNombre = (registro: Registro) => `#${numero(registro, 'id') ?? '?'}`;
const nombre = (registro: Registro) =>
  texto(registro, 'nombre', 'nombreRol', 'razonSocial', 'placa', 'correo') || idNombre(registro);

export const RECURSOS: Record<string, ConfigRecurso> = {
  usuarios: {
    titulo: 'Usuarios',
    singular: 'usuario',
    endpoint: '/usuarios',
    crear: 'none',
    editar: 'admin',
    eliminar: 'admin',
    campos: [
      { nombre: 'nombres', etiqueta: 'Nombres', tipo: 'texto', requerido: true, maxLength: 50 },
      { nombre: 'apellidos', etiqueta: 'Apellidos', tipo: 'texto', requerido: true, maxLength: 50 },
      { nombre: 'correo', etiqueta: 'Correo', tipo: 'correo', requerido: true },
      {
        nombre: 'rolId',
        etiqueta: 'Rol',
        tipo: 'opciones',
        requerido: true,
        endpointOpciones: '/roles',
        etiquetasOpcion: ['nombreRol'],
      },
      {
        nombre: 'activo',
        etiqueta: 'Activo',
        tipo: 'opciones',
        opcionesFijas: [
          { id: 1, etiqueta: 'Sí' },
          { id: 0, etiqueta: 'No' },
        ],
      },
    ],
    columnas: (registro) => [
      nombre(registro),
      texto(registro, 'correo'),
      texto(objeto(registro, 'rol'), 'nombreRol'),
      registro.activo === false ? 'Inactivo' : 'Activo',
    ],
  },

  conductores: {
    titulo: 'Conductores',
    singular: 'conductor',
    endpoint: '/conductores',
    endpointCrear: '/conductores/crear-usuario',
    crear: 'admin',
    editar: 'admin',
    eliminar: 'admin',
    campos: [
      { nombre: 'nombres', etiqueta: 'Nombres', tipo: 'texto', requerido: true, soloCrear: true },
      { nombre: 'apellidos', etiqueta: 'Apellidos', tipo: 'texto', requerido: true, soloCrear: true },
      { nombre: 'correo', etiqueta: 'Correo', tipo: 'correo', requerido: true, soloCrear: true },
      { nombre: 'contrasena', etiqueta: 'Contraseña', tipo: 'password', requerido: true, soloCrear: true },
      { nombre: 'licenciaConducir', etiqueta: 'Licencia', tipo: 'texto', maxLength: 50 },
      {
        nombre: 'estadoId',
        etiqueta: 'Estado',
        tipo: 'opciones',
        endpointOpciones: '/estados-conductor',
        etiquetasOpcion: ['nombre'],
      },
    ],
    columnas: (registro) => [
      texto(objeto(registro, 'usuario'), 'nombres', 'apellidos') || nombre(registro),
      texto(registro, 'licenciaConducir'),
      texto(objeto(registro, 'estado'), 'nombre'),
      texto(objeto(registro, 'vehiculo'), 'placa'),
    ],
  },

  pasajeros: {
    titulo: 'Pasajeros',
    singular: 'pasajero',
    endpoint: '/pasajeros',
    endpointCrear: '/pasajeros/crear-usuario',
    crear: 'admin',
    editar: 'admin',
    eliminar: 'admin',
    campos: [
      { nombre: 'nombres', etiqueta: 'Nombres', tipo: 'texto', requerido: true, soloCrear: true },
      { nombre: 'apellidos', etiqueta: 'Apellidos', tipo: 'texto', requerido: true, soloCrear: true },
      { nombre: 'correo', etiqueta: 'Correo', tipo: 'correo', requerido: true, soloCrear: true },
      { nombre: 'contrasena', etiqueta: 'Contraseña', tipo: 'password', requerido: true, soloCrear: true },
      { nombre: 'telefono', etiqueta: 'Teléfono', tipo: 'texto', maxLength: 30 },
      { nombre: 'direccion', etiqueta: 'Dirección', tipo: 'texto', maxLength: 300 },
      {
        nombre: 'tipoDocumentoId',
        etiqueta: 'Tipo de documento',
        tipo: 'opciones',
        endpointOpciones: '/tipos-documento',
        etiquetasOpcion: ['nombre', 'descripcion'],
      },
      { nombre: 'numeroDocumento', etiqueta: 'Número de documento', tipo: 'texto', maxLength: 50 },
      { nombre: 'fechaNacimiento', etiqueta: 'Fecha de nacimiento', tipo: 'fecha' },
    ],
    columnas: (registro) => [
      texto(objeto(registro, 'usuario'), 'nombres', 'apellidos') || nombre(registro),
      texto(objeto(registro, 'usuario'), 'correo'),
      texto(registro, 'telefono'),
      texto(registro, 'numeroDocumento'),
    ],
  },

  vehiculos: {
    titulo: 'Vehículos',
    singular: 'vehículo',
    endpoint: '/vehiculos',
    crear: 'admin',
    editar: 'admin',
    eliminar: 'admin',
    campos: [
      { nombre: 'placa', etiqueta: 'Placa', tipo: 'texto', requerido: true, maxLength: 20 },
      { nombre: 'marca', etiqueta: 'Marca', tipo: 'texto', requerido: true, maxLength: 100 },
      { nombre: 'modelo', etiqueta: 'Modelo', tipo: 'texto', requerido: true, maxLength: 50 },
      { nombre: 'color', etiqueta: 'Color', tipo: 'texto', requerido: true, maxLength: 50 },
      { nombre: 'capacidadPasajeros', etiqueta: 'Capacidad', tipo: 'numero', requerido: true },
      {
        nombre: 'entidadId',
        etiqueta: 'Entidad',
        tipo: 'opciones',
        requerido: true,
        soloAdmin: true,
        endpointOpciones: '/entidades',
        etiquetasOpcion: ['razonSocial'],
      },
      {
        nombre: 'estadoId',
        etiqueta: 'Estado',
        tipo: 'opciones',
        requerido: true,
        endpointOpciones: '/estados-vehiculo',
        etiquetasOpcion: ['nombre'],
      },
      { nombre: 'latitud', etiqueta: 'Latitud (opcional)', tipo: 'numero' },
      { nombre: 'longitud', etiqueta: 'Longitud (opcional)', tipo: 'numero' },
    ],
    columnas: (registro) => [
      texto(registro, 'placa') || idNombre(registro),
      [texto(registro, 'marca'), texto(registro, 'modelo')].filter(Boolean).join(' '),
      texto(registro, 'color'),
      texto(objeto(registro, 'estado'), 'nombre'),
      texto(objeto(registro, 'entidad'), 'razonSocial'),
    ],
  },

  rutas: {
    titulo: 'Rutas',
    singular: 'ruta',
    endpoint: '/rutas',
    crear: 'admin',
    editar: 'admin',
    eliminar: 'admin',
    campos: [
      { nombre: 'nombre', etiqueta: 'Nombre', tipo: 'texto', requerido: true, maxLength: 200 },
      {
        nombre: 'origenId',
        etiqueta: 'Comuna de origen',
        tipo: 'opciones',
        requerido: true,
        endpointOpciones: '/comunas',
        etiquetasOpcion: ['nombre'],
      },
      {
        nombre: 'destinoId',
        etiqueta: 'Comuna de destino',
        tipo: 'opciones',
        requerido: true,
        endpointOpciones: '/comunas',
        etiquetasOpcion: ['nombre'],
      },
      { nombre: 'descripcion', etiqueta: 'Descripción', tipo: 'texto', maxLength: 500 },
      { nombre: 'distanciaKm', etiqueta: 'Distancia (km)', tipo: 'numero' },
      { nombre: 'tiempoEstimadoMinutos', etiqueta: 'Tiempo estimado (min)', tipo: 'numero' },
      { nombre: 'rutaGeometria', etiqueta: 'Geometría (GeoJSON)', tipo: 'texto' },
    ],
    columnas: (registro) => [
      texto(registro, 'nombre') || idNombre(registro),
      texto(objeto(registro, 'origen'), 'nombre'),
      texto(objeto(registro, 'destino'), 'nombre'),
      texto(registro, 'distanciaKm'),
    ],
  },

  horarios: {
    titulo: 'Horarios',
    singular: 'horario',
    endpoint: '/horarios',
    crear: 'admin',
    editar: 'admin',
    eliminar: 'admin',
    campos: [
      {
        nombre: 'rutaId',
        etiqueta: 'Ruta',
        tipo: 'opciones',
        requerido: true,
        endpointOpciones: '/rutas',
        etiquetasOpcion: ['nombre'],
      },
      { nombre: 'horaSalida', etiqueta: 'Hora de salida', tipo: 'hora', requerido: true, placeholder: '08:30' },
      { nombre: 'frecuenciaMinutos', etiqueta: 'Frecuencia (min)', tipo: 'numero' },
      { nombre: 'fechaInicio', etiqueta: 'Fecha de inicio', tipo: 'fecha' },
      { nombre: 'fechaFin', etiqueta: 'Fecha de fin', tipo: 'fecha' },
    ],
    columnas: (registro) => [
      texto(registro, 'horaSalida') || idNombre(registro),
      texto(objeto(registro, 'ruta'), 'nombre'),
      texto(registro, 'frecuenciaMinutos'),
      texto(registro, 'fechaInicio'),
    ],
  },

  viajes: {
    titulo: 'Viajes',
    singular: 'viaje',
    endpoint: '/viajes',
    crear: 'none',
    editar: 'admin',
    eliminar: 'admin',
    campos: [
      {
        nombre: 'rutaId',
        etiqueta: 'Ruta',
        tipo: 'opciones',
        endpointOpciones: '/rutas',
        etiquetasOpcion: ['nombre'],
      },
      {
        nombre: 'horarioId',
        etiqueta: 'Horario',
        tipo: 'opciones',
        endpointOpciones: '/horarios',
        etiquetasOpcion: ['horaSalida'],
      },
      {
        nombre: 'conductorId',
        etiqueta: 'Conductor (usuario)',
        tipo: 'opciones',
        endpointOpciones: '/conductores',
        etiquetasOpcion: ['nombres', 'apellidos', 'correo'],
        rutaValorOpcion: ['usuario'],
      },
      {
        nombre: 'vehiculoId',
        etiqueta: 'Vehículo',
        tipo: 'opciones',
        endpointOpciones: '/vehiculos',
        etiquetasOpcion: ['placa'],
      },
      {
        nombre: 'estadoId',
        etiqueta: 'Estado',
        tipo: 'opciones',
        endpointOpciones: '/estados-viaje',
        etiquetasOpcion: ['nombre'],
      },
      { nombre: 'precioEstimado', etiqueta: 'Precio estimado', tipo: 'numero' },
    ],
    columnas: (registro) => [
      idNombre(registro),
      texto(objeto(registro, 'ruta'), 'nombre'),
      texto(objeto(registro, 'conductor'), 'nombres', 'apellidos'),
      texto(objeto(registro, 'estado'), 'nombre'),
    ],
  },

  comunas: {
    titulo: 'Comunas',
    singular: 'comuna',
    endpoint: '/comunas',
    crear: 'admin',
    editar: 'admin',
    eliminar: 'admin',
    campos: [{ nombre: 'nombre', etiqueta: 'Nombre', tipo: 'texto', requerido: true, maxLength: 100 }],
    columnas: (registro) => [nombre(registro)],
  },

  barrios: {
    titulo: 'Barrios',
    singular: 'barrio',
    endpoint: '/barrios',
    crear: 'admin',
    editar: 'admin',
    eliminar: 'admin',
    campos: [
      { nombre: 'nombre', etiqueta: 'Nombre', tipo: 'texto', requerido: true, maxLength: 100 },
      {
        nombre: 'comunaId',
        etiqueta: 'Comuna',
        tipo: 'opciones',
        requerido: true,
        endpointOpciones: '/comunas',
        etiquetasOpcion: ['nombre'],
      },
    ],
    columnas: (registro) => [
      nombre(registro),
      texto(objeto(registro, 'comuna'), 'nombre'),
    ],
  },
};

export function recursoPermitido(permiso: Permiso, rolId: number): boolean {
  if (permiso === 'none') return false;
  return rolId === ROLES.ADMINISTRADOR;
}
