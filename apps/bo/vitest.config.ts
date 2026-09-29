import { fileURLToPath, URL } from 'node:url';

import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: { '@front': fileURLToPath(new URL('../front/src', import.meta.url)) },
  },
  test: {
    environment: 'node',
    include: ['src/**/*.unit.spec.ts'],
    reporters: ['default'],
  },
});
