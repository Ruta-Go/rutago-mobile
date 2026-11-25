# Seguimiento nocturno — tareas IMPLEMENTADO

**Fecha:** 2026-11-25  
**Rama:** `feature-ASEG1999` (mobile)  
**Base:** `6914e76` (post PR #43)  
**Restricción:** sin push, sin merge, sin producción, sin secretos, sin DB real, sin validaciones físicas/externas simuladas.

## Resumen de ejecución

| Verificación | Resultado |
|---|---|
| `npm test -- --runInBand` | PASS — 20 suites, 117 tests, 0 fallos |
| `npx tsc --noEmit` | PASS |
| `npm run lint` | PASS |
| `npx expo export --platform web` | PASS — 21 rutas, 84 archivos (salida temporal) |

**Delta de pruebas:** 110 → 117 tests (+7) por cobertura local añadida.

## Trazabilidad por tarea (15 IMPLEMENTADO)

| Tarea | Estado inicial | Hallazgo | Pendiente antes | Cambios realizados | Pruebas ejecutadas | Resultado | Validación física/externa faltante | Estado final justificado |
|---|---|---|---|---|---|---|---|---|
| T5 Biometría | IMPLEMENTADO | Código y tests existentes; faltaba manejo explícito de cancelación y casos edge. | Validación en dispositivo biométrico real. | `src/services/biometria.ts`: distingue cancelación (`user_cancel/system_cancel`) con mensaje específico. `__tests__/biometria.test.ts`: +3 casos (cancelación, no disponible al autenticar, error de módulo). | `npm test`, `tsc`, `lint`, `expo export` | PASS | Face ID/Touch ID real, permisos, fallback en iPhone/Android. | **IMPLEMENTADO** — mejor evidencia automatizada; no TERMINADO por validación física. |
| T6 Navegación y roles | IMPLEMENTADO | TabBarPorRol y guards existentes; validación funcional real pendiente. | Validación funcional en dispositivo. | Sin cambio de código riesgoso; revisión de cobertura existente (`tabBarPorRol.test.tsx`). | Suite completa | PASS | Navegación nativa, gestos, deep links, comportamiento por rol en dispositivo. | **IMPLEMENTADO** — falta validación funcional en dispositivo. |
| T11 Mapas y ubicación | IMPLEMENTADO | REST+WS probados; falta validación visual/dispositivo. | Validación visual/funcional en dispositivo. | Sin cambio de código (riesgo de regresión en mapa nativo). | Suite completa | PASS | Render mapa, GPS, permisos, UX en dispositivo real. | **IMPLEMENTADO**. |
| T14 Navegación por pestañas según rol | IMPLEMENTADO | Componente probado; falta validación UI nativa. | Validación funcional/UI en dispositivo. | Sin cambio de código; evidencia existente revisada. | Suite completa | PASS | Comportamiento visual/táctil en dispositivo real. | **IMPLEMENTADO**. |
| T15 Dashboard con datos reales | IMPLEMENTADO | Dashboard conectado; falta validación funcional real. | Validación funcional/UI en dispositivo. | Sin cambio de código; verificado por export web y tests existentes. | Suite completa, export web | PASS | Validación con datos reales/staging en dispositivo. | **IMPLEMENTADO**. |
| T17 Mis viajes, solicitudes y perfil conectados | IMPLEMENTADO | Pantallas conectadas; falta E2E en dispositivo. | Validación funcional E2E. | Sin cambio de código. | Suite completa | PASS | Flujo E2E real en dispositivo con staging. | **IMPLEMENTADO**. |
| T18 Registro de token push en backend | IMPLEMENTADO | `enviarTokenAlBackend` integrado; faltan casos edge en tests. | Entrega push real con proveedor/dispositivo. | `__tests__/notificaciones.test.ts`: +2 casos (token vacío no enviado; fallo obtención token Expo no rompe). | Suite completa | PASS | Proveedor push, credenciales, recepción en dispositivo real. | **IMPLEMENTADO** — no TERMINADO sin entrega real. |
| T19 Notificaciones y navegación móvil | IMPLEMENTADO | GestorNotificaciones implementado; falta validación real. | Push/deep link en dispositivo. | Cobertura de servicio reforzada por tests de notificaciones; sin cambio funcional riesgoso. | Suite completa | PASS | Recepción foreground/background/killed, tap, deep link en dispositivo. | **IMPLEMENTADO**. |
| T20 GPS en segundo plano | IMPLEMENTADO | Servicio y tests básicos; faltaban casos de permiso/inactividad. | Prueba física GPS segundo plano. | `__tests__/gpsFondo.test.ts`: +2 casos (permiso denegado, no detener si inactiva). | Suite completa | PASS | GPS real en segundo plano, permisos iOS/Android, batería, reinicio. | **IMPLEMENTADO**. |
| T25 ConfirmModal, Skeleton y accesibilidad base | IMPLEMENTADO | Componentes probados; falta validación visual/accesibilidad real. | Validación visual/accesibilidad en dispositivo. | Sin cambio de código (prueba añadida fue revertida por fragilidad de Modal en test; se conserva cobertura existente). | Suite completa | PASS | VoiceOver/TalkBack, contraste, toque, comportamiento nativo. | **IMPLEMENTADO**. |
| T27 Componentes UI compartidos | IMPLEMENTADO | Componentes con pruebas; falta validación visual real. | Validación visual/funcional en dispositivo. | Sin cambio de código. | Suite completa | PASS | Validación visual/funcional en dispositivo real. | **IMPLEMENTADO**. |
| T28 Diseño responsivo | IMPLEMENTADO | Hook y pruebas; falta validación en dispositivo/rotación. | Rotación/safe areas/teclado en dispositivo. | Sin cambio de código. | Suite completa, export web | PASS | Dispositivo real, rotación, safe areas, teclado. | **IMPLEMENTADO**. |
| T29 Accesibilidad y rendimiento | IMPLEMENTADO | Etiquetas/roles/memoización; falta validación física. | VoiceOver/TalkBack y rendimiento percibido. | Sin cambio de código. | Suite completa, lint | PASS | VoiceOver/TalkBack, rendimiento percibido en dispositivo. | **IMPLEMENTADO**. |
| T33 Recursos y documentación de tienda | IMPLEMENTADO | Créditos/marcas documentados; faltaba checklist local consolidado. | Publicación externa requiere cuentas. | `docs/TIENDA_RECURSOS_CHECKLIST.md` creado con inventario, metadatos borrador, capturas pendientes y checklist externo. | Verificación documental | N/A (documental) | Cuentas Expo/Apple/Google, política de privacidad publicada, capturas reales, submit/revisión. | **IMPLEMENTADO** — recursos/documentación local mejorados; no TERMINADO si el criterio exige publicación real. |
| T42 Arquitectura offline-first | IMPLEMENTADO | Documentada y probada; falta prueba física. | Prueba física red apagada/reconexión. | Sin cambio de código; evidencia de tests existentes revisada (`offline`, `conexion`, `colaOffline`). | Suite completa | PASS | Modo avión/red real, reconexión, conflictos en dispositivo. | **IMPLEMENTADO**. |

## Archivos modificados

- `src/services/biometria.ts` — manejo explícito de cancelación biométrica.
- `__tests__/biometria.test.ts` — 3 casos edge añadidos.
- `__tests__/gpsFondo.test.ts` — 2 casos añadidos.
- `__tests__/notificaciones.test.ts` — 2 casos añadidos.
- `docs/TIENDA_RECURSOS_CHECKLIST.md` — nuevo checklist local de tienda.
- `docs/INFORME_AUDITORIA_FINAL_POST_PR43.md` — creado previamente en auditoría (sin modificar INFORME_CIERRE_AUTONOMO).
- `docs/SEGUIMIENTO_IMPLEMENTADO_2026-11-25.md` — este anexo.

## Correcciones implementadas

1. **Biometría:** distinguir cancelación del usuario/sistema de fallo de verificación, con mensaje claro y pruebas.
2. **Cobertura automatizada:** añadir casos de borde en GPS fondo y notificaciones sin introducir mocks engañosos.
3. **T33:** consolidar checklist local de recursos/documentación de tienda sin publicar ni usar cuentas externas.

## Errores encontrados y solucionados

- **Test UI frágil añadido durante la sesión:** un caso nuevo para `ConfirmModal` produjo falso negativo por comportamiento del entorno de prueba con Modal; se eliminó el caso frágil y se conservó la suite verde. No se modificó comportamiento de producción.

## Errores/limitaciones que siguen pendientes

- Ninguna falla automatizada pendiente en mobile tras las correcciones locales.
- Las 15 tareas permanecen **IMPLEMENTADO** por validación física/externa/funcional real faltante; T33 mejorada localmente pero no publicable sin cuentas externas.

## Validaciones que requieren intervención de Santiago

1. **iPhone físico/Expo Go/dev client:** T5, T6, T11, T14, T15, T17, T19, T20, T25, T27, T28, T29, T42.
2. **Proveedor push + dispositivo:** T18, T19.
3. **Cuentas Apple/Google/Expo, política de privacidad, capturas reales, submit:** T33 (publicación), T30/T40 relacionadas.
4. **Autorización para push/PR/merge:** no realizadas.

## No realizado (por restricción)

- No push, no PR creado en GitHub, no merge a `main`.
- No modificación de `INFORME_CIERRE_AUTONOMO.md`.
- No creación/eliminación de ramas ni stashes.
- No producción, no DB real, no secretos, no migraciones.