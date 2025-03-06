import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// No need to import tailwindcss here - it's handled via postcss.config.js
export default defineConfig({
  plugins: [react()]
})