/// <reference types="vitest/config" />
import { getViteConfig } from 'astro/config';

export default getViteConfig({
  test: {
    include: ['src/**/*.test.ts', 'server/**/*.test.ts', 'tests/**/*.test.ts'],
    exclude: ['tests/pages/**', 'tests/staging/**', 'tests/preview/**', 'node_modules/**'],
    testTimeout: 60_000,
  },
});
