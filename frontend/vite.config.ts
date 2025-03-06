import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// No need to import tailwindcss here - it's handled via postcss.config.js
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    host: true,
    // proxy: {
    //   '/api': 'http://localhost:8081'
    // }
  }
})