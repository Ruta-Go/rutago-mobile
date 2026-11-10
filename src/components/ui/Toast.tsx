import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import {
  Animated,
  Easing,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { Colores, Espacios, Radios, Sombras, Tipografia } from '@/constants/tema';

export type TipoToast = 'exito' | 'error' | 'advertencia' | 'info';

export type OpcionesToast = {
  tipo?: TipoToast;
  duracion?: number;
};

export type ContextoToast = {
  mostrar: (mensaje: string, opciones?: OpcionesToast) => void;
  ocultar: () => void;
};

type ToastActivo = {
  mensaje: string;
  tipo: TipoToast;
  duracion: number;
  clave: number;
};

const ESTILOS_TIPO: Record<
  TipoToast,
  { fondo: string; texto: string; icono: string }
> = {
  exito: { fondo: Colores.primario, texto: Colores.blanco, icono: '✓' },
  error: { fondo: Colores.error, texto: Colores.blanco, icono: '!' },
  advertencia: { fondo: Colores.advertencia, texto: Colores.negro, icono: '!' },
  info: { fondo: Colores.carbon, texto: Colores.blanco, icono: 'i' },
};

const SEPARACION_SUPERIOR = Platform.select({
  ios: 64,
  android: 48,
  default: 24,
});

const Contexto = createContext<ContextoToast | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<ToastActivo | null>(null);
  const [animacion] = useState(() => new Animated.Value(0));
  const temporizador = useRef<ReturnType<typeof setTimeout> | null>(null);
  const contador = useRef(0);

  const limpiarTemporizador = useCallback(() => {
    if (temporizador.current !== null) {
      clearTimeout(temporizador.current);
      temporizador.current = null;
    }
  }, []);

  const ocultar = useCallback(() => {
    limpiarTemporizador();
    Animated.timing(animacion, {
      toValue: 0,
      duration: 180,
      easing: Easing.in(Easing.ease),
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished) setToast(null);
    });
  }, [animacion, limpiarTemporizador]);

  const mostrar = useCallback(
    (mensaje: string, opciones?: OpcionesToast) => {
      limpiarTemporizador();
      contador.current += 1;
      setToast({
        mensaje,
        tipo: opciones?.tipo ?? 'info',
        duracion: opciones?.duracion ?? 3000,
        clave: contador.current,
      });
    },
    [limpiarTemporizador],
  );

  useEffect(() => {
    if (!toast) return;

    animacion.setValue(0);
    Animated.timing(animacion, {
      toValue: 1,
      duration: 220,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    }).start();

    temporizador.current = setTimeout(() => ocultar(), toast.duracion);

    return limpiarTemporizador;
  }, [toast, animacion, ocultar, limpiarTemporizador]);

  const contexto = useMemo<ContextoToast>(
    () => ({ mostrar, ocultar }),
    [mostrar, ocultar],
  );

  const colores = toast ? ESTILOS_TIPO[toast.tipo] : null;

  return (
    <Contexto.Provider value={contexto}>
      <View style={styles.contenedor}>
        {children}

        {toast && colores ? (
          <Animated.View
            pointerEvents="box-none"
            style={[
              styles.capa,
              {
                opacity: animacion,
                transform: [
                  {
                    translateY: animacion.interpolate({
                      inputRange: [0, 1],
                      outputRange: [-24, 0],
                    }),
                  },
                ],
              },
            ]}>
            <Pressable
              accessibilityRole="alert"
              accessibilityLiveRegion="polite"
              onPress={ocultar}
              style={[styles.toast, { backgroundColor: colores.fondo }]}>
              <View style={styles.icono}>
                <Text style={[styles.iconoTexto, { color: colores.texto }]}>
                  {colores.icono}
                </Text>
              </View>
              <Text style={[styles.mensaje, { color: colores.texto }]}>
                {toast.mensaje}
              </Text>
            </Pressable>
          </Animated.View>
        ) : null}
      </View>
    </Contexto.Provider>
  );
}

export function useToast(): ContextoToast {
  const contexto = useContext(Contexto);
  if (!contexto) {
    throw new Error('useToast debe usarse dentro de <ToastProvider>');
  }
  return contexto;
}

const styles = StyleSheet.create({
  contenedor: {
    flex: 1,
  },
  capa: {
    position: 'absolute',
    top: SEPARACION_SUPERIOR,
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingHorizontal: Espacios.lg,
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Espacios.md,
    width: '100%',
    maxWidth: 420,
    borderRadius: Radios.grande,
    paddingVertical: Espacios.md,
    paddingHorizontal: Espacios.lg,
    ...Sombras.modal,
  },
  icono: {
    width: 24,
    height: 24,
    borderRadius: Radios.circulo,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
  },
  iconoTexto: {
    fontSize: Tipografia.etiqueta,
    fontWeight: '800',
  },
  mensaje: {
    flex: 1,
    fontSize: Tipografia.cuerpo,
    fontWeight: '600',
  },
});
