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

<!-- reloadAll: true,
    reloadCurrent: true,
    history: true,
    ignoreCache: true, -->

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from "vue";
import { f7, f7ready } from "framework7-vue";
import type { Framework7Parameters, Router } from "framework7/types";
import { useUserStore, Role } from "../stores/userStore";
import { useThemeStore } from "../stores/themeStore";
import { routeMiddleware } from "../middleware/routeMiddleware";

import routes from "../js/routes";
import store from "../js/store";

type CustomRoute = Router.Route & {
  options?: {
    roles?: Role[];
  };
};

const userStore = useUserStore();
const themeStore = useThemeStore();
console.log("[App] Component setup initiated");

const f7params: Framework7Parameters = {
  name: "Mars",
  theme: "ios",
  store: store,
  routes: routes,

  view: {
    browserHistory: true,
    browserHistorySeparator: "#!",
    browserHistoryRoot: "",
    preloadPreviousPage: false,
    reloadPages: true,
    removeElements: true,
  },

  on: {
    routeChange(newRoute: any) {
      console.log("[Router] Route changed:", newRoute);

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

onMounted(() => {
  console.log("[App] Component mounted");
  console.log(
    "[App] Verbose logging enabled for authentication and routing process"
  );

  f7ready(async () => {
    console.log("[F7] Framework7 ready");
    console.log("[F7] Detailed initialization process starting");

    console.log("[UserStore] Initializing user store");
    console.log("[UserStore] Attempting to load user authentication state");
    await userStore.initialize();
    console.log("[UserStore] User authenticated:", userStore.isAuthenticated);
    console.log("[UserStore] Detailed authentication state:", {
      isAuthenticated: userStore.isAuthenticated,
      userRoles: userStore.roles,
    });

    if (f7 && f7.views && f7.views.main) {
      console.log("[Router] Main view router initialized");
      console.log("[Router] Detailed router configuration:", {
        browserHistory: f7.views.main.params.browserHistory,
        browserHistoryRoot: f7.views.main.params.browserHistoryRoot,
      });

      if (!userStore.isAuthenticated) {
        const currentRoute = f7.views.main.router.currentRoute;
        console.log(
          "[Auth] User not authenticated, performing comprehensive route requirement check"
        );

        console.log(
          "[Auth] Verbose current route object details:",
          JSON.stringify(currentRoute, null, 2)
        );

        let requiresAuth = false;

        if (currentRoute) {
          const routeMeta =
            currentRoute.route?.meta || currentRoute.route?.options || {};
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
          userRoles: userStore.roles,
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

// Clean up event listeners when component is unmounted
onBeforeUnmount(() => {
  // Destroy custom navigation handler if it exists
  // if (customNavigation.value) {
  //   customNavigation.value.destroy();
  // }
});
</script>
