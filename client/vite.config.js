import react from '@vitejs/plugin-react'
import process from 'node:process'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig, loadEnv } from 'vite'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [react(), tailwindcss()],
    server: {
      proxy: { '/api': env.RISK_ATLAS_API_TARGET || 'http://127.0.0.1:8000' },
    },
    resolve: {
      alias: {
        // Must mirror the `paths` block in tsconfig.json or the shadcn `@/` imports
        // resolve in the type-checker but fail in Vite.
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    build: {
      chunkSizeWarningLimit: 600,
      rollupOptions: {
        input: {
          home: fileURLToPath(new URL('./index.html', import.meta.url)),
          dashboard: fileURLToPath(new URL('./dashboard/index.html', import.meta.url)),
          login: fileURLToPath(new URL('./login/index.html', import.meta.url)),
          register: fileURLToPath(new URL('./register/index.html', import.meta.url)),
          app: fileURLToPath(new URL('./app/index.html', import.meta.url)),
        },
      },
    },
  }
})
