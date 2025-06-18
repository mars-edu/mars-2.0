<template>
  <f7-page name="login" class="flex flex-col min-h-screen bg-background">
    <div class="hidden md:flex h-full">
      <div
        class="w-1/2 bg-gradient-to-br from-red-500 to-red-700 flex flex-col items-center justify-center p-12 relative overflow-hidden"
      >
        <div class="absolute inset-0 opacity-10"></div>

        <div class="text-white max-w-md w-full">
          <h1 class="text-3xl font-bold mb-4">Лучшие выбирают лучших!</h1>
          <p class="text-opacity-90">
            Пусть рутина уйдёт, а вдохновение останется — мы автоматизируем
            образовательный процесс.
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
          <form @submit.prevent="handleLogin" class="space-y-8">
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
                type="password"
                v-model:value="password"
                placeholder="Введите пароль"
                :error-message="errors.password"
                required
                class="!border !border-input !rounded-md !bg-transparent !px-3 !py-1 !shadow-sm"
              />
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

            <div class="text-center mt-4">
              <f7-link
                href="/register"
                class="text-primary hover:text-primary/80 font-medium"
              >
                Нет аккаунта? Зарегистрироваться
              </f7-link>
            </div>
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
          <h2 class="text-2xl font-bold mb-2">С возвращением!</h2>
          <p class="text-muted-foreground">
            Войдите в свою учетную запись, чтобы продолжить образовательное
            путешествие.
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
                type="password"
                v-model:value="password"
                placeholder="Введите пароль"
                :error-message="errors.password"
                required
                class="!border !border-input !rounded-md !bg-transparent !px-3 !py-1 !shadow-sm"
              />
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

            <div class="text-center mt-4">
              <f7-link
                href="/register"
                class="text-primary hover:text-primary/80 font-medium"
              >
                Нет аккаунта? Зарегистрироваться
              </f7-link>
            </div>
          </form>
        </div>
      </div>
    </div>
  </f7-page>
</template>

<script setup lang="ts">
import { ref, reactive } from "vue";
import { f7 } from "framework7-vue";
import { useUserStore } from "../stores/userStore";
import AuthService from "../services/auth";
import Logo from "../components/Logo/Logo.vue";

const defaultRedirectTo = "/";

const props = defineProps({
  redirectTo: {
    type: String,
    default: defaultRedirectTo,
  },
});

const userStore = useUserStore();

const username = ref("");
const password = ref("");
const rememberMe = ref(true);
const isLoading = ref(false);
const errors = reactive({
  username: "",
  password: "",
});

const validateForm = () => {
  let isValid = true;
  errors.username = "";
  errors.password = "";

  if (!username.value) {
    errors.username = "ФИО обязательно";
    isValid = false;
  }

  if (!password.value) {
    errors.password = "Пароль обязателен";
    isValid = false;
  }

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

    const redirectTo = props.redirectTo || defaultRedirectTo;
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
