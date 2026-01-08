module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  setupFiles: ['dotenv/config'],
  testMatch: ['**/*.test.ts', '**/*.integration.test.ts'],
  testPathIgnorePatterns: ['/node_modules/', '/.aws-sam/'],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.test.ts',
    '!src/**/*.integration.test.ts',
    '!src/__tests__/**',
  ],
};
