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
| `/dashboard` | Autenticado | Panel por rol real (`Administrador`, `Conductor`, `Pasajero`, `Entidad Externa`). |
| `/buscar-viajes` | Autenticado | Búsqueda real de rutas por destino y origen. |
| `/mis-viajes` | Autenticado | Viajes propios desde `/viajes/me/mis-viajes`; el conductor puede iniciar/finalizar/cancelar y el pasajero cancelar. |
| `/mis-solicitudes` | Autenticado | Pasajero: solicitudes pendientes filtradas de su historial. Conductor: `/viajes/disponibles` con aceptación real. |
| `/mi-perfil` | Autenticado | Lectura y edición de `/usuarios/me/perfil` y cambio de contraseña con `/usuarios/me/contrasena`. |
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

## Verificación

```bash
npx tsc --noEmit
npm run lint
npx expo export --platform web --output-dir <ruta-temporal>
```

Todos los comandos pasan sin errores: `npx tsc --noEmit` y `npm run lint` sin hallazgos; `npx expo export --platform web` compila 14 bundles y genera **11 rutas estáticas** (antes 7), incluidas las cuatro nuevas. No se generan artefactos dentro del repositorio: la exportación se hace en una ruta temporal.

`.github/workflows/ci.yml` repite `npm ci`, `npx tsc --noEmit` y `npm run lint` en pushes y PRs de `feature-ASEG1999`, `dev` y `main`. El build/submit con EAS queda pendiente de credenciales de Expo.

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
- Seguimiento de vehículos en un mapa en tiempo real y push del sistema operativo: el backend ya expone el WebSocket y las notificaciones persistentes, pero falta la vista de mapa y un proveedor de push externo.
- CI/CD con EAS build/submit (requiere cuenta y credenciales de Expo).
