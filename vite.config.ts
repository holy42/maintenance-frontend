import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// En développement, /api est relayé vers le backend (pas de problème de CORS).
export default defineConfig({
  plugins: [react()],
  // server: { port: 5173, proxy: { "/api": { target: "http://localhost:8000", changeOrigin: true } } },
  server: { port: 5173, proxy: { "/api": { target: "http://127.0.0.1:8001", changeOrigin: true } } },
});
