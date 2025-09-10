import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3005
  },
  resolve: {
    alias: {
      'xeva': path.resolve(__dirname, '../../src/index.ts')
    }
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'three', '@react-three/fiber', '@react-three/drei', '@react-three/uikit', '@react-three/uikit-default', 'zustand']
  }
})