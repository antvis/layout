module.exports = {
  testEnvironment: 'jsdom',
  testRegex: '__tests__/.*test\\.ts?$',
  moduleDirectories: ['node_modules', 'src', 'es'],
  moduleFileExtensions: ['js', 'ts', 'json'],
  modulePathIgnorePatterns: ['<rootDir>/packages'],
  moduleNameMapper: {
    '@antv/layout/(.*)': '<rootDir>/src/$1',
  },
  transform: {
    '^.+\\.tsx?$': ['@swc/jest'],
  },
};
