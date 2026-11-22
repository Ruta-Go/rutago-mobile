import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { isAxiosError, type AxiosError } from 'axios';
import { router, Stack, useLocalSearchParams } from 'expo-router';

import { volverSeguro } from '@/utils/navegacion';

import { RECURSOS, recursoPermitido, type CampoForm } from '@/constants/gestion';
import { ROLES } from '@/constants/roles';
import { useSesion } from '@/hooks/useSesion';
import { api } from '@/services/api';
import {
  actualizarRecurso,
  crearRecurso,
  obtenerRecurso,
  opcionesRemotas,
  objeto,
  numero,
  type Registro,
} from '@/services/recursos';
import { esCorreoValido, validarPassword } from '@/utils/validacion';

type Opcion = { id: number | string; etiqueta: string };

const RUTAS_VALOR: Record<string, string[]> = {
  rolId: ['rol'],
  estadoId: ['estado', 'estadoConductor', 'estadoVehiculo', 'estadoViaje'],
  entidadId: ['entidad'],
  origenId: ['origen'],
  destinoId: ['destino'],
  rutaId: ['ruta'],
  comunaId: ['comuna'],
  tipoDocumentoId: ['tipoDocumento'],
  horarioId: ['horario'],
  vehiculoId: ['vehiculo'],
  conductorId: ['conductor', 'usuario'],
};

function mensajeError(error: unknown): string {
  const err = error as AxiosError<{ message?: string }>;
  if (err.response?.data?.message) return err.response.data.message;
  if (isAxiosError(error)) {
    return `Error ${err.response?.status ?? 'de conexión'}: ${err.message}`;
  }
  return 'No se pudo guardar la información.';
}

function leerValor(registro: Registro, campo: CampoForm): string {
  const directo = registro[campo.nombre];
  if (directo != null && typeof directo !== 'object') {
    const valor = String(directo);
    if (campo.tipo === 'fecha') return valor.slice(0, 10);
    if (campo.tipo === 'hora') return valor.slice(0, 5);
    return valor;
  }
  for (const ruta of RUTAS_VALOR[campo.nombre] ?? []) {
    let fuente: Registro | null = registro;
    for (const clave of ruta) {
      fuente = objeto(fuente, clave);
      if (!fuente) break;
    }
    const id = numero(fuente, 'id');
    if (id != null) return String(id);
  }
  return '';
}

export default function GestionDetalleScreen() {
  const params = useLocalSearchParams<{ recurso?: string; id?: string }>();
  const { usuario } = useSesion();
  const rolId = Number(usuario?.rolId ?? usuario?.rol?.id);
  const recurso = String(params.recurso ?? '');
  const config = RECURSOS[recurso];
  const id = params.id ? Number(params.id) : null;
  const editando = id != null && Number.isFinite(id);

  const camposVisibles = useMemo(
    () =>
      (config?.campos ?? []).filter(
        (campo) =>
          (!campo.soloAdmin || rolId === ROLES.ADMINISTRADOR) &&
          (!editando || !campo.soloCrear),
      ),
    [config, editando, rolId],
  );

  const [valores, setValores] = useState<Record<string, string>>({});
  const [errores, setErrores] = useState<Record<string, string>>({});
  const [opciones, setOpciones] = useState<Record<string, Opcion[]>>({});
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);

  const cargar = useCallback(async () => {
    if (!config) {
      setCargando(false);
      return;
    }
    try {
      const Entradas = await Promise.allSettled(
        camposVisibles.map((campo) => {
          if (campo.opcionesFijas) {
            return Promise.resolve(campo.opcionesFijas);
          }
          if (!campo.endpointOpciones) return Promise.resolve([]);
          return opcionesRemotas(
            campo.endpointOpciones,
            campo.etiquetasOpcion ?? ['nombre'],
            campo.rutaValorOpcion,
          );
        }),
      );
      const mapaOpciones: Record<string, Opcion[]> = {};
      camposVisibles.forEach((campo, indice) => {
        const resultado = Entradas[indice];
        mapaOpciones[campo.nombre] =
          resultado.status === 'fulfilled' ? (resultado.value as Opcion[]) : [];
      });
      setOpciones(mapaOpciones);

      if (editando) {
        const registro = await obtenerRecurso(config.endpoint, id as number);
        const iniciales: Record<string, string> = {};
        camposVisibles.forEach((campo) => {
          iniciales[campo.nombre] = leerValor(registro, campo);
        });
        setValores(iniciales);
      }
    } catch (error) {
      console.error('Error al preparar formulario:', mensajeError(error));
      Alert.alert('Error', mensajeError(error));
    } finally {
      setCargando(false);
    }
  }, [camposVisibles, config, editando, id]);

  useEffect(() => {
    void Promise.resolve().then(cargar);
  }, [cargar]);

  if (!config || rolId !== ROLES.ADMINISTRADOR) {
    return (
      <>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={[styles.container, styles.centro]}>
          <Text style={styles.titulo}>Formulario no disponible</Text>
          <Pressable style={styles.boton} onPress={() => volverSeguro()}>
            <Text style={styles.textoBoton}>Volver</Text>
          </Pressable>
        </View>
      </>
    );
  }

  const puedeGuardar = recursoPermitido(editando ? config.editar : config.crear, rolId);
  if (!puedeGuardar) {
    return (
      <>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={[styles.container, styles.centro]}>
          <Text style={styles.titulo}>Acceso restringido</Text>
          <Text style={styles.descripcion}>
            Tu rol no puede modificar este recurso.
          </Text>
          <Pressable style={styles.boton} onPress={() => volverSeguro()}>
            <Text style={styles.textoBoton}>Volver</Text>
          </Pressable>
        </View>
      </>
    );
  }

  const validarCampos = (): Record<string, string> => {
    const nuevosErrores: Record<string, string> = {};

    camposVisibles.forEach((campo) => {
      const bruto = (valores[campo.nombre] ?? '').trim();
      if (!bruto) return;

      if (campo.tipo === 'correo' && !esCorreoValido(bruto)) {
        nuevosErrores[campo.nombre] = 'Ingresa un correo válido.';
      } else if (
        campo.tipo === 'password' &&
        !(editando && campo.soloCrear) &&
        validarPassword(bruto)
      ) {
        nuevosErrores[campo.nombre] = validarPassword(bruto) ?? '';
      } else if (
        (campo.tipo === 'numero' || campo.tipo === 'opciones') &&
        !Number.isFinite(Number(bruto))
      ) {
        nuevosErrores[campo.nombre] = 'Debe ser un número válido.';
      } else if (
        campo.tipo === 'opciones' &&
        !(opciones[campo.nombre] ?? []).some(
          (opcion) => String(opcion.id) === bruto,
        )
      ) {
        nuevosErrores[campo.nombre] = 'Selecciona una opción disponible.';
      } else if (
        campo.tipo === 'fecha' &&
        (!/^\d{4}-\d{2}-\d{2}$/.test(bruto) || Number.isNaN(Date.parse(bruto)))
      ) {
        nuevosErrores[campo.nombre] = 'Usa una fecha válida (AAAA-MM-DD).';
      } else if (
        campo.tipo === 'hora' &&
        !/^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/.test(bruto)
      ) {
        nuevosErrores[campo.nombre] = 'Usa una hora válida (HH:mm).';
      } else if (campo.maxLength && bruto.length > campo.maxLength) {
        nuevosErrores[campo.nombre] = `Máximo ${campo.maxLength} caracteres.`;
      }
    });

    return nuevosErrores;
  };

  const construirPayload = (): Registro => {
    const payload: Registro = {};
    camposVisibles.forEach((campo) => {
      const bruto = (valores[campo.nombre] ?? '').trim();
      if (!bruto) return;
      if (campo.nombre === 'activo') payload[campo.nombre] = bruto === '1';
      else if (campo.tipo === 'numero' || campo.tipo === 'opciones') {
        payload[campo.nombre] = Number(bruto);
      } else payload[campo.nombre] = bruto;
    });
    return payload;
  };

  const guardar = async () => {
    const faltantes = camposVisibles.filter(
      (campo) => campo.requerido && !(valores[campo.nombre] ?? '').trim(),
    );
    if (faltantes.length > 0) {
      Alert.alert(
        'Campos requeridos',
        `Completa: ${faltantes.map((campo) => campo.etiqueta).join(', ')}.`,
      );
      return;
    }

    const erroresValidados = validarCampos();
    setErrores(erroresValidados);
    if (Object.keys(erroresValidados).length > 0) {
      Alert.alert('Datos inválidos', 'Revisa los campos marcados en rojo.');
      return;
    }

    try {
      setGuardando(true);
      const payload = construirPayload();

      if (editando && recurso === 'usuarios' && valores.rolId) {
        const rolNuevo = Number(valores.rolId);
        const payloadBasico = { ...payload };
        delete payloadBasico.rolId;
        if (Object.keys(payloadBasico).length > 0) {
          await actualizarRecurso(config.endpoint, id as number, payloadBasico);
        }
        await api.patch(`/usuarios/${id}/rol`, { rolId: rolNuevo });
      } else if (editando) {
        await actualizarRecurso(config.endpoint, id as number, payload);
      } else {
        await crearRecurso(config.endpointCrear ?? config.endpoint, payload);
      }

      Alert.alert('Listo', 'La información se guardó en el backend.', [
        {
          text: 'Ver listado',
          onPress: () =>
            router.replace(
              `/gestion?recurso=${recurso}` as Parameters<typeof router.push>[0],
            ),
        },
      ]);
    } catch (error) {
      Alert.alert('Error', mensajeError(error));
    } finally {
      setGuardando(false);
    }
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />

      <ScrollView style={styles.container} contentContainerStyle={styles.contenido}>
        <Pressable style={styles.volver} onPress={() => volverSeguro()}>
          <Text style={styles.volverTexto}>← Volver</Text>
        </Pressable>

        <Text style={styles.marca}>RUTA GO</Text>
        <Text style={styles.titulo}>
          {editando ? 'Editar' : 'Nuevo'} {config.singular}
        </Text>
        <Text style={styles.descripcion}>
          Los datos se envían a {config.endpointCrear ?? config.endpoint}.
        </Text>

        {cargando ? (
          <View style={styles.cargando}>
            <ActivityIndicator size="large" color="#087A35" />
            <Text style={styles.ayuda}>Preparando formulario...</Text>
          </View>
        ) : (
          <View style={styles.formulario}>
            {camposVisibles.map((campo) => {
              const opcionesCampo = opciones[campo.nombre] ?? [];
              const valor = valores[campo.nombre] ?? '';
              return (
                <View style={styles.campo} key={campo.nombre}>
                  <Text style={styles.etiqueta}>
                    {campo.etiqueta}
                    {campo.requerido ? ' *' : ''}
                  </Text>
                  {campo.tipo === 'opciones' ? (
                    <View style={styles.opciones}>
                      {opcionesCampo.length === 0 ? (
                        <Text style={styles.sinOpciones}>
                          No hay opciones disponibles para este campo.
                        </Text>
                      ) : (
                        opcionesCampo.map((opcion) => (
                          <Pressable
                            key={String(opcion.id)}
                            style={[
                              styles.opcion,
                              valor === String(opcion.id) && styles.opcionSeleccionada,
                            ]}
                            onPress={() =>
                              setValores((anterior) => ({
                                ...anterior,
                                [campo.nombre]: String(opcion.id),
                              }))
                            }>
                            <Text
                              style={[
                                styles.textoOpcion,
                                valor === String(opcion.id) && styles.textoOpcionSeleccionado,
                              ]}>
                              {opcion.etiqueta}
                            </Text>
                          </Pressable>
                        ))
                      )}
                    </View>
                  ) : (
                    <TextInput
                      style={styles.input}
                      value={valor}
                      onChangeText={(textoNuevo) => {
                        setValores((anterior) => ({
                          ...anterior,
                          [campo.nombre]: textoNuevo,
                        }));
                        setErrores((anterior) => ({
                          ...anterior,
                          [campo.nombre]: '',
                        }));
                      }}
                      placeholder={campo.placeholder}
                      placeholderTextColor="#9CA3AF"
                      secureTextEntry={campo.tipo === 'password'}
                      keyboardType={
                        campo.tipo === 'numero'
                          ? 'numeric'
                          : campo.tipo === 'correo'
                            ? 'email-address'
                            : 'default'
                      }
                      maxLength={campo.maxLength}
                    />
                  )}
                  {errores[campo.nombre] ? (
                    <Text style={styles.error}>{errores[campo.nombre]}</Text>
                  ) : null}
                </View>
              );
            })}

            <Pressable
              style={[styles.boton, guardando && styles.botonDeshabilitado]}
              onPress={() => void guardar()}
              disabled={guardando}>
              {guardando ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.textoBoton}>Guardar {config.singular}</Text>
              )}
            </Pressable>
          </View>
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
  volverTexto: { color: '#087A35', fontSize: 15, fontWeight: '700' },
  marca: { color: '#087A35', fontSize: 22, fontWeight: '900', letterSpacing: 4 },
  titulo: { color: '#202936', fontSize: 27, fontWeight: '800', marginTop: 16 },
  descripcion: { color: '#687385', fontSize: 14, marginTop: 8, lineHeight: 20 },
  cargando: { alignItems: 'center', padding: 45 },
  ayuda: { color: '#687385', marginTop: 12 },
  formulario: { marginTop: 22 },
  campo: { marginBottom: 18 },
  etiqueta: { color: '#374151', fontSize: 14, fontWeight: '700', marginBottom: 8 },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: '#202936',
  },
  opciones: { flexDirection: 'row', flexWrap: 'wrap' },
  opcion: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginRight: 7,
    marginBottom: 7,
  },
  opcionSeleccionada: { borderColor: '#087A35', backgroundColor: '#E6F4EC' },
  textoOpcion: { color: '#374151', fontSize: 13 },
  textoOpcionSeleccionado: { color: '#065F33', fontWeight: '700' },
  sinOpciones: { color: '#B91C1C', fontSize: 13 },
  error: { color: '#DC2626', fontSize: 12, marginTop: 6 },
  boton: {
    backgroundColor: '#087A35',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 16,
  },
  botonDeshabilitado: { opacity: 0.7 },
  textoBoton: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
});
