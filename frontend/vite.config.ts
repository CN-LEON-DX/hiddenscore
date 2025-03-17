import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

try {
  // @ts-ignore
  if (typeof globalThis.window === 'undefined' && !global.crypto) {
    const webcrypto = require('node:crypto').webcrypto;
    // @ts-ignore
    global.crypto = webcrypto;
  }
} catch (e) {
  console.warn('Crypto polyfill not applied:', e);
}

export default defineConfig(({ mode }: { mode: string }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const backendApi = env.BACKEND_API
  
  return {
    plugins: [react()],
    server: {
      port: 3000,
      host: true,
      proxy: {
        '/api': {
          target: backendApi,
          changeOrigin: true,
          rewrite: (path: string) => path.replace(/^\/api/, '')
        }
      }
    },
    optimizeDeps: {
      esbuildOptions: {
        define: {
          global: 'globalThis'
        }
      }
    },
    build: {
      reportCompressedSize: false,
      chunkSizeWarningLimit: 1600,
      commonjsOptions: {
        transformMixedEsModules: true
      }
    },
    resolve: {
      alias: {
        'crypto': 'crypto-browserify'
      }
    }
  }
})