import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0', // Listen on all network interfaces
    // Allow the specific hostname of your Pi
    allowedHosts: ['pipedal.local', 'localhost', '127.0.0.1'] 
  }
})
