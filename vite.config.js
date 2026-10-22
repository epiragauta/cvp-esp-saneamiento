import { defineConfig } from 'vite';

// base relativo para que funcione en cualquier ruta de Vercel / subcarpetas
export default defineConfig({
  base: './',
  build: {
    outDir: 'dist',
    assetsInlineLimit: 0, // los GeoJSON grandes se sirven como estáticos
  },
});
