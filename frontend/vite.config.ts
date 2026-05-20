import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // Avoid CORS in dev: browser calls Vite origin, Vite forwards to backend container.
      "/v1": {
        // In Docker dev, `VITE_PROXY_TARGET` should be `http://backend:3000`.
        // In local dev, omit it and we fall back to localhost.
        target:
          process.env.VITE_PROXY_TARGET ??
          process.env.VITE_API_BASE_URL ??
          "http://localhost:3000",
        changeOrigin: true,
        secure: false
      }
    }
  }
});
