/// <reference types="jest" />
import type { Notificacion } from '@/types/rutago';
import {
  avisoLocalDesdeEvento,
  COLORES_AVISO,
  colorDeNotificacion,
  tiempoRelativo,
  viajeDeNotificacion,
} from '@/utils/notificaciones';

function aviso(parcial: Partial<Notificacion>): Notificacion {
  return { id: 1, ...parcial };
}

describe('color del aviso', () => {
  it('usó el color del estado del viaje', () => {
    const conEstado = (estadoId: number) =>
      colorDeNotificacion(aviso({ tipo: 'viaje_estado', datos: { estadoId } }));

    expect(conEstado(2)).toBe(COLORES_AVISO.azul);
    expect(conEstado(3)).toBe(COLORES_AVISO.naranja);
    expect(conEstado(4)).toBe(COLORES_AVISO.gris);
    expect(conEstado(5)).toBe(COLORES_AVISO.rojo);
  });

  it('diferenció avisos de administración, sistema y pasajero nuevo', () => {
    expect(colorDeNotificacion(aviso({ tipo: 'administracion' }))).toBe(
      COLORES_AVISO.rojo,
    );
    expect(colorDeNotificacion(aviso({ tipo: 'sistema' }))).toBe(COLORES_AVISO.gris);
    expect(colorDeNotificacion(aviso({ tipo: 'viaje_pasajero' }))).toBe(
      COLORES_AVISO.verde,
    );
  });
});

describe('viaje del aviso', () => {
  it('tomó el viaje de la columna o de los datos', () => {
    expect(viajeDeNotificacion(aviso({ viajeId: 8 }))).toBe(8);
    expect(viajeDeNotificacion(aviso({ datos: { viajeId: 12 } }))).toBe(12);
  });

  it('devolvió null sin viaje válido', () => {
    expect(viajeDeNotificacion(aviso({}))).toBeNull();
    expect(viajeDeNotificacion(aviso({ viajeId: null }))).toBeNull();
  });
});

describe('tiempo relativo', () => {
  const ahora = new Date('2026-11-24T12:00:00Z');

  it('mostró minutos, horas y días como en el diseño', () => {
    expect(tiempoRelativo('2026-11-24T11:58:00Z', ahora)).toBe('hace 2 min');
    expect(tiempoRelativo('2026-11-24T11:00:00Z', ahora)).toBe('hace 1 h');
    expect(tiempoRelativo('2026-11-21T12:00:00Z', ahora)).toBe('hace 3 d');
    expect(tiempoRelativo('2026-11-24T11:59:40Z', ahora)).toBe('ahora');
  });

  it('no inventó un tiempo con fechas vacías o inválidas', () => {
    expect(tiempoRelativo(undefined, ahora)).toBe('');
    expect(tiempoRelativo('no-es-fecha', ahora)).toBe('');
  });
});

describe('aviso local desde el WebSocket', () => {
  it('adjuntó el viaje cuando el evento lo trae', () => {
    expect(
      avisoLocalDesdeEvento({ titulo: 'Tu viaje', mensaje: 'En camino', viajeId: 3 }),
    ).toEqual({ titulo: 'Tu viaje', cuerpo: 'En camino', datos: { viajeId: 3 } });
  });

  it('adjuntó la ruta de avisos cuando no hay viaje', () => {
    expect(avisoLocalDesdeEvento({ titulo: 'Recordatorio', mensaje: 'Hola' }).datos).toEqual({
      ruta: '/notificaciones',
    });
  });

  it('usó textos por defecto si el evento viene incompleto', () => {
    expect(avisoLocalDesdeEvento(null)).toEqual({
      titulo: 'Nueva notificación',
      cuerpo: 'Tienes un aviso real de RutaGo.',
      datos: { ruta: '/notificaciones' },
    });
  });
});
