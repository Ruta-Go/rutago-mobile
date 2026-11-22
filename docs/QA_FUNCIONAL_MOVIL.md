# Verificación funcional móvil — 2026-11-22

Ejecutada en esta ventana de trabajo sobre `main` de `rutago-mobile`, después de los PR `#23` a `#28`.

**Resultado global de la batería móvil:** 14 suites / 70 pruebas OK, `tsc` sin errores, `expo lint --no-cache` limpio, export web con 22 bundles / 20 rutas y Metro con caché limpia respondiendo `HTTP 200`.

| Requisito | Estado | Evidencia ejecutada hoy | Limitación |
| --- | --- | --- | --- |
| Bienvenida | Probado | `__tests__/bienvenida.test.tsx`; export web y DOM verificado en `docs/EVIDENCIA_VISUAL_WEB.md` | Vista final en iPhone pendiente |
| Fotografía y créditos | Probado | `__tests__/bienvenida.test.tsx` verifica el crédito exacto `Foto: Albert Torres Bonilla / Wikimedia Commons · CC BY-SA 4.0` y la imagen real | Ninguna sobre el crédito |
| Colores `#087A35`, `#FFD900`, `#FFFFFF` en toda la app | Probado por código y web; parcial en dispositivo | Prueba del banner amarillo, franja global en `src/app/_layout.tsx`, evidencia DOM en `docs/EVIDENCIA_VISUAL_WEB.md` | Falta recorrido visual físico por todas las pantallas |
| Selección de roles Conductor y Pasajero | Probado | `__tests__/bienvenida.test.tsx` verifica navegación con la pista de rol | La selección sigue siendo sólo pista; el backend manda |
| Inicio de sesión de conductor y pasajero | Probado en servicio y API | `__tests__/authService.test.ts`; backend `e2e-v2.js` 23/23 con ambos roles demo contra staging | Login desde Expo Go en iPhone pendiente |
| Validación real de roles | Probado | `__tests__/authService.test.ts`: rol 4 rechazado y sesión no guardada si el rol real difiere del seleccionado | Ninguna |
| Búsqueda de barrios y Universidad del Pacífico | Probado en API | Backend `e2e-v2.js` 23/23: 106 barrios, 8 esperados presentes y Universidad como origen/destino | Búsqueda desde la UI del iPhone pendiente |
| Horarios y rutas | Probado en API | Backend `e2e-v2.js` 23/23: rutas, paradas y horarios reales | Ninguna sobre los datos |
| Consulta de viajes | Probado en API | Backend `e2e-v2.js` 23/23: viajes disponibles y mis viajes | Ninguna sobre los datos |
| Inscripción de pasajeros | Probado en servicio | `__tests__/authService.test.ts`: payload saneado, mensaje del backend y errores propagados | Registro desde la UI del iPhone pendiente |
| Panel del conductor | Probado en API y rutas protegidas | Backend `e2e-v2.js` 23/23; `src/app/_layout.tsx` protege las rutas por rol | Interacción visual en dispositivo pendiente |
| Notificaciones | Probado en servicio y API | `__tests__/notificaciones.test.ts`; backend `e2e-v2.js` | Proveedor push remoto y registro de tokens en dispositivo pendientes |
| GPS y ubicación | Probado en servicio y API | `__tests__/gpsFondo.test.ts`; backend `e2e-v2.js` | Permisos reales y tracking en segundo plano en iPhone pendientes |
| Conectividad | Probado | `__tests__/conexion.test.ts`: estados `null`, conexión y caída | Sin desconexión física de red |
| Funcionamiento offline | Probado | `__tests__/offline.test.ts` y `__tests__/colaOffline.test.ts` | Sin prueba con pérdida real de Wi-Fi/Datos |
| Sincronización al recuperar internet | Probado | `__tests__/colaOffline.test.ts`: reenvío ordenado al recuperar red | Sin dispositivo físico |
| Manejo de errores con `Llamar a ANGEL ESTUPIÑAN` | Probado | `__tests__/mensajes.test.ts` y `__tests__/loginBiometria.test.tsx`; `Toast` aplica el contacto a todo toast `error` | Ninguna |

## Qué NO se marcó como probado

- Apertura real en Expo Go desde el iPhone: sin dispositivo/cuenta Expo accesible desde este entorno.
- Colores y foto inspeccionados ojo a ojo en cada pantalla del teléfono: se sustituyó por DOM/estilos computados y pruebas.
- Offline con red apagada de verdad: se probó con mocks de NetInfo y cola.
- Notificaciones push reales: falta proveedor remoto y registro de tokens.
- Producción, Render, tiendas y datos reales: no se tocaron.
