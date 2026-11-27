import { useEffect } from 'react';

import { suscribirResultadosSincronizacion } from '@/services/colaOffline';
import { useUnionesStore } from '@/store/unionesStore';

/**
 * Conecta el resultado real de la cola offline con el estado optimista de las
 * uniones a viajes. Se monta una sola vez en el layout raíz: así cualquier
 * pantalla ve el estado final aunque no esté abierta cuando reconecta la red.
 */
export function useSincronizacionUniones(): void {
  useEffect(() => {
    const desuscribir = suscribirResultadosSincronizacion((resultados) => {
      useUnionesStore.getState().aplicarResultados(resultados);
    });

    // Recupera uniones que quedaron guardadas de una sesión anterior.
    void useUnionesStore.getState().hidratarDesdeCola();

    return desuscribir;
  }, []);
}
