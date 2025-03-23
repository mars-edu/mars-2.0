<template>
  <f7-page
    name="restore-password"
    class="flex flex-col min-h-screen bg-gray-50"
  >
    <div class="hidden md:flex h-full">
      <div
        class="w-1/2 bg-gradient-to-br from-red-500 to-red-700 flex flex-col items-center justify-center p-12 relative overflow-hidden"
      >
        <div class="absolute inset-0 opacity-10"></div>

        <div class="max-w-md w-full">
          <h1 class="text-3xl font-bold text-white mb-4">
            Восстановление пароля
          </h1>
          <p class="text-white text-opacity-90">
            Восстановите доступ к своей учетной записи в несколько простых
            шагов.
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
          <!-- Step 1: IIN Verification -->
          <div v-if="currentStep === 1">
            <h2 class="text-2xl font-bold text-gray-900 mb-6">
              Шаг 1: Идентификация
            </h2>
            <form @submit.prevent="handleIINSubmit" class="space-y-6">
              <div class="space-y-2">
                <label class="block text-sm font-semibold text-gray-800 mb-2">
                  ИИН
                </label>
                <f7-input
                  type="text"
                  v-model:value="formData.iin"
                  placeholder="Введите ИИН"
                  :error-message="errors.iin"
                  required
                  maxlength="12"
                  class="!border !border-input !rounded-md !bg-transparent !px-3 !py-1 !shadow-sm"
                />
              </div>

              <f7-button
                type="submit"
                fill
                large
                :loading="isLoading"
                class="w-full bg-red-600 hover:bg-red-700 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 py-4"
              >
                <span class="relative z-10">Продолжить</span>
                <div
                  v-if="isLoading"
                  class="absolute inset-0 flex items-center justify-center bg-red-700 rounded-xl transition-opacity duration-200"
                >
                  <span class="loading-spinner"></span>
                </div>
              </f7-button>
            </form>
          </div>

          <!-- Step 2: New Password -->
          <div v-if="currentStep === 2">
            <h2 class="text-2xl font-bold text-gray-900 mb-6">
              Шаг 2: Новый пароль
            </h2>
            <form @submit.prevent="handlePasswordReset" class="space-y-6">
              <div class="space-y-2">
                <label class="block text-sm font-semibold text-gray-800 mb-2">
                  Новый пароль
                </label>
                <f7-input
                  type="password"
                  v-model:value="formData.password"
                  placeholder="Введите новый пароль"
                  :error-message="errors.password"
                  required
                  class="!border !border-input !rounded-md !bg-transparent !px-3 !py-1 !shadow-sm"
                />
              </div>

              <div class="space-y-2">
                <label class="block text-sm font-semibold text-gray-800 mb-2">
                  Подтвердите пароль
                </label>
                <f7-input
                  type="password"
                  v-model:value="formData.confirmPassword"
                  placeholder="Повторите новый пароль"
                  :error-message="errors.confirmPassword"
                  required
                  class="!border !border-input !rounded-md !bg-transparent !px-3 !py-1 !shadow-sm"
                />
              </div>

              <f7-button
                type="submit"
                fill
                large
                :loading="isLoading"
                class="w-full bg-red-600 hover:bg-red-700 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 py-4"
              >
                <span class="relative z-10">Сбросить пароль</span>
                <div
                  v-if="isLoading"
                  class="absolute inset-0 flex items-center justify-center bg-red-700 rounded-xl transition-opacity duration-200"
                >
                  <span class="loading-spinner"></span>
                </div>
              </f7-button>
            </form>
          </div>

          <div class="text-center mt-6">
            <f7-link href="/login" class="text-red-600 hover:text-red-800">
              Вернуться к входу
            </f7-link>
          </div>
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
          <h2 class="text-2xl font-bold text-gray-900 mb-2">
            Восстановление пароля
          </h2>
          <p class="text-gray-600 mb-8">
            Восстановите доступ к своей учетной записи в несколько простых
            шагов.
          </p>

          <!-- Mobile Step 1: IIN Verification -->
          <div v-if="currentStep === 1">
            <form @submit.prevent="handleIINSubmit" class="space-y-6">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  ИИН
                </label>
                <f7-input
                  type="text"
                  v-model:value="formData.iin"
                  placeholder="Введите ИИН"
                  :error-message="errors.iin"
                  required
                  maxlength="12"
                  class="!border !border-input !rounded-md !bg-transparent !px-3 !py-1 !shadow-sm"
                />
              </div>

              <f7-button
                type="submit"
                fill
                large
                :loading="isLoading"
                class="w-full bg-red-600 hover:bg-red-700 rounded-lg shadow-sm transition-colors duration-200"
              >
                Продолжить
              </f7-button>
            </form>
          </div>

          <!-- Mobile Step 2: New Password -->
          <div v-if="currentStep === 2">
            <form @submit.prevent="handlePasswordReset" class="space-y-6">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  Новый пароль
                </label>
                <f7-input
                  type="password"
                  v-model:value="formData.password"
                  placeholder="Введите новый пароль"
                  :error-message="errors.password"
                  required
                  class="!border !border-input !rounded-md !bg-transparent !px-3 !py-1 !shadow-sm"
                />
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  Подтвердите пароль
                </label>
                <f7-input
                  type="password"
                  v-model:value="formData.confirmPassword"
                  placeholder="Повторите новый пароль"
                  :error-message="errors.confirmPassword"
                  required
                  class="!border !border-input !rounded-md !bg-transparent !px-3 !py-1 !shadow-sm"
                />
              </div>

              <f7-button
                type="submit"
                fill
                large
                :loading="isLoading"
                class="w-full bg-red-600 hover:bg-red-700 rounded-lg shadow-sm transition-colors duration-200"
              >
                Сбросить пароль
              </f7-button>
            </form>
          </div>

          <div class="text-center mt-6">
            <f7-link href="/login" class="text-red-600 hover:text-red-800">
              Вернуться к входу
            </f7-link>
          </div>
        </div>
      </div>
    </div>
  </f7-page>
</template>

<script setup lang="ts">
import { ref, reactive } from "vue";
import { f7 } from "framework7-vue";
import Logo from "../components/Logo/Logo.vue";

const currentStep = ref(1);
const isLoading = ref(false);

const formData = reactive({
  iin: "",
  password: "",
  confirmPassword: "",
});

const errors = reactive({
  iin: "",
  password: "",
  confirmPassword: "",
});

const validateIIN = (iin: string): boolean => {
  return /^\d{12}$/.test(iin);
};

const validateStep1 = (): boolean => {
  let isValid = true;
  errors.iin = "";

  if (!formData.iin) {
    errors.iin = "ИИН обязателен";
    isValid = false;
  } else if (!validateIIN(formData.iin)) {
    errors.iin = "Неверный формат ИИН";
    isValid = false;
  }

  return isValid;
};

const validateStep2 = (): boolean => {
  let isValid = true;
  errors.password = "";
  errors.confirmPassword = "";

  if (!formData.password) {
    errors.password = "Пароль обязателен";
    isValid = false;
  } else if (formData.password.length < 8) {
    errors.password = "Пароль должен содержать минимум 8 символов";
    isValid = false;
  }

  if (!formData.confirmPassword) {
    errors.confirmPassword = "Подтвердите пароль";
    isValid = false;
  } else if (formData.password !== formData.confirmPassword) {
    errors.confirmPassword = "Пароли не совпадают";
    isValid = false;
  }

  return isValid;
};

const handleIINSubmit = async (e: Event) => {
  e.preventDefault();

  if (!validateStep1()) {
    return;
  }

  isLoading.value = true;

  try {
    // TODO: Implement IIN verification with AuthService
    // const response = await AuthService.verifyIIN(formData.iin);

    // Temporary for demonstration
    await new Promise((resolve) => setTimeout(resolve, 1000));

    currentStep.value = 2;
  } catch (error) {
    console.error("IIN verification error:", error);
    f7.toast.show({
      text: "Ошибка при проверке ИИН. Попробуйте позже.",
      closeTimeout: 3000,
      position: "center",
    });
  } finally {
    isLoading.value = false;
  }
};

const handlePasswordReset = async (e: Event) => {
  e.preventDefault();

  if (!validateStep2()) {
    return;
  }

  isLoading.value = true;

  try {
    // TODO: Implement password reset with AuthService
    // const response = await AuthService.resetPassword({
    //   iin: formData.iin,
    //   newPassword: formData.password,
    // });

    // Temporary for demonstration
    await new Promise((resolve) => setTimeout(resolve, 1000));

    f7.toast.show({
      text: "Пароль успешно изменен",
      closeTimeout: 3000,
      position: "center",
    });

    f7.views.main.router.navigate("/login");
  } catch (error) {
    console.error("Password reset error:", error);
    f7.toast.show({
      text: "Ошибка при сбросе пароля. Попробуйте позже.",
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
