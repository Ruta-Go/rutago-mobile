import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import type { ReactNode } from 'react';
import { router } from 'expo-router';

import { ROLES } from '@/constants/roles';
import {
  leerSesion,
  limpiarSesion,
  suscribirseASesion,
} from '@/services/api';

export type UsuarioSesion = {
  id?: number | string;
  nombres?: string;
  apellidos?: string;
  correo?: string;
  rolId?: number;
  rol?: { id?: number; nombreRol?: string } | null;
};

type ContextoSesion = {
  token: string | null;
  usuario: UsuarioSesion | null;
  cargando: boolean;
  refrescarSesion: () => Promise<void>;
  cerrarSesion: () => Promise<void>;
};

const SesionContext = createContext<ContextoSesion | null>(null);

export function SesionProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [usuario, setUsuario] = useState<UsuarioSesion | null>(null);
  const [cargando, setCargando] = useState(true);

  const refrescarSesion = useCallback(async () => {
    try {
      const sesion = await leerSesion();
      const usuarioSesion = sesion.usuario as UsuarioSesion | null;
      const rolId = Number(usuarioSesion?.rolId ?? usuarioSesion?.rol?.id);
      const rolesHabilitados: number[] = [
        ROLES.ADMINISTRADOR,
        ROLES.CONDUCTOR,
        ROLES.PASAJERO,
      ];
      const rolHabilitado = rolesHabilitados.includes(rolId);

      if (sesion.token && !rolHabilitado) {
        await limpiarSesion();
        setToken(null);
        setUsuario(null);
        return;
      }

      setToken(sesion.token);
      setUsuario(usuarioSesion);
    } catch {
      setToken(null);
      setUsuario(null);
    }
  }, []);

  useEffect(() => {
    let activo = true;

    (async () => {
      await refrescarSesion();
      if (activo) setCargando(false);
    })();

    return () => {
      activo = false;
    };
  }, [refrescarSesion]);

  useEffect(() => suscribirseASesion(refrescarSesion), [refrescarSesion]);

  const cerrarSesion = useCallback(async () => {
    await limpiarSesion();
    await refrescarSesion();
    router.replace('/');
  }, [refrescarSesion]);

  const valor = useMemo<ContextoSesion>(
    () => ({ token, usuario, cargando, refrescarSesion, cerrarSesion }),
    [token, usuario, cargando, refrescarSesion, cerrarSesion],
  );

  return <SesionContext.Provider value={valor}>{children}</SesionContext.Provider>;
}

export function useSesion(): ContextoSesion {
  const contexto = useContext(SesionContext);
  if (!contexto) {
    throw new Error('useSesion debe usarse dentro de SesionProvider');
  }
  return contexto;
}
