<template>
  <f7-page
    name="restore-password"
    class="flex flex-col min-h-screen bg-background"
  >
    <AuthHeader />

    <div class="hidden md:flex h-full">
      <div
        class="w-1/2 bg-gradient-to-br from-red-500 to-red-700 flex flex-col items-center justify-center p-12 relative overflow-hidden"
      >
        <div class="absolute inset-0 opacity-10"></div>

        <div class="max-w-md w-full">
          <h1 class="text-3xl font-bold text-white mb-4">
            {{ auth_restore_password_title() }}
          </h1>
          <p class="text-white text-opacity-90">
            {{ auth_restore_password_subtitle() }}
          </p>
        </div>
      </div>

      <div
        class="w-1/2 flex items-center justify-center p-8 bg-background relative"
      >
        <div
          class="bg-card rounded-3xl p-12 shadow-xl max-w-md w-full transform hover:shadow-2xl transition-all duration-300"
        >
          <!-- Step 1: IIN Verification -->
          <div v-if="currentStep === 1">
            <h2 class="text-2xl font-bold text-foreground mb-6">
              {{ auth_step1_title() }}
            </h2>
            <form @submit.prevent="handleIINSubmit" class="space-y-6">
              <div class="space-y-2">
                <label class="block text-sm font-semibold text-foreground mb-2">
                  {{ auth_iin() }}
                </label>
                <f7-input
                  type="text"
                  v-model:value="formData.iin"
                  :placeholder="auth_iin_placeholder()"
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
                <span class="relative z-10">{{ auth_continue() }}</span>
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
            <h2 class="text-2xl font-bold text-foreground mb-6">
              {{ auth_step2_title() }}
            </h2>
            <form @submit.prevent="handlePasswordReset" class="space-y-6">
              <div class="space-y-2">
                <label class="block text-sm font-semibold text-foreground mb-2">
                  {{ auth_new_password() }}
                </label>
                <f7-input
                  type="password"
                  v-model:value="formData.password"
                  :placeholder="auth_new_password_placeholder()"
                  :error-message="errors.password"
                  required
                  class="!border !border-input !rounded-md !bg-transparent !px-3 !py-1 !shadow-sm"
                />
              </div>

              <div class="space-y-2">
                <label class="block text-sm font-semibold text-foreground mb-2">
                  {{ auth_new_password_confirm() }}
                </label>
                <f7-input
                  type="password"
                  v-model:value="formData.confirmPassword"
                  :placeholder="auth_repeat_new_password_placeholder()"
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
                <span class="relative z-10">{{ auth_reset_password() }}</span>
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
              {{ auth_back_to_login() }}
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

      <div class="flex-1 px-6 py-8 bg-background">
        <div
          class="bg-card rounded-3xl p-8 shadow-xl mb-4 -mt-12 transform hover:shadow-2xl transition-all duration-300"
        >
          <h2 class="text-2xl font-bold text-foreground mb-2">
            {{ auth_restore_password_title() }}
          </h2>
          <p class="text-muted-foreground mb-8">
            {{ auth_restore_password_subtitle() }}
          </p>

          <!-- Mobile Step 1: IIN Verification -->
          <div v-if="currentStep === 1">
            <form @submit.prevent="handleIINSubmit" class="space-y-6">
              <div>
                <label class="block text-sm font-medium text-foreground mb-2">
                  {{ auth_iin() }}
                </label>
                <f7-input
                  type="text"
                  v-model:value="formData.iin"
                  :placeholder="auth_iin_placeholder()"
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
                {{ auth_continue() }}
              </f7-button>
            </form>
          </div>

          <!-- Mobile Step 2: New Password -->
          <div v-if="currentStep === 2">
            <form @submit.prevent="handlePasswordReset" class="space-y-6">
              <div>
                <label class="block text-sm font-medium text-foreground mb-2">
                  {{ auth_new_password() }}
                </label>
                <f7-input
                  type="password"
                  v-model:value="formData.password"
                  :placeholder="auth_new_password_placeholder()"
                  :error-message="errors.password"
                  required
                  class="!border !border-input !rounded-md !bg-transparent !px-3 !py-1 !shadow-sm"
                />
              </div>

              <div>
                <label class="block text-sm font-medium text-foreground mb-2">
                  {{ auth_new_password_confirm() }}
                </label>
                <f7-input
                  type="password"
                  v-model:value="formData.confirmPassword"
                  :placeholder="auth_repeat_new_password_placeholder()"
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
                {{ auth_reset_password() }}
              </f7-button>
            </form>
          </div>

          <div class="text-center mt-6">
            <f7-link href="/login" class="text-red-600 hover:text-red-800">
              {{ auth_back_to_login() }}
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
import AuthHeader from "../components/AuthHeader.vue";
import {
  auth_restore_password_title,
  auth_restore_password_subtitle,
  auth_step1_title,
  auth_step2_title,
  auth_iin,
  auth_iin_placeholder,
  auth_continue,
  auth_new_password,
  auth_new_password_placeholder,
  auth_new_password_confirm,
  auth_repeat_new_password_placeholder,
  auth_reset_password,
  auth_back_to_login,
  auth_iin_required,
  auth_iin_invalid,
  auth_password_required,
  auth_password_min_length,
  auth_confirm_password_required,
  auth_passwords_mismatch,
  auth_iin_verify_error,
  auth_password_changed,
  auth_reset_password_error,
} from "@/paraglide/messages";
import { useI18n } from "@/composables/useI18n";

const { locale } = useI18n();

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
    errors.iin = auth_iin_required();
    isValid = false;
  } else if (!validateIIN(formData.iin)) {
    errors.iin = auth_iin_invalid();
    isValid = false;
  }

  return isValid;
};

const validateStep2 = (): boolean => {
  let isValid = true;
  errors.password = "";
  errors.confirmPassword = "";

  if (!formData.password) {
    errors.password = auth_password_required();
    isValid = false;
  } else if (formData.password.length < 8) {
    errors.password = auth_password_min_length();
    isValid = false;
  }

  if (!formData.confirmPassword) {
    errors.confirmPassword = auth_confirm_password_required();
    isValid = false;
  } else if (formData.password !== formData.confirmPassword) {
    errors.confirmPassword = auth_passwords_mismatch();
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
      text: auth_iin_verify_error(),
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
      text: auth_password_changed(),
      closeTimeout: 3000,
      position: "center",
    });

    f7.views.main.router.navigate("/login");
  } catch (error) {
    console.error("Password reset error:", error);
    f7.toast.show({
      text: auth_reset_password_error(),
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
