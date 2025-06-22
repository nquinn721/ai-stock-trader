// Backend Jest Configuration
module.exports = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: 'src',
  testRegex: '.*\\.spec\\.ts$',
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest',
  },
  transformIgnorePatterns: ['node_modules/(?!(@xenova/transformers)/)'],
  collectCoverageFrom: [
    '**/*.(t|j)s',
    '!**/*.spec.ts',
    '!**/*.e2e-spec.ts',
    '!**/node_modules/**',
    '!**/dist/**',
  ],
  coverageDirectory: '../coverage',
  testEnvironment: 'node',
  setupFilesAfterEnv: ['<rootDir>/../test/setup.ts'],
  moduleNameMapper: {
    '^@xenova/transformers$': '<rootDir>/../__mocks__/@xenova/transformers.js',
  },
};
