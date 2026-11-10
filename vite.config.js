import { defineConfig } from 'vitest/config';

export default defineConfig({
  base: '/renovation/',
  test: {
    environment: 'jsdom',
  },
});
