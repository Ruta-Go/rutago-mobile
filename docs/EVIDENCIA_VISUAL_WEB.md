# Evidencia visual web de bienvenida

Fecha: 2026-11-22. Se sirvió el export web estático desde una copia limpia fuera de OneDrive y se inspeccionó el DOM renderizado en navegador.

## Datos observados

- Franja de identidad: `DIV` de `4px` con `background-color: rgb(255, 217, 0)` → amarillo `#FFD900`.
- Elementos con verde `#087A35`: `4` en la pantalla de bienvenida.
- Fondo blanco: `#FFFFFF` en el contenedor de la aplicación.
- Imagen: `/assets/assets/images/unipacifico-buenaventura.46bb1d7b595588f2db046ee5411e262f.jpg` con `alt="Entrada principal de la Universidad del Pacífico en Buenaventura"`.
- Crédito visible: `Foto: Albert Torres Bonilla / Wikimedia Commons · CC BY-SA 4.0`.
- Roles visibles: `Pasajero` y `Conductor`.
- Texto de bienvenida: `Selecciona tu rol` / `Elige cómo quieres usar RutaGo. Tu cuenta real se validará al entrar.`

## Limitación

La herramienta de captura de pantalla requiere una ventana de escritorio visible y no pudo tomar la imagen en este entorno. Por eso la evidencia se registra con **DOM y estilos computados reales**, no con una captura.

La verificación en Expo Go con dispositivo físico sigue bloqueada por falta de dispositivo/cuenta Expo. El export web verificado tiene 22 bundles y 20 rutas estáticas.
