# Checklist de recursos y documentación de tienda (T33)

**Fecha:** 2026-11-25  
**Rama:** `feature-ASEG1999`  
**Alcance:** preparación local de recursos/documentación. **No se publica en tiendas ni se usan cuentas externas.**

## Estado

- **Criterio local cubierto:** recursos y documentación preparados en repositorio.
- **Bloqueo externo restante:** publicación/envío a App Store y Google Play (cuentas, firma, EAS submit, revisión de tiendas).

## Inventario de recursos existentes

| Recurso | Ruta / evidencia | Estado |
|---|---|---|
| Ícono de app | `assets/images/icon.png` | Presente |
| Ícono adaptativo Android | `assets/images/adaptive-icon.png` | Presente |
| Splash / logo | `assets/images/` (verificar set completo) | Presente en repo |
| Créditos de foto | `docs/CREDITOS_FOTOS.md` | Presente |
| Evidencia visual web | `docs/EVIDENCIA_VISUAL_WEB.md` | Presente |
| Bloqueos externos | `docs/BLOQUEOS_EXTERNOS.md` | Presente |
| Decisiones técnicas | `docs/DECISIONES_TECNICAS_2026-11-25.md` | Presente |
| Configuración Expo/app | `app.json` | Presente |

## Metadatos sugeridos (borrador local, no publicado)

| Campo | Borrador |
|---|---|
| Nombre | RutaGo |
| Nombre corto | RutaGo |
| Categoría sugerida | Transporte / Movilidad |
| Descripción corta | Gestión y seguimiento de rutas de transporte institucional/comunitario. |
| Descripción larga | RutaGo permite a conductores, pasajeros y administradores gestionar viajes, consultar rutas, recibir notificaciones y reportar ubicación con controles de rol y seguridad. |
| Palabras clave | rutas, transporte, viajes, conductor, pasajero, notificaciones |
| Política de privacidad | **Pendiente de publicación externa** (URL requerida por tiendas). |
| Soporte/contacto | Definir correo/canal oficial antes de publicación. |

## Capturas requeridas (pendientes de dispositivo real)

- iPhone: pantallas de login, dashboard por rol, viajes, detalle, notificaciones, perfil. **No capturadas en esta ejecución** (requiere dispositivo/emulador autorizado).
- Android: equivalentes. **Pendiente**.

## Checklist previo a publicación (externo)

- [ ] Cuenta Expo/EAS configurada.
- [ ] Cuenta Apple Developer activa.
- [ ] Cuenta Google Play Console activa.
- [ ] Firma/certificados/provisioning configurados.
- [ ] Política de privacidad publicada en URL pública.
- [ ] Capturas finales en dispositivos reales.
- [ ] Revisión de permisos (ubicación segundo plano, notificaciones, biometría) en textos de tienda.
- [ ] Build EAS preview/production.
- [ ] Submit y revisión de tienda.

## Evidencia local

- Documentación y assets verificados en repositorio.
- No se realizó publicación ni se usaron cuentas externas.