import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// base "./" così il sito funziona sia su Cloudflare Pages sia in una sottocartella
export default defineConfig({
  base: "./",
  plugins: [react()],
});
