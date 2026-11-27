# RutaGo · Sprints y cierre de integración

## Alcance

Cierre integral de RutaGo **sin reconstruir** el proyecto: se auditaron los tres repositorios, se alinearon estados Git, se corrigió seguridad de autenticación y permisos, se ajustaron los clientes web y móvil al contrato real del backend y se dejó documentación reproducible para la demostración académica.

## Tabla de cierre

| Sprint / Tarea | Repositorio | Resultado | Commit | Push |
| --- | --- | --- | --- | --- |
| Sprint 0 · Auditoría y alineación | `rutago-frontend` | `git merge --ff-only origin/main`: `ebb3e6e` → `acfbd5c` | Sin commit propio | No requerido |
| Sprint 0 · Backend / móvil | `rutago-backend`, `rutago-mobile` | Ramas alineadas con remoto; stash móvil `stash@{0}` revisado y **no aplicado** | — | No requerido |
| Sprint 1 / T1 · Seguridad de auth | `rutago-backend` | Rol forzado a `PASAJERO` en registro, contraseñas 8+letra+número, reset hasheado, refresh rechazado como access, rate limit, CORS/HSTS, `.env.example` | `9c6f292` | Sí |
| Sprint 1 / T3 · Propiedad y permisos | `rutago-backend` | Middleware `ownership` para conductores, vehículos, viajes y pasajeros; 6 pruebas nuevas | `e9dd736` | Sí (`0e0a7a9..e9dd736`) |
| Sprint 2 · Frontend | `rutago-frontend` | Recuperación/reset, cambio de contraseña, logout completo, guard reforzado, lint sin errores | `8d511f7` | Sí (`acfbd5c..8d511f7`) |
| Sprint 3 · Móvil | `rutago-mobile` | `EXPO_PUBLIC_API_URL`, envelope `{ success, data }`, sesión reactiva, roles reales, logout, deep link y contrato de `horarios` | `75c20e9` | Sí (`5fc2e97..75c20e9`) |
| Sprint 4 · Documentación y verificación | Los tres | READMEs, `SPRINTS.md`, `.env.example` y evidencia de pruebas | Docs finales | Sí |
| Sprint 5 · Auditoría final | Los tres | Sólo `.env.example` versionado, deploy sin generar `JWT_SECRET`, `npm ci` en CI web, CI móvil de tipos/lint | Auditoría final | Sí |
| Sprint 6 · Continuación | Los tres | Verificación en vivo: backend 200, dominio VPS vencido; chequeo de entorno sin secretos y configuración EAS preparada | Verificación final | Sí |
| Sprint 7 / T1 · Tiempo real y geoespacial | `rutago-backend` | WebSocket autenticado con salas autorizadas, GPS sobre REST existente, `POST /rutas/cercanas` con PostGIS/fallback JS | `46c5f1a` | Sí (`8287243..7bfc31f`) |
| Sprint 7 / T2 · Notificaciones internas | `rutago-backend` | Tabla aditiva, endpoints propios, eventos reales de viaje y difusión WebSocket | `b6e9512` | Sí (`8287243..7bfc31f`) |
| Sprint 7 / T3 · Móvil funcional | `rutago-mobile` | Mis viajes, Mis solicitudes, Mi perfil y Notificaciones conectados a API real + WebSocket; dashboard sin placeholders en esas opciones | `908eec5` | Sí (`e29ba56..270e45e`) |
| Sprint 7 / T4 · Mapa web en vivo | `rutago-frontend` | Posición inicial por REST y actualización por WebSocket en `/viajes/:id/mapa` | `d63db00` | Sí (`34d719d..fe09678`) |
| Sprint 7 / T5 · Campana web | `rutago-frontend` | `GET/PATCH /notificaciones` y eventos WS en el `Navbar`, con contador real | `e52d5a5` | Sí (`34d719d..fe09678`) |
| Sprint 7 / T6 · GPS en móvil | `rutago-mobile` | Posición inicial por REST, eventos `ubicacion` en `viaje:<id>` y apertura de mapa externo con coordenadas reales | `3ebcd76` | Sí (`270e45e..83437c1`) |
| Sprint 7 / T7 · Mapa de flota | `rutago-frontend` | `/vehiculos/mapa`: posiciones iniciales de `GET /vehiculos`, eventos por sala `vehiculo:<id>` y listado lateral real | `903cefa` | Sí (`fe09678..dd62b4c`) |
| Sprint 8 · Accesibilidad móvil | `rutago-mobile` | `Input` compartido con etiqueta, estado y error anunciados | `f64e862` | Sí |
| Sprint 8 · CI móvil | `rutago-mobile` | Jest y exportación real del bundle web agregados al workflow | `1d45a5a`, `7d3b279` | Sí |
| Sprint 8 · Notificaciones del SO | `rutago-mobile` | Permisos, token de Expo desde `app.json` y avisos locales de eventos reales | `4311069`, `14bde93` | Sí |
| Sprint 8 · Offline | `rutago-mobile` | Caché cifrada de viajes y notificaciones con fallback real sin red | `702acc7` | Sí |
| Sprint 8 · GPS en segundo plano | `rutago-mobile` | Tarea del sistema, permisos y envío real de coordenadas con la app en segundo plano | `db13257` | Sí |
| Sprint 9 / Backend Render | `rutago-backend` | PR #36: `/api/health/db` y `/api/rutas/por-paradas`, diagnóstico sin secretos | `75cf9d9` | Sí |
| Sprint 9 / Identidad visual | `rutago-mobile` | Paleta verde `#087A35`, amarillo `#FFD900` y blanco `#FFFFFF` | `bbd6023` | Sí |
| Sprint 9 / Foto verificada | `rutago-mobile` | Universidad del Pacífico desde Wikimedia Commons, CC BY-SA 4.0 | `4ed9991` | Sí |
| Sprint 9 / Bienvenida | `rutago-mobile` | Nueva pantalla de bienvenida, selección de roles y ruta `/iniciar-sesion` | `c2fe9d1` | Sí |
| Sprint 9 / Validación de rol | `rutago-mobile` | El backend valida el rol real antes de guardar la sesión | `5f6c900` | Sí |
| Sprint 9 / Búsqueda por barrio | `rutago-mobile` | Selectores reales de barrios y Universidad del Pacífico | `6082736` | Sí |
| Sprint 10 / Sincronización offline | `rutago-mobile` | PR #17 de `feature/offline-sync`: cola cifrada, detección de red y reenvío automático | `9b40ffb` | Sí |

## Verificación ejecutada

| Repositorio | Comando | Resultado |
| --- | --- | --- |
| `rutago-backend` | `npm test` | 35/35 pruebas correctas (18 originales + 17 de tiempo real, GPS, geobúsqueda y notificaciones) |
| `rutago-frontend` | `npm run lint` | 0 errores; warnings no bloqueantes de `exhaustive-deps` |
| `rutago-frontend` | `npx vite build --outDir <ruta-temporal>` | 2002 módulos transformados, sin errores |
| `rutago-mobile` | `npx tsc --noEmit` | Sin errores |
| `rutago-mobile` | `npm run lint` | Sin errores (equivale a `npx expo lint`) |
| `rutago-mobile` | `npm test` | 35/35 pruebas correctas (9 suites) |
| `rutago-mobile` | `npx expo export --platform web --output-dir .expo-export` | 21 bundles y 19 rutas estáticas exportadas, sin errores; paso incluido en la CI |
| Backend en vivo | `GET https://rutago-backend-a303.onrender.com/api/ping` | 200 |
| Frontend en vivo | `GET https://rutago.seminario1.eleueleo.com/` | Dominio vencido (Hostinger): los 4 checks de Fase 2 están bloqueados |
| Móvil | `eas.json` | Perfiles EAS preparados; requiere cuenta Expo para ejecutarlos |
| Los tres | `git ls-files` filtrado por `.env` | Sólo `.env.example` está versionado |
| Los tres | `git grep` de patrones de credenciales | Sin coincidencias reales |

No se generaron artefactos versionados (`dist`, `web-build`, `.expo-export`) dentro de los repositorios.

## Verificación del cierre móvil (Sprint 9)

- `npm test -- --runInBand`: 10 suites, 41 pruebas, sin fallos.
- `npm run lint`: 0 errores, 0 advertencias.
- `npx tsc --noEmit`: sin errores de tipos.
- `npx expo export --platform web --output-dir .expo-export`: 22 bundles web y 20 rutas estáticas. El export se ejecutó desde una copia limpia fuera de OneDrive porque los puntos de reparse de `node_modules` en la ruta sincronizada producen `EINVAL readlink` en Metro; el código verificado es idéntico al de esta rama.

## Integración de ramas y bloqueos

- `feature-ASEG1999` se integró en `main` mediante PR #16; CI verde (tipos, lint, pruebas y export web).
- `feature/offline-sync` se integró en `main` mediante PR #17; merge temporal verificado con 12 suites/59 pruebas, lint, tipos y export web.
- `chore/sdk-58`, `feacture-Stefany`, `dev` y `feacture-ESQ` ya eran antecedentes de `main`: no había trabajo pendiente que integrar.
- En el backend, todas las ramas remotas salvo `FEATURE-ASEG` ya estaban incluidas en `main`; `FEATURE-ASEG` no produce diferencias de contenido frente a `main`.
- Deploy de Render: el auto-deploy desde GitHub sí incorporó el PR #36. `/api/health/db` responde 200 con tablas `Usuarios`/`Rutas` y 1 usuario; el login con correo inexistente devuelve 401 y ya no 500. El workflow SSH al VPS sigue fallido y requiere acceso a sus secretos.
- Trello: no hay variables de entorno `TRELLO*` ni acceso verificado, así que los tableros no pudieron actualizarse.

## Decisiones

1. **Roles válidos en el móvil:** `Administrador` (1), `Conductor` (2), `Pasajero` (3). `Entidad Externa` existe en el backend pero queda fuera del alcance de la app móvil. El backend verifica siempre; el cliente nunca decide el rol en registro ni puede escalar.
2. **Contrato de respuesta:** las listas y detalles usan `{ success, data, message? }`. El móvil hace `unwrap` con `extraerDatos` / `extraerLista`.
3. **Recuperación:** token de un solo uso guardado como hash SHA-256. Resend vía `fetch`; sin `EMAIL_API_KEY` el modo desarrollo imprime el enlace en consola y producción responde 503. No se enviaron correos reales.
4. **Deep link móvil:** `rutagomobile://recuperar-password?token=...`, configurable con `PASSWORD_RESET_URL` en el backend.
5. **Horarios reales:** `GET /api/rutas/destino/:destino` devuelve `horarios: string[]`. El móvil muestra horas reales y **no inventa** placa, empresa ni estado de vehículo porque el DTO no los incluye.
6. **Sin secretos:** `.env` nunca se publicó ni se incluyó en commits. Las variables públicas son sólo `VITE_API_URL` y `EXPO_PUBLIC_API_URL`.
7. **CI/CD:** deploy web con `npm ci`; el script de producción ya **no genera** `JWT_SECRET` automáticamente (falla con mensaje si falta). El móvil tiene CI de `tsc`/lint; EAS build/submit sigue pendiente de credenciales.
8. **Tiempo real implementado:** se reutiliza el REST de GPS existente; `/ws` sólo difunde eventos y `rutaGeometria` ya existente evita migraciones espaciales. El móvil consume notificaciones persistentes y, en viajes aceptados/en curso, muestra coordenadas reales con posición inicial por REST y eventos `ubicacion` en la sala autorizada `viaje:<id>`; “Abrir mapa” usa esas coordenadas. El mapa nativo embebido, el push local con registro de token y el GPS en segundo plano ya están integrados; EAS build/submit sigue pendiente de cuenta Expo. El panel administrativo móvil está implementado con CRUD real y notificaciones internas.
9. **Estado del dominio:** `rutago.seminario1.eleueleo.com` responde con la página de dominio vencido de Hostinger; por eso no se pueden ejecutar los 4 checks de Fase 2 en vivo. El backend de Render sigue en 200. Renovar el dominio o publicar el frontend en otra URL antes de la demo.
10. **Caché offline y push:** viajes y notificaciones se guardan en `SecureStore` y se reutilizan sólo cuando falla la red; sin caché se propaga el error. El registro de push lee el `projectId` publicado en `app.json`, pero el envío remoto requiere un proveedor externo configurado por el equipo.

## Restricciones respetadas

- Sin `force push`, sin cambio de rama, sin borrado de ramas/archivos, sin `git reset --hard`, `git clean` ni stashes automáticos.
- Sin migraciones destructivas, `sync({ force: true })`, truncado de tablas ni seeds en producción.
- Sin modificar credenciales de producción ni infraestructura irreversible.
- Sin datos ficticios presentados como reales.

## Pendiente para el equipo / docente

1. **Rotar credenciales** del `.env` real revisado: deben considerarse expuestas. No se muestran valores en esta documentación.
2. **Renovar el dominio** `rutago.seminario1.eleueleo.com` o definir otra URL del frontend; hoy responde "domain expired" y bloquea los checks en vivo.
3. **Configurar proveedor de correo** (`EMAIL_API_KEY`, `EMAIL_FROM`, `PASSWORD_RESET_URL`) para el envío real; hoy el flujo está integrado pero no probado con correo.
4. **Ejecutar los 4 checks de Fase 2** una vez el frontend esté accesible (requiere credenciales de prueba).
5. **EAS build/submit** cuando se disponga de cuenta Expo; ejecutar antes `npx eas-cli init`.
6. **Ejecutar** `npx eas-cli init` **y configurar la cuenta Expo** antes de usar `eas.json`.
7. **Configurar el proveedor de push remoto** y registrar los tokens obtenidos en el backend; hoy el móvil solicita permisos, obtiene el token y muestra notificaciones locales, pero no existe un canal de envío externo.
8. **Autorizar una cuenta de demostración**: la base de Render solo tiene 1 usuario real; no se cargaron usuarios de prueba ni se cambiaron contraseñas.

## Comandos de push

```bash
# Backend (rama main)
cd C:\Users\Usuario\OneDrive\Escritorio\RUTAGO\rutago-backend
git push origin main

# Frontend (rama main)
cd C:\Users\Usuario\OneDrive\Escritorio\RUTAGO\rutago-frontend
git push origin main

# Móvil (rama feature-ASEG1999)
cd C:\Users\Usuario\OneDrive\Escritorio\RUTAGO\rutago-mobile
git push origin feature-ASEG1999
```

## Sprint 10 / Staging aislado (backend) - 2026-11-22

| Tarea | Repositorio | Resultado | Commit / PR | Hecho |
| --- | --- | --- | --- | --- |
| Base y role aislados, seed con solo Conductor y Pasajero, guard antiproduccion | `rutago-backend` | Implementado y probado: seed rechaza produccion con exit 1; idempotente | `6b568b0`, PR `#37` | Si |
| Documentacion del procedimiento y evidencia de QA | `rutago-backend` | `docs/STAGING.md` y `docs/QA_STAGING.md` | `e488f93`, PR `#37` | Si |
| E2E de API: login, barrios, Universidad, horarios, viajes, panel conductor, notificaciones y GPS | `rutago-backend` | 23/23 verificaciones OK | PR `#37` | Si |
| Bateria unitaria del backend | `rutago-backend` | `npm test`: 44/44 pruebas OK | PR `#37` | Si |
| CI del backend | `rutago-backend` | Workflow `Deploy Backend RutaGo` falla en `Verificar conexion SSH` por secretos SSH ausentes (fallo preexistente, no causado por este cambio) | run `45061064951` | No |

## Sprint 11 / Errores con contacto e identidad visual (movil) - 2026-11-22

| Tarea | Repositorio | Resultado | Commit / PR | Hecho |
| --- | --- | --- | --- | --- |
| Todo error muestra la falla y ademas `Llamar a ANGEL ESTUPIÑAN`; login dice `Clave o correo incorrecto` | `rutago-mobile` | Implementado, 5 pruebas nuevas, 11 suites/46 pruebas OK | `40b8f18`, PR `#18` mergeado | Si |
| Franja verde `#087A35`, amarillo `#FFD900` y blanco en todas las pantallas | `rutago-mobile` | Implementado en `_layout.tsx`; export web 22 bundles/20 rutas | `549190f`, PR `#18` mergeado | Si |
| Verificacion tsc, lint, jest y export | `rutago-mobile` | Todo verde desde copia limpia fuera de OneDrive | PR `#18` | Si |
| CI del movil | `rutago-mobile` | 3 ejecuciones verde; PR `#18` mergeado en `ce4e8cc` | runs `45073378801`, `45073394238`, `45073423627` | Si |
| Verificacion visual en Expo Go con dispositivo | `rutago-mobile` | Bloqueado: no hay dispositivo/cuenta Expo; se uso export web | - | No |
| Sincronizacion offline probada sin red real | `rutago-mobile` | No ejecutada en esta ventana; la suite completa si incluye las pruebas unitarias de offline | - | No |

## Sprint 12 / Errores de Expo Go (movil) - 2026-11-22

| Tarea | Estado | Archivos modificados | Pruebas ejecutadas | Resultado | Commit / PR |
| --- | --- | --- | --- | --- | --- |
| NetInfo: verificar declaracion, instalacion y compatibilidad | Terminado | `scripts/verificar-entorno.js`, `package.json`, `.github/workflows/ci.yml`, `docs/EXPO_GO_DIAGNOSTICO.md` | `npm run check:entorno`, jest, tsc, lint, export web | `NETINFO_OK declarado=12.0.1 instalado=12.0.1`; 11 suites/46 pruebas OK; CI verde | `ea05c17`, PR `#23` mergeado |
| Dependencias del SDK 58 | Terminado | `package.json`, `package-lock.json`, `app.json`, `docs/EXPO_GO_DIAGNOSTICO.md` | `npx expo install --fix`, `npx expo install --check`, jest, tsc, lint, export web | `Dependencies are up to date`; 11 suites/46 pruebas OK; CI verde | `938038c`, PR `#24` mergeado |
| Carga centralizada de fuentes de iconos en iOS | Terminado | `src/services/fuentes.ts`, `src/app/_layout.tsx`, `__tests__/fuentes.test.ts`, `docs/EXPO_GO_DIAGNOSTICO.md` | jest, tsc, `expo lint --no-cache`, export web | 14 suites/65 pruebas OK; CI verde | `1982069`, PR `#25` mergeado |
| Verificacion fisica en iPhone/Expo Go | Bloqueado | - | - | Sin dispositivo en este entorno; no afirmo resuelto en dispositivo | - |
| Reinicio de Metro con cache limpia | Parcialmente realizado | - | Reinicio del bundle web desde copia limpia | Verificado por export web; falta repetir en el iPhone | - |

## Sprint 13 / Cierre de verificaciones y evidencia - 2026-11-22

| Tarea | Estado | Archivos modificados | Pruebas ejecutadas | Resultado | Commit / PR |
| --- | --- | --- | --- | --- | --- |
| Reverificación de staging backend | Terminado | `docs/QA_STAGING.md` | `npm test`, `e2e-v2.js`, `/api/health/db` | 44/44 y 23/23 OK; 2 usuarios demo, sin tocar Render | `114e3a4` (documentación, push directo a `main`) |
| Reinicio de Metro con caché limpia | Terminado | `docs/EXPO_GO_DIAGNOSTICO.md` | `npx expo start --clear --port 19006` | HTTP 200 y bundle reconstruido; proceso detenido | `5dcb5be`, PR `#27` mergeado |
| Pruebas de registro y recuperación de contraseña | Terminado | `__tests__/authService.test.ts` | jest, tsc, lint | 14 suites / 70 pruebas OK | `52e0981`, PR `#28` mergeado |
| Matriz funcional móvil | Terminado | `docs/QA_FUNCIONAL_MOVIL.md` | Revisión de evidencias de hoy | Checklist cubierto con estados y limitaciones explícitas | `245e889`, PR `#29` mergeado |
| Lint determinista | Terminado | `package.json` | jest, tsc, lint, export web | `npm run lint` sin caché; 14 suites/70 pruebas OK | `ab71825`, PR `#31` mergeado |
| Inventario de bloqueos externos | Terminado | `docs/BLOQUEOS_EXTERNOS.md` | Revisión de dependencias externas | Documentados SSH, Expo, push, correo, JWT, dominio, PostGIS, Trello y tiendas | `c542f73`, PR `#32` mergeado |
| CI backend | Parcialmente realizado | - | Workflows `CI Backend RutaGo` y `Deploy Backend RutaGo` | CI verde en run `45083225867`; Deploy falla por secretos SSH ausentes, fallo preexistente | - |
| Verificación física en Expo Go | Bloqueado | - | - | Sin iPhone/emulador en este entorno | - |

## Cierre autónomo 2026-11-24 · T25 (confirmación, carga y accesibilidad)

| Tarea | Estado | Archivos modificados | Pruebas ejecutadas | Resultado | Commit / PR |
| --- | --- | --- | --- | --- | --- |
| T25 · `ConfirmModal` con identidad oficial y compatibilidad | TERMINADO | `src/components/ui/ConfirmModal.tsx`, `src/components/ui/Modal.tsx` | `npm test`, `npx tsc --noEmit`, `npm run lint` | Botón principal verde `#087A35` (variante `primario`), acento amarillo `#FFD900`, tarjeta blanca `#FFFFFF`; `accessibilityRole="alert"` y `accessibilityViewIsModal`; firma compatible con pantallas existentes | `f58c315` · PR del cierre autónomo |
| T25 · `Skeleton` y `SkeletonLista` exportados | TERMINADO | `src/components/ui/Skeleton.tsx`, `src/components/ui/index.ts` | Ídem | Pulso animado sin datos fingidos, `accessibilityRole="progressbar"` y `accessibilityState.busy`; exports públicos desde `@/components/ui` | `f58c315` |
| T25 · Uso real en gestión de registros | TERMINADO | `src/app/gestion.tsx` | Ídem | `Alert.alert` destructivo sustituido por `ConfirmModal`; `ActivityIndicator` sustituido por `SkeletonLista` durante la consulta | `f58c315` |
| T25 · Pruebas automáticas de UI | TERMINADO | `__tests__/uiConfirmacionCarga.test.tsx` | `npm test` | 15 suites / 73 pruebas OK; cubre acciones, rol de alerta, rol de progreso y 6 bloques de lista | `f58c315` |

## Cierre autónomo 2026-11-25 · T28 y T29 (responsive, accesibilidad y rendimiento)

| Tarea | Estado | Archivos modificados | Pruebas ejecutadas | Resultado | Commit / PR |
| --- | --- | --- | --- | --- | --- |
| T28 · Decisiones responsivas por ancho | TERMINADO | `src/hooks/useResponsivo.ts`, `src/app/dashboard.tsx` | `npm test`, `npx tsc --noEmit`, `npm run lint` | Padding 16/24/40, cabecera 40/65 y saludo 23/27/30 según ancho; fallback 360 si la dimensión no es válida | `5c82bc4` · PR del cierre autónomo |
| T29 · Accesibilidad y rendimiento del dashboard | TERMINADO | `src/app/dashboard.tsx`, `__tests__/responsive.test.ts` | Ídem | Botones con `accessibilityRole` y etiqueta descriptiva; listas memoizadas por rol; 20 suites / 110 pruebas OK | `5c82bc4` |

## Cierre autónomo 2026-11-25 · T33, T41, T42 y T43

| Tarea | Estado | Archivos modificados | Pruebas ejecutadas | Resultado | Commit / PR |
| --- | --- | --- | --- | --- | --- |
| T33 · E2E y export real | TERMINADO | Sin cambios de código | `npx expo export --platform web --output-dir <temp>` | Export correcto: 21 rutas, 84 archivos, sin errores de fuentes ni imports | PR del cierre autónomo |
| T41 · Decisión tecnológica (Tailwind, SQLite, PostGIS) | TERMINADO | `docs/DECISIONES_TECNICAS_2026-11-25.md` | Revisión de dependencias, suites y contratos | No migrar a NativeWind; no adoptar SQLite sin build nativo; conservar PostGIS con fallback | PR del cierre autónomo |
| T42 · Arquitectura offline-first | IMPLEMENTADO | `docs/DECISIONES_TECNICAS_2026-11-25.md` | `__tests__/offline.test.ts`, `__tests__/conexion.test.ts`, `__tests__/colaOffline.test.ts` | Caché cifrada, cola ordenada, reintentos, 4xx descartadas y reconexión cubiertos; falta prueba con red física apagada | PR del cierre autónomo |
| T43 · CI/CD | PARCIAL | `.github/workflows/ci.yml` | CI de PR #39, #40 y #41 | NetInfo, tipos, lint, 110 pruebas y export web en verde; CD/EAS bloqueado por cuenta Expo | PRs #39-#41 mergeados |