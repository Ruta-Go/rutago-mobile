import { useAuthStore } from '@/store/authStore';
import {
  canUseBiometrics,
  iniciarSesion as iniciarSesionServicio,
  iniciarSesionBiometrica as iniciarSesionBiometricaServicio,
  registrarUsuario,
  solicitarRecuperacion,
  verificarTokenRecuperacion,
  cambiarContrasenaConToken,
  type LoginResponse,
} from '@/services/authService';

/**
 * Expuse una única API de autenticación para las pantallas: servicio real,
 * estado global y sincronización de sesión en un solo lugar.
 */
export function useAuth() {
  const token = useAuthStore((estado) => estado.token);
  const usuario = useAuthStore((estado) => estado.usuario);
  const cargando = useAuthStore((estado) => estado.cargando);
  const refrescarSesion = useAuthStore((estado) => estado.refrescarSesion);
  const refrescarPerfil = useAuthStore((estado) => estado.refrescarPerfil);
  const aplicarUsuario = useAuthStore((estado) => estado.aplicarUsuario);
  const cerrarSesion = useAuthStore((estado) => estado.cerrarSesion);

  const iniciarSesion = async (
    correo: string,
    contrasena: string,
  ): Promise<LoginResponse> => {
    const respuesta = await iniciarSesionServicio(correo, contrasena);
    await refrescarSesion();
    return respuesta;
  };

  const iniciarSesionBiometrica = async (): Promise<LoginResponse> => {
    const respuesta = await iniciarSesionBiometricaServicio();
    await refrescarSesion();
    return respuesta;
  };

  return {
    token,
    usuario,
    cargando,
    refrescarSesion,
    refrescarPerfil,
    aplicarUsuario,
    cerrarSesion,
    iniciarSesion,
    iniciarSesionBiometrica,
    canUseBiometrics,
    registrarUsuario,
    solicitarRecuperacion,
    verificarTokenRecuperacion,
    cambiarContrasenaConToken,
  };
}
