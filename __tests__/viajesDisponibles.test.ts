/// <reference types="jest" />
import type { Viaje } from '@/types/rutago';
import { cuposLibres, sePuedeUnir } from '@/utils/viajes';

function viaje(parcial: Partial<Viaje>): Viaje {
  return { id: 1, ...parcial };
}

describe('viajes a los que un pasajero se puede unir', () => {
  it('aceptó viajes con conductor, vehículo y cupos libres', () => {
    const conCupos = viaje({
      estado: { id: 2, nombre: 'ACEPTADO' },
      vehiculo: { id: 1, capacidadPasajeros: 4 },
      pasajeros: [{ id: 1 }],
    });

    expect(cuposLibres(conCupos)).toBe(3);
    expect(sePuedeUnir(conCupos)).toBe(true);
  });

  it('descartó solicitudes sin vehículo aunque no tengan pasajeros', () => {
    const sinVehiculo = viaje({ estado: { id: 1, nombre: 'BUSCANDO' }, pasajeros: [] });

    expect(cuposLibres(sinVehiculo)).toBeNull();
    expect(sePuedeUnir(sinVehiculo)).toBe(false);
  });

  it('descartó viajes llenos o que no están aceptados', () => {
    const lleno = viaje({
      estado: { id: 2, nombre: 'ACEPTADO' },
      vehiculo: { id: 1, capacidadPasajeros: 2 },
      pasajeros: [{ id: 1 }, { id: 2 }],
    });
    const enCurso = viaje({
      estado: { id: 3, nombre: 'EN_CURSO' },
      vehiculo: { id: 1, capacidadPasajeros: 4 },
      pasajeros: [],
    });

    expect(cuposLibres(lleno)).toBe(0);
    expect(sePuedeUnir(lleno)).toBe(false);
    expect(sePuedeUnir(enCurso)).toBe(false);
  });
});
