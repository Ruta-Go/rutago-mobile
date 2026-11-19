/// <reference types="jest" />
/** Simulé la UI compartida para probar el flujo real del login sin montar el provider global. */
jest.mock('@/components/ui', () => {
  const React = require('react');
  const { Pressable, Text, TextInput, View } = require('react-native');
  const mostrar = jest.fn();

  return {
    Card: ({ children }: { children: any }) =>
      React.createElement(View, null, children),
    Button: ({
      titulo,
      onPress,
    }: {
      titulo: string;
      onPress: () => void;
    }) =>
      React.createElement(
        Pressable,
        { testID: 'boton-ingresar', onPress },
        React.createElement(Text, null, titulo),
      ),
    Input: ({
      etiqueta,
      value,
      onChangeText,
    }: {
      etiqueta: string;
      value: string;
      onChangeText: (texto: string) => void;
    }) =>
      React.createElement(TextInput, {
        testID: etiqueta,
        value,
        onChangeText,
        placeholder: etiqueta,
      }),
    useToast: () => ({ mostrar }),
    __mostrar: mostrar,
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

jest.mock('expo-router', () => ({
  router: { push: jest.fn(), replace: jest.fn() },
  useLocalSearchParams: () => ({}),
}));

jest.mock('@/hooks/useAuth', () => {
  const iniciarSesion = jest.fn();
  const iniciarSesionBiometrica = jest.fn();
  return {
    useAuth: () => ({ iniciarSesion, iniciarSesionBiometrica }),
    __iniciarSesion: iniciarSesion,
    __iniciarSesionBiometrica: iniciarSesionBiometrica,
  };
});

jest.mock('@/services/biometria', () => ({
  obtenerEstadoBiometria: jest.fn(),
}));

import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { router } from 'expo-router';
import HomeScreen from '@/app/index';
import * as moduloAuth from '@/hooks/useAuth';
import * as moduloBiometria from '@/services/biometria';
import * as moduloUI from '@/components/ui';

const iniciarSesion = (
  moduloAuth as unknown as { __iniciarSesion: jest.Mock }
).__iniciarSesion;
const iniciarSesionBiometrica = (
  moduloAuth as unknown as { __iniciarSesionBiometrica: jest.Mock }
).__iniciarSesionBiometrica;
const mostrar = (moduloUI as unknown as { __mostrar: jest.Mock }).__mostrar;
const obtenerEstadoBiometria =
  moduloBiometria.obtenerEstadoBiometria as jest.Mock;
const reemplazar = router.replace as jest.Mock;

describe('pantalla de login', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    obtenerEstadoBiometria.mockResolvedValue({
      disponible: false,
      tipo: 'ninguna',
      etiqueta: '',
    });
    iniciarSesion.mockResolvedValue({ success: true, message: 'ok' });
    iniciarSesionBiometrica.mockResolvedValue({
      success: true,
      message: 'ok',
    });
  });

  it('inicia sesión con correo y contraseña reales', async () => {
    await render(<HomeScreen />);

    await fireEvent.changeText(
      screen.getByTestId('Correo electrónico'),
      'ana@correo.com',
    );
    await fireEvent.changeText(screen.getByTestId('Contraseña'), 'clave123');
    await fireEvent.press(screen.getByTestId('boton-ingresar'));

    await waitFor(() =>
      expect(iniciarSesion).toHaveBeenCalledWith('ana@correo.com', 'clave123'),
    );
    expect(reemplazar).toHaveBeenCalledWith('/dashboard');
  });

  it('muestra y ejecuta el ingreso con huella cuando el dispositivo la tiene', async () => {
    obtenerEstadoBiometria.mockResolvedValue({
      disponible: true,
      tipo: 'huella',
      etiqueta: 'huella',
    });
    await render(<HomeScreen />);

    const boton = await screen.findByTestId('boton-biometria');
    expect(screen.getByText('Entrar con huella')).toBeTruthy();

    await fireEvent.press(boton);

    await waitFor(() =>
      expect(iniciarSesionBiometrica).toHaveBeenCalledTimes(1),
    );
    expect(reemplazar).toHaveBeenCalledWith('/dashboard');
  });

  it('oculta el botón biométrico cuando el dispositivo no lo soporta', async () => {
    await render(<HomeScreen />);

    await waitFor(() => expect(obtenerEstadoBiometria).toHaveBeenCalled());
    expect(screen.queryByTestId('boton-biometria')).toBeNull();
  });

  it('muestra el error si la biometría falla sin navegar', async () => {
    obtenerEstadoBiometria.mockResolvedValue({
      disponible: true,
      tipo: 'faceid',
      etiqueta: 'Face ID',
    });
    iniciarSesionBiometrica.mockRejectedValue(
      new Error('No se pudo verificar tu identidad.'),
    );
    await render(<HomeScreen />);

    const boton = await screen.findByTestId('boton-biometria');
    await fireEvent.press(boton);

    await waitFor(() =>
      expect(mostrar).toHaveBeenCalledWith(
        'No se pudo verificar tu identidad.',
        { tipo: 'error' },
      ),
    );
    expect(reemplazar).not.toHaveBeenCalled();
  });
});
