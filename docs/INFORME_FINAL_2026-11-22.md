# Informe final RutaGo — 2026-11-22

Hora de corte: 20:00 (Colombia). Todo lo listado como **Terminado** quedó commiteado y publicado en GitHub. No se hicieron cambios en producción, Render, tiendas ni datos reales.

## Resumen ejecutivo

- Corregí la verificación de NetInfo: dependencia `12.0.1` confirmada, script `check:entorno` y paso en CI.
- Alinearon las dependencias móviles con Expo SDK 58 (`npx expo install --fix`, `--check` limpio).
- Centralicé la carga de fuentes de iconos antes del navegador para evitar registros duplicados en iOS (`CTFontManagerError 104`).
- Reinicié Metro con caché limpia: `HTTP 200`, bundle reconstruido.
- Cubrí registro y recuperación de contraseña con pruebas móviles.
- Reverifiqué staging backend: 44/44 unitarias y 23/23 E2E.
- Documenté Sprint 12, Sprint 13, matriz funcional, diagnóstico de Expo Go y bloqueos externos.
- CI móvil verde en todos los PR de esta ventana. CI backend verde; el workflow de deploy sigue fallando por secretos SSH ajenos a este trabajo.

## Sprint 10 — Staging aislado (backend)

| Tarea | Estado | Evidencia | Commit / PR |
| --- | --- | --- | --- |
| Base/role aislados, seed Conductor y Pasajero, guard antiproducción | Terminado | Seed rechaza producción con `exit 1`; idempotente | `6b568b0`, PR `#37` |
| Documentación de staging y QA | Terminado | `docs/STAGING.md`, `docs/QA_STAGING.md` | `e488f93`, PR `#37` |
| E2E de API (barrios, Universidad, horarios, viajes, panel conductor, notificaciones, GPS) | Terminado | 23/23 | PR `#37` |
| Batería unitaria backend | Terminado | 44/44 | PR `#37` |
| Deploy automático | No realizado / bloqueado | Falla SSH preexistente | run `45061064951` |

## Sprint 11 — Errores con contacto y colores (móvil)

| Tarea | Estado | Evidencia | Commit / PR |
| --- | --- | --- | --- |
| Mensajes de error con `Llamar a ANGEL ESTUPIÑAN` | Terminado | `src/utils/mensajes.ts`, `Toast.tsx`, pruebas | `40b8f18` |
| Colores globales | Terminado | Franja amarilla global y banner de roles | `549190f` |
| Registro de Sprints 10 y 11 | Terminado | `SPRINTS.md` | `74cec9e`, PR `#19` |
| Evidencia visual web | Terminado | `docs/EVIDENCIA_VISUAL_WEB.md` | `53297e9`, PR `#20` |
| Amarillo en selección de rol | Terminado | Pantalla de bienvenida | `50ed356`, PR `#21` |
| Staging local en desarrollo | Terminado | `src/services/api.ts` | `7ba5066`, PR `#22` |

## Sprint 12 — Errores de Expo Go (móvil)

| Tarea | Estado | Archivos / evidencia | Commit / PR |
| --- | --- | --- | --- |
| NetInfo | Terminado | `scripts/verificar-entorno.js`, CI, `docs/EXPO_GO_DIAGNOSTICO.md`; `NETINFO_OK declarado=12.0.1 instalado=12.0.1` | `ea05c17`, PR `#23` |
| Dependencias SDK 58 | Terminado | `package.json`, `package-lock.json`, `app.json`; `npx expo install --check` limpio | `938038c`, PR `#24` |
| Fuentes de iconos iOS | Terminado | `src/services/fuentes.ts`, `src/app/_layout.tsx`, `__tests__/fuentes.test.ts` | `1982069`, PR `#25` |
| Documentación del Sprint | Terminado | `SPRINTS.md` | `049629c`, PR `#26` |
| Reinicio de Metro limpio | Terminado | `docs/EXPO_GO_DIAGNOSTICO.md`; HTTP 200 y bundle reconstruido | `5dcb5be`, PR `#27` |
| Prueba en iPhone | Bloqueado | Sin dispositivo/cuenta Expo en este entorno | — |

## Sprint 13 — Cierre de verificaciones

| Tarea | Estado | Archivos / evidencia | Commit / PR |
| --- | --- | --- | --- |
| Reverificación staging backend | Terminado | `npm test` 44/44; `e2e-v2.js` 23/23; health 2 usuarios | `114e3a4` (push directo a `main`, documentado) |
| Registro y recuperación móvil | Terminado | `__tests__/authService.test.ts`; 14 suites / 70 pruebas | `52e0981`, PR `#28` |
| Matriz funcional móvil | Terminado | `docs/QA_FUNCIONAL_MOVIL.md` | `245e889`, PR `#29` |
| Cierre de Sprint 13 | Terminado | `SPRINTS.md` | `23eb95e`, PR `#30` |
| Lint determinista | Terminado | `package.json` con `expo lint --no-cache` | `ab71825`, PR `#31` |
| Bloqueos externos | Terminado | `docs/BLOQUEOS_EXTERNOS.md` | `c542f73`, PR `#32` |
| Sprint 13 completo | Terminado | `SPRINTS.md` | `fe51485`, PR `#33` |
| CI backend deploy | Bloqueado | Secretos SSH ausentes; fallo preexistente | run `45083225850` |

## Pruebas ejecutadas hoy

| Comando | Resultado |
| --- | --- |
| `npm run check:entorno` | `NETINFO_OK declarado=12.0.1 instalado=12.0.1` |
| `npm test` (móvil) | 14 suites / 70 pruebas OK |
| `npx tsc --noEmit` | Sin errores |
| `npm run lint` | Limpio, sin caché |
| `npx expo export --platform web` | 22 bundles, 20 rutas |
| `npx expo start --clear --port 19006` | HTTP 200, caché vacía, proceso detenido |
| `npm test` (backend) | 44/44 |
| `node <temp>/rutago-staging/e2e-v2.js` | 23/23 |

## CI

- Móvil: PRs `#23` a `#33`, todos con chequeos verdes. Últimos runs: `45085205275`, `45085190374`.
- Backend: `CI Backend RutaGo` verde en el run `45083225867`.
- Backend deploy: `Deploy Backend RutaGo` fallido en `45083225850` por falta de secretos SSH. No se inventaron credenciales ni se cambió infraestructura.
- PRs abiertos al corte: 0 en ambos repositorios.

## Pendiente que requiere tu intervención

1. Probar en iPhone/Expo Go: apertura, NetInfo, iconos, colores y recorrido completo.
2. Configurar secretos SSH para deploy automático.
3. Configurar proveedor push y registro de tokens.
4. Definir `EMAIL_API_KEY`, `EMAIL_FROM` y `PASSWORD_RESET_URL`.
5. Rotar/endurecer `JWT_SECRET` sin romper sesiones reales.
6. Renovar el dominio vencido.
7. Decidir PostGIS o conservar el fallback JS.
8. Configurar Trello o dar acceso verificado.
9. Hacer la prueba offline con red física apagada en dispositivo.

## Estado de git al corte

- `rutago-mobile`: workspace limpio, `main` y rama de trabajo sincronizados en `0778a77`.
- `rutago-backend`: workspace limpio, `main` en `114e3a4`.
- `rutago-frontend`: workspace limpio, `main` en `dd62b4c`.
- No quedan commits locales sin publicar ni PRs abiertos.
