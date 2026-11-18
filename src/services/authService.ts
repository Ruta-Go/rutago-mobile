import { isAxiosError } from 'axios';
import { api, guardarSesion, type RespuestaApi } from './api';

type MensajeRespuesta = RespuestaApi<never> & { message?: string };

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

/** Solicita el enlace de recuperación. El backend responde de forma uniforme. */
export async function solicitarRecuperacion(correo: string): Promise<void> {
  const { data } = await api.post<MensajeRespuesta>(
    '/usuarios/recuperar-contrasena',
    { correo: correo.trim() },
  );
  if (!data?.success) {
    throw new Error(data?.message || 'No se pudo solicitar la recuperación');
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
