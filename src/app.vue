<template>
  <f7-app v-bind="f7params">
    <InactiveTabIndicator />
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
  </f7-app>
</template>

<script setup lang="ts">
import { onMounted, onBeforeMount, computed } from "vue";
import { f7, f7ready } from "framework7-vue";
import type { Framework7Parameters } from "framework7/types";
import { useUserStore } from "./stores/userStore";
import { useThemeStore } from "./stores/themeStore";

import routes from "./js/routes";
import store from "./js/store";
import { initVisibilityDetector } from "./composables/useVisibility";
import InactiveTabIndicator from "./components/InactiveTabIndicator.vue";

const userStore = useUserStore();
const themeStore = useThemeStore();
console.log("[App] Component setup initiated");

/**
 * Get the initial URL from the browser's current location.
 * This ensures that on page refresh, the app navigates to the correct route
 * instead of defaulting to the first route in the routes array.
 */
const initialUrl = computed(() => {
  const pathname = window.location.pathname;
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
    buttonOk: "Хорошо",
    buttonCancel: "Отмена",
  },

  picker: {
    toolbarCloseText: "Готово",
  },

  calendar: {
    monthNames: [
      "Январь",
      "Февраль",
      "Март",
      "Апрель",
      "Май",
      "Июнь",
      "Июль",
      "Август",
      "Сентябрь",
      "Октябрь",
      "Ноябрь",
      "Декабрь",
    ],
    monthNamesShort: [
      "Янв",
      "Фев",
      "Мар",
      "Апр",
      "Май",
      "Июн",
      "Июл",
      "Авг",
      "Сен",
      "Окт",
      "Ноя",
      "Дек",
    ],
    dayNames: [
      "Воскресенье",
      "Понедельник",
      "Вторник",
      "Среда",
      "Четверг",
      "Пятница",
      "Суббота",
    ],
    dayNamesShort: ["Вс", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"],
    firstDay: 1,
  },

  smartSelect: {
    popupCloseLinkText: "Назад",
    searchbarPlaceholder: "Поиск",
    searchbarDisableText: "Отмена",
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

  // Normalize URLs with trailing slashes
  // This runs before Framework7 processes the route
  if (window.location.pathname.length > 1 && window.location.pathname.endsWith('/')) {
    const normalizedPath = window.location.pathname.slice(0, -1);
    const newUrl = normalizedPath + window.location.search + window.location.hash;
    console.log(`[App] Normalizing URL from ${window.location.pathname} to ${normalizedPath}`);
    window.history.replaceState(null, '', newUrl);
  }

  f7ready(() => {
    console.log("[F7] Framework7 ready");
    themeStore.initTheme();

    if (f7 && f7.views && f7.views.main) {
      console.log("[Router] Main view router initialized");

      // Add popstate listener to normalize URLs on browser back/forward
      window.addEventListener('popstate', () => {
        if (window.location.pathname.length > 1 && window.location.pathname.endsWith('/')) {
          const normalizedPath = window.location.pathname.slice(0, -1);
          console.log(`[App] Normalizing URL on popstate from ${window.location.pathname} to ${normalizedPath}`);
          f7.views.main.router.navigate(normalizedPath, { reloadCurrent: true });
        }
      });

      // Route guards in routes.ts will handle authentication
    }
  });
});
</script>
