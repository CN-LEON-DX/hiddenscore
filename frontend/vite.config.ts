import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }: { mode: string }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const backendApi = env.BACKEND_API || 'http://localhost:8081'
  
  return {
    plugins: [react()],
    server: {
      port: 3000,
      host: true,
      proxy: {
        // Single catch-all proxy for the backend
        '/api': {
          target: backendApi,
          changeOrigin: true,
          rewrite: (path: string) => path.replace(/^\/api/, '')
        }
      }
    },
    // Xử lý lỗi crypto.getRandomValues
    optimizeDeps: {
      esbuildOptions: {
        define: {
          global: 'globalThis'
        }
      }
    },
    build: {
      // Bỏ qua cảnh báo
      reportCompressedSize: false,
      chunkSizeWarningLimit: 1600,
    }
  }
})