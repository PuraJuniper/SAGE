/** @type {import('ts-jest/dist/types').InitialOptionsTsJest} */
module.exports = {
  preset: 'ts-jest/presets/js-with-ts-esm',
  testEnvironment: 'jest-environment-jsdom',
  setupFilesAfterEnv: ['./jest.setup.js'],
  globals: {
    'ts-jest': {
      isolatedModules: true, // speeds up tests considerably but disables type-checking (try it)
    },
  },
  moduleNameMapper: {
    "\\.css$": "<rootDir>/test/__mocks__/styleMock.js"
  }
};