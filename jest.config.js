/** @type {import('jest').Config} */
module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",

  roots: ["<rootDir>/packages", "<rootDir>/tests"],

  testMatch: ["**/__tests__/**/*.test.ts", "**/?(*.)+(spec|test).ts"],

  moduleFileExtensions: ["ts", "js", "json"],

  transform: {
    "^.+\\.tsx?$": [
      "ts-jest",
      {
        tsconfig: "tsconfig.json",
      },
    ],
  },

  testPathIgnorePatterns: ["/node_modules/", "/dist/", "/build/"],

  modulePathIgnorePatterns: ["/dist/", "/build/"],

  collectCoverage: true,

  collectCoverageFrom: [
    "packages/**/*.ts",
    "!**/*.d.ts",
    "!**/dist/**",
    "!**/build/**",
    "!packages/cli/src/index.ts",
    "!packages/notifier/src/cli.ts",
  ],

  coverageDirectory: "<rootDir>/coverage",

  coverageReporters: ["text", "lcov", "html"],

  coverageThreshold: {
    global: {
      branches: 85,
      functions: 90,
      lines: 95,
      statements: 95,
    },
  },

  verbose: true,

  detectOpenHandles: true,
  forceExit: true,

  clearMocks: true,
  restoreMocks: true,
  resetMocks: true,

  maxWorkers: "50%",

  moduleNameMapper: {
    "^@crashcue/shared-assets$":
      "<rootDir>/packages/shared-assets/src/index.ts",
    "^@crashcue/notifier$": "<rootDir>/packages/notifier/src/index.ts",
    "^@crashcue/shared-config$":
      "<rootDir>/packages/shared-config/src/index.ts",
    "^vscode$": "<rootDir>/packages/vscode-extension/__mocks__/vscode.ts",
    "^conf$": "<rootDir>/tests/__mocks__/conf.ts",
  },
};
