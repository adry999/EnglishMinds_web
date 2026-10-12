import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['tests/staging/**/*.test.ts'],
    testTimeout: 300_000,
  },
});
