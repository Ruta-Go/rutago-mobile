/// <reference types="jest" />

let mockSesion: { token: string | null; usuario: { rolId: number } | null };
let mockRutaActual: string;
const mockPush = jest.fn();

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush }),
  usePathname: () => mockRutaActual,
}));

jest.mock('@/hooks/useSesion', () => ({
  useSesion: () => mockSesion,
}));

import { fireEvent, render, screen } from '@testing-library/react-native';

import { TabBarPorRol } from '@/components/navegacion/TabBarPorRol';
import { ROLES } from '@/constants/roles';

describe('barra de pestañas por rol', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRutaActual = '/dashboard';
    mockSesion = {
      token: 'token-real',
      usuario: { rolId: ROLES.PASAJERO },
    };
  });

  it('muestra las pestañas de pasajero y marca Inicio como activa', async () => {
    await render(<TabBarPorRol />);

    expect(screen.getByTestId('tab-bar-por-rol')).toBeTruthy();
    expect(screen.getByText('Buscar')).toBeTruthy();
    expect(screen.getByText('Mis viajes')).toBeTruthy();
    expect(screen.getByText('Avisos')).toBeTruthy();
    expect(screen.queryByText('Solicitudes')).toBeNull();
    expect(screen.getByTestId('tab-dashboard').props.accessibilityState).toEqual({
      selected: true,
    });
  });

  it('muestra solicitudes y ubicación al conductor, sin búsqueda de pasajero', async () => {
    mockSesion = { token: 'token-real', usuario: { rolId: ROLES.CONDUCTOR } };

    await render(<TabBarPorRol />);

    expect(screen.getByText('Solicitudes')).toBeTruthy();
    expect(screen.getByText('Ubicación')).toBeTruthy();
    expect(screen.queryByText('Buscar')).toBeNull();
  });

  it('muestra gestión al administrador', async () => {
    mockSesion = {
      token: 'token-real',
      usuario: { rolId: ROLES.ADMINISTRADOR },
    };

    await render(<TabBarPorRol />);

    expect(screen.getByText('Gestión')).toBeTruthy();
    expect(screen.getByTestId('tab-panel-gestion')).toBeTruthy();
  });

  it('no muestra pestañas sin sesión', async () => {
    mockSesion = { token: null, usuario: null };

    await render(<TabBarPorRol />);

    expect(screen.queryByTestId('tab-bar-por-rol')).toBeNull();
  });

  it('navega a la ruta de la pestaña pulsada', async () => {
    await render(<TabBarPorRol />);

    fireEvent.press(screen.getByTestId('tab-mis-viajes'));

    expect(mockPush).toHaveBeenCalledWith('/mis-viajes');
  });
});
