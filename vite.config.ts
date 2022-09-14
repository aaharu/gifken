import {resolve} from 'node:path'
import {defineConfig} from 'vite'
import dts from 'vite-plugin-dts'

export default defineConfig({
  publicDir: 'assets',
  build: {
    lib: {
      formats: ['es'],
      entry: resolve(__dirname, 'src/gifken.ts'),
    },
  },
  plugins: [dts()],
})
