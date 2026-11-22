/** Habilité act() para las pruebas de componentes y dejé este archivo listo para mocks globales. */
global.IS_REACT_ACT_ENVIRONMENT = true;

/**
 * Con la caché de Jest vacía la transformación de módulos satura el equipo y el
 * reloj de 5 s de Jest se adelanta: el test se aborta a la mitad y su trabajo
 * pendiente contamina al siguiente. Doy 15 s para que las aserciones siguen
 * siendo las mismas y sólo aguanten la saturación del arranque.
 */
jest.setTimeout(15000);
