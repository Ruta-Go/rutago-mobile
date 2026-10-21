# RutaGo Mobile

Aplicación móvil de RutaGo, una plataforma de movilidad orientada a facilitar la conexión entre pasajeros y los servicios de transporte.

El proyecto está desarrollado con React Native, Expo y TypeScript. Actualmente se encuentra en desarrollo y cuenta con una pantalla de inicio de sesión conectada al backend y un dashboard inicial.

## Tecnologías utilizadas

- React Native: desarrollo de interfaces móviles.
- Expo: entorno de desarrollo y ejecución.
- Expo Router: navegación basada en archivos.
- TypeScript: tipado estático.
- Expo SecureStore: almacenamiento seguro de tokens y datos de sesión.
- API REST: comunicación con el backend de RutaGo.

## Requisitos previos

Antes de ejecutar el proyecto, debes tener instalado:

- Node.js y npm.
- Git, para clonar o actualizar el repositorio.
- Expo Go en el dispositivo móvil, o un entorno de emulación compatible.

## Instalación

1. Clona el repositorio:

   ```bash
   git clone https://github.com/Ruta-Go/rutago-mobile.git
   ```

2. Ingresa a la carpeta del proyecto:

   ```bash
   cd rutago-mobile
   ```

3. Instala las dependencias:

   ```bash
   npm install
   ```

## Ejecución de la aplicación

Inicia el servidor de desarrollo con:

```bash
npx expo start
```

Para abrir la aplicación, escanea el código QR con Expo Go cuando sea compatible con la versión del proyecto. También puedes utilizar un emulador configurado.

Si necesitas reiniciar la caché de Expo, ejecuta:

```bash
npx expo start --clear
```

## Conexión con el backend

La aplicación utiliza el backend desplegado en Render:

- API: https://rutago-backend-a303.onrender.com
- Documentación Swagger: https://rutago-backend-a303.onrender.com/api/docs

El servicio de autenticación se encuentra en:

`src/services/authService.ts`

La aplicación utiliza el endpoint:

`POST /api/auth/login`

El inicio de sesión envía el correo electrónico y la contraseña al servidor. Cuando la autenticación es exitosa, la aplicación guarda el token de acceso, el token de actualización y los datos básicos del usuario mediante Expo SecureStore.

La disponibilidad del inicio de sesión depende de que el backend y la base de datos estén funcionando correctamente.

## Estructura del proyecto

```text
rutago-mobile/
├── assets/          # Recursos gráficos
├── scripts/         # Scripts del proyecto
├── src/
│   ├── app/         # Pantallas y navegación
│   │   ├── index.tsx
│   │   ├── dashboard.tsx
│   │   └── _layout.tsx
│   ├── components/  # Componentes reutilizables
│   ├── constants/   # Constantes de la aplicación
│   ├── hooks/       # Hooks personalizados
│   └── services/    # Comunicación con la API
│       └── authService.ts
├── app.json
├── package.json
└── README.md
```

## Funcionalidades implementadas

- Pantalla de inicio de sesión.
- Validación de la respuesta de autenticación del backend.
- Almacenamiento de tokens y datos básicos de sesión.
- Navegación al dashboard después de iniciar sesión.
- Pantalla inicial de bienvenida con el nombre y el rol del usuario.

## Funcionalidades pendientes

La aplicación continúa en desarrollo. Las pantallas y funcionalidades adicionales de pasajeros, conductores, viajes, rutas, vehículos y demás módulos deben implementarse e integrarse progresivamente con el backend.

## Repositorio

Código fuente de la aplicación móvil:

https://github.com/Ruta-Go/rutago-mobile

## Estado del proyecto

Proyecto en desarrollo. La autenticación y el dashboard inicial están implementados; la cobertura funcional completa de la plataforma móvil está pendiente.
