// client/vite.config.js
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig(({ command }) => ({
  base: command === "build" ? "/FullStack-E-Commerce/" : "/",
  plugins: [react()],
  server: {
    proxy: {
      "/api": {
        target: "http://localhost:5001",
        changeOrigin: true,
      },
    },
  },
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: "./src/setupTests.js",
    css: { postcss: null },
    include: ["src/**/*.test.{js,jsx}", "src/__tests__/**/*.test.{js,jsx}"],
    exclude: ["node_modules", "tests/e2e/**"],
  },
}));
