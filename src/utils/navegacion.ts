import { router } from 'expo-router';

/** Evita el botón «Volver» inactivo cuando la pantalla se abrió por deep link. */
export function volverSeguro(destino = '/dashboard') {
  if (router.canGoBack()) {
    router.back();
    return;
  }
  router.replace(destino as Parameters<typeof router.replace>[0]);
}
