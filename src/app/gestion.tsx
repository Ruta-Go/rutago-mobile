import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { isAxiosError, type AxiosError } from 'axios';
import { router, Stack, useLocalSearchParams } from 'expo-router';

import { volverSeguro } from '@/utils/navegacion';

import { RECURSOS, recursoPermitido } from '@/constants/gestion';
import { ROLES } from '@/constants/roles';
import { useSesion } from '@/hooks/useSesion';
import {
  eliminarRecurso,
  listarRecurso,
  numero,
  type Registro,
} from '@/services/recursos';

function mensajeError(error: unknown): string {
  const err = error as AxiosError<{ message?: string }>;
  if (err.response?.data?.message) return err.response.data.message;
  if (isAxiosError(error)) {
    return `Error ${err.response?.status ?? 'de conexión'}: ${err.message}`;
  }
  return 'No se pudo completar la operación.';
}

export default function GestionScreen() {
  const params = useLocalSearchParams<{ recurso?: string }>();
  const { usuario } = useSesion();
  const rolId = Number(usuario?.rolId ?? usuario?.rol?.id);
  const recurso = String(params.recurso ?? '');
  const config = RECURSOS[recurso];

  const [items, setItems] = useState<Registro[]>([]);
  const [total, setTotal] = useState<number | null>(null);
  const [busqueda, setBusqueda] = useState('');
  const [cargando, setCargando] = useState(true);
  const [refrescando, setRefrescando] = useState(false);
  const [eliminando, setEliminando] = useState<number | null>(null);

  const cargar = useCallback(async () => {
    if (!config) {
      setCargando(false);
      return;
    }
    try {
      const respuesta = await listarRecurso(config.endpoint, {
        ...(busqueda.trim() ? { q: busqueda.trim() } : {}),
      });
      setItems(respuesta.items);
      setTotal(respuesta.total);
    } catch (error) {
      console.error(`Error al listar ${recurso}:`, mensajeError(error));
      Alert.alert('Error', mensajeError(error));
    } finally {
      setCargando(false);
      setRefrescando(false);
    }
  }, [busqueda, config, recurso]);

  useEffect(() => {
    void Promise.resolve().then(cargar);
  }, [cargar]);

  if (!config || rolId !== ROLES.ADMINISTRADOR) {
    return (
      <>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={[styles.container, styles.centro]}>
          <Text style={styles.titulo}>Recurso no disponible</Text>
          <Pressable style={styles.boton} onPress={() => volverSeguro()}>
            <Text style={styles.textoBoton}>Volver</Text>
          </Pressable>
        </View>
      </>
    );
  }

  const puedeCrear = recursoPermitido(config.crear, rolId);
  const puedeEditar = recursoPermitido(config.editar, rolId);
  const puedeEliminar = recursoPermitido(config.eliminar, rolId);

  const abrirDetalle = (id?: number) => {
    const url = id == null
      ? `/gestion-detalle?recurso=${recurso}`
      : `/gestion-detalle?recurso=${recurso}&id=${id}`;
    router.push(url as Parameters<typeof router.push>[0]);
  };

  const confirmarEliminacion = (item: Registro) => {
    const id = numero(item, 'id');
    if (id == null) return;
    Alert.alert(
      `Eliminar ${config.singular}`,
      `¿Eliminas el registro #${id}? Esta acción no se puede deshacer.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              setEliminando(id);
              await eliminarRecurso(config.endpoint, id);
              await cargar();
              Alert.alert('Listo', 'El registro se eliminó.');
            } catch (error) {
              Alert.alert('Error', mensajeError(error));
            } finally {
              setEliminando(null);
            }
          },
        },
      ],
    );
  };

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
        <Text style={styles.titulo}>{config.titulo}</Text>
        <Text style={styles.descripcion}>
          Datos consultados directamente a {config.endpoint}.
        </Text>

        <TextInput
          style={styles.busqueda}
          value={busqueda}
          onChangeText={setBusqueda}
          onSubmitEditing={() => void cargar()}
          placeholder={`Buscar ${config.singular}`}
          placeholderTextColor="#9CA3AF"
        />
        <Pressable style={styles.botonBuscar} onPress={() => void cargar()}>
          <Text style={styles.textoBotonBuscar}>Buscar</Text>
        </Pressable>

        {puedeCrear && (
          <Pressable style={styles.boton} onPress={() => abrirDetalle()}>
            <Text style={styles.textoBoton}>+ Nuevo {config.singular}</Text>
          </Pressable>
        )}

        {cargando ? (
          <View style={styles.cargando}>
            <ActivityIndicator size="large" color="#07883F" />
            <Text style={styles.ayuda}>Consultando registros...</Text>
          </View>
        ) : items.length === 0 ? (
          <View style={styles.vacio}>
            <Text style={styles.vacioTitulo}>No hay registros</Text>
            <Text style={styles.vacioTexto}>
              {busqueda.trim()
                ? 'Prueba con otro término de búsqueda.'
                : 'Los datos aparecerán aquí cuando existan en el backend.'}
            </Text>
          </View>
        ) : (
          <>
            <Text style={styles.total}>
              {total ?? items.length} registro{total === 1 ? '' : 's'}
            </Text>
            {items.map((item, indice) => {
              const id = numero(item, 'id');
              return (
                <View style={styles.tarjeta} key={id ?? indice}>
                  <Text style={styles.registroId}>#{id ?? '—'}</Text>
                  {config.columnas(item).filter(Boolean).map((valor, posicion) => (
                    <Text style={styles.registroTexto} key={posicion}>
                      {valor}
                    </Text>
                  ))}
                  <View style={styles.acciones}>
                    {puedeEditar && (
                      <Pressable
                        style={styles.botonAccion}
                        onPress={() => id != null && abrirDetalle(id)}>
                        <Text style={styles.textoAccion}>Editar</Text>
                      </Pressable>
                    )}
                    {puedeEliminar && (
                      <Pressable
                        style={[styles.botonAccion, styles.botonEliminar]}
                        onPress={() => confirmarEliminacion(item)}
                        disabled={eliminando === id}>
                        <Text style={styles.textoEliminar}>
                          {eliminando === id ? 'Eliminando...' : 'Eliminar'}
                        </Text>
                      </Pressable>
                    )}
                  </View>
                </View>
              );
            })}
          </>
        )}
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  contenido: { padding: 24, paddingTop: 65, paddingBottom: 40 },
  centro: { justifyContent: 'center', padding: 30 },
  volver: { marginBottom: 22 },
  volverTexto: { color: '#07883F', fontSize: 15, fontWeight: '700' },
  marca: { color: '#07883F', fontSize: 22, fontWeight: '900', letterSpacing: 4 },
  titulo: { color: '#202936', fontSize: 27, fontWeight: '800', marginTop: 16 },
  descripcion: { color: '#687385', fontSize: 14, marginTop: 8, lineHeight: 20 },
  busqueda: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginTop: 22,
    color: '#202936',
  },
  botonBuscar: { alignSelf: 'flex-start', marginTop: 9 },
  textoBotonBuscar: { color: '#07883F', fontSize: 13, fontWeight: '700' },
  boton: {
    backgroundColor: '#07883F',
    borderRadius: 10,
    paddingVertical: 13,
    alignItems: 'center',
    marginTop: 18,
    marginBottom: 12,
  },
  textoBoton: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
  cargando: { alignItems: 'center', padding: 40 },
  ayuda: { color: '#687385', marginTop: 12 },
  vacio: {
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    padding: 20,
    marginTop: 16,
  },
  vacioTitulo: { color: '#374151', fontWeight: '800', marginBottom: 6 },
  vacioTexto: { color: '#6B7280', fontSize: 13, lineHeight: 19 },
  total: { color: '#687385', fontSize: 13, marginTop: 14, marginBottom: 8 },
  tarjeta: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 13,
    padding: 15,
    marginBottom: 10,
  },
  registroId: { color: '#07883F', fontWeight: '800', marginBottom: 7 },
  registroTexto: { color: '#374151', fontSize: 14, marginBottom: 4 },
  acciones: { flexDirection: 'row', gap: 8, marginTop: 12 },
  botonAccion: {
    borderWidth: 1,
    borderColor: '#07883F',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  textoAccion: { color: '#07883F', fontSize: 13, fontWeight: '700' },
  botonEliminar: { borderColor: '#B91C1C' },
  textoEliminar: { color: '#B91C1C', fontSize: 13, fontWeight: '700' },
});
