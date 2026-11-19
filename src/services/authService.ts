import { isAxiosError } from 'axios';
import { api, guardarSesion, type RespuestaApi } from './api';

type MensajeRespuesta = RespuestaApi<never> & {
  message?: string;
  valido?: boolean;
};

function mensajeDe(error: unknown, respaldo: string): string {
  if (isAxiosError(error)) {
    const data = error.response?.data as { message?: string } | undefined;
    return data?.message || respaldo;
  }
  return error instanceof Error ? error.message : respaldo;
}

export interface LoginResponse {
  success: boolean;
  message: string;
  token?: string;
  refreshToken?: string;
  usuario?: {
    id: number | string;
    nombres: string;
    rol: {
      id: number | string;
      nombreRol: string;
    } | null;
  };
}

export interface DatosRegistro {
  nombres: string;
  apellidos: string;
  correo: string;
  contrasena: string;
  telefono?: string;
  direccion?: string;
  tipoDocumentoId?: number;
  numeroDocumento?: string;
  fechaNacimiento?: string;
}

/** El registro público del backend crea siempre un Pasajero. */
export async function registrarUsuario(
  datos: DatosRegistro,
): Promise<{ mensaje: string }> {
  try {
    const { data } = await api.post<MensajeRespuesta>('/usuarios/registro', {
      nombres: datos.nombres.trim(),
      apellidos: datos.apellidos.trim(),
      correo: datos.correo.trim(),
      contrasena: datos.contrasena,
      ...(datos.telefono?.trim() ? { telefono: datos.telefono.trim() } : {}),
      ...(datos.direccion?.trim() ? { direccion: datos.direccion.trim() } : {}),
      ...(datos.tipoDocumentoId ? { tipoDocumentoId: datos.tipoDocumentoId } : {}),
      ...(datos.numeroDocumento?.trim()
        ? { numeroDocumento: datos.numeroDocumento.trim() }
        : {}),
      ...(datos.fechaNacimiento?.trim()
        ? { fechaNacimiento: datos.fechaNacimiento.trim() }
        : {}),
    });
    if (!data?.success) {
      throw new Error(data?.message || 'No se pudo completar el registro');
    }
    return { mensaje: data.message ?? 'Registro creado correctamente' };
  } catch (error) {
    throw new Error(mensajeDe(error, 'No se pudo completar el registro'));
  }
}

export async function iniciarSesion(
  correo: string,
  contrasena: string,
): Promise<LoginResponse> {
  try {
    const { data } = await api.post<LoginResponse>('/auth/login', {
      correo: correo.trim(),
      contrasena,
    });

    if (!data.success || !data.token || !data.refreshToken || !data.usuario) {
      throw new Error(data.message || 'No fue posible iniciar sesión');
    }

    await guardarSesion(data.token, data.refreshToken, data.usuario);
    return data;
  } catch (error) {
    throw new Error(mensajeDe(error, 'No fue posible iniciar sesión'));
  }
}

/** Solicita el enlace de recuperación. El backend responde 503 si no hay proveedor. */
export async function solicitarRecuperacion(correo: string): Promise<string> {
  try {
    const { data } = await api.post<MensajeRespuesta>(
      '/usuarios/recuperar-contrasena',
      { correo: correo.trim() },
    );
    if (!data?.success) {
      throw new Error(data?.message || 'No se pudo solicitar la recuperación');
    }
    return data.message ?? 'Revisa tu correo para continuar';
  } catch (error) {
    throw new Error(mensajeDe(error, 'No se pudo solicitar la recuperación'));
  }
}

/** Consulta al backend si el enlace sigue vigente, sin consumirlo. */
export async function verificarTokenRecuperacion(
  token: string,
): Promise<{ expira?: string }> {
  try {
    const { data } = await api.post<MensajeRespuesta & { expira?: string }>(
      '/usuarios/verificar-token-recuperacion',
      { token: token.trim() },
    );
    if (!data?.success || data.valido !== true) {
      throw new Error(data?.message || 'El enlace no es válido o ya expiró');
    }
    return { expira: data.expira };
  } catch (error) {
    throw new Error(mensajeDe(error, 'El enlace no es válido o ya expiró'));
  }
}

export async function cambiarContrasenaConToken(
  token: string,
  nuevaContrasena: string,
): Promise<void> {
  try {
    const { data } = await api.post<MensajeRespuesta>(
      '/usuarios/cambiar-contrasena',
      { token, nuevaContrasena },
    );
    if (!data?.success) {
      throw new Error(data?.message || 'No se pudo cambiar la contraseña');
    }
  } catch (error) {
    throw new Error(mensajeDe(error, 'No se pudo cambiar la contraseña'));
  }
}
