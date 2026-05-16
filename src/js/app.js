import { createApp } from "vue";
import Framework7 from "framework7/lite-bundle";
import Framework7Vue, { registerComponents } from "framework7-vue/bundle";
import "framework7/css/bundle";
import "../css/framework7-icons.css";
import { createPinia, getActivePinia } from "pinia";
import { createPersistedState } from "pinia-plugin-persistedstate";
import vAuth from "../directives/auth";
import "../css/app.css";
import App from "../app.vue";
import localforage from "localforage";
import { convexPlugin, convexUrl } from "../lib/convexClient";
import { useLocaleStore } from "../stores/localeStore";
import VueApexCharts from "vue3-apexcharts";

Framework7.use(Framework7Vue);

if (import.meta.env.DEV && typeof window !== "undefined" && "serviceWorker" in navigator) {
  navigator.serviceWorker.getRegistrations().then((registrations) => {
    registrations.forEach((registration) => {
      void registration.unregister();
    });
  });
  if ("caches" in window) {
    caches.keys().then((keys) => {
      keys.forEach((key) => {
        void caches.delete(key);
      });
    });
  }
}

const app = createApp(App);

const pinia = createPinia();

const piniaStorage = localforage.createInstance({
  name: "pinia",
});

pinia.use(
  createPersistedState({
    storage: piniaStorage,
  })
);

app.use(pinia);
app.use(VueApexCharts);

// Initialize Paraglide locale from persisted preference before first render.
// localeStore uses localStorage (sync), so it's already hydrated here.
const localeStore = useLocaleStore();
localeStore.initialize();

// Register Convex plugin if URL is configured
if (convexUrl) {
  app.use(convexPlugin, { url: convexUrl });
}

app.directive("auth", vAuth);

registerComponents(app);

window.resetAllPiniaStores = () => {
  const activePinia = getActivePinia();
  if (activePinia) {
    activePinia._s.forEach((store) => store.reset());
  }
};

app.mount("#app");
