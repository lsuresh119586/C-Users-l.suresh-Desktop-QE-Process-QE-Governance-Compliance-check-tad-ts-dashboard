import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5174,
    host: true
  },
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index-react.html'),
        legacy: resolve(__dirname, 'index.html'),
        testsCovered: resolve(__dirname, 'tests-covered.html'),
        unified: resolve(__dirname, 'unified-dashboard.html'),
      }
    }
  }
});
