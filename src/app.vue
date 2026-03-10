<template>
  <f7-app v-bind="f7params">
    <f7-view
      class="safe-areas"
      :main="true"
      :iosSwipeBack="false"
      :reloadPages="true"
      :xhrCache="false"
      :loadInitialPage="true"
      :url="initialUrl"
      :preloadPreviousPage="false"
      :removeElements="true"
      :uniqueHistory="true"
      :allowDuplicateUrls="false"
      :browserHistory="true"
      browserHistorySeparator=""
      :browserHistoryInitialMatch="true"
      :browserHistoryOnLoad="true"
    ></f7-view>
    <AiAssistantFab />
  </f7-app>
</template>

<script setup lang="ts">
import { onMounted, onBeforeMount, computed } from "vue";
import AiAssistantFab from './components/AiAssistantFab.vue';
import { f7, f7ready } from "framework7-vue";
import type { Framework7Parameters } from "framework7/types";
import { useUserStore } from "./stores/userStore";
import { useThemeStore } from "./stores/themeStore";
import {
  f7_dialog_ok,
  f7_dialog_cancel,
  f7_picker_done,
  f7_smart_select_close,
  f7_smart_select_search_placeholder,
  f7_smart_select_search_cancel,
  f7_month_jan, f7_month_feb, f7_month_mar, f7_month_apr,
  f7_month_may, f7_month_jun, f7_month_jul, f7_month_aug,
  f7_month_sep, f7_month_oct, f7_month_nov, f7_month_dec,
  f7_month_jan_short, f7_month_feb_short, f7_month_mar_short, f7_month_apr_short,
  f7_month_may_short, f7_month_jun_short, f7_month_jul_short, f7_month_aug_short,
  f7_month_sep_short, f7_month_oct_short, f7_month_nov_short, f7_month_dec_short,
  f7_day_sun, f7_day_mon, f7_day_tue, f7_day_wed,
  f7_day_thu, f7_day_fri, f7_day_sat,
  f7_day_sun_short, f7_day_mon_short, f7_day_tue_short, f7_day_wed_short,
  f7_day_thu_short, f7_day_fri_short, f7_day_sat_short,
} from "@/paraglide/messages";

import routes from "./js/routes";
import store from "./js/store";
import { initVisibilityDetector } from "./composables/useVisibility";

const userStore = useUserStore();
const themeStore = useThemeStore();
console.log("[App] Component setup initiated");

/**
 * Get the initial URL from the browser's current location.
 * This ensures that on page refresh, the app navigates to the correct route
 * instead of defaulting to the first route in the routes array.
 * Trailing slashes are normalized in index.html before this runs.
 */
const initialUrl = computed(() => {
  let pathname = window.location.pathname;

  // Normalize trailing slash if it wasn't caught by index.html
  if (pathname.length > 1 && pathname.endsWith('/')) {
    pathname = pathname.slice(0, -1);
  }

  const search = window.location.search;
  const url = pathname + search;
  console.log("[App] Initial URL computed:", url);
  return url || "/";
});

const f7params: Framework7Parameters = {
  name: "Mars",
  theme: "ios",
  store: store,
  routes: routes,

  dialog: {
    buttonOk: f7_dialog_ok(),
    buttonCancel: f7_dialog_cancel(),
  },

  picker: {
    toolbarCloseText: f7_picker_done(),
  },

  calendar: {
    monthNames: [
      f7_month_jan(), f7_month_feb(), f7_month_mar(), f7_month_apr(),
      f7_month_may(), f7_month_jun(), f7_month_jul(), f7_month_aug(),
      f7_month_sep(), f7_month_oct(), f7_month_nov(), f7_month_dec(),
    ],
    monthNamesShort: [
      f7_month_jan_short(), f7_month_feb_short(), f7_month_mar_short(), f7_month_apr_short(),
      f7_month_may_short(), f7_month_jun_short(), f7_month_jul_short(), f7_month_aug_short(),
      f7_month_sep_short(), f7_month_oct_short(), f7_month_nov_short(), f7_month_dec_short(),
    ],
    dayNames: [
      f7_day_sun(), f7_day_mon(), f7_day_tue(), f7_day_wed(),
      f7_day_thu(), f7_day_fri(), f7_day_sat(),
    ],
    dayNamesShort: [
      f7_day_sun_short(), f7_day_mon_short(), f7_day_tue_short(), f7_day_wed_short(),
      f7_day_thu_short(), f7_day_fri_short(), f7_day_sat_short(),
    ],
    firstDay: 1,
  },

  smartSelect: {
    popupCloseLinkText: f7_smart_select_close(),
    searchbarPlaceholder: f7_smart_select_search_placeholder(),
    searchbarDisableText: f7_smart_select_search_cancel(),
  },

  popover: {
    closeByBackdropClick: true,
    closeOnEscape: true,
  },

  popup: {
    closeByBackdropClick: true,
    closeOnEscape: true,
  },

  view: {
    browserHistory: true,
    browserHistorySeparator: '',  // Empty string removes #!/ prefix
    browserHistoryOnLoad: true,
    browserHistoryTabs: "push",
    preloadPreviousPage: false,
    reloadPages: true,
    removeElements: true,
  },

  on: {
    init() {
      console.log("[Framework7] Framework7 initialized");
    },
  },
};

onBeforeMount(async () => {
  // Initialize user store before mounting so route guards have access to auth state
  await userStore.initialize();
  console.log("[App] User store initialized");
});

onMounted(() => {
  initVisibilityDetector();
  console.log("[App] Component mounted");

  f7ready(() => {
    console.log("[F7] Framework7 ready");
    themeStore.initTheme();

    if (f7 && f7.views && f7.views.main) {
      console.log("[Router] Main view router initialized");
      // Route guards in routes.ts will handle authentication and URL normalization
    }
  });
});
</script>
