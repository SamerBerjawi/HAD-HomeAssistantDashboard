import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';

// Second front end ("pro" design language). Same providers, hooks, stores and server as the
// classic app; only the UI layer under src/pro differs. Built to dist-pro/ and served when the
// server runs with UI=pro. No service worker: the classic app owns the PWA.
const repoRoot = __dirname;

export default defineConfig({
  root: path.resolve(repoRoot, 'src/pro'),
  publicDir: path.resolve(repoRoot, 'public'),
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(repoRoot, 'src'),
    },
  },
  server: {
    fs: { allow: [repoRoot] },
    watch: { ignored: ['**/data/**'] },
  },
  build: {
    outDir: path.resolve(repoRoot, 'dist-pro'),
    emptyOutDir: true,
    rollupOptions: {
      output: {
        manualChunks(id: string) {
          if (!id.includes('/node_modules/')) return undefined;
          if (/\/node_modules\/(react|react-dom|scheduler)\//.test(id)) return 'vendor-react';
          return undefined;
        },
      },
    },
  },
});
