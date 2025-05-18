<template>
  <f7-page name="register" class="flex flex-col min-h-screen bg-gray-50">
    <div class="hidden md:flex h-full">
      <div
        class="w-1/2 bg-gradient-to-br from-red-500 to-red-700 flex flex-col items-center justify-center p-12 relative overflow-hidden"
      >
        <div class="absolute inset-0 opacity-10"></div>

        <div class="max-w-md w-full">
          <h1 class="text-3xl font-bold text-white mb-4">Регистрация</h1>
          <p class="text-white text-opacity-90">
            Создайте учетную запись, чтобы начать свое образовательное
            путешествие.
          </p>
        </div>
      </div>

      <div
        class="w-1/2 flex items-center justify-center p-8 bg-gray-50 relative overflow-y-auto"
      >
        <Logo
          class="absolute top-8 right-8 text-red-600 transform hover:scale-105 transition-transform duration-300"
        />
        <div
          class="bg-white rounded-3xl p-12 shadow-xl max-w-md w-full transform hover:shadow-2xl transition-all duration-300"
        >
          <form @submit.prevent="handleRegister" class="space-y-6">
            <div class="space-y-2">
              <label class="block text-sm font-semibold text-gray-800 mb-2">
                Фамилия
              </label>
              <f7-input
                type="text"
                v-model:value="formData.lastName"
                placeholder="Введите фамилию"
                required
                class="!border !border-input !rounded-md !bg-transparent !px-3 !py-1 !shadow-sm"
              />
            </div>

            <div class="space-y-2">
              <label class="block text-sm font-semibold text-gray-800 mb-2">
                Имя
              </label>
              <f7-input
                type="text"
                v-model:value="formData.firstName"
                placeholder="Введите имя"
                required
                class="!border !border-input !rounded-md !bg-transparent !px-3 !py-1 !shadow-sm"
              />
            </div>

            <div class="space-y-2">
              <label class="block text-sm font-semibold text-gray-800 mb-2">
                Отчество
              </label>
              <f7-input
                type="text"
                v-model:value="formData.middleName"
                placeholder="Введите отчество"
                class="!border !border-input !rounded-md !bg-transparent !px-3 !py-1 !shadow-sm"
              />
            </div>

            <div class="space-y-2">
              <label class="block text-sm font-semibold text-gray-800 mb-2">
                ИИН
              </label>
              <f7-input
                type="text"
                v-model:value="formData.iin"
                placeholder="Введите ИИН"
                required
                maxlength="12"
                v-maska
                data-maska="############"
                class="!border !border-input !rounded-md !bg-transparent !px-3 !py-1 !shadow-sm"
              />
            </div>

            <div class="space-y-2">
              <label class="block text-sm font-semibold text-gray-800 mb-2">
                Email
              </label>
              <f7-input
                type="email"
                v-model:value="formData.email"
                placeholder="Введите email"
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
                v-model:value="formData.password"
                placeholder="Введите пароль"
                required
                class="!border !border-input !rounded-md !bg-transparent !px-3 !py-1 !shadow-sm"
              />
            </div>

            <div class="space-y-2">
              <label class="block text-sm font-semibold text-gray-800 mb-2">
                Повторите пароль
              </label>
              <f7-input
                type="password"
                v-model:value="formData.confirmPassword"
                placeholder="Повторите пароль"
                required
                class="!border !border-input !rounded-md !bg-transparent !px-3 !py-1 !shadow-sm"
              />
            </div>

            <div class="flex items-center space-x-2 py-2">
              <f7-checkbox
                v-model:checked="formData.acceptTerms"
                class="!flex-shrink-0"
              />
              <span class="text-sm text-gray-600 whitespace-nowrap">
                Я согласен на обработку персональных данных
              </span>
            </div>

            <f7-button
              type="submit"
              fill
              large
              :loading="isLoading"
              class="w-full bg-red-600 hover:bg-red-700 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 py-4"
            >
              <span class="relative z-10">Зарегистрироваться</span>
              <div
                v-if="isLoading"
                class="absolute inset-0 flex items-center justify-center bg-red-700 rounded-xl transition-opacity duration-200"
              >
                <span class="loading-spinner"></span>
              </div>
            </f7-button>

            <div class="text-center mt-4">
              <f7-link href="/login" class="text-red-600 hover:text-red-800">
                Уже есть аккаунт? Войти
              </f7-link>
            </div>
          </form>
        </div>
      </div>
    </div>

    <!-- Mobile View -->
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
          <h2 class="text-2xl font-bold text-gray-900 mb-2">Регистрация</h2>
          <p class="text-gray-600">
            Создайте учетную запись, чтобы начать свое образовательное
            путешествие.
          </p>

          <form @submit.prevent="handleRegister" class="space-y-6 mt-8">
            <!-- Mobile form fields mirror desktop fields -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Фамилия
              </label>
              <f7-input
                type="text"
                v-model:value="formData.lastName"
                placeholder="Введите фамилию"
                required
                class="!border !border-input !rounded-md !bg-transparent !px-3 !py-1 !shadow-sm"
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Имя
              </label>
              <f7-input
                type="text"
                v-model:value="formData.firstName"
                placeholder="Введите имя"
                required
                class="!border !border-input !rounded-md !bg-transparent !px-3 !py-1 !shadow-sm"
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Отчество
              </label>
              <f7-input
                type="text"
                v-model:value="formData.middleName"
                placeholder="Введите отчество"
                class="!border !border-input !rounded-md !bg-transparent !px-3 !py-1 !shadow-sm"
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                ИИН
              </label>
              <f7-input
                type="text"
                v-model:value="formData.iin"
                placeholder="Введите ИИН"
                required
                maxlength="12"
                v-maska
                data-maska="############"
                class="!border !border-input !rounded-md !bg-transparent !px-3 !py-1 !shadow-sm"
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <f7-input
                type="email"
                v-model:value="formData.email"
                placeholder="Введите email"
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
                v-model:value="formData.password"
                placeholder="Введите пароль"
                required
                class="!border !border-input !rounded-md !bg-transparent !px-3 !py-1 !shadow-sm"
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Повторите пароль
              </label>
              <f7-input
                type="password"
                v-model:value="formData.confirmPassword"
                placeholder="Повторите пароль"
                required
                class="!border !border-input !rounded-md !bg-transparent !px-3 !py-1 !shadow-sm"
              />
            </div>

            <div class="flex items-center space-x-2">
              <f7-checkbox
                v-model:checked="formData.acceptTerms"
                class="!flex-shrink-0"
              />
              <span class="text-sm text-gray-600 whitespace-nowrap">
                Я согласен на обработку персональных данных
              </span>
            </div>

            <f7-button
              type="submit"
              fill
              large
              :loading="isLoading"
              class="w-full bg-red-600 hover:bg-red-700 rounded-lg shadow-sm transition-colors duration-200"
            >
              Зарегистрироваться
            </f7-button>

            <div class="text-center">
              <f7-link href="/login" class="text-red-600 hover:text-red-800">
                Уже есть аккаунт? Войти
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
import Logo from "../components/Logo/Logo.vue";
import { vMaska } from "maska/vue";
import { authClient } from "../lib/http-client";

const isLoading = ref(false);

const formData = reactive({
  lastName: "",
  firstName: "",
  middleName: "",
  iin: "",
  password: "",
  confirmPassword: "",
  acceptTerms: false,
  email: "",
});

const validateIIN = (iin: string): boolean => {
  // Basic IIN validation - 12 digits
  return /^\d{12}$/.test(iin);
};

const validateForm = (): { isValid: boolean; errorMessage: string } => {
  let isValid = true;
  const errorMessages: string[] = [];

  if (!formData.lastName) {
    errorMessages.push("Фамилия обязательна");
    isValid = false;
  }

  if (!formData.firstName) {
    errorMessages.push("Имя обязательно");
    isValid = false;
  }

  if (!formData.iin) {
    errorMessages.push("ИИН обязателен");
    isValid = false;
  } else if (!validateIIN(formData.iin)) {
    errorMessages.push("Неверный формат ИИН");
    isValid = false;
  }

  if (!formData.email) {
    errorMessages.push("Email обязателен");
    isValid = false;
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
    errorMessages.push("Неверный формат email");
    isValid = false;
  }

  if (!formData.password) {
    errorMessages.push("Пароль обязателен");
    isValid = false;
  } else if (formData.password.length < 8) {
    errorMessages.push("Пароль должен содержать минимум 8 символов");
    isValid = false;
  }

  if (!formData.confirmPassword) {
    errorMessages.push("Подтвердите пароль");
    isValid = false;
  } else if (formData.password !== formData.confirmPassword) {
    errorMessages.push("Пароли не совпадают");
    isValid = false;
  }

  if (!formData.acceptTerms) {
    errorMessages.push("Необходимо согласие на обработку данных");
    isValid = false;
  }

  return {
    isValid,
    errorMessage: errorMessages.join(". "),
  };
};

const handleRegister = async (e: Event) => {
  e.preventDefault();

  const validation = validateForm();
  if (!validation.isValid) {
    f7.toast.show({
      text: validation.errorMessage,
      closeTimeout: 3000,
      position: "center",
    });
    return;
  }

  isLoading.value = true;

  try {
    const data = await authClient.register({
      firstName: formData.firstName,
      lastName: formData.lastName,
      middleName: formData.middleName || undefined,
      iin: formData.iin,
      email: formData.email,
      password: formData.password,
    });

    if (data.success) {
      f7.toast.show({
        text: "Регистрация успешно завершена",
        closeTimeout: 3000,
        position: "center",
      });

      f7.views.main.router.navigate("/login");
    } else {
      f7.toast.show({
        text: data.message || "Произошла ошибка при регистрации",
        closeTimeout: 3000,
        position: "center",
      });
    }
  } catch (error) {
    console.error("Registration error:", error);
    f7.toast.show({
      text: "Произошла ошибка при регистрации. Попробуйте позже.",
      closeTimeout: 3000,
      position: "center",
    });
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
