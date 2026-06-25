// Self-contained jest config: transform TS/JSX with babel-jest using the
// @babel/preset-* packages pinned in devDependencies, rather than relying on
// next/jest's SWC transform (which did not apply under CI's locked deps).
// The current test suite targets pure modules with relative imports, so no
// tsconfig path-alias mapping is needed.
export default {
  testEnvironment: 'jest-environment-jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  testMatch: ['**/?(*.)+(test|spec).[jt]s?(x)'],
  // Ignore Next build output so a local `.next/standalone/package.json` doesn't
  // trigger a jest-haste-map naming collision.
  modulePathIgnorePatterns: ['<rootDir>/.next/'],
  transform: {
    '^.+\\.[jt]sx?$': [
      'babel-jest',
      {
        presets: [
          ['@babel/preset-env', { targets: { node: 'current' } }],
          ['@babel/preset-react', { runtime: 'automatic' }],
          '@babel/preset-typescript',
        ],
      },
    ],
  },
};
