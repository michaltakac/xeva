import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 3000,
    sourcemapType: 'source-map'
  },
  css: {
    devSourcemap: true
  },
  resolve: {
    alias: {
      // Point to source files instead of built files to avoid module issues
      'xreva': resolve(__dirname, '../../src/index.ts')
    },
    dedupe: ['react', 'react-dom', 'three']
  },
  optimizeDeps: {
    // Force pre-bundling of these dependencies
    include: [
      'react',
      'react-dom',
      'three',
      '@react-three/fiber',
      '@react-three/drei',
      '@react-three/xr',
      '@react-three/uikit',
      '@react-three/uikit-default',
      'zustand'
    ]
  },
  build: {
    sourcemap: true
  },
  esbuild: {
    sourcemap: true
  },
  root: __dirname,
  cacheDir: resolve(__dirname, '../../node_modules/.vite/xr')
})