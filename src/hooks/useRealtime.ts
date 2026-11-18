import { useEffect, useRef } from 'react';

import { useSesion } from '@/hooks/useSesion';
import { WS_URL } from '@/services/api';

export type EventoTiempoReal = {
  tipo?: string;
  type?: string;
  payload?: Record<string, unknown> | null;
  fecha?: string;
};

/**
 * Canal WebSocket autenticado con el mismo token de la sesión.
 * Si no hay token o el servidor no está disponible, no simula eventos:
 * simplemente no conecta y la pantalla sigue funcionando con el REST.
 */
export function useRealtime(onEvento: (evento: EventoTiempoReal) => void) {
  const { token } = useSesion();
  const manejador = useRef(onEvento);

  useEffect(() => {
    manejador.current = onEvento;
  }, [onEvento]);

  useEffect(() => {
    if (!token) return;

    let socket: WebSocket | null = null;
    try {
      socket = new WebSocket(
        `${WS_URL}/ws?token=${encodeURIComponent(token)}`,
      );
    } catch (error) {
      console.warn('[realtime] no se pudo crear el socket', error);
      return;
    }

    socket.onmessage = (mensaje) => {
      try {
        const evento = JSON.parse(String(mensaje.data)) as EventoTiempoReal;
        manejador.current(evento);
      } catch {
        // Mensaje no conforme: se ignora, no se inventa un evento.
      }
    };

    socket.onerror = () => {
      // No se registra el error con la URL porque contiene el token.
      console.warn('[realtime] conexión no disponible');
    };

    return () => {
      socket?.close();
    };
  }, [token]);
}
