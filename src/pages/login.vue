<template>
  <f7-page name="login" class="flex flex-col min-h-screen bg-gray-50">
    <div class="hidden md:flex h-full">
      <div
        class="w-1/2 bg-gradient-to-br from-red-500 to-red-700 flex flex-col items-center justify-center p-12 relative overflow-hidden"
      >
        <div class="absolute inset-0 opacity-10"></div>

        <div class="max-w-md w-full">
          <h1 class="text-3xl font-bold text-white mb-4">С возвращением!</h1>
          <p class="text-white text-opacity-90">
            Войдите в свою учетную запись, чтобы продолжить образовательное
            путешествие.
          </p>
        </div>
      </div>

      <div
        class="w-1/2 flex items-center justify-center p-8 bg-gray-50 relative"
      >
        <Logo
          class="absolute top-8 right-8 text-red-600 transform hover:scale-105 transition-transform duration-300"
        />
        <div
          class="bg-white rounded-3xl p-12 shadow-xl max-w-md w-full transform hover:shadow-2xl transition-all duration-300"
        >
          <form @submit.prevent="handleLogin" class="space-y-8">
            <div class="space-y-2">
              <label class="block text-sm font-semibold text-gray-800 mb-2">
                Имя пользователя
              </label>
              <f7-input
                type="text"
                v-model:value="username"
                placeholder="Введите имя пользователя"
                :error-message="errors.username"
                required
                class="!border !border-input !rounded-md !bg-transparent !px-3 !py-1 !shadow-sm"
              />
            </div>

            <div class="space-y-2">
              <label class="block text-sm font-semibold text-gray-800 mb-2">
                Пароль
              </label>
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
              <f7-checkbox
                v-model:checked="rememberMe"
                class="text-gray-700 hover:text-red-600 transition-colors duration-200 flex items-center"
              >
                Запомнить меня
              </f7-checkbox>
              <f7-link
                class="text-red-600 hover:text-red-800 font-medium transition-colors duration-200 underline-offset-2 hover:underline whitespace-nowrap"
              >
                Забыли пароль?
              </f7-link>
            </div>

            <f7-button
              type="submit"
              fill
              large
              :loading="isLoading"
              class="w-full bg-red-600 hover:bg-red-700 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 py-4"
            >
              <span class="relative z-10">Войти</span>
              <div
                v-if="isLoading"
                class="absolute inset-0 flex items-center justify-center bg-red-700 rounded-xl transition-opacity duration-200"
              >
                <span class="loading-spinner"></span>
              </div>
            </f7-button>
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

      <div class="flex-1 px-6 py-8 bg-gray-50">
        <div
          class="bg-white rounded-3xl p-8 shadow-xl mb-4 -mt-12 transform hover:shadow-2xl transition-all duration-300"
        >
          <h2 class="text-2xl font-bold text-gray-900 mb-2">С возвращением!</h2>
          <p class="text-gray-600">
            Войдите в свою учетную запись, чтобы продолжить образовательное
            путешествие.
          </p>

          <form @submit.prevent="handleLogin" class="space-y-6 mt-8">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Имя пользователя
              </label>
              <f7-input
                type="text"
                v-model:value="username"
                placeholder="Введите имя пользователя"
                :error-message="errors.username"
                required
                class="!border !border-input !rounded-md !bg-transparent !px-3 !py-1 !shadow-sm"
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Пароль
              </label>
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
              <f7-checkbox
                v-model:checked="rememberMe"
                class="text-gray-700 flex items-center"
                >Запомнить меня</f7-checkbox
              >
              <f7-link
                class="text-red-600 hover:text-red-800 font-medium whitespace-nowrap"
                >Забыли пароль?</f7-link
              >
            </div>

            <f7-button
              type="submit"
              fill
              large
              :loading="isLoading"
              class="w-full bg-red-600 hover:bg-red-700 rounded-lg shadow-sm transition-colors duration-200"
            >
              Войти
            </f7-button>
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
const rememberMe = ref(false);
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
    errors.username = "Имя пользователя обязательно";
    isValid = false;
  }

  if (!password.value) {
    errors.password = "Пароль обязателен";
    isValid = false;
  }

  return isValid;
};

const handleLogin = async () => {
  if (!validateForm()) return;

  isLoading.value = true;

  try {
    const response = await AuthService.login({
      username: username.value,
      password: password.value,
      remember: rememberMe.value,
    });

    const redirectTo = props.redirectTo || defaultRedirectTo;
    console.log(redirectTo);

    if (response.success) {
      f7.views.main.router.navigate(redirectTo);
    } else {
      f7.toast.show({
        text: response.message || "Неверное имя пользователя или пароль",
        closeTimeout: 3000,
        position: "center",
      });
    }
  } catch (error) {
    f7.toast.show({
      text: "Произошла ошибка при входе. Попробуйте позже.",
      closeTimeout: 3000,
      position: "center",
    });
    console.error(error);
  } finally {
    isLoading.value = false;
  }
};
</script>

<style scoped>
.loading-spinner {
  @apply w-6 h-6 border-4 border-white border-t-transparent rounded-full animate-spin;
}
</style>
