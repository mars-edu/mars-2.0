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
import { PiniaServerSync } from "./plugin/pinia-server-sync";
import { API_URL } from "../lib/config";
import { httpToWebSocketUrl } from "../lib/utils";
import superjson from "superjson";

Framework7.use(Framework7Vue);

const app = createApp(App);

const pinia = createPinia();

const piniaStorage = localforage.createInstance({
  name: "pinia",
});

pinia.use(
  createPersistedState({
    storage: piniaStorage,
    serializer: {
      serialize: superjson.stringify,
      deserialize: superjson.parse,
    },
  })
);
pinia.use(
  PiniaServerSync({
    url: httpToWebSocketUrl(`${API_URL}/ws`),
    serializer: {
      serialize: superjson.stringify,
      deserialize: superjson.parse,
    },
  })
);

app.use(pinia);

app.directive("auth", vAuth);

registerComponents(app);

window.resetAllPiniaStores = () => {
  const activePinia = getActivePinia();
  if (activePinia) {
    activePinia._s.forEach((store) => store.reset());
  }
};

app.mount("#app");

window.addEventListener("storage", (e) => {
  if (e.key === "auth_token" && e.newValue) {
    // Trigger a connection attempt if token appears in another tab
    // eslint-disable-next-line @typescript-eslint/no-unused-expressions
    PiniaServerSync && typeof PiniaServerSync === "function"; // no-op to keep import
  }
});
