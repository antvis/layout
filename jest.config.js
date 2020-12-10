module.exports = {
  runner: 'jest-electron/runner',
  testEnvironment: 'jest-electron/environment',
  preset: 'ts-jest',
  collectCoverage: false,
  collectCoverageFrom: ['src/**/*.{ts,js}', '!**/node_modules/**', '!**/vendor/**'],
  testRegex: '__tests__/.*-spec\\.ts?$',
  moduleDirectories: ['node_modules', 'src', 'es'],
  moduleFileExtensions: ['js', 'ts', 'json'],
  moduleNameMapper: {
    '@layout/types': '<rootDir>/types',
    '@layout/(.*)': '<rootDir>/src/$1',
  },
  globals: {
    'ts-jest': {
      diagnostics: false,
    },
  },
};
