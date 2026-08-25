import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
   build: {
    commonjsOptions: {
      transformMixedEsModules: true,
    }
  } ,
  server: {
    proxy: {
      '/api': {
        target: 'https://localhost:7085',
        changeOrigin: true,
        secure: false,
      },
    },
    
  },
})
