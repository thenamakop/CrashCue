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
    "!packages/cli/src/index.ts",
    "!packages/notifier/src/cli.ts",
  ],
  coverageThreshold: {
    global: {
      branches: 85,
      functions: 90,
      lines: 95,
      statements: 95,
    },
  },
  coverageReporters: ["text", "lcov"],
  transform: {
    "^.+\\.tsx?$": [
      "ts-jest",
      {
        tsconfig: "tsconfig.json",
      },
    ],
  },
  moduleNameMapper: {
    "^@crashcue/shared-assets$":
      "<rootDir>/packages/shared-assets/src/index.ts",
    "^@crashcue/notifier$": "<rootDir>/packages/notifier/src/index.ts",
    "^@crashcue/shared-config$":
      "<rootDir>/packages/shared-config/src/index.ts",
    "^vscode$": "<rootDir>/packages/vscode-extension/__mocks__/vscode.ts",
  },
  modulePathIgnorePatterns: ["<rootDir>/dist/"],
};
