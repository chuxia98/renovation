import { defineConfig } from 'vitest/config';

export default defineConfig({
  base: '/renovation/',
  // HDRI/贴图在启动前用 top-level await 加载
  build: {
    target: 'esnext',
  },
  test: {
    environment: 'jsdom',
  },
});
