<template>
  <div class="bg-card rounded-lg border border-border">
    <div class="p-4 border-b border-border">
      <h2 class="text-lg font-semibold">
        Рабочий учебный план на базе 11 класс
      </h2>
    </div>

    <div class="p-6 text-center">
      <div class="max-w-md mx-auto space-y-4">
        <IconFileText class="w-12 h-12 text-muted-foreground" />
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
import IconFileText from "~icons/lucide/file-text";

defineProps<{
  specialtyId: string;
}>();
</script>
