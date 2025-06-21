import { createApp } from "vue";
import Framework7 from "framework7/lite-bundle";
import Framework7Vue, { registerComponents } from "framework7-vue/bundle";
import "framework7/css/bundle";
import "../css/framework7-icons.css";
import { createPinia } from "pinia";
import piniaPluginPersistedstate from "pinia-plugin-persistedstate";
import vAuth from "../directives/auth";
import "../css/app.css";
import App from "../components/app.vue";
import { PiniaSharedState } from "./plugin/pinia";

Framework7.use(Framework7Vue);

const app = createApp(App);

const pinia = createPinia();
pinia.use(piniaPluginPersistedstate);
pinia.use(PiniaSharedState);

app.use(pinia);

app.directive("auth", vAuth);

registerComponents(app);

app.mount("#app");
