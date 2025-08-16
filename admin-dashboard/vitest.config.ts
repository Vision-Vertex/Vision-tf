import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './vitest.setup.ts',

    coverage: {
      reporter: ['text', 'json', 'html'],
      exclude: ['node_modules/', 'test/', 'vitest.setup.ts'],
      provider: 'istanbul', // or 'v8'
    },

    alias: {
      '@': path.resolve(__dirname, './src'),
    },

    watch: false,
  },
});














