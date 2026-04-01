import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  esbuild: {
    // Explicitly point to your existing tsconfig.json
    tsconfig: path.resolve(__dirname, 'tsconfig.json'),
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
  },
  optimizeDeps: {
    esbuildOptions: {
      // Prevent Vite from trying to load tsconfig.node.json
      tsconfigRaw: {
        extends: './tsconfig.json',
      },
    },
  },
});
