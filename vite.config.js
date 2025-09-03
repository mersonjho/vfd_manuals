import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
//  base: '/vfd_manuals/',
  server: {
    historyApiFallback: true
  }
})
