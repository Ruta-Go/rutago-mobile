/// <reference types="jest" />
import {
  destinatariosDesdeUsuarios,
  filtrarDestinatarios,
} from '@/utils/destinatarios';

const usuarios = [
  { id: 3, correo: 'pasajero1@rutago.com', nombres: 'Juan', apellidos: 'Pérez', rol: { nombreRol: 'Pasajero' } },
  { id: 1, correo: 'admin@rutago.com', nombres: 'Stefany', apellidos: 'Hernández', rol: { nombreRol: 'Administrador' } },
  { id: 5, correo: 'María.Gomez@rutago.com', nombres: 'María', apellidos: 'Gómez' },
  { id: 9, nombres: 'Sin correo' },
  { correo: 'sinid@rutago.com' },
];

describe('destinatarios de notificaciones', () => {
  it('ordenó por correo alfabéticamente y descartó los incompletos', () => {
    const lista = destinatariosDesdeUsuarios(usuarios);

    expect(lista.map((d) => d.correo)).toEqual([
      'admin@rutago.com',
      'María.Gomez@rutago.com',
      'pasajero1@rutago.com',
    ]);
    expect(lista[0]).toEqual({
      id: 1,
      correo: 'admin@rutago.com',
      nombre: 'Stefany Hernández',
      rol: 'Administrador',
    });
  });

  it('buscó por correo o nombre sin importar tildes ni mayúsculas', () => {
    const lista = destinatariosDesdeUsuarios(usuarios);

    expect(filtrarDestinatarios(lista, 'PASAJERO').map((d) => d.id)).toEqual([3]);
    expect(filtrarDestinatarios(lista, 'maria').map((d) => d.id)).toEqual([5]);
    expect(filtrarDestinatarios(lista, 'perez').map((d) => d.id)).toEqual([3]);
    expect(filtrarDestinatarios(lista, '   ')).toHaveLength(3);
    expect(filtrarDestinatarios(lista, 'nadie')).toHaveLength(0);
  });
});
