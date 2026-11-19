/// <reference types="jest" />
/** Verifiqué que el reporte en segundo plano guarde el viaje real y arranque la tarea del sistema. */
jest.mock('@/services/api', () => ({ API_URL: 'https://api.test' }));

jest.mock('expo-task-manager', () => ({ defineTask: jest.fn() }));

jest.mock('expo-location', () => ({
  Accuracy: { High: 5 },
  requestBackgroundPermissionsAsync: jest.fn(),
  startLocationUpdatesAsync: jest.fn(),
  stopLocationUpdatesAsync: jest.fn(),
  hasStartedLocationUpdatesAsync: jest.fn(),
}));

jest.mock('expo-secure-store', () => ({
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
  getItemAsync: jest.fn(),
}));

import * as Location from 'expo-location';
import * as SecureStore from 'expo-secure-store';
import * as TaskManager from 'expo-task-manager';

import {
  TAREA_GPS_FONDO,
  detenerGpsFondo,
  iniciarGpsFondo,
} from '@/services/gpsFondo';

const permiso = Location.requestBackgroundPermissionsAsync as jest.Mock;
const iniciar = Location.startLocationUpdatesAsync as jest.Mock;
const detener = Location.stopLocationUpdatesAsync as jest.Mock;
const consultar = Location.hasStartedLocationUpdatesAsync as jest.Mock;
const guardar = SecureStore.setItemAsync as jest.Mock;
const borrar = SecureStore.deleteItemAsync as jest.Mock;
const definir = TaskManager.defineTask as jest.Mock;

describe('GPS en segundo plano', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    permiso.mockResolvedValue({ status: 'granted' });
    consultar.mockResolvedValue(true);
  });

  it('guardó el contexto del viaje y registró la tarea', async () => {
    const resultado = await iniciarGpsFondo(12, 34, 2);

    expect(resultado).toBe(true);
    expect(definir).toHaveBeenCalledWith(
      TAREA_GPS_FONDO,
      expect.any(Function),
    );
    expect(guardar).toHaveBeenCalledWith('rutago_gps_vehiculo', '12');
    expect(guardar).toHaveBeenCalledWith('rutago_gps_viaje', '34');
    expect(iniciar).toHaveBeenCalledWith(
      TAREA_GPS_FONDO,
      expect.objectContaining({ timeInterval: 15000 }),
    );
  });

  it('detuvo la tarea y limpió el contexto', async () => {
    await detenerGpsFondo();

    expect(consultar).toHaveBeenCalledWith(TAREA_GPS_FONDO);
    expect(detener).toHaveBeenCalledWith(TAREA_GPS_FONDO);
    expect(borrar).toHaveBeenCalledWith('rutago_gps_vehiculo');
  });
});
