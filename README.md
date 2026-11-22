# RutaGo · App móvil

Cliente móvil de RutaGo construido con **Expo SDK 58**, React Native, Expo Router y TypeScript. Comparte el backend con la versión web (`rutago-backend`).

## Configuración

1. Instala dependencias:

```bash
npm install
```

2. Copia el ejemplo de entorno y ajusta la URL del backend:

```bash
cp .env.example .env
```

```env
EXPO_PUBLIC_API_URL=https://rutago-backend-a303.onrender.com
```

`EXPO_PUBLIC_API_URL` se incrusta en el bundle (Expo sólo expone variables `EXPO_PUBLIC_`). **Nunca pongas secretos aquí.** El cliente añade `/api` a esta URL.

3. Inicia la app:

```bash
npm start
```

## Rutas y sesión

| Ruta | Acceso | Descripción |
| --- | --- | --- |
| `/` | Público | Inicio de sesión. |
| `/recuperar-password` | Público | Solicitud de enlace y restablecimiento con `?token=`. |
| `/dashboard` | Autenticado | Panel por rol real: `Administrador`, `Conductor` o `Pasajero`. `Entidad Externa` queda fuera del alcance móvil. |
| `/buscar-viajes` | Autenticado | Búsqueda real de rutas por destino y origen. |
| `/mis-viajes` | Autenticado | Viajes propios desde `/viajes/me/mis-viajes`; el conductor puede iniciar/finalizar/cancelar y el pasajero cancelar. Los viajes aceptados/en curso muestran la posición inicial de `/vehiculos/:id/ubicacion` y la actualizan con eventos `ubicacion` de la sala `viaje:<id>`. |
| `/mis-solicitudes` | Autenticado | Pasajero: solicitudes pendientes filtradas de su historial. Conductor: `/viajes/disponibles` con aceptación real. |
| `/crear-viaje` | Pasajero | Solicitud real con rutas y horarios de `/rutas` y `/horarios/ruta/:id`. |
| `/viajes-disponibles` | Pasajero | Viajes en estado BUSCANDO desde `/viajes/disponibles-pasajero`, con unión real por `/unirse`. |
| `/aceptar-viaje` | Conductor | Aceptación con `vehiculoId` real desde `/vehiculos`. |
| `/reportar-ubicacion` | Conductor | GPS real con `expo-location` hacia `/vehiculos/:id/ubicacion`. |
| `/panel-gestion` | Administrador | Módulos y conteos consultados a los endpoints reales. |
| `/gestion` | Administrador | Listado, búsqueda, alta, edición y baja por recurso. |
| `/gestion-detalle` | Administrador | Formulario real por recurso, con opciones cargadas del backend. |
| `/crear-notificacion` | Administrador | Notificación interna persistida y difundida por WebSocket. |
| `/mi-perfil` | Autenticado | Datos comunes, datos de pasajero o licencia/estado de conductor según el rol. |
| `/notificaciones` | Autenticado | Lista persistida en `/notificaciones`, marca de leído y refresco por WebSocket autenticado. |
| `/explore` | Público | Pantalla de ejemplo del template Expo. |

La sesión se guarda en `expo-secure-store` (`token`, `refreshToken`, `rutago_user`). El interceptor de Axios renueva el access token con `/api/auth/refresh`; si falla, borra **las tres** claves y redirige al login. `src/app/_layout.tsx` usa `Stack.Protected` para impedir navegación a pantallas privadas sin sesión. El perfil se toma del backend (no se confía en un rol escrito en el cliente).

### Deep link de recuperación

El esquema configurado en `app.json` es `rutagomobile`. Para que el correo abra la app directamente, configura en el backend:

```env
PASSWORD_RESET_URL=rutagomobile://recuperar-password
```

Enlace resultante: `rutagomobile://recuperar-password?token=<token>`. Sin esa variable, el backend usa `FRONTEND_URL/recuperar-password` (versión web).

## Contrato de API

- Las respuestas exitosas usan `{ success: true, data: ... }`. Los helpers `extraerDatos` y `extraerLista` (`src/services/api.ts`) hacen el unwrap.
- `GET /api/rutas/destino/:destino` devuelve rutas con `horarios: string[]` (sólo horas). El DTO del backend **no incluye** placa, empresa ni estado del vehículo, por lo que la app no inventa esos datos.
- Un `404` en la búsqueda se trata como “sin resultados”, no como error de red.
- `GET /viajes/me/mis-viajes`, `GET /viajes/disponibles`, `GET /notificaciones`, `GET/PUT /usuarios/me/perfil` y `PUT /usuarios/me/contrasena` son las fuentes reales de las nuevas pantallas. Ninguna usa datos de ejemplo.
- El canal en tiempo real escucha `ws(s)://<backend>/ws?token=<accessToken>` con el token de la sesión. Los eventos `notificacion` y `notificacion_leida` refrescan la lista; si el socket no conecta, la pantalla sigue funcionando con el REST y **no simula** eventos.
- Para el seguimiento, el cliente se suscribe a `viaje:<id>` (validado en backend por propiedad real) y aplica los eventos `ubicacion`. El botón “Abrir mapa” abre OpenStreetMap con las coordenadas reportadas; no se dibuja un bus inventado cuando no hay datos.

## Sin conexión

La app sigue funcionando cuando la red cae y no pierde el trabajo hecho en campo:

- **Lecturas:** `obtenerConCache` (`src/services/offline.ts`) intenta la red primero y, si falla, devuelve la última respuesta real guardada en `SecureStore`. Sin caché propaga el error original; nunca inventa registros.
- **Escrituras:** `mutarConCola` (`src/services/colaOffline.ts`) envía el cambio si hay red y, si no, lo guarda en la cola `rutago_cola_offline` para reenviarlo después.
- **Detección:** `src/services/conexion.ts` escucha el estado del dispositivo con `@react-native-community/netinfo` y dispara la sincronización al recuperar la conexión. También se intenta al arrancar la app, por si quedó trabajo de una sesión anterior.
- **Conflictos:** al encolar, un `PUT` o `PATCH` sobre el mismo recurso reemplaza al pendiente (último en ganar), de modo que sólo se reenvía la posición o el estado más reciente. Al sincronizar se conserva el orden original, se descartan los `4xx` del servidor (validación o conflicto) y se limitan los reintentos a 5 por cambio.
- **Sesión:** `cerrarSesion` vacía la cola para no reenviar cambios de otra cuenta.

Están conectados a la cola el reporte de ubicación del conductor y el marcado de notificaciones como leidas. Las decisiones con efecto inmediato y no repetibles (bajarse o cancelar un viaje) siguen exigiendo red: reenviarlas horas después aplicaría una decisión que ya no es la del usuario.

## Verificación

```bash
npx tsc --noEmit
npm run lint
npm test
npx expo export --platform web --output-dir <ruta-temporal>
```

Todos los comandos pasan sin errores: `npx tsc --noEmit` y `npm run lint` sin hallazgos; `npm test` ejecuta **54 pruebas en 11 suites** (cola offline, conexión, sesión, GPS, notificaciones, biometría y accesibilidad); `npx expo export --platform web` compila 14 bundles y genera **11 rutas estáticas** (antes 7), incluidas las cuatro nuevas. No se generan artefactos dentro del repositorio: la exportación se hace en una ruta temporal.

`.github/workflows/ci.yml` repite `npm ci`, `npx tsc --noEmit`, `npm run lint`, `npm test` y la exportación del bundle web en pushes y PRs de `feature-ASEG1999`, `dev` y `main`. El build/submit con EAS queda pendiente de credenciales de Expo.

## EAS (preparado, sin ejecutar)

`eas.json` define los perfiles `development`, `preview` y `production`. Aún no se han generado binarios ni enviado nada a tiendas. Cuando exista cuenta Expo y permisos sobre el proyecto:

```bash
npx eas-cli login
npx eas-cli init
npx eas-cli build --profile preview --platform android
npx eas-cli build --profile production --platform ios
npx eas-cli submit --profile production --platform android
```

Antes del build definitivo confirma `EXPO_PUBLIC_API_URL` y `PASSWORD_RESET_URL` con la URL del backend elegida.

## Sprints y cierre

Consulta [`SPRINTS.md`](SPRINTS.md) para el resumen cross-repo, commits, evidencia de pruebas y riesgos pendientes.

## Funciones pendientes (sin simular éxito)

- Publicación de nuevos viajes y panel administrativo desde la app: siguen en la versión web; el móvil ya gestiona viajes propios, solicitudes, perfil y notificaciones internas con datos reales.
- Mapa embebido dentro de la app y push del sistema operativo: las coordenadas en vivo y la apertura del mapa externo ya funcionan con datos reales; el mapa nativo integrado requiere una dependencia adicional y el push requiere proveedor externo.
- CI/CD con EAS build/submit (requiere cuenta y credenciales de Expo).
