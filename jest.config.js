/** @type {import('ts-jest').JestConfigWithTsJest} */

// jest.config.js
const nextJest = require('next/jest')
const { pathsToModuleNameMapper } = require("ts-jest");
const { compilerOptions } = require("./tsconfig.json");

const paths = compilerOptions.paths ? compilerOptions.paths : {};

// Providing the path to your Next.js app which will enable loading next.config.js and .env files
const createJestConfig = nextJest({ dir: './' })

// Any custom config you want to pass to Jest
const customJestConfig = {
  preset: 'ts-jest',
  testRegex: '(/__tests__/.*|(\\.|/)(test|spec))\\.(jsx?|js?|tsx?|ts?)$',
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': '<rootDir>/node_modules/babel-jest',
  },
  collectCoverage: true,
  // on node 14.x coverage provider v8 offers good speed and more or less good report
  coverageProvider: 'v8',
  collectCoverageFrom: [
    '<rootDir>/__tests__/src/**/*.test.{js,jsx,ts,tsx}',
    '!**/*.d.ts',
    '!**/node_modules/**',
    '!<rootDir>/out/**',
    '!<rootDir>/.next/**',
    '!<rootDir>/*.config.js',
    '!<rootDir>/coverage/**',
  ],
  testPathIgnorePatterns: [
      "<rootDir>/.next/",
      "<rootDir>/node_modules/",
      "<rootDir>/cypress/",
      "<rootDir>/webdriverio/",
      "<rootDir>/__tests__/__mocks__/",
      "<rootDir>/__tests__/setups/",
  ],
  moduleNameMapper: {
      ...pathsToModuleNameMapper(paths, { prefix: "<rootDir>/" }),
      "\\.(scss|sass|css)$": "identity-obj-proxy",
      '\\.(jpg|jpeg|png|gif|svg)$': ['<rootDir>/__tests__/__mocks__/fileMock.js'],
  },
  moduleDirectories: ['node_modules', '<rootDir>/'],
  setupFilesAfterEnv: ['<rootDir>/__tests__/setups/jest.setup.js'],
  testEnvironment: 'jest-environment-jsdom',
}

// createJestConfig is exported in this way to ensure that next/jest can load the Next.js configuration, which is async
module.exports = createJestConfig(customJestConfig)