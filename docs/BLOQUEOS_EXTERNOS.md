# Bloqueos externos pendientes — 2026-11-22

| Bloqueo | Qué falta | Por qué hace falta | Tarea dependiente | Estado |
| --- | --- | --- | --- | --- |
| Deploy automático de backend | Secretos SSH del workflow `Deploy Backend RutaGo` | El paso `Verificar conexión SSH` falla antes de desplegar; no inventé claves ni cambié infraestructura de producción | Publicación automática en Render | Bloqueado; CI de pruebas sí está verde |
| Expo Go en iPhone | Dispositivo/cuenta Expo accesible desde este entorno | No puedo confirmar visualmente NetInfo, fuentes ni colores en iOS | Verificación física de los errores A y B | Bloqueado; sustituido por export web, DOM y Metro limpio |
| Notificaciones push reales | Proveedor push y registro de tokens del dispositivo | El servicio local está probado, pero sin proveedor no hay entrega real | Notificaciones en producción | Bloqueado |
| Recuperación de contraseña por correo | `EMAIL_API_KEY`, `EMAIL_FROM` y `PASSWORD_RESET_URL` | El backend responde 503 sin proveedor configurado | Envío real del enlace | Bloqueado; endpoints y UI cubiertos con pruebas |
| Firma JWT | `JWT_SECRET` seguro y suficientemente largo | El valor real reportado es demasiado corto; no lo modifiqué para no afectar sesiones existentes | Endurecimiento de seguridad | Pendiente de decisión |
| Dominio público | Renovación del dominio `https://rutago.seminario1.eleueleo.com/` | Está vencido; no renové ni contraté nada | Acceso estable por URL propia | Bloqueado |
| PostGIS | Decisión de installed/enable en staging | La lógica geométrica actual tiene fallback JS probado, pero PostGIS sigue pendiente | Consultas geoespaciales nativas | Pendiente de decisión |
| Trello | Variables `TRELLO*` o acceso verificado | No hay credenciales configuradas; no actualicé tableros | Sincronización de tareas con Trello | Bloqueado |
| Offline con red real | Prueba con Wi-Fi/Datos apagados en dispositivo | Sólo se probó con mocks de NetInfo y cola | Confirmación de sincronización real | Parcialmente realizado |
| Publicación en tiendas | Cuentas de Play Store/App Store y autorización expresa | Quedó fuera del alcance concedido | Distribución pública | No realizado |

Ninguno de estos puntos se inventó, se saltó o se simuló con credenciales falsas. Mientras estuvieron bloqueados, continuaron las tareas independientes locales y de staging aislado.
