import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

const WEB_PORT = Number(process.env.WEB_PORT || 4300);
const API_PORT = Number(process.env.API_PORT || 4301);

export default defineConfig({
  plugins: [react(), tailwindcss()],
  define: { global: 'globalThis' },
  server: {
    port: WEB_PORT,
    strictPort: true,
    host: true,
    allowedHosts: ['.ngrok-free.app', '.ngrok-free.dev', '.ngrok.app', '.trycloudflare.com'],
    proxy: {
      '/api': { target: `http://localhost:${API_PORT}`, rewrite: (p) => p.replace(/^\/api/, '') },
    },
  },
});
