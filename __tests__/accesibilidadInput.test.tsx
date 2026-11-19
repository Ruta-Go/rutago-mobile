/// <reference types="jest" />
/** Verifiqué que el campo compartido exponga nombre, estado y errores a tecnologías de asistencia. */
import { render, screen } from '@testing-library/react-native';

import { Input } from '@/components/ui/Input';

describe('accesibilidad del Input compartido', () => {
  it('usa la etiqueta visual como nombre accesible', async () => {
    await render(
      <Input etiqueta="Correo electrónico" value="" onChangeText={() => {}} />,
    );

    expect(screen.getByLabelText('Correo electrónico')).toBeTruthy();
  });

  it('anuncia el campo deshabilitado y su error', async () => {
    await render(
      <Input
        etiqueta="Contraseña"
        value=""
        onChangeText={() => {}}
        editable={false}
        error="La contraseña es obligatoria"
      />,
    );

    const campo = screen.getByLabelText('Contraseña');
    expect(campo.props.accessibilityState.disabled).toBe(true);
    expect(screen.getByRole('alert')).toHaveTextContent(
      'La contraseña es obligatoria',
    );
  });
});
