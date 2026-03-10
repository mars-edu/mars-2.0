import path from "node:path";
import vue from "@vitejs/plugin-vue";
import webfontDownload from "vite-plugin-webfont-dl";
import { visualizer } from "rollup-plugin-visualizer";
import { ViteImageOptimizer } from "vite-plugin-image-optimizer";
import { VitePWA } from "vite-plugin-pwa";
import buildInfoPlugin from "./vite-plugins/build-info.js";
import { nodePolyfills } from "vite-plugin-node-polyfills";
import Icons from "unplugin-icons/vite";

const SRC_DIR = path.resolve(__dirname, "./src");
const PUBLIC_DIR = path.resolve(__dirname, "./public");
const BUILD_DIR = path.resolve(__dirname, "./dist");

export default async () => {
  return {
    plugins: [
      // nodePolyfills(), // Temporarily disabled for Vite 8 compatibility
      VitePWA({
        registerType: "autoUpdate",
        workbox: {
          globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2}"],
          runtimeCaching: [
            {
              urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
              handler: "CacheFirst",
              options: {
                cacheName: "google-fonts-cache",
                expiration: {
                  maxEntries: 10,
                  maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
                },
                cacheableResponse: {
                  statuses: [0, 200],
                },
              },
            },
            {
              urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
              handler: "CacheFirst",
              options: {
                cacheName: "gstatic-fonts-cache",
                expiration: {
                  maxEntries: 10,
                  maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
                },
                cacheableResponse: {
                  statuses: [0, 200],
                },
              },
            },
            {
              urlPattern: /\/api\/.*/i,
              handler: "NetworkFirst",
              options: {
                cacheName: "api-cache",
                expiration: {
                  maxEntries: 100,
                  maxAgeSeconds: 60 * 5, // 5 minutes
                },
                networkTimeoutSeconds: 10,
              },
            },
          ],
        },
      }),
      vue({
        template: {
          compilerOptions: {
            isCustomElement: (tag) => tag.includes("swiper-"),
          },
        },
      }),
      webfontDownload(
        [
          "https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap",
        ],
        {
          injectAsStyleTag: true,
          minifyCss: true,
          embedFonts: false,
          async: true,
        }
      ),
      ViteImageOptimizer({}),
      visualizer(),
      buildInfoPlugin(),
      Icons({
        compiler: "vue3",
        autoInstall: false,
      }),
    ],
    define: {
      __BUILD_TIME__: JSON.stringify(new Date().toISOString()),
      __BUILD_ENV__: JSON.stringify(process.env.NODE_ENV || "development"),
      __APP_VERSION__: JSON.stringify(process.env.APP_VERSION || "1.0.0"),
    },
    root: SRC_DIR,
    envDir: path.resolve(__dirname, "./"),
    // Must be absolute to support clean-URL deep-link reloads in production (e.g. /journals/:id).
    base: "/",
    publicDir: PUBLIC_DIR,
    build: {
      outDir: BUILD_DIR,
      assetsInlineLimit: 0,
      emptyOutDir: true,
      rolldownOptions: {
        treeshake: true,
        output: {
          advancedChunks: {
            minSize: 20000, // 20KB minimum chunk size
            groups: [
              {
                name: "framework7",
                test: /node_modules\/(framework7|framework7-vue)/,
                priority: 10,
              },
              {
                name: "vue-vendor",
                test: /node_modules\/(vue|pinia)/,
                priority: 20,
              },
              {
                name: "convex",
                test: /node_modules\/convex/,
                priority: 15,
              },
            ],
          },
        },
      },
      // Enable compression and optimization
      minify: 'terser',
      terserOptions: {
        compress: {
          drop_console: true,
          drop_debugger: true,
          pure_funcs: ['console.log', 'console.info'],
        },
      },
      // Enable source maps for debugging but with smaller size
      sourcemap: false,
      // Optimize chunk size
      chunkSizeWarningLimit: 1000,
    },
    resolve: {
      alias: {
        "@": SRC_DIR,
        "@convex": path.resolve(__dirname, "./convex"),
      },
      extensions: [".js", ".ts", ".jsx", ".tsx", ".json", ".vue"],
    },
    optimizeDeps: {
      include: [
        "dayjs",
        "dayjs/plugin/isBetween",
        "dayjs/plugin/customParseFormat",
        "dayjs/locale/ru",
        "vue-advanced-cropper",
      ],
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
