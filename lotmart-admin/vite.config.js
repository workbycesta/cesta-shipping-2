import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3001,
    proxy: {
      '/api/admin': { target: 'http://localhost:2000', changeOrigin: true },
      '/api/price-config': { target: 'http://localhost:2000', changeOrigin: true },
      '/api/manifest': { target: 'http://localhost:2000', changeOrigin: true },
      '/api/users': { target: 'http://localhost:2000', changeOrigin: true },
      '/api/allotments': { target: 'http://localhost:2000', changeOrigin: true },
      '/api/custom-lots': { target: 'http://localhost:2000', changeOrigin: true },
      '/api/bids': { target: 'http://localhost:2000', changeOrigin: true },
    },
  },
})
