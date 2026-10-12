
const API_URL = 'http://localhost:8082';

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

  if (!data.token || !data.refreshToken) {
    throw new Error('El servidor no devolvió los tokens de sesión');
  }

  return data;
}
