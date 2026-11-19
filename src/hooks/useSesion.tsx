import { useEffect } from 'react';
import type { ReactNode } from 'react';

import {
  iniciarSincronizacionSesion,
  useAuthStore,
  type UsuarioSesion,
} from '@/store/authStore';

export type { UsuarioSesion } from '@/store/authStore';

type ContextoSesion = {
  token: string | null;
  usuario: UsuarioSesion | null;
  cargando: boolean;
  refrescarSesion: () => Promise<void>;
  cerrarSesion: () => Promise<void>;
};

/**
 * Mantuve este provider como fachada para no reescribir las pantallas existentes;
 * el estado real ahora vive en el store global de autenticación.
 */
export function SesionProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    const desuscribir = iniciarSincronizacionSesion();

    void (async () => {
      await useAuthStore.getState().hidratar();
      if (useAuthStore.getState().token) {
        await useAuthStore.getState().refrescarPerfil();
      }
    })();

    return desuscribir;
  }, []);

  return <>{children}</>;
}

export function useSesion(): ContextoSesion {
  const token = useAuthStore((estado) => estado.token);
  const usuario = useAuthStore((estado) => estado.usuario);
  const cargando = useAuthStore((estado) => estado.cargando);
  const refrescarSesion = useAuthStore((estado) => estado.refrescarSesion);
  const cerrarSesion = useAuthStore((estado) => estado.cerrarSesion);

  return { token, usuario, cargando, refrescarSesion, cerrarSesion };
}
