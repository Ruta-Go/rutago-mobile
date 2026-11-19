/** Verifiqué que la URL pública configurada responda al contrato real de la API. */
const API_URL =
  process.env.EXPO_PUBLIC_API_URL || 'https://rutago-backend-a303.onrender.com';

async function verificar() {
  const destino = `${API_URL.replace(/\/$/, '')}/api/auth/verificar-token`;

  try {
    const respuesta = await fetch(destino, {
      headers: { Accept: 'application/json' },
    });

    // Sin token, el endpoint debe responder 401; cualquier otra cosa indica un problema de túnel o backend.
    if (respuesta.status === 401) {
      console.log(`API reachable: ${destino} -> 401 (endpoint protegido activo)`);
      return;
    }

    console.error(
      `Unexpected response: ${destino} -> ${respuesta.status} ${respuesta.statusText}`,
    );
    process.exitCode = 1;
  } catch (error) {
    console.error(
      `No pude conectar con ${destino}:`,
      error instanceof Error ? error.message : error,
    );
    process.exitCode = 1;
  }
}

void verificar();
