import NetInfo from '@react-native-community/netinfo';

/**
 * Detecto el estado de la red del dispositivo en un solo lugar para que la
 * cola offline y las pantallas lean siempre el mismo valor (Sprint 2,
 * sincronizar los datos de la app con el servidor · Tarea 1).
 */

type Suscriptor = (enLinea: boolean) => void;

const suscriptores = new Set<Suscriptor>();
let enLinea = true;
let escuchando = false;

/**
 * NetInfo devuelve null mientras resuelve, así que sólo tomo la caída como
 * real cuando lo dice expresamente: asumir "sin red" en ese instante
 * encolaría cambios que podían enviarse de inmediato.
 */
function interpretar(estado: {
  isConnected: boolean | null;
  isInternetReachable: boolean | null;
}): boolean {
  return estado.isConnected !== false && estado.isInternetReachable !== false;
}

function anunciar(siguiente: boolean) {
  const cambio = enLinea !== siguiente;
  enLinea = siguiente;
  if (!cambio) return;
  suscriptores.forEach((suscriptor) => suscriptor(enLinea));
}

function escuchar() {
  if (escuchando) return;
  escuchando = true;
  NetInfo.addEventListener((estado) => anunciar(interpretar(estado)));
}

/** Estado puntual de la red; se invoca el listener y queda el último valor. */
export async function hayConexion(): Promise<boolean> {
  try {
    const estado = await NetInfo.fetch();
    anunciar(interpretar(estado));
  } catch {
    // Si el sistema no responde dejo el valor conocido: la petición decidirá.
  }
  return enLinea;
}

/** Último estado conocido, para consultarlo sin esperar el sistema. */
export function conexionActual(): boolean {
  return enLinea;
}

/**
 * Me suscribo a los cambios de conexión y devuelvo la función de baja. No se
 * invoca al suscribirse: quien arranca la sincronización consulta el estado
 * inicial por su cuenta para no reenviar nada con la red aún desconocida.
 */
export function suscribirConexion(suscriptor: Suscriptor): () => void {
  escuchar();
  suscriptores.add(suscriptor);
  return () => {
    suscriptores.delete(suscriptor);
  };
}
