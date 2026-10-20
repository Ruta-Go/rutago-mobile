
import * as SecureStore from 'expo-secure-store';

const API_URL = 'https://warm-socks-yawn.loca.lt';

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
  const response = await fetch(`${API_URL}/api/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      correo: correo.trim(),
      contrasena,
    }),
  });

  const data: LoginResponse = await response.json();

  if (!response.ok || !data.success) {
    throw new Error(data.message || 'No fue posible iniciar sesión');
  }

  if (!data.token || !data.refreshToken || !data.usuario) {
    throw new Error('La respuesta del servidor está incompleta');
  }

  await SecureStore.setItemAsync('rutago_token', data.token);
  await SecureStore.setItemAsync('rutago_refresh_token', data.refreshToken);
  await SecureStore.setItemAsync(
    'rutago_user',
    JSON.stringify(data.usuario),
  );

  return data;
}
