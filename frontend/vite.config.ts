import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import tailwindcss from '@tailwindcss/vite';
import * as path from 'node:path';

// The path the app is served under: '/' locally, '/omnistore/' behind the florian-piel.space gateway.
const base = (process.env.VITE_BASE ?? '/').replace(/\/?$/, '/');

// https://vite.dev/config/
export default defineConfig({
  base,
  // A prefixed build lands in dist/<prefix>/, so the static host serves the files at the same paths
  // index.html references (/omnistore/assets/...), whether or not the gateway sits in front.
  build: { outDir: `dist${base}` },
  plugins: [
    react({
      tsDecorators: true,
    }),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      '@shared': path.resolve(__dirname, '../shared/src'),
      '@assets': path.resolve(__dirname, './src/assets'),
    },
    extensions: ['.ts', '.tsx', '.js', '.jsx', '.json'],
  },
  server: {
    fs: {
      allow: ['..'],
    },
    watch: {
      usePolling: true,
    },
    host: true,
    strictPort: true,
    port: 5173,
  },
});