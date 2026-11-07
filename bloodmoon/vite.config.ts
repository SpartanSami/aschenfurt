import { defineConfig } from "vite";
import { viteSingleFile } from "vite-plugin-singlefile";

// "npm run build"        -> dist/ (statisch hostbar, z. B. GitHub Pages)
// "npm run build:single" -> dist-single/index.html (eine einzige Datei, per Doppelklick spielbar)
export default defineConfig(({ mode }) => ({
  base: "./",
  plugins: mode === "single" ? [viteSingleFile()] : [],
  build: {
    outDir: mode === "single" ? "dist-single" : "dist",
    target: "es2022",
    chunkSizeWarningLimit: 4000,
    assetsInlineLimit: mode === "single" ? 100_000_000 : 4096,
  },
  server: { port: 5173, host: true },
}));
