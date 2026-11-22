"use strict";

/** Verifica que NetInfo esté declarado e instalado antes de arrancar Expo. */

const paquete = require("../package.json");

const declarada = paquete.dependencies?.["@react-native-community/netinfo"];

if (!declarada) {
  console.error(
    "NETINFO_FALTANTE: @react-native-community/netinfo no está en dependencies.",
  );
  process.exit(1);
}

let instalada;
try {
  instalada = require("../node_modules/@react-native-community/netinfo/package.json")
    .version;
} catch {
  instalada = undefined;
}

if (!instalada) {
  console.error(
    "NETINFO_NO_INSTALADO: ejecuta npx expo install @react-native-community/netinfo y reinicia Metro con caché limpia.",
  );
  process.exit(1);
}

console.log(`NETINFO_OK declarado=${declarada} instalado=${instalada}`);
