import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  root: './',
  base: './',
  publicDir: 'public',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'storytelling/index.html'),
        game: resolve(__dirname, 'index.html'),
      },
    },
  },
  server: {
    open: '/storytelling/index.html',
  },
});
