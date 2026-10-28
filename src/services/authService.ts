import axios from 'axios';
import { api, guardarSesion } from './api';

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
    if (axios.isAxiosError(error)) {
      const mensaje = (
        error.response?.data as { message?: string } | undefined
      )?.message;
      throw new Error(mensaje || 'No fue posible iniciar sesión');
    }
    throw error;
  }
}
