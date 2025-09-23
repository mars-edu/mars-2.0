<template>
  <div class="bg-card rounded-lg border border-border">
    <div class="p-4 border-b border-border">
      <h2 class="text-lg font-semibold">
        Рабочий учебный план на базе 11 класс
      </h2>
    </div>

    <div class="p-6 text-center">
      <div class="max-w-md mx-auto space-y-4">
        <f7-icon
          ios="f7:doc_text"
          md="material:description"
          size="48px"
          class="text-muted-foreground"
        ></f7-icon>
        <h3 class="text-lg font-medium">В разработке</h3>
        <p class="text-muted-foreground">
          Рабочий учебный план для 11 класса находится в разработке. Скоро здесь
          появится полная информация о предметах и часах.
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { f7Icon } from "framework7-vue";

defineProps<{
  specialtyId: string;
}>();
</script>
