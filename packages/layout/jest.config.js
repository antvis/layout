module.exports = {
  preset: 'ts-jest/presets/js-with-ts',
  transform: {
    '^.+\\.[tj]s$': [
      'ts-jest',
      {
        diagnostics: {
          exclude: ['**'],
        },
        tsconfig: {
          allowJs: true,
          target: 'esnext',
          esModuleInterop: true,
        },
      },
    ],
  },
  collectCoverageFrom: ['src/**/*.ts'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'json'],
  collectCoverage: false,
  testRegex: '(/__tests__/.*\\.(test|spec))\\.(ts|tsx|js)$',
  transformIgnorePatterns: ['/node_modules/(?!(d3.*)/)'],
  testPathIgnorePatterns: ['/(lib|esm)/__tests__/'],
};
