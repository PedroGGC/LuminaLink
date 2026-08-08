import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: true,
    watch: {
      usePolling: true,   // required for Docker on Windows (inotify doesn't fire)
      interval: 300,
    },
    proxy: {
      '/api': {
        target: 'http://app:3000',
        changeOrigin: true,
      },
    },
  },
})
