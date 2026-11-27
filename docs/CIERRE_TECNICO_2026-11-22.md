# RutaGo · Cierre técnico autónomo del 22 de noviembre de 2026

Este documento registra, tarea por tarea, la jornada de cierre técnico ejecutada sin dispositivo físico, cuentas externas, credenciales nuevas ni intervención de Santiago. Conserva el plan original de **5 Sprints y 43 tareas**. No se crean Sprints nuevos.

## Reglas cumplidas

- No se modificó producción, Render ni la base de datos real.
- No se eliminaron ramas, commits, stashes ni cambios preexistentes.
- Se conservaron los stashes `stash@{0}` y `stash@{1}` del repositorio móvil.
- No se expusieron secretos ni se inventaron credenciales, recorridos o coordenadas.
- Cada bloque se publica en rama, con PR hacia `main` y verificación de CI.

## Auditoría inicial

| Repositorio | Estado inicial | Línea base encontrada |
| --- | --- | --- |
| `rutago-mobile` | Limpio en `feature-ASEG1999`, igual que `main` (`31c6d7d`) | `npm test` fallaba: Jest no resolvía el preset `jest-expo`; ESLint fallaba por un binario nativo `unrs-resolver` corrupto en `node_modules` |
| `rutago-backend` | Limpio en `main` (`16d2211`) | `npm test` 44/44 |
| `rutago-frontend` | Limpio en `main` (`dd62b4c`) | `npm run lint` 0 errores / 14 warnings; `npm run build` correcto, 2002 módulos |

El binario nativo corrupto se restauró desde el tarball oficial del registro npm, sin tocar archivos versionados. El preset de Jest se fijó de forma explícita en `jest.config.js` para evitar que Jest 30 intentara cargar el `main` ESM del paquete.

## Cambios ejecutados por tarea

### Sprint 1

#### Tarea 1 — Infraestructura inicial y configuración del entorno de desarrollo

- **Estado anterior:** TERMINADO.
- **Trabajo de esta jornada:** se documentó la restauración del entorno local de pruebas; el cambio versionado es la resolución explícita del preset de Jest.
- **Archivos:** `jest.config.js`, este documento.
- **Pruebas:** `npm test` → 14 suites / 70 pruebas OK; `npx tsc --noEmit` limpio; `npm run lint` limpio.
- **Commit / PR:** `ce0f4ad` · PR `#36`.
- **CI:** `Typecheck y lint` = success.
- **Falta:** nada local. EAS sigue dependiendo de cuenta externa (Tarea 30).

### Sprint 2

#### Tarea 14 — Navegación por pestañas según el rol del usuario

- **Estado anterior:** PARCIAL.
- **Trabajo de esta jornada:** se añadió una barra inferior `TabBarPorRol` con destinos distintos para Pasajero, Conductor y Administrador. Se montó desde el layout raíz sin mover rutas, sin cambiar deep links y sin tocar los `Stack.Protected`.
- **Archivos:** `src/components/navegacion/TabBarPorRol.tsx`, `src/app/_layout.tsx`, `__tests__/tabBarPorRol.test.tsx`, este documento.
- **Pruebas:** 15 suites / 75 pruebas OK (5 nuevas); `npx tsc --noEmit` limpio; `npm run lint` limpio; `npx expo export --platform web` correcto, 22 bundles y 20 rutas.
- **Commit / PR:** `42ba1d8` · PR `#37`.
- **CI:** `Typecheck y lint` = success.
- **Falta:** validación visual en dispositivo; la navegación en sí queda cubierta por pruebas automatizadas.

### Sprint 3

#### Tarea 18 — Integración de notificaciones push de Expo y registro de tokens

- **Estado anterior:** PARCIAL.
- **Trabajo de esta jornada:** el servicio móvil ahora envía el token real de Expo a `POST /api/notificaciones/push-token` con la plataforma detectada. El backend ya expone ese endpoint con migración aditiva, modelo, repositorio, servicio y pruebas (PR backend `#40`). El token no se devuelve ni se imprime en logs.
- **Archivos:** `src/services/notificaciones.ts`, `__tests__/notificaciones.test.ts`, este documento. Backend: `docs/PUSH_TOKEN_REGISTRO.md` y archivos indicados en ese PR.
- **Pruebas:** 15 suites / 78 pruebas OK (3 nuevas móviles); backend 50/50 en la rama push y 53/53 tras integrar capacidad; `npx tsc --noEmit` limpio; `npm run lint` limpio.
- **Commit / PR:** se registrará al publicar este bloque.
- **Falta:** proveedor push remoto y prueba con notificación real en dispositivo. No se simuló entrega push.

### Tareas transversales

#### Tarea 43 — CI/CD móvil

- **Estado anterior:** PARCIAL.
- **Trabajo de esta jornada:** se corrigió la configuración de Jest para que la CI vuelva a ejecutar las 70 pruebas de forma determinista. La parte de CD (EAS build/submit) sigue bloqueada por cuenta Expo.
- **Archivos:** `jest.config.js`, este documento.
- **Pruebas:** verificación local previa al PR; CI del PR pendiente de registrar.
- **Commit / PR:** `ce0f4ad` · PR `#36`.
- **CI:** `Typecheck y lint` = success.
- **Falta:** cuenta Expo y credenciales de firma para `eas build`/`eas submit`.

## Estado consolidado al inicio de la jornada

| Estado | Cantidad |
| --- | ---: |
| TERMINADO | 19 |
| IMPLEMENTADO | 9 |
| PARCIAL | 10 |
| PENDIENTE | 4 |
| BLOQUEADO | 1 |

Este registro se actualiza después de cada bloque integrado.

## Actualización autónoma del 24 y 25 de noviembre de 2026

### Sprint 4 / Tarea 25 — ConfirmModal, Skeleton y accesibilidad

- **Estado anterior:** PARCIAL.
- **Trabajo ejecutado:** `ConfirmModal` reutiliza `Modal` con verde `#087A35`, amarillo `#FFD900` y blanco `#FFFFFF`; `Modal` anuncia `alert` y `accessibilityViewIsModal`; `Skeleton`/`SkeletonLista` anuncian `progressbar` con `busy`; `gestion.tsx` usa ambos componentes reales.
- **Pruebas:** 15 suites / 73 pruebas OK en el bloque; `tsc` y `lint` limpios.
- **Commit / PR:** `f58c315`, `3e5dfc6` · PR móvil `#39` mergeado (`07931e3`).

### Sprint 3 / Tarea 18 — Token push consolidado

- **Estado anterior:** PARCIAL.
- **Trabajo ejecutado:** el commit `4923c25` quedó integrado en `feature-ASEG1999`; el PR `#38` se cerró con nota de consolidación.
- **Commit / PR:** `6abef4f` · PR `#39` mergeado.

### Sprint 3 — Notificaciones en vivo y navegación desde `origin/dev`

- **Estado anterior:** IMPLEMENTADO en rama ajena.
- **Trabajo ejecutado:** siete commits de `origin/dev` recuperados sin crear ramas: avisos en vivo, detalle de viaje, destinatarios por correo, contador de no leídas y deduplicación del toque inicial. Se conservó `enviarTokenAlBackend` y se añadió el alias `escucharTapPush`.
- **Pruebas:** 19 suites / 106 pruebas OK; `tsc` y `lint` limpios.
- **Commit / PR:** `667756c` · PR `#40` mergeado (`016b49e`).

### Sprint 4 / Tareas 28 y 29 — Responsive, accesibilidad y rendimiento

- **Estado anterior:** PARCIAL.
- **Trabajo ejecutado:** hook `useResponsivo` con decisiones puras y fallback seguro; dashboard adapta espaciado y tipografía, memoiza opciones por rol y etiqueta sus botones.
- **Pruebas:** 20 suites / 110 pruebas OK; `tsc` y `lint` limpios.
- **Commit / PR:** `5c82bc4` · PR del cierre autónomo.

## Entrega final

El cierre único, el estado de las 43 tareas, los PRs mergeados, las pruebas reales, los bloqueos y las actividades pendientes de Santiago están en `docs/INFORME_CIERRE_AUTONOMO.md`.