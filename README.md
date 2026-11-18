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

## Verificación

```bash
npx tsc --noEmit
npm run lint
npx expo export --platform web --output-dir <ruta-temporal>
```

Todos los comandos pasan sin errores. No se generan artefactos dentro del repositorio.

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

- Publicación/gestión de viajes, solicitudes y perfil editable desde la app; hoy se indican como disponibles en la versión web.
- GPS/WebSocket y notificaciones push.
- CI/CD con EAS build/submit (requiere cuenta y credenciales de Expo).
