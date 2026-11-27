import { isAxiosError, type AxiosError } from "axios";
import { router, Stack } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { volverSeguro } from "@/utils/navegacion";

import { useUnirseViaje } from "@/hooks/useUnirseViaje";
import { api, extraerLista } from "@/services/api";
import { useUnionesStore } from "@/store/unionesStore";
import type { Viaje } from "@/types/rutago";
import {
  fechaLegible,
  idEstado,
  nombreEstado,
  tituloRuta,
} from "@/utils/viajes";

function mensajeError(error: unknown): string {
  const err = error as AxiosError<{ message?: string; error?: string }>;
  if (err.response?.data?.message) return err.response.data.message;
  if (err.response?.data?.error) return err.response.data.error;
  if (isAxiosError(error)) {
    return `Error ${err.response?.status ?? "de conexión"}: ${err.message}`;
  }
  return "No se pudo completar la operación.";
}

export default function ViajesDisponiblesScreen() {
  const [viajes, setViajes] = useState<Viaje[]>([]);
  const [cargando, setCargando] = useState(true);
  const [refrescando, setRefrescando] = useState(false);

  // Acciones optimistas: el store decide qué viajes se ocultan mientras la
  // solicitud está en curso o esperando conexión.
  const uniones = useUnionesStore((estado) => estado.uniones);
  const quitarUnion = useUnionesStore((estado) => estado.quitar);

  const cargar = useCallback(async () => {
    try {
      const respuesta = await api.get<unknown>("/viajes/disponibles-pasajero");
      const lista = extraerLista<Viaje>(respuesta.data).filter(
        (viaje) => idEstado(viaje) === 1,
      );
      setViajes(lista);
    } catch (error) {
      console.error("Error al cargar viajes disponibles:", mensajeError(error));
      Alert.alert("Error", mensajeError(error));
    } finally {
      setCargando(false);
      setRefrescando(false);
    }
  }, []);

  const {
    mutate,
    isPending,
    variables: viajeEnCurso,
  } = useUnirseViaje({
    onExito: (resultado) => {
      Alert.alert(
        resultado.offline ? "Guardado sin conexión" : "Listo",
        resultado.mensaje,
      );

      if (!resultado.offline) void cargar();
    },
    onFallo: (mensaje) => {
      Alert.alert("No se pudo unir al viaje", mensaje);
    },
  });

  const unirse = (viaje: Viaje) => {
    const union = uniones[viaje.id];
    if (union && union.estado !== "fallida") return;

    Alert.alert("Unirse al viaje", `¿Quieres unirte al viaje #${viaje.id}?`, [
      { text: "Volver", style: "cancel" },
      { text: "Unirme", onPress: () => mutate(viaje) },
    ]);
  };

  const visibles = viajes.filter((viaje) => {
    const union = uniones[viaje.id];
    return !union || union.estado === "fallida";
  });
  const pendientes = Object.values(uniones).filter(
    (union) => union.estado === "pendiente",
  );
  const fallidas = Object.values(uniones).filter(
    (union) => union.estado === "fallida",
  );
  const procesando = isPending ? viajeEnCurso?.id : undefined;

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contenido}
        refreshControl={
          <RefreshControl
            refreshing={refrescando}
            onRefresh={() => {
              setRefrescando(true);
              void cargar();
            }}
            colors={["#087A35"]}
          />
        }
      >
        <Pressable style={styles.volver} onPress={() => volverSeguro()}>
          <Text style={styles.volverTexto}>← Volver</Text>
        </Pressable>

        <Text style={styles.marca}>RUTA GO</Text>
        <Text style={styles.titulo}>Viajes disponibles</Text>
        <Text style={styles.descripcion}>
          Viajes reales en estado «Buscando conductor» a los que todavía no te
          has unido.
        </Text>

        <Pressable
          style={styles.botonPrimario}
          onPress={() =>
            router.push("/crear-viaje" as Parameters<typeof router.push>[0])
          }
        >
          <Text style={styles.textoBoton}>Solicitar un viaje nuevo</Text>
        </Pressable>

        {pendientes.length > 0 && (
          <View style={styles.avisoPendiente} testID="aviso-uniones-pendientes">
            <Text style={styles.avisoTitulo}>
              {pendientes.length === 1
                ? "1 solicitud esperando conexión"
                : `${pendientes.length} solicitudes esperando conexión`}
            </Text>
            <Text style={styles.avisoTexto}>
              Las guardamos en el dispositivo y se enviarán solas al recuperar
              la red.
            </Text>
          </View>
        )}

        {fallidas.map((union) => (
          <View
            key={`fallida-${union.viajeId}`}
            style={styles.avisoError}
            testID={`union-fallida-${union.viajeId}`}
          >
            <Text style={styles.avisoTituloError}>No se pudo sincronizar</Text>
            <Text style={styles.avisoTexto}>
              {union.titulo ?? `Viaje #${union.viajeId}`}
              {union.mensaje ? `: ${union.mensaje}` : "."}
            </Text>
            <Pressable
              style={styles.descartar}
              onPress={() => quitarUnion(union.viajeId)}
            >
              <Text style={styles.descartarTexto}>Descartar</Text>
            </Pressable>
          </View>
        ))}

        {cargando && (
          <View style={styles.estado}>
            <ActivityIndicator size="large" color="#087A35" />
            <Text style={styles.estadoTexto}>Consultando viajes...</Text>
          </View>
        )}

        {!cargando && visibles.length === 0 && (
          <View style={styles.vacio}>
            <Text style={styles.icono}>🚐</Text>
            <Text style={styles.vacioTitulo}>No hay viajes disponibles</Text>
            <Text style={styles.vacioTexto}>
              Cuando haya solicitudes abiertas, aparecerán aquí.
            </Text>
          </View>
        )}

        {!cargando &&
          visibles.map((viaje) => (
            <View key={viaje.id} style={styles.tarjeta}>
              <View style={styles.cabecera}>
                <Text style={styles.nombreRuta}>{tituloRuta(viaje)}</Text>
                <Text style={styles.estadoChip}>{nombreEstado(viaje)}</Text>
              </View>
              <Text style={styles.dato}>Solicitud #{viaje.id}</Text>
              <Text style={styles.dato}>
                Horario: {viaje.horario?.horaSalida ?? "No disponible"}
              </Text>
              <Text style={styles.dato}>
                Creado: {fechaLegible(viaje.createdAt)}
              </Text>
              <Text style={styles.dato}>
                Pasajeros: {viaje.pasajeros?.length ?? 0}
              </Text>
              <Pressable
                style={[
                  styles.boton,
                  procesando === viaje.id && styles.botonDeshabilitado,
                ]}
                onPress={() => unirse(viaje)}
                disabled={isPending}
              >
                {procesando === viaje.id ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.textoBoton}>Unirme a este viaje</Text>
                )}
              </Pressable>
            </View>
          ))}
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFFFFF" },
  contenido: { padding: 24, paddingTop: 65, paddingBottom: 40 },
  volver: { marginBottom: 22 },
  volverTexto: { color: "#087A35", fontSize: 15, fontWeight: "700" },
  marca: {
    color: "#087A35",
    fontSize: 22,
    fontWeight: "900",
    letterSpacing: 4,
  },
  titulo: { color: "#202936", fontSize: 27, fontWeight: "800", marginTop: 16 },
  descripcion: { color: "#687385", fontSize: 14, marginTop: 8, lineHeight: 20 },
  botonPrimario: {
    backgroundColor: "#087A35",
    borderRadius: 10,
    paddingVertical: 13,
    alignItems: "center",
    marginTop: 22,
  },
  textoBoton: { color: "#FFFFFF", fontSize: 15, fontWeight: "700" },
  estado: { alignItems: "center", padding: 35 },
  estadoTexto: { color: "#687385", marginTop: 12 },
  vacio: {
    alignItems: "center",
    padding: 25,
    marginTop: 28,
    backgroundColor: "#E6F4EC",
    borderRadius: 15,
  },
  icono: { fontSize: 38 },
  vacioTitulo: {
    color: "#087A35",
    fontWeight: "800",
    fontSize: 16,
    marginTop: 12,
  },
  vacioTexto: {
    color: "#687385",
    textAlign: "center",
    fontSize: 13,
    marginTop: 8,
    lineHeight: 20,
  },
  avisoPendiente: {
    backgroundColor: "#FFF7E6",
    borderWidth: 1,
    borderColor: "#F0C36D",
    borderRadius: 12,
    padding: 14,
    marginTop: 18,
  },
  avisoError: {
    backgroundColor: "#FDECEC",
    borderWidth: 1,
    borderColor: "#E7A3A3",
    borderRadius: 12,
    padding: 14,
    marginTop: 12,
  },
  avisoTitulo: {
    color: "#8A5A00",
    fontWeight: "800",
    fontSize: 14,
  },
  avisoTituloError: {
    color: "#9B1C1C",
    fontWeight: "800",
    fontSize: 14,
  },
  avisoTexto: {
    color: "#4B5563",
    fontSize: 13,
    lineHeight: 19,
    marginTop: 4,
  },
  descartar: {
    alignSelf: "flex-start",
    marginTop: 10,
    paddingVertical: 4,
  },
  descartarTexto: {
    color: "#9B1C1C",
    fontSize: 13,
    fontWeight: "800",
  },
  tarjeta: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 15,
    padding: 18,
    marginTop: 20,
  },
  cabecera: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 10,
  },
  nombreRuta: {
    color: "#087A35",
    fontSize: 17,
    fontWeight: "800",
    flex: 1,
    marginRight: 8,
  },
  estadoChip: {
    color: "#202936",
    fontSize: 11,
    fontWeight: "700",
    backgroundColor: "#E6F4EC",
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 10,
  },
  dato: { color: "#374151", fontSize: 14, marginBottom: 7 },
  boton: {
    backgroundColor: "#087A35",
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
    marginTop: 14,
  },
  botonDeshabilitado: { opacity: 0.7 },
});
