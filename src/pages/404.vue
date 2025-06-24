<template>
  <f7-page name="not-found" class="flex flex-col min-h-screen bg-gray-50">
    <div class="hidden md:flex h-full">
      <div
        class="w-1/2 bg-gradient-to-br from-red-500 to-red-700 flex flex-col items-center justify-center p-12 relative overflow-hidden"
      >
        <div class="absolute inset-0 opacity-10"></div>

        <div class="max-w-md w-full">
          <h1 class="text-3xl font-bold text-white mb-4">
            Страница не найдена
          </h1>
          <p class="text-white text-opacity-90">
            Запрошенная страница не существует или была перемещена.
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
          <h2 class="text-2xl font-bold text-gray-900 mb-4">404</h2>
          <p class="text-gray-600 mb-6">
            Запрошенный путь не найден:
            <span class="font-medium">{{ path }}</span>
          </p>
          <f7-button
            href="/home"
            fill
            large
            class="w-full bg-red-600 hover:bg-red-700 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 py-4"
          >
            <span class="relative z-10">Вернуться домой</span>
          </f7-button>
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
          <h2 class="text-2xl font-bold text-gray-900 mb-2">404</h2>
          <p class="text-gray-600 mb-6">
            Запрошенный путь не найден:
            <span class="font-medium">{{ path }}</span>
          </p>
          <f7-button
            href="/home"
            fill
            large
            class="w-full bg-red-600 hover:bg-red-700 rounded-lg shadow-sm transition-colors duration-200"
          >
            Вернуться домой
          </f7-button>
        </div>
      </div>
    </div>
  </f7-page>
</template>

<script setup lang="ts">
import { ref } from "vue";
import Logo from "../components/Logo/Logo.vue";

const path = ref(window.location.pathname);
</script>
