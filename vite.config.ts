import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    // Capacitor loads from file:// on device — relative paths required
    assetsDir: 'assets',
  },
  base: './',
})
