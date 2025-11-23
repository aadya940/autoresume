import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://backend:8000',  /* To expose the IP of the docker image. */
        changeOrigin: true,
        secure: false,
      },
    },
  },
  optimizeDeps: {
    esbuildOptions: {
      target: 'esnext'
    }
  },
  worker: {
    format: 'es'
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'pdfjs': ['pdfjs-dist']
        }
      }
    }
  }
})