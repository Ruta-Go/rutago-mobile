import { useMemo, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { WebView } from 'react-native-webview';

import { Colores, Espacios, Radios, Tipografia } from '@/constants/tema';

export type PuntoMapa = {
  latitud: number;
  longitud: number;
  etiqueta?: string;
  tipo?: 'conductor' | 'pasajero' | 'vehiculo' | 'ruta';
};

type Propiedades = {
  puntos?: PuntoMapa[];
  trazo?: PuntoMapa[];
  altura?: number;
};

const COLORES_MARCADOR: Record<NonNullable<PuntoMapa['tipo']>, string> = {
  conductor: Colores.primario,
  vehiculo: Colores.secundario,
  pasajero: Colores.carbon,
  ruta: Colores.textoSecundario,
};

function puntosValidos(puntos: PuntoMapa[] = []): PuntoMapa[] {
  return puntos.filter(
    (punto) =>
      Number.isFinite(punto.latitud) &&
      Number.isFinite(punto.longitud) &&
      Math.abs(punto.latitud) <= 90 &&
      Math.abs(punto.longitud) <= 180,
  );
}

function construirHtml(puntos: PuntoMapa[], trazo: PuntoMapa[]): string {
  const datos = JSON.stringify({
    puntos: puntos.map((punto) => ({
      lat: punto.latitud,
      lng: punto.longitud,
      etiqueta: (punto.etiqueta ?? 'Ubicación').slice(0, 80),
      color: COLORES_MARCADOR[punto.tipo ?? 'vehiculo'],
    })),
    trazo: puntosValidos(trazo).map((punto) => [punto.longitud, punto.latitud]),
  }).replace(/</g, '\\u003c');

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <style>
    html, body, #mapa { height: 100%; width: 100%; margin: 0; padding: 0; }
    #mapa { background: #E6F4FE; }
    .leyenda { font: 600 12px Arial, sans-serif; color: #1F2937; }
  </style>
</head>
<body>
  <div id="mapa"></div>
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <script>
    (function () {
      const datos = ${datos};
      const mapa = L.map('mapa', { zoomControl: true, attributionControl: true });
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; OpenStreetMap contributors'
      }).addTo(mapa);

      const limites = [];
      if (datos.trazo.length > 1) {
        L.polyline(datos.trazo, { color: '#F5B700', weight: 5, opacity: 0.9 }).addTo(mapa);
        datos.trazo.forEach(function (p) { limites.push(p); });
      }

      datos.puntos.forEach(function (punto) {
        const icono = L.divIcon({
          className: '',
          html: '<div style="width:18px;height:18px;border-radius:50%;background:'
            + punto.color + ';border:3px solid white;box-shadow:0 1px 6px rgba(0,0,0,.4)"></div>',
          iconSize: [18, 18],
          iconAnchor: [9, 9]
        });
        L.marker([punto.lat, punto.lng], { icon: icono })
          .addTo(mapa)
          .bindPopup(punto.etiqueta);
        limites.push([punto.lat, punto.lng]);
      });

      if (datos.puntos.length === 1) {
        mapa.setView([datos.puntos[0].lat, datos.puntos[0].lng], 15);
      } else if (limites.length > 1) {
        mapa.fitBounds(limites, { padding: [36, 36], maxZoom: 16 });
      }
      setTimeout(function () { mapa.invalidateSize(); }, 250);
    })();
  </script>
</body>
</html>`;
}

/** Mapa embebido con OpenStreetMap; no abre navegador externo ni requiere API key. */
export function MapaIntegrado({ puntos, trazo, altura = 260 }: Propiedades) {
  const ubicaciones = useMemo(() => puntosValidos(puntos), [puntos]);
  const recorrido = useMemo(() => puntosValidos(trazo), [trazo]);
  const html = useMemo(
    () => construirHtml(ubicaciones, recorrido),
    [ubicaciones, recorrido],
  );
  const [cargando, setCargando] = useState(true);
  const [fallo, setFallo] = useState(false);

  if (ubicaciones.length === 0 && recorrido.length === 0) {
    return (
      <View style={[styles.contenedor, { height: altura }, styles.vacio]}>
        <Text style={styles.vacioTitulo}>Ubicación no disponible todavía</Text>
        <Text style={styles.vacioTexto}>
          El mapa aparecerá cuando el backend reporte coordenadas reales del viaje.
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.contenedor, { height: altura }]}>
      <WebView
        source={{ html }}
        style={styles.webview}
        originWhitelist={['*']}
        javaScriptEnabled
        domStorageEnabled
        onLoadEnd={() => setCargando(false)}
        onError={() => {
          setCargando(false);
          setFallo(true);
        }}
      />
      {cargando ? (
        <View style={styles.superpuesto}>
          <ActivityIndicator size="large" color={Colores.primario} />
          <Text style={styles.superpuestoTexto}>Cargando mapa...</Text>
        </View>
      ) : null}
      {fallo ? (
        <View style={styles.superpuesto}>
          <Text style={styles.superpuestoTexto}>
            No se pudo cargar el mapa. Revisa tu conexión e inténtalo de nuevo.
          </Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: {
    borderRadius: Radios.medio,
    overflow: 'hidden',
    backgroundColor: Colores.fondoAlterno,
    borderWidth: 1,
    borderColor: Colores.borde,
  },
  webview: { flex: 1, backgroundColor: Colores.fondoAlterno },
  superpuesto: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.88)',
    gap: Espacios.sm,
  },
  superpuestoTexto: {
    color: Colores.textoSecundario,
    fontSize: Tipografia.ayuda,
    textAlign: 'center',
    paddingHorizontal: Espacios.lg,
  },
  vacio: { alignItems: 'center', justifyContent: 'center', padding: Espacios.xl },
  vacioTitulo: {
    color: Colores.texto,
    fontSize: Tipografia.cuerpo,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: Espacios.sm,
  },
  vacioTexto: {
    color: Colores.textoSecundario,
    fontSize: Tipografia.ayuda,
    textAlign: 'center',
  },
});
