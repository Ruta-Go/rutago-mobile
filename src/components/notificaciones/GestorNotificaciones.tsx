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

export function GestorNotificaciones() {
  const router = useRouter();
  const { token, cargando } = useSesion();
  const listo = Boolean(token) && !cargando;
  const listoRef = useRef(listo);
  const pendiente = useRef<DestinoPush | null>(null);

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
