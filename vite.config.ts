import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  base: process.env.VITE_BASE_PATH || "/",
  publicDir: ".public-release",
  plugins: [react()],
  optimizeDeps: { entries: ["index.html"] },
  server: {
    port: 3000,
  },
  build: {
    target: "es2022",
  },
});
