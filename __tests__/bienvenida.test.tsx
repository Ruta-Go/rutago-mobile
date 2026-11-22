/// <reference types="jest" />
jest.mock('expo-router', () => ({
  router: { push: jest.fn(), replace: jest.fn() },
}));

jest.mock('react-native-safe-area-context', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    SafeAreaView: ({ children }: { children: React.ReactNode }) =>
      React.createElement(View, null, children),
  };
});

jest.mock('@expo/vector-icons', () => {
  const React = require('react');
  const { Text } = require('react-native');
  return {
    MaterialCommunityIcons: ({ name }: { name: string }) =>
      React.createElement(Text, null, name),
  };
});

import { fireEvent, render, screen } from '@testing-library/react-native';
import { router } from 'expo-router';
import PantallaBienvenida from '@/app/index';

const empujar = router.push as jest.Mock;

describe('pantalla de bienvenida', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('muestra la marca, la foto real verificada y el selector de roles', async () => {
    await render(<PantallaBienvenida />);

    expect(screen.getByText('RutaGo')).toBeTruthy();
    expect(screen.getByText('Transporte')).toBeTruthy();
    expect(screen.getByText('Selecciona tu rol')).toBeTruthy();
    expect(screen.getByText('Universidad del Pacífico')).toBeTruthy();
    expect(screen.getByText('Buenaventura · Colombia')).toBeTruthy();
    expect(screen.getByTestId('rol-pasajero')).toBeTruthy();
    expect(screen.getByTestId('rol-conductor')).toBeTruthy();
    expect(
      screen.getByText(
        'Foto: Albert Torres Bonilla / Wikimedia Commons · CC BY-SA 4.0',
      ),
    ).toBeTruthy();
  });

  it('no navega sin seleccionar un rol', async () => {
    await render(<PantallaBienvenida />);

    expect(
      screen.getByTestId('boton-continuar').props.accessibilityState.disabled,
    ).toBe(true);
    await fireEvent.press(screen.getByTestId('boton-continuar'));
    expect(empujar).not.toHaveBeenCalled();
  });

  it('selecciona Pasajero y abre el login con esa pista de rol', async () => {
    await render(<PantallaBienvenida />);

    await fireEvent.press(screen.getByTestId('rol-pasajero'));
    expect(
      screen.getByTestId('rol-pasajero').props.accessibilityState.selected,
    ).toBe(true);

    await fireEvent.press(screen.getByTestId('boton-continuar'));
    expect(empujar).toHaveBeenCalledWith('/iniciar-sesion?rol=pasajero');
  });

  it('selecciona Conductor y abre el login con esa pista de rol', async () => {
    await render(<PantallaBienvenida />);

    await fireEvent.press(screen.getByTestId('rol-conductor'));
    expect(
      screen.getByTestId('rol-conductor').props.accessibilityState.selected,
    ).toBe(true);

    await fireEvent.press(screen.getByTestId('boton-continuar'));
    expect(empujar).toHaveBeenCalledWith('/iniciar-sesion?rol=conductor');
  });
});
