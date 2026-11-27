# RutaGo · Informe de cierre autónomo (25 de noviembre de 2026)

Este informe es el cierre único de la jornada. Se trabajó sobre los cinco Sprints originales y las 43 tareas, sin crear Sprints nuevos, sin crear ramas adicionales, sin force push y sin tocar producción, Render ni la base de datos real.

## 1. Rama, publicación e integración

- Única rama de trabajo: `feature-ASEG1999` en `rutago-mobile`.
- Flujo usado: `feature-ASEG1999` → `main` mediante PRs verificados.
- PRs móviles mergeados en esta continuación: **#39, #40, #41 y #42**.
- PR #38 (`feat/push-token-movil`) cerrado con nota de consolidación tras integrar `4923c25`.
- No quedan PRs abiertos en `rutago-mobile` ni en `rutago-backend`.
- Stashes protegidos intactos: `stash@{0}: On feature-ASEG1999: !!GitHub_Desktop<feature-ASEG1999>` y `stash@{1}: On dev: !!GitHub_Desktop<dev>`.
- `main` móvil quedó en `c0a3097`; `feature-ASEG1999` quedó alineada con `origin/main`.

## 2. Commits publicados

| Commit | Contenido | PR |
| --- | --- | --- |
| `f58c315` | ConfirmModal con paleta oficial, Modal accesible, Skeleton/SkeletonLista y uso real en gestión | #39 |
| `3e5dfc6` | Registro documental de T25 | #39 |
| `9ce0ad1` | Integración de `main` (PR #36 y #37) | #39 |
| `6abef4f` | Integración de `feat/push-token-movil` | #39 |
| `667756c` | Recuperación de `origin/dev`: notificaciones en vivo, detalle de viaje, destinatarios, contador y deduplicación | #40 |
| `5c82bc4` | Hook responsivo, dashboard adaptable/memoizado y botones accesibles | #41 |
| `0039c48` | Registro documental de T28/T29 y consolidación | #41 |
| `493927e` | Decisiones técnicas T41/T42 y evidencia T33/T43 | #42 |

## 3. Pruebas ejecutadas y resultados reales

| Repositorio | Comando | Resultado |
| --- | --- | --- |
| `rutago-mobile` | `npm test` | **20 suites / 110 pruebas OK** |
| `rutago-mobile` | `npx tsc --noEmit` | Sin errores |
| `rutago-mobile` | `npm run lint` | 0 errores, 0 warnings |
| `rutago-mobile` | `npm run check:entorno` | NetInfo 12.0.1 verificado en CI |
| `rutago-mobile` | `npx expo export --platform web --output-dir <temp>` | 21 rutas, 84 archivos, sin errores de fuentes ni imports |
| `rutago-backend` | `npm test` | **53/53 pruebas OK** |
| `rutago-frontend` | `npm run lint` | 0 errores |
| `rutago-frontend` | `npm run build` | Correcto |
| GitHub Actions | `Typecheck y lint` en PRs #39, #40, #41 y #42 | `success` en todos |

## 4. Estado de las 43 tareas

Estados permitidos: TERMINADO, IMPLEMENTADO, PARCIAL, PENDIENTE y BLOQUEADO.

| Tarea | Tema | Estado | Evidencia / límite |
| --- | --- | --- | --- |
| T1 | Infraestructura y entorno de desarrollo | TERMINADO | `jest.config.js`, CI verde, 110 pruebas |
| T2 | Autenticación | TERMINADO | Backend y móvil verificados en suites de auth |
| T3 | Propiedad y permisos | TERMINADO | Middleware `ownership`, 6 pruebas, commit `e9dd736` |
| T4 | Persistencia de sesión | TERMINADO | `authStore.test.ts`, sesión reactiva |
| T5 | Biometría | TERMINADO | `biometria.test.ts`, `loginBiometria.test.tsx` |
| T6 | Navegación y roles | TERMINADO | Roles reales, `TabBarPorRol`, PR #37 |
| T7 | Pruebas pendientes de Sprint 1 | TERMINADO | Suites de auth/sesión/biometría en verde |
| T8 | Inscripción de pasajeros | TERMINADO | Contrato backend y pruebas de registro |
| T9 | Capacidad de viajes | TERMINADO | `viaje.capacidad.test.js`, PR backend #39 |
| T10 | Validaciones de backend | TERMINADO | Reglas de contraseña, rol y errores cubiertas |
| T11 | Mapas y ubicación | IMPLEMENTADO | REST + WebSocket probados; falta validación visual en dispositivo |
| T12 | Pruebas de integración móvil | TERMINADO | 20 suites / 110 pruebas |
| T13 | Inscripción y capacidad en backend | TERMINADO | 53/53 pruebas backend |
| T14 | Navegación por pestañas según rol | TERMINADO | `TabBarPorRol`, PR #37 |
| T15 | Dashboard con datos reales | TERMINADO | `dashboard.tsx`, contador real de no leídas |
| T16 | Notificaciones internas del backend | TERMINADO | Eventos de viaje y WebSocket, pruebas backend |
| T17 | Mis viajes, solicitudes y perfil conectados | TERMINADO | Pantallas conectadas a API real |
| T18 | Registro de token push en backend | IMPLEMENTADO | `4923c25`; código y endpoint verificados, entrega real bloqueada |
| T19 | Notificaciones y navegación móvil | TERMINADO | `GestorNotificaciones`, `detalle-viaje`, deduplicación, PR #40 |
| T20 | GPS en segundo plano | IMPLEMENTADO | `gpsFondo.test.ts`, permisos y envío; requiere prueba física |
| T21 | SQLite y arquitectura offline | PARCIAL | Arquitectura actual documentada; SQLite no adoptada sin EAS/dispositivo |
| T22 | Cola de sincronización | TERMINADO | `colaOffline.test.ts`: orden, deduplicación, reintentos, 4xx y reconexión |
| T23 | Reintentos y conflictos | TERMINADO | Casos de red caída, 409 y agotamiento de intentos |
| T24 | Pruebas de desconexión y reconexión | BLOQUEADO | Sólo mocks; sin dispositivo para apagar red física |
| T25 | ConfirmModal, Skeleton y accesibilidad base | TERMINADO | Colores oficiales, `alert`, `progressbar`, PR #39 |
| T26 | Skeleton y SkeletonLista exportados | TERMINADO | `index.ts`, nueva suite de UI |
| T27 | Componentes UI compartidos | TERMINADO | Button/Card/Input/Modal/Toast/Skeleton con pruebas |
| T28 | Diseño responsivo | TERMINADO | `useResponsivo`, dashboard adaptable, 4 pruebas nuevas |
| T29 | Accesibilidad y rendimiento | TERMINADO | `accessibilityRole`, etiquetas, memoización, lint limpio |
| T30 | Build y envío a tiendas | BLOQUEADO | Requiere cuenta Expo/Apple/Google y firma |
| T31 | E2E y pruebas automatizadas | TERMINADO | 20 suites / 110 pruebas, export web real |
| T32 | CI móvil | TERMINADO | NetInfo, tipos, lint, pruebas y export en `.github/workflows/ci.yml` |
| T33 | Recursos y documentación de tienda | IMPLEMENTADO | Créditos y marcas documentados; publicación bloqueada |
| T34 | PostGIS y fallback | TERMINADO | `geo.service.js` usa PostGIS o haversine y reporta motor |
| T35 | `ST_Within` | PENDIENTE | Requiere decisión de infraestructura de BD; no se tocó base real |
| T36 | Polígonos geoespaciales | PENDIENTE | Sin migración ni geometrías aprobadas |
| T37 | `ST_Distance` y `ST_DWithin` | TERMINADO | Implementados en `geo.service.js`, con fallback |
| T38 | Fallback geográfico seguro | TERMINADO | `test/geo.service.test.js`, motor `javascript` verificado |
| T39 | Regresión geoespacial con PostGIS real | BLOQUEADO | Sin extensión habilitada en base autorizada |
| T40 | Recursos gráficos de tienda | BLOQUEADO | Foto y créditos listos; envío requiere cuenta |
| T41 | Decisión tecnológica | TERMINADO | `docs/DECISIONES_TECNICAS_2026-11-25.md` |
| T42 | Arquitectura offline-first | IMPLEMENTADO | Documentada y cubierta por pruebas; falta prueba física |
| T43 | CI/CD | PARCIAL | CI verde; CD/EAS bloqueado por credenciales externas |

Resumen: **TERMINADO 29 · IMPLEMENTADO 6 · PARCIAL 2 · PENDIENTE 2 · BLOQUEADO 4**.

## 5. Errores encontrados y corregidos

- Jest 30 no resolvía el preset `jest-expo`: se fijó explícitamente en `jest.config.js`.
- BOM UTF-8 en `ConfirmModal.tsx`: se reescribió sin BOM.
- `Skeleton` no exponía `progressbar`/`testID` en el árbol de prueba: se movieron las props al `View` contenedor.
- Orden de pruebas con `Modal` provocaba `act()` solapado: se reordenó la suite para ejecutar primero los skeletons.
- Conflicto de merge entre el token push y las notificaciones de `origin/dev`: se conservaron ambas APIs y se añadió `escucharTapPush` como alias compatible.
- Typo en el mensaje de eliminación de gestión: corregido.

## 6. Bloqueos externos

1. iPhone/emulador y Expo Go: sin dispositivo ni cuenta accesible.
2. EAS build/submit y tiendas: requieren Expo, Apple Developer/Google Play y firma.
3. Push real: proveedor remoto y prueba en dispositivo pendientes; el registro de token sí está integrado.
4. Recuperación por correo: faltan `EMAIL_API_KEY`, `EMAIL_FROM` y `PASSWORD_RESET_URL`.
5. Deploy automático backend: el workflow `Deploy Backend RutaGo` falla en `Verificar conexión SSH` por secretos SSH ausentes.
6. `JWT_SECRET` real reportado como demasiado corto; no se modificó.
7. Dominio `https://rutago.seminario1.eleueleo.com/` vencido.
8. Trello: sin variables `TRELLO*` ni acceso verificado.
9. PostGIS/`ST_Within`/polígonos: requieren habilitación y decisión de infraestructura en base de datos autorizada; no se tocó producción.

## 7. Actividades concretas para Santiago con ChatGPT

1. Revisar este informe y los PRs #39-#42 ya mergeados en `main`.
2. Conectar un iPhone al mismo Wi-Fi que el servidor local (`192.168.0.11:8083`), instalar Expo Go y abrir `npx expo start --clear --port 19006`.
3. Probar login con `demo.conductor@rutago.staging` y `demo.pasajero@rutago.staging`; validar pestañas por rol, dashboard, notificaciones y detalle de viaje.
4. Probar `ConfirmModal`, `Skeleton`, VoiceOver/TalkBack y rotación de pantalla.
5. Enviar una notificación real desde el backend staging y comprobar navegación al viaje y contador de no leídas.
6. Activar modo avión, crear un cambio y reconectar: verificar reenvío automático y que no se duplique.
7. Activar GPS en segundo plano y verificar coordenadas reales en el mapa.
8. Aportar cuenta Expo/Apple para `eas login`, `eas build -p ios --profile preview` y `eas submit`; configurar credenciales push del proveedor.
9. Aportar secrets SSH, `EMAIL_*`, `JWT_SECRET` seguro y dominio vigente para cerrar los bloqueos de deploy/correo/URL.
10. Decidir si se habilita PostGIS en una base de datos de prueba para implementar `ST_Within` y polígonos; ChatGPT puede hacerlo después sin tocar producción.

## 8. Lo que debe continuar haciendo ChatGPT

Mantener `feature-ASEG1999` como única rama de trabajo, no crear ramas nuevas, no hacer force push, no tocar producción y retomar desde este informe. Las siguientes acciones seguras son: implementar `ST_Within`/polígonos en backend cuando haya base autorizada, completar CD cuando existan credenciales, y ejecutar las pruebas físicas indicadas por Santiago con evidencia real. No se debe marcar TERMINADO ningún trabajo que requiera dispositivo o cuenta externa sin evidencia.

Santiago, he terminado todo lo que podía desarrollar y verificar sin un dispositivo físico ni intervención externa. Esto es lo que quedó terminado, esto es lo que no pude completar y estas son las actividades concretas que ahora debes realizar con ChatGPT.