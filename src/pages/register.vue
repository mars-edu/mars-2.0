<template>
  <f7-page name="register" class="flex flex-col min-h-screen bg-background">
    <AuthHeader />
    <div class="hidden md:flex h-full min-h-screen">
      <div
        class="w-1/2 bg-gradient-to-br from-red-500 to-red-700 flex flex-col items-center justify-center p-12 relative overflow-hidden"
      >
        <div class="absolute inset-0 opacity-10"></div>

        <div class="text-white max-w-md w-full">
          <h1 class="text-3xl font-bold mb-4">{{ auth_register_title() }}</h1>
          <p class="text-opacity-90">
            {{ auth_register_subtitle() }}
          </p>
        </div>
      </div>

      <div
        class="w-1/2 flex items-start justify-center p-8 bg-background relative overflow-y-auto h-screen"
      >
        <div
          class="bg-card rounded-3xl p-12 shadow-xl max-w-md w-full transform hover:shadow-2xl transition-all duration-300 my-8"
        >
          <div class="flex justify-center mb-8">
            <Logo class="h-16 w-auto" />
          </div>
          <form @submit.prevent="handleRegister" class="space-y-4">
            <div class="space-y-2">
              <label class="block text-sm font-semibold text-foreground mb-2">
                {{ auth_last_name() }}
              </label>
              <f7-input
                type="text"
                v-model:value="formData.lastName"
                :placeholder="auth_last_name_placeholder()"
                required
                class="!border !border-input !rounded-md !bg-transparent !px-3 !py-1 !shadow-sm"
              />
            </div>

            <div class="space-y-2">
              <label class="block text-sm font-semibold text-foreground mb-2">
                {{ auth_first_name() }}
              </label>
              <f7-input
                type="text"
                v-model:value="formData.firstName"
                :placeholder="auth_first_name_placeholder()"
                required
                class="!border !border-input !rounded-md !bg-transparent !px-3 !py-1 !shadow-sm"
              />
            </div>

            <div class="space-y-2">
              <label class="block text-sm font-semibold text-foreground mb-2">
                {{ auth_middle_name() }}
              </label>
              <f7-input
                type="text"
                v-model:value="formData.middleName"
                :placeholder="auth_middle_name_placeholder()"
                class="!border !border-input !rounded-md !bg-transparent !px-3 !py-1 !shadow-sm"
              />
            </div>

            <div class="space-y-2">
              <label class="block text-sm font-semibold text-foreground mb-2">
                {{ auth_iin() }}
              </label>
              <f7-input
                type="text"
                v-model:value="formData.iin"
                :placeholder="auth_iin_placeholder()"
                required
                maxlength="12"
                v-maska
                data-maska="############"
                class="!border !border-input !rounded-md !bg-transparent !px-3 !py-1 !shadow-sm"
              />
            </div>

            <div class="space-y-2">
              <label class="block text-sm font-semibold text-foreground mb-2">
                {{ auth_email() }}
              </label>
              <f7-input
                type="email"
                v-model:value="formData.email"
                :placeholder="auth_email_placeholder()"
                required
                class="!border !border-input !rounded-md !bg-transparent !px-3 !py-1 !shadow-sm"
              />
            </div>

            <div class="space-y-2">
              <label class="block text-sm font-semibold text-foreground mb-2">
                {{ auth_password() }}
              </label>
              <f7-input
                :type="showPassword ? 'text' : 'password'"
                v-model:value="formData.password"
                :placeholder="auth_password_placeholder()"
                required
                class="!border !border-input !rounded-md !bg-transparent !px-3 !py-1 !shadow-sm"
              />
            </div>

            <div class="space-y-2">
              <label class="block text-sm font-semibold text-foreground mb-2">
                {{ auth_confirm_password() }}
              </label>
              <f7-input
                :type="showPassword ? 'text' : 'password'"
                v-model:value="formData.confirmPassword"
                :placeholder="auth_confirm_password_placeholder()"
                required
                class="!border !border-input !rounded-md !bg-transparent !px-3 !py-1 !shadow-sm"
              />
            </div>

            <div class="flex items-center space-x-2 py-2">
              <f7-checkbox
                v-model:checked="showPassword"
                class="!flex-shrink-0"
              />
              <span class="text-sm text-muted-foreground">
                {{ auth_show_password() }}
              </span>
            </div>

            <div class="flex items-center space-x-2 py-2">
              <f7-checkbox
                v-model:checked="formData.acceptTerms"
                class="!flex-shrink-0"
              />
              <span class="text-sm text-muted-foreground">
                {{ auth_accept_terms() }}
              </span>
            </div>

            <f7-button
              type="submit"
              fill
              large
              :loading="isLoading"
              class="w-full bg-red-600 hover:bg-red-700 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 py-4"
            >
              <span class="relative z-10">{{ auth_register() }}</span>
              <div
                v-if="isLoading"
                class="absolute inset-0 flex items-center justify-center bg-red-700 rounded-xl transition-opacity duration-200"
              >
                <span class="loading-spinner"></span>
              </div>
            </f7-button>

            <div class="text-center mt-4">
              <f7-link href="/login" class="text-red-600 hover:text-red-800">
                {{ auth_have_account() }}
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

      <div class="flex-1 px-6 py-8 bg-background">
        <div
          class="bg-card rounded-3xl p-8 shadow-xl mb-4 -mt-12 transform hover:shadow-2xl transition-all duration-300"
        >
          <div class="flex justify-center mb-6">
            <Logo class="h-14 w-auto" />
          </div>
          <h2 class="text-2xl font-bold text-foreground mb-2">{{ auth_register_title() }}</h2>
          <p class="text-muted-foreground">
            {{ auth_register_subtitle() }}
          </p>

          <form @submit.prevent="handleRegister" class="space-y-6 mt-8">
            <!-- Mobile form fields mirror desktop fields -->
            <div>
              <label class="block text-sm font-medium text-foreground mb-2">
                {{ auth_last_name() }}
              </label>
              <f7-input
                type="text"
                v-model:value="formData.lastName"
                :placeholder="auth_last_name_placeholder()"
                required
                class="!border !border-input !rounded-md !bg-transparent !px-3 !py-1 !shadow-sm"
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-foreground mb-2">
                {{ auth_first_name() }}
              </label>
              <f7-input
                type="text"
                v-model:value="formData.firstName"
                :placeholder="auth_first_name_placeholder()"
                required
                class="!border !border-input !rounded-md !bg-transparent !px-3 !py-1 !shadow-sm"
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-foreground mb-2">
                {{ auth_middle_name() }}
              </label>
              <f7-input
                type="text"
                v-model:value="formData.middleName"
                :placeholder="auth_middle_name_placeholder()"
                class="!border !border-input !rounded-md !bg-transparent !px-3 !py-1 !shadow-sm"
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-foreground mb-2">
                {{ auth_iin() }}
              </label>
              <f7-input
                type="text"
                v-model:value="formData.iin"
                :placeholder="auth_iin_placeholder()"
                required
                maxlength="12"
                v-maska
                data-maska="############"
                class="!border !border-input !rounded-md !bg-transparent !px-3 !py-1 !shadow-sm"
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-foreground mb-2">
                {{ auth_email() }}
              </label>
              <f7-input
                type="email"
                v-model:value="formData.email"
                :placeholder="auth_email_placeholder()"
                required
                class="!border !border-input !rounded-md !bg-transparent !px-3 !py-1 !shadow-sm"
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-foreground mb-2">
                {{ auth_password() }}
              </label>
              <f7-input
                :type="showPassword ? 'text' : 'password'"
                v-model:value="formData.password"
                :placeholder="auth_password_placeholder()"
                required
                class="!border !border-input !rounded-md !bg-transparent !px-3 !py-1 !shadow-sm"
              />
            </div>

            <div class="flex items-center space-x-2 py-2">
              <f7-checkbox
                v-model:checked="showPassword"
                class="!flex-shrink-0"
              />
              <span class="text-sm text-muted-foreground">
                {{ auth_show_password() }}
              </span>
            </div>

            <div>
              <label class="block text-sm font-medium text-foreground mb-2">
                {{ auth_confirm_password() }}
              </label>
              <f7-input
                :type="showPassword ? 'text' : 'password'"
                v-model:value="formData.confirmPassword"
                :placeholder="auth_confirm_password_placeholder()"
                required
                class="!border !border-input !rounded-md !bg-transparent !px-3 !py-1 !shadow-sm"
              />
            </div>

            <div class="flex items-center space-x-2 py-2">
              <f7-checkbox
                v-model:checked="showPassword"
                class="!flex-shrink-0"
              />
              <span class="text-sm text-muted-foreground">
                {{ auth_show_password() }}
              </span>
            </div>

            <div class="flex items-center space-x-2">
              <f7-checkbox
                v-model:checked="formData.acceptTerms"
                class="!flex-shrink-0"
              />
              <span class="text-sm text-muted-foreground">
                {{ auth_accept_terms() }}
              </span>
            </div>

            <f7-button
              type="submit"
              fill
              large
              :loading="isLoading"
              class="w-full bg-red-600 hover:bg-red-700 rounded-lg shadow-sm transition-colors duration-200"
            >
              {{ auth_register() }}
            </f7-button>

            <div class="text-center">
              <f7-link href="/login" class="text-red-600 hover:text-red-800">
                {{ auth_have_account() }}
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
import AuthHeader from "../components/AuthHeader.vue";
import { vMaska } from "maska/vue";
import AuthService from "../services/auth";
import {
  auth_register_title,
  auth_register_subtitle,
  auth_last_name,
  auth_last_name_placeholder,
  auth_first_name,
  auth_first_name_placeholder,
  auth_middle_name,
  auth_middle_name_placeholder,
  auth_iin,
  auth_iin_placeholder,
  auth_email,
  auth_email_placeholder,
  auth_password,
  auth_password_placeholder,
  auth_confirm_password,
  auth_confirm_password_placeholder,
  auth_show_password,
  auth_accept_terms,
  auth_register,
  auth_have_account,
  auth_last_name_required,
  auth_first_name_required,
  auth_iin_required,
  auth_iin_invalid,
  auth_email_required,
  auth_email_invalid,
  auth_password_required,
  auth_password_min_length,
  auth_confirm_password_required,
  auth_passwords_mismatch,
  auth_terms_required,
  auth_register_success,
  auth_register_error,
  auth_register_error_retry,
} from "@/paraglide/messages";
import { useI18n } from "@/composables/useI18n";

const { locale } = useI18n();

const isLoading = ref(false);
const showPassword = ref(false);

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
    errorMessages.push(auth_last_name_required());
    isValid = false;
  }

  if (!formData.firstName) {
    errorMessages.push(auth_first_name_required());
    isValid = false;
  }

  if (!formData.iin) {
    errorMessages.push(auth_iin_required());
    isValid = false;
  } else if (!validateIIN(formData.iin)) {
    errorMessages.push(auth_iin_invalid());
    isValid = false;
  }

  if (!formData.email) {
    errorMessages.push(auth_email_required());
    isValid = false;
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
    errorMessages.push(auth_email_invalid());
    isValid = false;
  }

  if (!formData.password) {
    errorMessages.push(auth_password_required());
    isValid = false;
  } else if (formData.password.length < 8) {
    errorMessages.push(auth_password_min_length());
    isValid = false;
  }

  if (!formData.confirmPassword) {
    errorMessages.push(auth_confirm_password_required());
    isValid = false;
  } else if (formData.password !== formData.confirmPassword) {
    errorMessages.push(auth_passwords_mismatch());
    isValid = false;
  }

  if (!formData.acceptTerms) {
    errorMessages.push(auth_terms_required());
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
    const result = await AuthService.register({
      firstName: formData.firstName,
      lastName: formData.lastName,
      middleName: formData.middleName || undefined,
      iin: formData.iin,
      email: formData.email,
      password: formData.password,
    });

    if (result.success) {
      f7.toast.show({
        text: auth_register_success(),
        closeTimeout: 3000,
        position: "center",
      });

      f7.views.main.router.navigate("/login");
    } else {
      f7.toast.show({
        text: result.message || auth_register_error(),
        closeTimeout: 3000,
        position: "center",
      });
    }
  } catch (error) {
    console.error("Registration error:", error);
    f7.toast.show({
      text: auth_register_error_retry(),
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
