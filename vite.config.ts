import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  esbuild: {
    tsconfig: './tsconfig.json', // Force Vite to use this tsconfig
  },
  build: {
    outDir: 'dist', // optional, default is 'dist'
    sourcemap: false, // optional, can enable if needed
  },
});
