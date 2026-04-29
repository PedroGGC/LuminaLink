import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: true, // Needed for Docker to expose the port correctly
    proxy: {
      '/api': {
        target: 'http://app:3000', // Target the backend docker container
        changeOrigin: true,
      },
    },
  },
})
