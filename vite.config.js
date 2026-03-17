import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) {
            return undefined
          }

          if (
            id.includes('react-dom') ||
            id.includes('react-router-dom') ||
            id.includes('react-helmet-async') ||
            id.includes(`${'node_modules'}/react/`)
          ) {
            return 'react-core'
          }

          if (
            id.includes('react-toastify') ||
            id.includes('react-modal') ||
            id.includes('react-icons') ||
            id.includes('framer-motion') ||
            id.includes('lucide-react')
          ) {
            return 'ui-vendor'
          }

          if (id.includes('browser-image-compression')) {
            return 'media-vendor'
          }

          if (id.includes('@tanstack/react-query')) {
            return 'data-vendor'
          }

          return 'vendor'
        },
      },
    },
  },
})
