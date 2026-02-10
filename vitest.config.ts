import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['src/api/**/*.spec.ts'],
    environment: 'node',
    globals: false,
  },
});
