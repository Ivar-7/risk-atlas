import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'
import { fileURLToPath } from 'node:url'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    rollupOptions: {
      input: {
        home: fileURLToPath(new URL('./index.html', import.meta.url)),
        dashboard: fileURLToPath(new URL('./dashboard/index.html', import.meta.url)),
        login: fileURLToPath(new URL('./login/index.html', import.meta.url)),
      },
    },
  },
})
