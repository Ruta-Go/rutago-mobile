import { useCallback, useEffect, useRef } from 'react';

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
 * El backend ya suscribe al usuario y a su rol; `salas` permite además
 * escuchar recursos concretos (por ejemplo `viaje:<id>`) previa validación
 * de propiedad en el servidor. Si no hay token o el socket no conecta, no
 * simula eventos: la pantalla sigue funcionando con el REST.
 */
export function useRealtime(
  onEvento: (evento: EventoTiempoReal) => void,
  salas: string[] = [],
) {
  const { token } = useSesion();
  const manejador = useRef(onEvento);
  const socketRef = useRef<WebSocket | null>(null);
  const salasRef = useRef(salas);
  const salasEnviadas = useRef<Set<string>>(new Set());

  useEffect(() => {
    manejador.current = onEvento;
  }, [onEvento]);

  useEffect(() => {
    salasRef.current = salas;
  }, [salas]);

  const suscribir = useCallback((socket: WebSocket, lista: string[]) => {
    lista.forEach((sala) => {
      if (!sala || salasEnviadas.current.has(sala)) return;
      socket.send(JSON.stringify({ tipo: 'suscribirse', sala }));
      salasEnviadas.current.add(sala);
    });
  }, []);

  useEffect(() => {
    if (!token) return;

    let canal: WebSocket;
    try {
      canal = new WebSocket(`${WS_URL}/ws?token=${encodeURIComponent(token)}`);
    } catch (error) {
      console.warn('[realtime] no se pudo crear el socket', error);
      return;
    }

    socketRef.current = canal;
    const enviadas = salasEnviadas.current;

    canal.onopen = () => {
      suscribir(canal, salasRef.current);
    };

    canal.onmessage = (mensaje) => {
      try {
        const evento = JSON.parse(String(mensaje.data)) as EventoTiempoReal;
        manejador.current(evento);
      } catch {
        // Mensaje no conforme: se ignora, no se inventa un evento.
      }
    };

    canal.onerror = () => {
      // No se registra la URL porque contiene el token.
      console.warn('[realtime] conexión no disponible');
    };

    return () => {
      canal.close();
      socketRef.current = null;
      enviadas.clear();
    };
  }, [token, suscribir]);

  useEffect(() => {
    const socket = socketRef.current;
    if (socket && socket.readyState === WebSocket.OPEN) {
      suscribir(socket, salas);
    }
  }, [salas, suscribir]);
}
