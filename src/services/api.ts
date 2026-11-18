import {
  create,
  type AxiosError,
  type InternalAxiosRequestConfig,
} from 'axios';
import * as SecureStore from 'expo-secure-store';
import { router } from 'expo-router';

// EXPO_PUBLIC_ se incrusta en el bundle; nunca poner secretos aquí.
const API_URL =
  process.env.EXPO_PUBLIC_API_URL || 'https://rutago-backend-a303.onrender.com';

/** Mismo host, protocolo WS/WSS. Se deriva para no duplicar configuración. */
export const WS_URL = API_URL.replace(/^http/, 'ws');

const CLAVE_TOKEN = 'rutago_token';
const CLAVE_REFRESH = 'rutago_refresh_token';
const CLAVE_USUARIO = 'rutago_user';

export const api = create({
  baseURL: `${API_URL}/api`,
  timeout: 15000,
});

const clienteRefresh = create({ timeout: 15000 });

export interface RespuestaApi<T = unknown> {
  success?: boolean;
  data?: T;
  message?: string;
}

/** La mayoría de endpoints responden { success, data, message? }. */
export function extraerDatos<T>(cuerpo: unknown): T {
  if (
    cuerpo &&
    typeof cuerpo === 'object' &&
    'data' in (cuerpo as Record<string, unknown>)
  ) {
    return (cuerpo as RespuestaApi<T>).data as T;
  }
  return cuerpo as T;
}

export function extraerLista<T>(cuerpo: unknown): T[] {
  const datos = extraerDatos<unknown>(cuerpo);
  return Array.isArray(datos) ? (datos as T[]) : [];
}

type SuscriptorSesion = () => void;
const suscriptoresSesion = new Set<SuscriptorSesion>();

export function suscribirseASesion(suscriptor: SuscriptorSesion) {
  suscriptoresSesion.add(suscriptor);
  return () => {
    suscriptoresSesion.delete(suscriptor);
  };
}

function notificarSesion() {
  suscriptoresSesion.forEach((suscriptor) => suscriptor());
}

export async function guardarSesion(
  token: string,
  refreshToken: string,
  usuario: unknown,
) {
  await SecureStore.setItemAsync(CLAVE_TOKEN, token);
  await SecureStore.setItemAsync(CLAVE_REFRESH, refreshToken);
  await SecureStore.setItemAsync(CLAVE_USUARIO, JSON.stringify(usuario));
  notificarSesion();
}

export async function limpiarSesion() {
  await SecureStore.deleteItemAsync(CLAVE_TOKEN);
  await SecureStore.deleteItemAsync(CLAVE_REFRESH);
  await SecureStore.deleteItemAsync(CLAVE_USUARIO);
  notificarSesion();
}

export async function leerSesion(): Promise<{
  token: string | null;
  usuario: unknown | null;
}> {
  const [token, usuario] = await Promise.all([
    SecureStore.getItemAsync(CLAVE_TOKEN),
    SecureStore.getItemAsync(CLAVE_USUARIO),
  ]);
  return { token, usuario: usuario ? JSON.parse(usuario) : null };
}

/** Actualiza los datos del usuario guardados sin tocar el token. */
export async function guardarUsuarioSesion(usuario: unknown) {
  await SecureStore.setItemAsync(CLAVE_USUARIO, JSON.stringify(usuario));
  notificarSesion();
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
