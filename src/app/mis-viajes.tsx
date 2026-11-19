import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { isAxiosError, type AxiosError } from 'axios';
import { Stack, router } from 'expo-router';

import { volverSeguro } from '@/utils/navegacion';

import { MapaIntegrado, type PuntoMapa } from '@/components/mapa/MapaIntegrado';
import { ROLES } from '@/constants/roles';
import { useRealtime, type EventoTiempoReal } from '@/hooks/useRealtime';
import { useSesion } from '@/hooks/useSesion';
import { api, extraerDatos, extraerLista } from '@/services/api';
import type { Viaje } from '@/types/rutago';
import {
  ESTADO_VIAJE,
  fechaLegible,
  idEstado,
  nombreEstado,
  tituloRuta,
} from '@/utils/viajes';

function mensajeError(error: unknown): string {
  const err = error as AxiosError<{ message?: string }>;
  if (err.response?.data?.message) return err.response.data.message;
  if (isAxiosError(error)) {
    return `Error ${err.response?.status ?? 'de conexión'}: ${err.message}`;
  }
  return 'No se pudo completar la operación.';
}

type UbicacionEnVivo = {
  viajeId?: number | null;
  vehiculoId?: number | null;
  latitud?: number | null;
  longitud?: number | null;
  velocidadActual?: number | null;
  ultimaActualizacion?: string;
  fecha?: string;
  origen?: 'rest' | 'websocket';
};

export default function MisViajesScreen() {
  const { usuario } = useSesion();
  const rolId = Number(usuario?.rolId ?? usuario?.rol?.id);
  const [viajes, setViajes] = useState<Viaje[]>([]);
  const [ubicaciones, setUbicaciones] = useState<Record<number, UbicacionEnVivo>>(
    {},
  );
  const [cargando, setCargando] = useState(true);
  const [refrescando, setRefrescando] = useState(false);
  const [accionEnCurso, setAccionEnCurso] = useState<string | null>(null);

  const cargarUbicaciones = useCallback(async (lista: Viaje[]) => {
    const activos = lista.filter((viaje) => {
      const id = idEstado(viaje);
      return (
        (id === ESTADO_VIAJE.ACEPTADO || id === ESTADO_VIAJE.EN_CURSO) &&
        Boolean(viaje.vehiculo?.id)
      );
    });

    if (activos.length === 0) {
      setUbicaciones({});
      return;
    }

    const resultados = await Promise.all(
      activos.map(async (viaje) => {
        const vehiculoId = viaje.vehiculo?.id;
        if (!vehiculoId) return null;
        try {
          const respuesta = await api.get<unknown>(
            `/vehiculos/${vehiculoId}/ubicacion`,
          );
          return {
            ...extraerDatos<UbicacionEnVivo>(respuesta.data),
            origen: 'rest' as const,
          };
        } catch (error) {
          console.warn(`[ubicación] viaje ${viaje.id}:`, mensajeError(error));
          return null;
        }
      }),
    );

    const datos: Record<number, UbicacionEnVivo> = {};
    resultados.forEach((resultado, indice) => {
      if (resultado) datos[activos[indice].id] = resultado;
    });
    setUbicaciones(datos);
  }, []);

  const cargar = useCallback(async () => {
    try {
      const respuesta = await api.get<unknown>('/viajes/me/mis-viajes');
      const lista = extraerLista<Viaje>(respuesta.data);
      setViajes(lista);
      await cargarUbicaciones(lista);
    } catch (error) {
      console.error('Error al cargar mis viajes:', mensajeError(error));
      Alert.alert('Error', mensajeError(error));
    } finally {
      setCargando(false);
      setRefrescando(false);
    }
  }, [cargarUbicaciones]);

  useEffect(() => {
    void Promise.resolve().then(cargar);
  }, [cargar]);

  const manejarUbicacion = useCallback((evento: EventoTiempoReal) => {
    if (evento.tipo !== 'ubicacion' || !evento.payload) return;
    const dato = evento.payload as unknown as UbicacionEnVivo;
    if (!dato.viajeId) return;
    const viajeId = Number(dato.viajeId);
    setUbicaciones((actuales) => ({
      ...actuales,
      [viajeId]: {
        ...actuales[viajeId],
        ...dato,
        fecha: evento.fecha,
        origen: 'websocket' as const,
      },
    }));
  }, []);

  const salasViaje = useMemo(
    () =>
      viajes
        .filter((viaje) => {
          const id = idEstado(viaje);
          return id === ESTADO_VIAJE.ACEPTADO || id === ESTADO_VIAJE.EN_CURSO;
        })
        .map((viaje) => `viaje:${viaje.id}`),
    [viajes],
  );

  useRealtime(manejarUbicacion, salasViaje);

  const ejecutarAccion = (
    viaje: Viaje,
    endpoint: 'cancelar' | 'iniciar' | 'finalizar',
    titulo: string,
    pregunta: string,
  ) => {
    Alert.alert(titulo, pregunta, [
      { text: 'Volver', style: 'cancel' },
      {
        text: 'Confirmar',
        onPress: async () => {
          if (accionEnCurso) return;
          const clave = `${viaje.id}-${endpoint}`;
          setAccionEnCurso(clave);
          try {
            const respuesta = await api.patch<unknown>(
              `/viajes/${viaje.id}/${endpoint}`,
            );
            const cuerpo = respuesta.data as { message?: string };
            Alert.alert('Listo', cuerpo?.message ?? 'Viaje actualizado.');
            await cargar();
          } catch (error) {
            Alert.alert('Error', mensajeError(error));
          } finally {
            setAccionEnCurso(null);
          }
        },
      },
    ]);
  };

  const estado = (viaje: Viaje) => idEstado(viaje);

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
            colors={['#07883F']}
          />
        }>
        <Pressable style={styles.volver} onPress={() => volverSeguro()}>
          <Text style={styles.volverTexto}>← Volver</Text>
        </Pressable>

        <Text style={styles.marca}>RUTA GO</Text>
        <Text style={styles.titulo}>Mis viajes</Text>
        <Text style={styles.descripcion}>
          Viajes en los que participas como {rolId === ROLES.CONDUCTOR ? 'conductor' : 'pasajero'}.
        </Text>

        {cargando && (
          <View style={styles.estado}>
            <ActivityIndicator size="large" color="#07883F" />
            <Text style={styles.estadoTexto}>Consultando tus viajes...</Text>
          </View>
        )}

        {!cargando && viajes.length === 0 && (
          <View style={styles.vacio}>
            <Text style={styles.icono}>🚗</Text>
            <Text style={styles.vacioTitulo}>Todavía no tienes viajes</Text>
            <Text style={styles.vacioTexto}>
              Cuando solicites o te asignen un viaje, aparecerá aquí con su estado real.
            </Text>
          </View>
        )}

        {!cargando &&
          viajes.map((viaje) => {
            const id = estado(viaje);
            const ubicacion = ubicaciones[viaje.id];
            const latitud = ubicacion?.latitud ?? viaje.vehiculo?.latitud;
            const longitud = ubicacion?.longitud ?? viaje.vehiculo?.longitud;
            const viajeActivo =
              id === ESTADO_VIAJE.ACEPTADO || id === ESTADO_VIAJE.EN_CURSO;
            const puntosMapa: PuntoMapa[] =
              latitud != null && longitud != null
                ? [
                    {
                      latitud: Number(latitud),
                      longitud: Number(longitud),
                      etiqueta: viaje.vehiculo?.placa
                        ? `Vehículo ${viaje.vehiculo.placa}`
                        : 'Vehículo del viaje',
                      tipo: 'vehiculo',
                    },
                  ]
                : [];
            return (
              <View key={viaje.id} style={styles.tarjeta}>
                <View style={styles.cabecera}>
                  <Text style={styles.nombreRuta}>{tituloRuta(viaje)}</Text>
                  <Text style={styles.estadoChip}>{nombreEstado(viaje)}</Text>
                </View>

                <Text style={styles.dato}>Viaje #{viaje.id}</Text>
                <Text style={styles.dato}>
                  Horario: {viaje.horario?.horaSalida ?? 'No disponible'}
                </Text>
                <Text style={styles.dato}>
                  Fecha: {fechaLegible(viaje.createdAt)}
                </Text>
                {viaje.vehiculo?.placa ? (
                  <Text style={styles.dato}>Vehículo: {viaje.vehiculo.placa}</Text>
                ) : null}
                {viaje.conductor?.nombres ? (
                  <Text style={styles.dato}>
                    Conductor: {viaje.conductor.nombres} {viaje.conductor.apellidos ?? ''}
                  </Text>
                ) : null}
                {viaje.precioEstimado != null ? (
                  <Text style={styles.dato}>Precio estimado: ${viaje.precioEstimado}</Text>
                ) : null}

                {viajeActivo ? (
                  <View style={styles.ubicacion}>
                    <Text style={styles.ubicacionTitulo}>
                      {ubicacion?.origen === 'websocket'
                        ? '📍 Ubicación en vivo'
                        : '📍 Última ubicación reportada'}
                    </Text>
                    {latitud != null && longitud != null ? (
                      <>
                        <Text style={styles.ubicacionDato}>
                          Latitud: {Number(latitud).toFixed(5)}
                        </Text>
                        <Text style={styles.ubicacionDato}>
                          Longitud: {Number(longitud).toFixed(5)}
                        </Text>
                        <Text style={styles.ubicacionDato}>
                          Actualizado:{' '}
                          {fechaLegible(
                            ubicacion?.fecha ??
                              ubicacion?.ultimaActualizacion ??
                              viaje.vehiculo?.ultimaActualizacion,
                          )}
                        </Text>
                        <MapaIntegrado puntos={puntosMapa} altura={220} />
                      </>
                    ) : (
                      <>
                        <Text style={styles.ubicacionDato}>
                          El conductor todavía no ha reportado coordenadas.
                        </Text>
                        <MapaIntegrado altura={180} />
                      </>
                    )}
                  </View>
                ) : null}

                <View style={styles.acciones}>
                  {rolId === ROLES.CONDUCTOR &&
                    (id === ESTADO_VIAJE.ACEPTADO ||
                      id === ESTADO_VIAJE.EN_CURSO) && (
                      <Pressable
                        style={styles.botonAccion}
                        onPress={() =>
                          router.push(
                            `/reportar-ubicacion?viajeId=${viaje.id}` as Parameters<
                              typeof router.push
                            >[0],
                          )
                        }>
                        <Text style={styles.textoBoton}>Reportar GPS</Text>
                      </Pressable>
                    )}

                  {rolId === ROLES.CONDUCTOR && id === ESTADO_VIAJE.ACEPTADO && (
                    <Pressable
                      style={styles.botonAccion}
                      disabled={accionEnCurso !== null}
                      onPress={() =>
                        ejecutarAccion(
                          viaje,
                          'iniciar',
                          'Iniciar viaje',
                          '¿Confirmas que el viaje está iniciando?',
                        )
                      }>
                      {accionEnCurso === `${viaje.id}-iniciar` ? (
                        <ActivityIndicator size="small" color="#FFFFFF" />
                      ) : (
                        <Text style={styles.textoBoton}>Iniciar</Text>
                      )}
                    </Pressable>
                  )}

                  {rolId === ROLES.CONDUCTOR && id === ESTADO_VIAJE.EN_CURSO && (
                    <Pressable
                      style={styles.botonAccion}
                      disabled={accionEnCurso !== null}
                      onPress={() =>
                        ejecutarAccion(
                          viaje,
                          'finalizar',
                          'Finalizar viaje',
                          '¿Confirmas que el viaje terminó?',
                        )
                      }>
                      {accionEnCurso === `${viaje.id}-finalizar` ? (
                        <ActivityIndicator size="small" color="#FFFFFF" />
                      ) : (
                        <Text style={styles.textoBoton}>Finalizar</Text>
                      )}
                    </Pressable>
                  )}

                  {(rolId === ROLES.PASAJERO ||
                    rolId === ROLES.CONDUCTOR) &&
                    id != null &&
                    id <= ESTADO_VIAJE.EN_CURSO && (
                      <Pressable
                        style={styles.botonSecundario}
                        disabled={accionEnCurso !== null}
                        onPress={() =>
                          ejecutarAccion(
                            viaje,
                            'cancelar',
                            'Cancelar viaje',
                            '¿Seguro que quieres cancelar este viaje?',
                          )
                        }>
                        {accionEnCurso === `${viaje.id}-cancelar` ? (
                          <ActivityIndicator size="small" color="#07883F" />
                        ) : (
                          <Text style={styles.textoBotonSecundario}>Cancelar</Text>
                        )}
                      </Pressable>
                    )}
                </View>
              </View>
            );
          })}
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  contenido: { padding: 24, paddingTop: 65 },
  volver: { marginBottom: 22 },
  volverTexto: { color: '#07883F', fontSize: 15, fontWeight: '700' },
  marca: { color: '#07883F', fontSize: 22, fontWeight: '900', letterSpacing: 4 },
  titulo: { color: '#202936', fontSize: 27, fontWeight: '800', marginTop: 16 },
  descripcion: { color: '#687385', fontSize: 14, marginTop: 8, lineHeight: 20 },
  estado: { alignItems: 'center', padding: 35 },
  estadoTexto: { color: '#687385', marginTop: 12 },
  vacio: {
    alignItems: 'center',
    padding: 25,
    marginTop: 28,
    backgroundColor: '#E6F4EC',
    borderRadius: 15,
  },
  icono: { fontSize: 38 },
  vacioTitulo: { color: '#07883F', fontWeight: '800', fontSize: 16, marginTop: 12 },
  vacioTexto: {
    color: '#687385',
    textAlign: 'center',
    fontSize: 13,
    marginTop: 8,
    lineHeight: 20,
  },
  tarjeta: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 15,
    padding: 18,
    marginTop: 20,
    backgroundColor: '#FFFFFF',
  },
  cabecera: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  nombreRuta: {
    color: '#07883F',
    fontSize: 17,
    fontWeight: '800',
    flex: 1,
    marginRight: 8,
  },
  estadoChip: {
    color: '#202936',
    fontSize: 11,
    fontWeight: '700',
    backgroundColor: '#E6F4EC',
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 10,
  },
  dato: { color: '#374151', fontSize: 14, marginBottom: 7 },
  ubicacion: {
    backgroundColor: '#F3F8F5',
    borderRadius: 12,
    padding: 14,
    marginTop: 14,
  },
  ubicacionTitulo: {
    color: '#07883F',
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 6,
  },
  ubicacionDato: { color: '#374151', fontSize: 13, marginBottom: 4 },
  botonMapa: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: '#07883F',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginTop: 6,
  },
  textoBotonMapa: { color: '#07883F', fontSize: 13, fontWeight: '700' },
  acciones: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 12 },
  botonAccion: {
    backgroundColor: '#07883F',
    borderRadius: 10,
    paddingVertical: 11,
    paddingHorizontal: 20,
    marginRight: 10,
    marginBottom: 8,
  },
  botonSecundario: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 10,
    paddingVertical: 11,
    paddingHorizontal: 20,
    marginBottom: 8,
  },
  textoBoton: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
  textoBotonSecundario: { color: '#374151', fontSize: 14, fontWeight: '700' },
});
