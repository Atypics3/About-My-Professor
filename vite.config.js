import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      input: {
        app: "index.html",
        content: "src/content.js",
        background: "src/background.js",
      },
      output: {
        entryFileNames: "[name].js",
      },
    },
  },
});
