import { defineConfig } from 'vite'
import { resolve } from 'path'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'VueNetworkTime',
      formats: ['es', 'umd'],
      fileName: (format) => {
        return format === 'es' 
          ? `vue-network-time.js` 
          : `vue-network-time.umd.cjs`
      }
    },
    rollupOptions: {
      external: ['vue'],
      output: {
        globals: {
          vue: 'Vue'
        }
      }
    },
    sourcemap: true
  },
  worker: {
    format: 'es'
  }
})
