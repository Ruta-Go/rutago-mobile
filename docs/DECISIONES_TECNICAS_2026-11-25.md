# Decisiones técnicas del cierre autónomo (25 de noviembre de 2026)

Este documento deja constancia de las decisiones T41 y T42 sin inventar resultados, sin instalar dependencias de alto impacto y sin tocar producción.

## T41 · Decisión tecnológica: NativeWind / Tailwind

**Decisión:** no migrar en esta jornada.

**Evidencia considerada**

- La app ya centraliza la identidad visual en `src/constants/tema.ts` (`#087A35`, `#FFD900`, `#FFFFFF`) y los componentes comparten `Button`, `Card`, `Input`, `Modal`, `ConfirmModal`, `Skeleton`, `Toast` y `TabBarPorRol`.
- La migración a NativeWind exigiría instalar y configurar un transformador, convertir estilos de 20 pantallas y revalidar cada pantalla en dispositivo, sin una ganancia medible en esta ventana.
- La suite actual (`npm test` 20 suites / 110 pruebas) y `npx expo export --platform web` (21 rutas) ya pasan con el sistema actual.

**Criterio para reconsiderar:** que exista un diseño formal firmado por el equipo, dispositivos de prueba y una comparación medida de rendimiento/productividad. No se añadió la dependencia para evitar deuda sin evidencia.

## T41 · Decisión tecnológica: SQLite

**Decisión:** no adoptar SQLite en esta jornada.

**Evidencia considerada**

- El offline ya resuelve caché cifrada con `SecureStore`, detección de red (`NetInfo 12.0.1`), cola persistente y sincronización automática.
- `__tests__/colaOffline.test.ts` cubre reenvío ordenado, deduplicación, 4xx descartadas, reintentos, agotamiento y reconexión.
- SQLite exigiría módulo nativo, migraciones y `eas build`; EAS y dispositivo físico están bloqueados por cuenta externa (`docs/BLOQUEOS_EXTERNOS.md`).

**Criterio para reconsiderar:** cuando existan datos estructurados de gran volumen, consultas locales complejas y un build nativo ejecutable con prueba en dispositivo. Hoy no hay evidencia que justifique reemplazar la cola cifrada actual.

## T41 · Decisión tecnológica: PostGIS

**Decisión:** conservar el motor dual ya implementado.

`src/services/geo.service.js` del backend usa PostGIS (`ST_DWithin` + `ST_Distance`) cuando la extensión existe y calcula haversine en JavaScript si no. La activación de `ST_Within` y geometrías de polígono requiere decidir infraestructura de base de datos; no se ejecutó contra la base real ni se modificó Render.

## T42 · Arquitectura offline-first

**Arquitectura vigente y verificada**

1. Lectura con caché cifrada en `SecureStore` y fallback sin red (`src/services/offline.ts`).
2. Escrituras envueltas en `mutarConCola`: si hay red, se envían; si no, se encolan con cuerpo y metadatos (`src/services/colaOffline.ts`).
3. Deduplicación por método + URL conservando el último valor; las mutaciones no conmutativas se conservan.
4. Reintentos con límite, descarte de respuestas 4xx definitivas y reenvío automático al recuperar conexión (`suscribirConexion`).
5. Vaciamiento explícito al cerrar sesión para no filtrar datos entre cuentas.

**Pruebas:** 20 suites / 110 pruebas OK, incluidas `__tests__/offline.test.ts`, `__tests__/conexion.test.ts` y `__tests__/colaOffline.test.ts`.

**Límite real:** no se desconectó la red física de un dispositivo; la desconexión se simuló con mocks de `NetInfo` y axios. No se afirma comportamiento en iPhone sin prueba física.