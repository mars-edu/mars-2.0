<template>
  <f7-app v-bind="f7params">
    <!-- <f7-view class="safe-areas" :main="true"></f7-view> -->

    <f7-view
      class="safe-areas"
      :main="true"
      :pushState="true"
      :browserHistory="true"
      browserHistorySeparator="#!"
      browserHistoryRoot=""
      :iosSwipeBack="true"
      :reloadPages="false"
      :xhrCache="false"
      :loadInitialPage="true"
      :preloadPreviousPage="true"
      :removeElements="false"
      :uniqueHistory="true"
      :allowDuplicateUrls="false"
      browserHistoryInitialMatch
    ></f7-view>
  </f7-app>
</template>

<!-- reloadAll: true,
    reloadCurrent: true,
    history: true,
    ignoreCache: true, -->

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { f7, f7ready } from "framework7-vue";
import type { Framework7Parameters, Router } from "framework7/types";
import { useUserStore, Role } from "../stores/userStore";
import { routeMiddleware } from "../middleware/routeMiddleware";

import routes from "../js/routes";
import store from "../js/store";

type CustomRoute = Router.Route & {
  options?: {
    roles?: Role[];
  };
};

const userStore = useUserStore();

const f7params: Framework7Parameters = {
  name: "Mars",
  theme: "ios",
  store: store,
  routes: routes,

  view: {
    browserHistory: true,
    browserHistorySeparator: "#!",
    browserHistoryRoot: "",
    preloadPreviousPage: true,
  },

  on: {
    routeChange(newRoute: any) {
      // Apply route middleware
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
            f7.views.main.router.navigate(redirect.url, redirect.options);
          }
        },
        reject: () => {
          f7.views.main.router.navigate("/");
        },
      });
    },
    init() {
      console.log("Framework7 initialized");
    },
  },
};

onMounted(() => {
  f7ready(async () => {
    // Initialize user store
    await userStore.initialize();

    // Ensure router is properly initialized
    if (f7 && f7.views && f7.views.main) {
      // Navigate to login if not authenticated and current route requires authentication
      if (!userStore.isAuthenticated) {
        const currentRoute = f7.views.main.router.currentRoute;

        // Add null checks to prevent TypeError
        if (currentRoute && currentRoute.route) {
          const routeOptions = currentRoute.route.options as { roles?: Role[] };
          const requiresAuth =
            routeOptions?.roles && routeOptions.roles.length > 0;

          if (requiresAuth) {
            f7.views.main.router.navigate("/login/", {
              props: {
                redirectTo: currentRoute.url,
              },
            });
          }
        }
      }
    }
  });
});
</script>
