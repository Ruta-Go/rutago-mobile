export const Colores = {
  primario: '#08863A',
  primarioPresionado: '#066C2F',
  primarioSuave: '#E6F4EC',
  carbon: '#374151',
  carbonPresionado: '#1F2937',
  texto: '#1F2937',
  textoSecundario: '#6B7280',
  textoTerciario: '#9CA3AF',
  borde: '#D1D5DB',
  bordeSuave: '#E5E7EB',
  fondo: '#FFFFFF',
  fondoAlterno: '#F3F4F6',
  exito: '#08863A',
  error: '#EF4444',
  errorSuave: '#FEE2E2',
  advertencia: '#F59E0B',
  advertenciaSuave: '#FEF3C7',
  info: '#2563EB',
  infoSuave: '#DBEAFE',
  blanco: '#FFFFFF',
  negro: '#111827',
  transparente: 'transparent',
} as const;

export const Radios = {
  pequeno: 6,
  medio: 8,
  grande: 12,
  extra: 16,
  circulo: 999,
} as const;

export const Espacios = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 30,
  enorme: 32,
} as const;

export const Alturas = {
  input: 44,
  botonPequeno: 36,
  botonMediano: 44,
  botonGrande: 52,
} as const;

export const Tipografia = {
  titulo: 20,
  subtitulo: 18,
  cuerpo: 15,
  etiqueta: 13,
  ayuda: 12,
  boton: 16,
} as const;

export const Sombras = {
  tarjeta: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  modal: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 24,
    elevation: 12,
  },
} as const;
