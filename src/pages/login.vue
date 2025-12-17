<template>
  <f7-page name="login" class="flex flex-col min-h-screen bg-background">
    <div class="hidden md:flex h-full">
      <div
        class="w-1/2 bg-gradient-to-br from-red-500 to-red-700 flex flex-col items-center justify-center p-12 relative overflow-hidden"
      >
        <div class="absolute inset-0 opacity-10"></div>

        <div class="text-white max-w-md w-full text-center">
          <h1 class="text-5xl font-bold mb-4">Добро пожаловать на Марс!</h1>
          <p class="text-lg text-white text-opacity-95">
            Передовая образовательная экосистема будущего.
          </p>
        </div>
      </div>

      <div
        class="w-1/2 flex items-center justify-center p-8 bg-background relative"
      >
        <div
          class="bg-card text-card-foreground rounded-3xl p-12 shadow-xl max-w-md w-full transform hover:shadow-2xl transition-all duration-300"
        >
          <div class="flex justify-center mb-8">
            <Logo class="h-16 w-auto" />
          </div>
          <form @submit.prevent="handleLogin" class="space-y-4">
            <div class="space-y-2">
              <label class="block text-sm font-semibold mb-2"> ФИО </label>
              <f7-input
                type="text"
                v-model:value="username"
                placeholder="Введите ФИО"
                :error-message="errors.username"
                required
                class="!border !border-input !rounded-md !bg-transparent !px-3 !py-1 !shadow-sm"
              />
            </div>

            <div class="space-y-2">
              <label class="block text-sm font-semibold mb-2"> Пароль </label>
              <f7-input
                :type="showPassword ? 'text' : 'password'"
                v-model:value="password"
                placeholder="Введите пароль"
                :error-message="errors.password"
                required
                class="!border !border-input !rounded-md !bg-transparent !px-3 !py-1 !shadow-sm"
              />
            </div>

            <div class="flex items-center space-x-2 py-2">
              <f7-checkbox
                v-model:checked="showPassword"
                class="!flex-shrink-0"
              />
              <span class="text-sm text-gray-600"> Показать пароль </span>
            </div>

            <div class="flex items-center justify-between py-2">
              <!-- <f7-checkbox
                v-model:checked="rememberMe"
                class="text-foreground hover:text-primary transition-colors duration-200 flex items-center"
              >
                Запомнить меня
              </f7-checkbox> -->
              <f7-link
                href="/restore-password"
                class="text-primary hover:text-primary/80 font-medium transition-colors duration-200 underline-offset-2 hover:underline whitespace-nowrap"
              >
                Забыли пароль?
              </f7-link>
            </div>

            <f7-button
              type="submit"
              fill
              large
              :loading="isLoading"
              class="w-full bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 py-4"
            >
              <span class="relative z-10">Войти</span>
              <div
                v-if="isLoading"
                class="absolute inset-0 flex items-center justify-center bg-primary/80 rounded-xl transition-opacity duration-200"
              >
                <span class="loading-spinner"></span>
              </div>
            </f7-button>

            <!-- <div class="text-center mt-4">
              <f7-link
                href="/register"
                class="text-primary hover:text-primary/80 font-medium"
              >
                Нет аккаунта? Зарегистрироваться
              </f7-link>
            </div> -->
          </form>
        </div>
      </div>
    </div>

    <div class="md:hidden flex flex-col min-h-screen">
      <div
        class="flex-shrink-0 pt-12 pb-8 flex justify-end px-8 bg-gradient-to-b from-red-500 to-red-600"
      >
        <Logo
          variant="light"
          class="transform hover:scale-105 transition-transform duration-300"
        />
      </div>

      <div class="flex-1 px-6 py-8 bg-background">
        <div
          class="bg-card text-card-foreground rounded-3xl p-8 shadow-xl mb-4 -mt-12 transform hover:shadow-2xl transition-all duration-300"
        >
          <div class="flex justify-center mb-6">
            <Logo class="h-14 w-auto" />
          </div>
          <h2 class="text-2xl font-bold mb-2">Добро пожаловать на Марс!</h2>
          <p class="text-muted-foreground">
            Передовая образовательная экосистема будущего.
          </p>

          <form @submit.prevent="handleLogin" class="space-y-6 mt-8">
            <div>
              <label class="block text-sm font-medium mb-2"> ФИО </label>
              <f7-input
                type="text"
                v-model:value="username"
                placeholder="Введите ФИО"
                :error-message="errors.username"
                required
                class="!border !border-input !rounded-md !bg-transparent !px-3 !py-1 !shadow-sm"
              />
            </div>

            <div>
              <label class="block text-sm font-medium mb-2"> Пароль </label>
              <f7-input
                :type="showPassword ? 'text' : 'password'"
                v-model:value="password"
                placeholder="Введите пароль"
                :error-message="errors.password"
                required
                class="!border !border-input !rounded-md !bg-transparent !px-3 !py-1 !shadow-sm"
              />
            </div>

            <div class="flex items-center space-x-2">
              <f7-checkbox
                v-model:checked="showPassword"
                class="text-foreground flex items-center"
              >
                Показать пароль
              </f7-checkbox>
            </div>

            <div class="flex items-center justify-between space-x-4">
              <!-- <f7-checkbox
                v-model:checked="rememberMe"
                class="text-foreground flex items-center"
                >Запомнить меня</f7-checkbox
              > -->
              <f7-link
                href="/restore-password"
                class="text-primary hover:text-primary/80 font-medium whitespace-nowrap"
                >Забыли пароль?</f7-link
              >
            </div>

            <f7-button
              type="submit"
              fill
              large
              :loading="isLoading"
              class="w-full bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg shadow-sm transition-colors duration-200"
            >
              Войти
            </f7-button>

            <!-- <div class="text-center mt-4">
              <f7-link
                href="/register"
                class="text-primary hover:text-primary/80 font-medium"
              >
                Нет аккаунта? Зарегистрироваться
              </f7-link>
            </div> -->
          </form>
        </div>
      </div>
    </div>
  </f7-page>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, onBeforeMount, computed } from "vue";
import { f7 } from "framework7-vue";
import AuthService from "../services/auth";
import Logo from "../components/Logo/Logo.vue";
import { useUserStore } from "../stores/userStore";

console.log("[LoginPage] Component setup initiated");

const userStore = useUserStore();
const defaultRedirectTo = "/home";

const props = defineProps({
  redirectTo: {
    type: String,
    default: defaultRedirectTo,
  },
});

/**
 * Get the redirect destination from URL query params or props.
 * This preserves the intended destination on page refresh.
 */
const redirectDestination = computed(() => {
  // Check URL query params first (set by root route redirect)
  const urlParams = new URLSearchParams(window.location.search);
  const queryRedirect = urlParams.get("redirect");

  if (queryRedirect) {
    console.log("[LoginPage] Redirect from query param:", queryRedirect);
    return queryRedirect;
  }

  // Also check browser location pathname in case we're directly refreshing
  const pathname = window.location.pathname;
  const publicRoutes = ["/", "/login", "/register", "/restore-password"];
  if (pathname && !publicRoutes.includes(pathname)) {
    console.log("[LoginPage] Redirect from pathname:", pathname);
    return pathname;
  }

  // Fall back to props or default
  return props.redirectTo || defaultRedirectTo;
});

console.log("[LoginPage] Props received:", {
  redirectTo: props.redirectTo,
  defaultRedirectTo,
});

const username = ref("");
const password = ref("");
const rememberMe = ref(true);
const isLoading = ref(false);
const showPassword = ref(false);
const errors = reactive({
  username: "",
  password: "",
});

onBeforeMount(() => {
  console.log("[LoginPage] Component before mount");

  // Redirect authenticated users away from login page
  if (userStore.isAuthenticated) {
    const destination = redirectDestination.value;
    console.log("[LoginPage] User already authenticated, redirecting to:", destination);
    f7.views.main.router.navigate(destination, {
      clearPreviousHistory: true,
    });
  }
});

onMounted(() => {
  console.log("[LoginPage] Component mounted");
  console.log("[LoginPage] Form state initialized:", {
    username: username.value,
    password: password.value ? "[HIDDEN]" : "",
    rememberMe: rememberMe.value,
    isLoading: isLoading.value,
    showPassword: showPassword.value,
  });
});

const validateForm = () => {
  console.log("[LoginPage] Validating form");
  let isValid = true;
  errors.username = "";
  errors.password = "";

  if (!username.value) {
    errors.username = "ФИО обязательно";
    isValid = false;
    console.log("[LoginPage] Username validation failed - empty field");
  }

  if (!password.value) {
    errors.password = "Пароль обязателен";
    isValid = false;
    console.log("[LoginPage] Password validation failed - empty field");
  }

  console.log("[LoginPage] Form validation result:", { isValid, errors });
  return isValid;
};

const handleLogin = async (e: Event) => {
  e.preventDefault();

  console.log("Login attempt started");
  console.log(`Username: ${username.value}`);

  if (!validateForm()) {
    console.log("Form validation failed");
    return;
  }

  isLoading.value = true;
  console.log("Loading state set to true");

  try {
    const response = await AuthService.login({
      username: username.value,
      password: password.value,
      remember: rememberMe.value,
    });

    console.log("Login service response received", response);

    const redirectTo = redirectDestination.value;
    console.log(`Redirect destination: ${redirectTo}`);

    if (response.success) {
      console.log("Login successful, navigating to redirect path");
      f7.views.main.router.navigate(redirectTo);
    } else {
      console.log("Login failed", response.message);
      f7.toast.show({
        text: response.message || "Неверное имя пользователя или пароль",
        closeTimeout: 3000,
        position: "center",
      });
    }
  } catch (error) {
    console.error("Login error", error);
    f7.toast.show({
      text: "Произошла ошибка при входе. Попробуйте позже.",
      closeTimeout: 3000,
      position: "center",
    });
  } finally {
    console.log("Login process completed, setting loading state to false");
    isLoading.value = false;
  }
};
</script>

<style scoped>
.loading-spinner {
  @apply w-6 h-6 border-4 border-white border-t-transparent rounded-full animate-spin;
}
</style>
