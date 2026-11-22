/// <reference types="jest" />

jest.mock('@expo/vector-icons', () => ({
  Ionicons: { font: { ionicons: 101 } },
  MaterialCommunityIcons: { font: { 'material-community': 102 } },
}));

import { FUENTES_ICONOS } from '@/services/fuentes';

describe('registro centralizado de fuentes de iconos', () => {
  it('incluye una sola vez cada familia usada por la app', () => {
    expect(FUENTES_ICONOS).toEqual({
      'material-community': 102,
      ionicons: 101,
    });
    expect(Object.keys(FUENTES_ICONOS)).toHaveLength(2);
  });
});
