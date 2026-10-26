import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import * as SecureStore from 'expo-secure-store';
import { router } from 'expo-router';

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:8082';

const CLAVE_TOKEN = 'rutago_token';
const CLAVE_REFRESH = 'rutago_refresh_token';
const CLAVE_USUARIO = 'rutago_user';

export const api = axios.create({
  baseURL: `${API_URL}/api`,
  timeout: 15000,
});

const clienteRefresh = axios.create({ timeout: 15000 });

export async function guardarSesion(
  token: string,
  refreshToken: string,
  usuario: unknown,
) {
  await SecureStore.setItemAsync(CLAVE_TOKEN, token);
  await SecureStore.setItemAsync(CLAVE_REFRESH, refreshToken);
  await SecureStore.setItemAsync(CLAVE_USUARIO, JSON.stringify(usuario));
}

export async function limpiarSesion() {
  await SecureStore.deleteItemAsync(CLAVE_TOKEN);
  await SecureStore.deleteItemAsync(CLAVE_REFRESH);
  await SecureStore.deleteItemAsync(CLAVE_USUARIO);
}

type ResolverCola = (token: string | null) => void;
type ConfigConReintento = InternalAxiosRequestConfig & { _reintento?: boolean };

let renovando = false;
let cola: ResolverCola[] = [];

function resolverCola(token: string | null) {
  cola.forEach((resolver) => resolver(token));
  cola = [];
}

async function renovarToken(): Promise<string | null> {
  const refreshToken = await SecureStore.getItemAsync(CLAVE_REFRESH);
  if (!refreshToken) return null;

  try {
    const { data } = await clienteRefresh.post(`${API_URL}/api/auth/refresh`, {
      refreshToken,
    });

    if (!data?.token || !data?.refreshToken) {
      throw new Error('RESPUESTA_INVALIDA');
    }

    await SecureStore.setItemAsync(CLAVE_TOKEN, data.token);
    await SecureStore.setItemAsync(CLAVE_REFRESH, data.refreshToken);
    return data.token;
  } catch {
    await limpiarSesion();
    router.replace('/');
    return null;
  }
}

api.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync(CLAVE_TOKEN);
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (respuesta) => respuesta,
  async (error: AxiosError) => {
    const original = error.config as ConfigConReintento | undefined;
    const esLogin = original?.url?.includes('/auth/login');
    const estado = error.response?.status;
    const tokenEnviado = Boolean(original?.headers?.Authorization);
    const noAutorizado = estado === 401 || (estado === 403 && tokenEnviado);

    if (!original || !noAutorizado || original._reintento || esLogin) {
      return Promise.reject(error);
    }

    original._reintento = true;

    if (renovando) {
      const token = await new Promise<string | null>((resolver) =>
        cola.push(resolver),
      );
      if (!token) return Promise.reject(error);
      original.headers.Authorization = `Bearer ${token}`;
      return api(original);
    }

    renovando = true;
    const token = await renovarToken();
    renovando = false;
    resolverCola(token);

    if (!token) return Promise.reject(error);

    original.headers.Authorization = `Bearer ${token}`;
    return api(original);
  },
);
