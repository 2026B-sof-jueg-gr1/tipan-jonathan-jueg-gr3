import { defineConfig } from 'vite';

// Configuración de Vite: servidor de desarrollo y compilación de producción.
// `base: './'` permite abrir el resultado de `npm run build` desde cualquier
// subdirectorio o servidor estático sin rutas absolutas rotas.
export default defineConfig({
  base: './',
  server: {
    port: 5173,
    host: 'localhost',
    open: false,
  },
  preview: {
    port: 4173,
  },
  build: {
    target: 'es2022',
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
    chunkSizeWarningLimit: 2500,
    rollupOptions: {
      output: {
        // Rolldown (Vite 8) exige la forma de función para manualChunks.
        // Separa el motor en su propio fragmento cacheable.
        manualChunks(id) {
          if (id.includes('node_modules/phaser')) return 'phaser';
          return undefined;
        },
      },
    },
  },
});
