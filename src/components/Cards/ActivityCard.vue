<template>
  <div class="bg-white rounded-xl shadow-sm overflow-hidden">
    <div class="flex items-center justify-between p-4 border-b border-gray-100">
      <h2 class="text-lg font-semibold text-gray-900">Ваша активность</h2>
    </div>
    <div class="p-4">
      <div class="space-y-4">
        <!-- Activity Stats -->
        <div class="grid grid-cols-2 gap-4">
          <div class="bg-gray-50 rounded-lg p-4">
            <div class="text-sm text-gray-500">Посещаемость</div>
            <div class="mt-1 flex items-baseline">
              <div class="text-2xl font-semibold text-gray-900">94%</div>
              <div class="ml-2 text-sm text-green-500">+2.3%</div>
            </div>
          </div>
          <div class="bg-gray-50 rounded-lg p-4">
            <div class="text-sm text-gray-500">Средний балл</div>
            <div class="mt-1 flex items-baseline">
              <div class="text-2xl font-semibold text-gray-900">???</div>
              <div class="ml-2 text-sm text-green-500">+32</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
</script>
