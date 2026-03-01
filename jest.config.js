module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  testMatch: ["**/tests/**/*.test.ts"],
  coverageDirectory: "coverage",
  collectCoverage: true,
  collectCoverageFrom: [
    "src/**/*.ts",
    "packages/**/*.ts",
    "!src/**/*.d.ts",
    "!tests/**/*.ts",
  ],
  coverageReporters: ["text", "lcov"],
  globals: {
    "ts-jest": {
      tsconfig: "tsconfig.json",
    },
  },
};
