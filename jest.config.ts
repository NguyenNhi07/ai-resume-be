import type { Config } from 'jest';
import { defaults } from 'jest-config';

export default async (): Promise<Config> => ({
  bail: 1, // stop when 1 test fail,
  clearMocks: defaults.clearMocks,
  collectCoverage: defaults.collectCoverage, // collect coverage information during test execution
  collectCoverageFrom: undefined, // it may significantly slow down your tests.
  coverageDirectory: 'test-coverage', // The directory where Jest should output its coverage files.
  // coveragePathIgnorePatterns: ['<rootDir>/dist/', '<rootDir>/node_modules/'],
  coverageThreshold: {
    // minimum threshold enforcement for coverage results
    global: { branches: 80, functions: 80, lines: 80, statements: -10 },
  },
  displayName: { name: 'e2e', color: 'blue' },
  fakeTimers: defaults.fakeTimers, // long timeout that we don't want to wait for in a test,
  forceCoverageMatch: defaults.forceCoverageMatch,
  globals: defaults.globals, // A set of global variables that need to be available in all test environments.
  injectGlobals: defaults.injectGlobals,
  maxConcurrency: defaults.maxConcurrency,
  moduleDirectories: [...defaults.moduleDirectories],
  moduleFileExtensions: ['ts', 'js'],
  moduleNameMapper: {
    // file path alias
    '^src/(.*)$': '<rootDir>/src/$1',
  },
  modulePathIgnorePatterns: [...defaults.modulePathIgnorePatterns],
  modulePaths: [],
  openHandlesTimeout: defaults.openHandlesTimeout, //Warning if Jest does not exit cleanly this number of milliseconds after it completes
  randomize: false, // randomize the order of the tests in a file.
  reporters: undefined, // Use this configuration option to add reporters to Jest
  resetMocks: defaults.resetMocks, // Automatically reset mock state before every test
  resetModules: defaults.resetModules,
  restoreMocks: defaults.restoreMocks,
  rootDir: '.', // directory containing your Jest config file or the package.json or the pwd if no package.json is found
  setupFiles: defaults.setupFiles, // A list of paths to modules that run some code to configure or set up the testing
  runner: defaults.runner, // Default: "jest-runner"
  slowTestThreshold: defaults.slowTestThreshold, // The number of seconds after which a test is considered as slow and reported as such in the results.
  // testMatch: defaults.testMatch,
  testRegex: '.spec.ts$', // can't use both testMatch and testRegex,
  testTimeout: 60000,
  transform: { '^.+\\.(t|j)s$': 'ts-jest' },
  transformIgnorePatterns: defaults.transformIgnorePatterns,
  workerThreads: true, // Whether to use worker threads for parallelization. Child processes are used by default.
  detectOpenHandles: true,
});
