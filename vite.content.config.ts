import { resolve } from 'path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  build: {
    sourcemap: false,
    target: 'es2021',
    outDir: 'dist',
    emptyOutDir: false,
    copyPublicDir: false,
    rollupOptions: {
      input: resolve(__dirname, 'src/content.tsx'),
      output: {
        format: 'iife',
        entryFileNames: 'content.js',
        inlineDynamicImports: true,
      },
    },
  },
  plugins: [react()],
})
