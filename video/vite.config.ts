import { defineConfig } from 'vite';
export default defineConfig({
  base: './',
  server: { port: 5177, strictPort: true },
  build: { outDir: 'dist', assetsInlineLimit: 0, chunkSizeWarningLimit: 4000 },
});
