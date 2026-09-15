import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    // Fixed and enforced (not just a preference) - your e-commercev2 project
    // tends to occupy 5173-5175, and a silently-different port here is
    // exactly what breaks the backend's CORS origin allowlist. If 5180 is
    // ever taken, Vite now errors instead of drifting to another port.
    port: 5180,
    strictPort: true,
  },
})
