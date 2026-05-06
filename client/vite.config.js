// client/vite.config.js
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig(({ command, mode }) => ({
  base: "/",
  plugins: [react()],
  css: mode === "test" ? false : undefined,
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
    include: ["src/**/*.test.{js,jsx}", "src/__tests__/**/*.test.{js,jsx}"],
    exclude: ["node_modules", "tests/e2e/**"],
  },
}));
