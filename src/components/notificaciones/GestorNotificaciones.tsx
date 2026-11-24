import { useCallback, useEffect, useRef } from 'react';
import { useRouter } from 'expo-router';

import { useRealtime, type EventoTiempoReal } from '@/hooks/useRealtime';
import { useSesion } from '@/hooks/useSesion';
import {
  escucharNotificaciones,
  limpiarContador,
  sincronizarContador,
  type DestinoPush,
} from '@/services/notificaciones';

/**
 * Conecté las notificaciones del sistema con la sesión: al recibir un aviso
 * actualizo el contador del ícono y al tocarlo navego al viaje o a su detalle.
 * Si el toque llega antes de que la sesión esté lista (app abierta desde
 * cerrada o sin iniciar sesión), guardo el destino y navego cuando se pueda.
 */
export function GestorNotificaciones() {
  const router = useRouter();
  const { token, cargando } = useSesion();
  const listo = Boolean(token) && !cargando;
  const listoRef = useRef(listo);
  const pendiente = useRef<DestinoPush | null>(null);

  const navegar = useCallback(
    (destino: DestinoPush) => {
      router.push(destino as Parameters<typeof router.push>[0]);
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
    if (token) void sincronizarContador();
    else void limpiarContador();
  }, [token, cargando]);

  const alEvento = useCallback((evento: EventoTiempoReal) => {
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
