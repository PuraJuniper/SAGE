/** @type {import('ts-jest/dist/types').InitialOptionsTsJest} */
module.exports = {
  preset: 'ts-jest/presets/js-with-ts-esm',
  testEnvironment: 'node',
  globals: {
    'ts-jest': {
      isolatedModules: true, // disables type-checking, speeds up tests considerably (try it)
    },
  },
};