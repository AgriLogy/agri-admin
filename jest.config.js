const nextJest = require('next/jest');

// next/jest wires SWC transform, tsconfig path aliases (@/*, @component/*),
// CSS/asset mocks and next.config — so tests resolve modules exactly like the app.
const createJestConfig = nextJest({ dir: './' });

/** @type {import('jest').Config} */
const customJestConfig = {
  testEnvironment: 'jest-environment-jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  testMatch: ['**/?(*.)+(test|spec).[jt]s?(x)'],
  // Ignore Next build output so a local `.next/standalone/package.json` doesn't
  // trigger a jest-haste-map naming collision.
  modulePathIgnorePatterns: ['<rootDir>/.next/'],
};

module.exports = createJestConfig(customJestConfig);
