// Import Vue
import { createApp } from "vue";

// Import Framework7
import Framework7 from "framework7/lite-bundle";

// Import Framework7-Vue Plugin
import Framework7Vue, { registerComponents } from "framework7-vue/bundle";

// Import Framework7 Styles
import "framework7/css/bundle";

// Import Framework7 Icons
import "../css/framework7-icons.css";

// Import Pinia
import { createPinia } from "pinia";
import piniaPluginPersistedstate from "pinia-plugin-persistedstate";

// Import auth directive
import vAuth from "../directives/auth";

import "../css/app.css";

// Import App Component
import App from "../components/app.vue";

Framework7.use(Framework7Vue);

// Init App
const app = createApp(App);

// Create and use Pinia
const pinia = createPinia();
pinia.use(piniaPluginPersistedstate);
app.use(pinia);

// Register custom directives
app.directive("auth", vAuth);

// Register Framework7 Vue components
registerComponents(app);

// Mount the app
app.mount("#app");
