import path from "path";
import vue from "@vitejs/plugin-vue";
import webfontDownload from "vite-plugin-webfont-dl";

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
    },
    server: {
      host: true,
      allowedHosts: ["fitting-rooster-aware.ngrok-free.app"],
    },
  };
};
