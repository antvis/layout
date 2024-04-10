module.exports = {
  testTimeout: 10 * 1000,
  transform: {
    '^.+\\.[tj]s$': ['@swc/jest'],
  },
  collectCoverageFrom: ['src/**/*.ts'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'json'],
  collectCoverage: false,
  testRegex: '(/__tests__/.*\\.(test|spec))\\.(ts|tsx|js)$',
  transformIgnorePatterns: ['node_modules/(?!(?:.pnpm/)?(d3.*))'],
  testPathIgnorePatterns: ['/(lib|esm)/__tests__/'],
};
