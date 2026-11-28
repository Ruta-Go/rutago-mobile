import { router } from "expo-router";
import { create } from "zustand";

import { esRolValido } from "@/constants/roles";
import { leerSesion, suscribirseASesion } from "@/services/api";
import { getUser, logout, type UsuarioAuth } from "@/services/authService";
import { vaciarCola } from "@/services/colaOffline";
import { useUnionesStore } from "@/store/unionesStore";

export type UsuarioSesion = UsuarioAuth;

type EstadoAuth = {
  token: string | null;
  usuario: UsuarioSesion | null;
  cargando: boolean;
  hidratar: () => Promise<void>;
  refrescarSesion: () => Promise<void>;
  refrescarPerfil: () => Promise<void>;
  aplicarUsuario: (usuario: UsuarioSesion) => Promise<void>;
  cerrarSesion: () => Promise<void>;
};

export const useAuthStore = create<EstadoAuth>((set, get) => ({
  token: null,
  usuario: null,
  cargando: true,

  hidratar: async () => {
    try {
      const sesion = await leerSesion();
      const usuario = sesion.usuario as UsuarioSesion | null;
      const rolId = Number(usuario?.rolId ?? usuario?.rol?.id);

      if (sesion.token && !esRolValido(rolId)) {
        await logout();
        set({ token: null, usuario: null, cargando: false });
        return;
      }

      set({
        token: sesion.token,
        usuario: usuario ?? null,
        cargando: false,
      });
    } catch {
      set({ token: null, usuario: null, cargando: false });
    }
  },

  refrescarSesion: async () => {
    await get().hidratar();
  },

  refrescarPerfil: async () => {
    if (!get().token) return;
    try {
      const usuario = await getUser();
      set({ usuario });
    } catch (error) {
      if (
        error instanceof Error &&
        error.message.includes("rol no está habilitado")
      ) {
        await logout();
        set({ token: null, usuario: null, cargando: false });
      }
    }
  },

  aplicarUsuario: async (usuario) => {
    set({ usuario });
  },

  cerrarSesion: async () => {
    await logout();

    await vaciarCola();
    useUnionesStore.getState().limpiar();
    set({ token: null, usuario: null, cargando: false });
    router.replace("/");
  },
}));

let sincronizando = false;

export function iniciarSincronizacionSesion(): () => void {
  if (sincronizando) return () => undefined;
  sincronizando = true;

  const desuscribir = suscribirseASesion(() => {
    void useAuthStore.getState().hidratar();
  });

  return () => {
    desuscribir();
    sincronizando = false;
  };
}
