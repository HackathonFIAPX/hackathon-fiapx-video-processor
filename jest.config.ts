export default {
    preset: 'ts-jest',
    testEnvironment: 'node',
    testMatch: ['**/__tests__/**/*.spec.ts', '**/?(*.)+(spec).ts'],
    moduleFileExtensions: ['ts', 'js', 'json'],
    clearMocks: true,
    testPathIgnorePatterns: ['<rootDir>/src/tests/'],
    coveragePathIgnorePatterns: ['<rootDir>/src/tests/', "/node_modules/", "/.*\\.entity\\.ts$"],
    coverageDirectory: 'coverage',
    coverageThreshold: {
      global: {
        branches: 80,
        functions: 80,
        lines: 80,
        statements: 80,
      },
    },
  };