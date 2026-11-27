import { useWindowDimensions } from 'react-native';

export type DisenoResponsivo = {
  ancho: number;
  esCompacto: boolean;
  esAncho: boolean;
  padding: number;
  columnas: number;
  tamanoTitulo: number;
};

/**
 * Decisiones visuales derivadas del ancho real, sin valores inventados ni
 * coordenadas dependientes de un dispositivo concreto.
 */
export function calcularDiseno(ancho: number): DisenoResponsivo {
  const anchoSeguro = Number.isFinite(ancho) && ancho > 0 ? ancho : 360;
  const esCompacto = anchoSeguro < 360;
  const esAncho = anchoSeguro >= 768;

  return {
    ancho: anchoSeguro,
    esCompacto,
    esAncho,
    padding: esCompacto ? 16 : esAncho ? 40 : 24,
    columnas: esAncho ? 2 : 1,
    tamanoTitulo: esCompacto ? 23 : esAncho ? 30 : 27,
  };
}

/** Hook delgado: sólo expone la decisión ya calculada para el ancho actual. */
export function useResponsivo(): DisenoResponsivo {
  const { width } = useWindowDimensions();
  return calcularDiseno(width);
}