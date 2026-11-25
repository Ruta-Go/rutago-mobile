import { useCallback, useEffect, useRef } from 'react';
import { useRouter } from 'expo-router';
import { AppState } from 'react-native';

import { useRealtime, type EventoTiempoReal } from '@/hooks/useRealtime';
import { useSesion } from '@/hooks/useSesion';
import {
  escucharNotificaciones,
  limpiarContador,
  mostrarNotificacionLocal,
  registrarNotificaciones,
  sincronizarContador,
  type DestinoPush,
} from '@/services/notificaciones';
import { avisoLocalDesdeEvento } from '@/utils/notificaciones';

const RETRASO_NAVEGACION_MS = 350;

/**
 * Conecté las notificaciones del sistema con la sesión: cada aviso en vivo del
 * backend se convierte en notificación del celular en cualquier pantalla, al
 * recibirla actualizo el contador del ícono y al tocarla navego a su destino.
 * Si el toque llega antes de que la sesión esté lista (app abierta desde
 * cerrada o sin iniciar sesión), guardo el destino y navego cuando se pueda.
 */
export function GestorNotificaciones() {
  const router = useRouter();
  const { token, cargando } = useSesion();
  const listo = Boolean(token) && !cargando;
  const listoRef = useRef(listo);
  const pendiente = useRef<DestinoPush | null>(null);

  /**
   * Al tocar una notificación Android reanuda la app; si cambio de pantalla
   * antes de que esté activa del todo, react-native-screens no puede montar
   * la pantalla y la app se cierra. Espero a que AppState sea «active» y le
   * doy un instante antes de navegar.
   */
  const navegar = useCallback(
    (destino: DestinoPush) => {
      const ir = () =>
        setTimeout(() => {
          router.push(destino as Parameters<typeof router.push>[0]);
        }, RETRASO_NAVEGACION_MS);

      if (AppState.currentState === 'active') {
        ir();
        return;
      }
      const suscripcion = AppState.addEventListener('change', (estado) => {
        if (estado !== 'active') return;
        suscripcion.remove();
        ir();
      });
    },
    [router],
  );

  useEffect(() => {
    listoRef.current = listo;
    if (listo && pendiente.current) {
      const destino = pendiente.current;
      pendiente.current = null;
      navegar(destino);
    }
  }, [listo, navegar]);

  useEffect(
    () =>
      escucharNotificaciones({
        alRecibir: () => {
          if (listoRef.current) void sincronizarContador();
        },
        alTocar: (destino) => {
          if (listoRef.current) navegar(destino);
          else pendiente.current = destino;
        },
      }),
    [navegar],
  );

  useEffect(() => {
    if (cargando) return;
    if (token) {
      // Preparo permisos y el manejador en primer plano apenas hay sesión,
      // para que los avisos lleguen en cualquier pantalla.
      void registrarNotificaciones();
      void sincronizarContador();
    } else {
      void limpiarContador();
    }
  }, [token, cargando]);

  const alEvento = useCallback((evento: EventoTiempoReal) => {
    if (evento.tipo === 'notificacion') {
      const aviso = avisoLocalDesdeEvento(evento.payload);
      void mostrarNotificacionLocal(aviso.titulo, aviso.cuerpo, aviso.datos);
    }
    if (
      evento.tipo === 'notificacion' ||
      evento.tipo === 'notificacion_leida'
    ) {
      void sincronizarContador();
    }
  }, []);

  useRealtime(alEvento);

  return null;
}
