/** Configuración de pruebas que dejé preparada para el flujo de autenticación. */
module.exports = {
  preset: '<rootDir>/node_modules/jest-expo/jest-preset.js',
  setupFiles: ['<rootDir>/jest.setup.js'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
};
