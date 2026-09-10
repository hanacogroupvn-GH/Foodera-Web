import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const apiPort = env.PORT?.trim() || '8787';
  const localApiOrigin = `http://localhost:${apiPort}`;

  return {
    build: {
      target: 'es2020', // Modern browsers — avoids unnecessary polyfills
      sourcemap: true, // Enable source maps for production debugging
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (!id.includes('node_modules')) {
              return undefined;
            }

            if (id.includes('@google/genai')) {
              return 'genai';
            }

            if (id.includes('lucide-react')) {
              return 'icons';
            }

            // React core — stable, long cache
            if (id.includes('react-dom') || id.includes('react/') || id.includes('react-router')) {
              return 'react-vendor';
            }

            // Map library — only used on map pages
            if (id.includes('leaflet') || id.includes('react-leaflet')) {
              return 'leaflet';
            }

            return undefined;
          }
        }
      }
    },
    server: {
      port: 3000,
      host: 'localhost',
      strictPort: true,
      origin: 'http://localhost:3000',
      hmr: {
        host: 'localhost',
        clientPort: 3000,
        protocol: 'ws'
      },
      proxy: {
        '/api': {
          target: localApiOrigin,
          changeOrigin: true
        }
      }
    },
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.')
      }
    }
  };
});
