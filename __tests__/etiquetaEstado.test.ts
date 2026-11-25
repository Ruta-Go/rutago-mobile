/// <reference types="jest" />
/** Verifiqué que el Detalle de viaje muestre el estado legible y no el código del backend. */
import { etiquetaEstado } from '@/utils/viajes';

describe('etiqueta del estado del viaje', () => {
  it('usó el nombre en español según el id', () => {
    expect(etiquetaEstado({ id: 1, estado: { id: 3, nombre: 'EN_CURSO' } })).toBe('En curso');
  });

  it('convirtió códigos desconocidos a texto legible', () => {
    expect(etiquetaEstado({ id: 1, estado: { id: 99, nombre: 'EN_REVISION' } })).toBe(
      'En revision',
    );
    expect(etiquetaEstado({ id: 1 })).toBe('Sin estado');
  });
});
