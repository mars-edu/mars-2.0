import path from "node:path";
import vue from "@vitejs/plugin-vue";
import webfontDownload from "vite-plugin-webfont-dl";
import { visualizer } from "rollup-plugin-visualizer";
import { ViteImageOptimizer } from "vite-plugin-image-optimizer";
import { VitePWA } from "vite-plugin-pwa";
import buildInfoPlugin from "./vite-plugins/build-info.js";

const SRC_DIR = path.resolve(__dirname, "./src");
const PUBLIC_DIR = path.resolve(__dirname, "./public");
const BUILD_DIR = path.resolve(__dirname, "./dist");

export default async () => {
  return {
    plugins: [
      VitePWA(),
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
      buildInfoPlugin(),
    ],
    define: {
      __BUILD_TIME__: JSON.stringify(new Date().toISOString()),
      __BUILD_ENV__: JSON.stringify(process.env.NODE_ENV || "development"),
      __APP_VERSION__: JSON.stringify(process.env.APP_VERSION || "1.0.0"),
    },
    root: SRC_DIR,
    base: "",
    publicDir: PUBLIC_DIR,
    build: {
      outDir: BUILD_DIR,
      assetsInlineLimit: 0,
      emptyOutDir: true,
      rollupOptions: {
        treeshake: false,
        output: {
          manualChunks: {
            framework7: ["framework7", "framework7-vue", "framework7-icons"],
          },
        },
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
      allowedHosts: ["*"],
      fs: {
        strict: false,
      },
      hmr: {
        overlay: false,
      },
      watch: {
        usePolling: true,
        interval: 400,
      },
      proxy: {
        "/api": {
          target: "http://localhost:3001",
          ws: true,
        },
      },
    },
  };
};
