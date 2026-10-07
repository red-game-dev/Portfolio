/** @type {import('jest').Config} */

const nextJest = require("next/jest");
const { pathsToModuleNameMapper } = require("ts-jest");
const { compilerOptions } = require("./tsconfig.json");

const paths = compilerOptions.paths ? compilerOptions.paths : {};

// Loads next.config.js and the .env files, and mocks styles and images the way Next does.
const createJestConfig = nextJest({ dir: "./" });

const customJestConfig = {
  testRegex: "(/__tests__/.*|(\\.|/)(test|spec))\\.(jsx?|js?|tsx?|ts?)$",
  // Coverage of the source, not of the tests. Off by default; npm run test:coverage turns it on.
  collectCoverageFrom: [
    "<rootDir>/src/**/*.{ts,tsx}",
    "!<rootDir>/src/data/**",
    "!**/*.d.ts",
  ],
  coverageProvider: "v8",
  testPathIgnorePatterns: [
    "<rootDir>/.next/",
    "<rootDir>/node_modules/",
    "<rootDir>/__tests__/__mocks__/",
    "<rootDir>/__tests__/setups/",
    "/fixtures/",
  ],
  moduleNameMapper: {
    ...pathsToModuleNameMapper(paths, { prefix: "<rootDir>/" }),
    "\\.(scss|sass|css)$": "identity-obj-proxy",
    "\\.(jpg|jpeg|png|gif|svg)$": ["<rootDir>/__tests__/__mocks__/fileMock.js"],
  },
  moduleDirectories: ["node_modules", "<rootDir>/"],
  setupFilesAfterEnv: ["<rootDir>/__tests__/setups/jest.setup.js"],
  testEnvironment: "jest-environment-jsdom",
};

// next/jest puts its SWC transform first, which skips Babel macros, so twin.macro would never compile and no
// component could be rendered. Every file goes through the project's Babel config instead.
module.exports = async () => {
  const config = await createJestConfig(customJestConfig)();

  return {
    ...config,
    transform: { "^.+\\.(js|jsx|ts|tsx|mjs)$": "<rootDir>/__tests__/setups/babelTransform.js" },
  };
};
