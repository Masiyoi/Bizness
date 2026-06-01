import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'https://stunning-space-umbrella-pjgqwxrx5q9vcr77w-5000.app.github.dev',
        changeOrigin: true,
        secure: false,
      }
    }
  }
})