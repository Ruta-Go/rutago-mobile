/// <reference types="jest" />
import { calcularDiseno } from '@/hooks/useResponsivo';

describe('decisiones responsivas', () => {
  it('compacta el espaciado en pantallas estrechas', () => {
    expect(calcularDiseno(320)).toEqual({
      ancho: 320,
      esCompacto: true,
      esAncho: false,
      padding: 16,
      columnas: 1,
      tamanoTitulo: 23,
    });
  });

  it('usa la línea base en teléfonos habituales', () => {
    expect(calcularDiseno(390)).toMatchObject({
      esCompacto: false,
      esAncho: false,
      padding: 24,
      columnas: 1,
      tamanoTitulo: 27,
    });
  });

  it('ensancha el contenido en tabletas', () => {
    expect(calcularDiseno(1024)).toMatchObject({
      esCompacto: false,
      esAncho: true,
      padding: 40,
      columnas: 2,
      tamanoTitulo: 30,
    });
  });

  it('no inventa un ancho cuando la dimensión no es válida', () => {
    expect(calcularDiseno(0).ancho).toBe(360);
    expect(calcularDiseno(Number.NaN).padding).toBe(24);
  });
});