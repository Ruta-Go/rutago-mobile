# Diagnóstico de Expo Go (Sprint 12)

## NetInfo

- `src/services/conexion.ts` importa `@react-native-community/netinfo` correctamente.
- `package.json` y `package-lock.json` declaran y fijan `@react-native-community/netinfo@12.0.1`.
- `npx expo install --check` no marca NetInfo como incompatible con el SDK 58.
- El error `Unable to resolve module @react-native-community/netinfo` en Expo Go apunta a caché de Metro o a `node_modules` incompleto en el equipo del dispositivo, no a una versión inválida.

### Mitigación verificable

1. Instalar de nuevo si falta: `npx expo install @react-native-community/netinfo`.
2. Verificar con `npm run check:entorno` (este chequeo también corre en CI).
3. Reiniciar Metro limpiando caché: `npx expo start --clear`.
4. En Expo Go, cerrar la app y volver a abrir el QR.

Estado: **Investigado / mitigado**. No afirmo resuelto en el iPhone hasta verificarlo en el dispositivo; no tengo acceso a él desde este entorno.

## Dependencias del SDK

`npx expo install --check` encontró paquetes por debajo de la versión esperada por SDK 58 (`expo`, `@expo/ui`, `expo-linking`, `expo-router`, `expo-secure-store`, `expo-splash-screen`, `expo-status-bar`, `expo-symbols`, `expo-web-browser`). Se ejecutó `npx expo install --fix`; quedaron en las versiones recomendadas y `npx expo install --check` terminó con `Dependencies are up to date`. También se registraron los plugins `expo-status-bar` y `expo-web-browser` en `app.json`.

## Fuentes de iconos en iOS

Causa identificada: `@expo/vector-icons` registra cada fuente al montar el primer icono de esa familia. Al renderizarse al mismo tiempo `index.tsx` (`MaterialCommunityIcons`), `iniciar-sesion.tsx` (`MaterialCommunityIcons`) y `Input.tsx` (`Ionicons`), iOS podía recibir dos registros del mismo `CTFont` y devolver `CTFontManagerError code: 104`, además de `Calling the 'loadAsync' function has failed`.

Corrección implementada:

- `src/services/fuentes.ts` exporta `FUENTES_ICONOS` con las dos familias en un solo objeto.
- `src/app/_layout.tsx` llama a `useFonts(FUENTES_ICONOS)` **antes** de renderizar el navegador y mantiene el splash hasta que termina.
- Como `Font.isLoaded()` ya es `true` cuando se montan los iconos, sus `componentDidMount` ya no vuelven a llamar a `Font.loadAsync()`.
- No se eliminaron iconos ni se reemplazó `@expo/vector-icons`.

Prueba nueva: `__tests__/fuentes.test.ts` verifica que el registro centralizado contiene exactamente `material-community` e `ionicons`.

Estado: **Implementado y probado con jest/tsc/lint/export web**. La verificación definitiva en iPhone sigue pendiente porque no tengo dispositivo en este entorno; no afirmo resuelto en dispositivo sin evidencia.
