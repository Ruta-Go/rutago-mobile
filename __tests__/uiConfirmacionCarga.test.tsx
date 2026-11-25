/// <reference types="jest" />
import { fireEvent, render, screen } from '@testing-library/react-native';

import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { Skeleton, SkeletonLista } from '@/components/ui/Skeleton';

describe('ConfirmModal y Skeleton', () => {
  it('anuncia el skeleton como contenido ocupado', async () => {
    await render(<Skeleton etiqueta="Cargando rutas" />);

    expect(screen.getByRole('progressbar')).toBeTruthy();
    expect(screen.getByLabelText('Cargando rutas')).toBeTruthy();
    expect(screen.getByTestId('skeleton').props.accessibilityState).toEqual({
      busy: true,
    });
  });

  it('muestra tres filas de carga en SkeletonLista', async () => {
    await render(<SkeletonLista cantidad={3} />);

    expect(screen.getAllByTestId('skeleton')).toHaveLength(6);
  });

  it('muestra la confirmación y ejecuta las acciones', async () => {
    const confirmar = jest.fn();
    const cerrar = jest.fn();

    await render(
      <ConfirmModal
        visible
        titulo="Eliminar ruta"
        mensaje="Esta acción no se puede deshacer."
        textoConfirmar="Eliminar"
        onConfirmar={confirmar}
        onCerrar={cerrar}
      />,
    );

    expect(screen.getByText('Eliminar ruta')).toBeTruthy();
    expect(screen.getByText('Esta acción no se puede deshacer.')).toBeTruthy();
    expect(screen.getByRole('alert')).toBeTruthy();

    fireEvent.press(screen.getByLabelText('Eliminar'));
    fireEvent.press(screen.getByLabelText('Cancelar'));

    expect(confirmar).toHaveBeenCalledTimes(1);
    expect(cerrar).toHaveBeenCalledTimes(1);
  });
});