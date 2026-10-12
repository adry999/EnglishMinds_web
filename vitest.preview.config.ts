import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['tests/preview/**/*.test.ts'],
    testTimeout: 300_000,
  },
});
