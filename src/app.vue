<template>
  <f7-app v-bind="f7params">
    <f7-view
      class="safe-areas"
      :main="true"
      browserHistorySeparator="#!"
      browserHistoryRoot=""
      :iosSwipeBack="true"
      :reloadPages="true"
      :xhrCache="false"
      :loadInitialPage="false"
      :preloadPreviousPage="false"
      :removeElements="true"
      :uniqueHistory="true"
      :allowDuplicateUrls="false"
      browserHistoryInitialMatch
    ></f7-view>
  </f7-app>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeMount } from "vue";
import { f7, f7ready } from "framework7-vue";
import type { Framework7Parameters, Router } from "framework7/types";
import { useUserStore } from "./stores/userStore";
import { Role } from "./types/user";
import { useThemeStore } from "./stores/themeStore";
import { routeMiddleware } from "./middleware/routeMiddleware";

import routes from "./js/routes";
import store from "./js/store";

const userStore = useUserStore();
const themeStore = useThemeStore();
console.log("[App] Component setup initiated");

interface CustomRouteOptions extends Router.RouteOptions {
  roles?: Role[];
}

interface CustomRoute extends Router.Route {
  options?: CustomRouteOptions;
}

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
    browserHistoryTabs: "push",
    preloadPreviousPage: false,
    reloadPages: true,
    removeElements: true,
  },

  on: {
    routeChange(newRoute: any) {
      console.log("[Router] Route changed:", newRoute);

      routeMiddleware({
        router: {
          app: f7,
          views: {
            main: {
              router: f7.views.main.router,
            },
          },
        },
        to: newRoute,
        resolve: (redirect) => {
          if (redirect) {
            console.log("[Middleware] Redirecting to:", redirect.url);
            f7.views.main.router.navigate(redirect.url, redirect.options);
          } else {
            console.log("[Middleware] Route approved without redirect");
          }
        },
        reject: () => {
          console.log("[Middleware] Route rejected, redirecting to home");
          f7.views.main.router.navigate("/");
        },
      });
    },
    init() {
      console.log("[Framework7] Framework7 initialized");
    },
  },
};

onMounted(async () => {
  await userStore.initialize();
  console.log("[App] Component mounted");
  console.log(
    "[App] Verbose logging enabled for authentication and routing process"
  );

  f7ready(async () => {
    console.log("[F7] Framework7 ready");
    console.log("[F7] Detailed initialization process starting");

    if (f7 && f7.views && f7.views.main) {
      console.log("[Router] Main view router initialized");
      console.log("[Router] Detailed router configuration:", {
        browserHistory: f7.views.main.params.browserHistory,
        browserHistoryRoot: f7.views.main.params.browserHistoryRoot,
      });

      const currentRoute = f7.views.main.router.currentRoute;
      if (
        currentRoute &&
        currentRoute.url &&
        currentRoute.url.startsWith("/login") &&
        userStore.isAuthenticated
      ) {
        console.log(
          "[Auth] User already authenticated, redirecting from login page to home"
        );
        f7.views.main.router.navigate("/");
        return;
      }

      if (!userStore.isAuthenticated) {
        console.log(
          "[Auth] User not authenticated, performing comprehensive route requirement check"
        );

        console.log(
          "[Auth] Verbose current route object details:",
          currentRoute ? JSON.stringify(currentRoute, null, 2) : "null"
        );

        let requiresAuth = false;

        if (currentRoute) {
          const routeMeta: CustomRouteOptions =
            (currentRoute.route as CustomRoute)?.options || {};
          const roles = (routeMeta.roles as Role[]) ?? [];
          requiresAuth = roles.length > 0;
          console.log("[Auth] Detailed route authentication analysis:", {
            routeMeta: routeMeta,
            requiredRoles: roles,
            requiresAuth: requiresAuth,
          });

          if (requiresAuth) {
            console.log("[Auth] Verbose redirect information:", {
              reason: "Authentication required",
              currentRoute: currentRoute.url,
              redirectTo: "/login/",
              redirectProps: { redirectTo: currentRoute.url },
            });
            f7.views.main.router.navigate("/login/", {
              props: {
                redirectTo: currentRoute.url,
              },
            });
          }
        }
      } else {
        console.log("[Auth] Verbose authentication status:", {
          message: "User is authenticated, proceeding normally",
          userRoles: userStore.currentUser?.roles,
        });
      }
    } else {
      console.warn(
        "[Router] Detailed error: Main view router not initialized properly",
        {
          f7Exists: !!f7,
          viewsExists: !!f7?.views,
          mainViewExists: !!f7?.views?.main,
        }
      );
    }

    themeStore.initTheme();
  });
});
</script>
