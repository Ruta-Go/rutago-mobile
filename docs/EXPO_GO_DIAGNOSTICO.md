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

## Fuentes de iconos en iOS

En análisis: `Calling the 'loadAsync' function has failed`, `Registering 'material-community' font failed`, `Registering 'ionicons' font failed`, `CTFontManagerError 104` sugieren registros duplicados de fuentes cuando varios componentes cargan `@expo/vector-icons` al mismo tiempo. Se documentará la corrección en la siguiente tarea.
