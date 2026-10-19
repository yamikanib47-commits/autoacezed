import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  // Proxy API calls to `wrangler pages dev` during local development
  server: { proxy: { "/api": "http://localhost:8788" } },
});
