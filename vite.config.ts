import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';

export default defineConfig({
  base: process.env.VITE_BASE_PATH ?? '/',
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-firebase-core': ['firebase/app', 'firebase/auth', 'firebase/storage'],
          'vendor-firebase-db': ['firebase/firestore'],
          'vendor-markdown': ['react-markdown', 'remark-gfm', 'rehype-sanitize'],
        },
      },
    },
  },
});
