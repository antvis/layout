// module.exports = {

//   preset: "ts-jest",
//   collectCoverage: false,
//   collectCoverageFrom: [
//     "packages/layout/src/**/*.{ts,js}",
//     "!**/node_modules/**",
//     "!**/vendor/**",
//   ],

/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  testEnvironment: "jsdom",
  testRegex: "__tests__/.*test\\.ts?$",
  moduleDirectories: ["node_modules", "src", "es"],
  moduleFileExtensions: ["js", "ts", "json"],
  moduleNameMapper: {
    "@antv/layout/(.*)": "<rootDir>/src/$1",
  },
  transform: {
    // '^.+\\.[tj]sx?$' to process js/ts with `ts-jest`
    // '^.+\\.m?[tj]sx?$' to process js/ts/mjs/mts with `ts-jest`
    "^.+\\.tsx?$": [
      "ts-jest",
      {
        diagnostics: false,
      },
    ],
  },
};
