import path from "node:path";
import vue from "@vitejs/plugin-vue";
import webfontDownload from "vite-plugin-webfont-dl";
import { visualizer } from "rollup-plugin-visualizer";
import { ViteImageOptimizer } from "vite-plugin-image-optimizer";

const SRC_DIR = path.resolve(__dirname, "./src");
const PUBLIC_DIR = path.resolve(__dirname, "./public");
const BUILD_DIR = path.resolve(__dirname, "./dist");

export default async () => {
  return {
    plugins: [
      vue({
        template: {
          compilerOptions: {
            isCustomElement: (tag) => tag.includes("swiper-"),
          },
        },
      }),
      webfontDownload([
        "https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap",
      ]),
      ViteImageOptimizer({}),
      visualizer(),
    ],
    root: SRC_DIR,
    base: "",
    publicDir: PUBLIC_DIR,
    build: {
      outDir: BUILD_DIR,
      assetsInlineLimit: 0,
      emptyOutDir: true,
      rollupOptions: {
        treeshake: false,
      },
    },
    resolve: {
      alias: {
        "@": SRC_DIR,
      },
      extensions: [".js", ".ts", ".jsx", ".tsx", ".json", ".vue"],
    },
    server: {
      host: true,
      allowedHosts: ["fitting-rooster-aware.ngrok-free.app"],
      fs: {
        strict: false,
      },
      hmr: {
        overlay: false,
      },
      watch: {
        usePolling: true,
        interval: 1000,
      },
      proxy: {
        "/api": "http://localhost:3001",
      },
    },
  };
};
