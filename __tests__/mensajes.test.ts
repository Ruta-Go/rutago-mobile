import {
  CONTACTO_ERROR,
  conContactoSiError,
  mensajeDeInicioSesion,
  textoDeError,
} from '@/utils/mensajes';

describe('mensajes de error con contacto', () => {
  it('normaliza errores sin mensaje', () => {
    expect(textoDeError(null, 'Respaldo')).toBe('Respaldo');
    expect(textoDeError(new Error('Falla real'), 'Respaldo')).toBe('Falla real');
  });

  it('traduce credenciales inválidas del backend', () => {
    expect(
      mensajeDeInicioSesion(new Error('Correo o contraseña incorrectos.')),
    ).toBe('Clave o correo incorrecto');
    expect(mensajeDeInicioSesion(new Error('Servidor caído'))).toBe(
      'Servidor caído',
    );
  });

  it('agrega el contacto a todos los errores', () => {
    expect(conContactoSiError('Clave o correo incorrecto', 'error')).toBe(
      `Clave o correo incorrecto. ${CONTACTO_ERROR}`,
    );
  });

  it('no modifica mensajes que no son error', () => {
    expect(conContactoSiError('Sesión iniciada', 'exito')).toBe(
      'Sesión iniciada',
    );
  });

  it('no duplica el contacto si ya está presente', () => {
    const mensaje = `Falla de red. ${CONTACTO_ERROR}`;
    expect(conContactoSiError(mensaje, 'error')).toBe(mensaje);
  });
});
