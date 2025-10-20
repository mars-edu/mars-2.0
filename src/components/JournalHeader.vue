<template>
  <div class="flex items-center justify-between">
    <div class="flex items-center gap-3">
      <f7-link
        @click="$emit('back')"
        class="back-button flex items-center justify-center w-10 h-10 rounded-lg hover:bg-muted transition-colors cursor-pointer"
      >
        <f7-icon
          f7="chevron_left"
          size="24px"
          class="text-foreground"
        />
      </f7-link>
      <div class="text-l font-semibold">
        <p>
          Результат обучения/дисциплина:
          <span class="text-green-600">{{ disciplineText }}</span>
        </p>
        <p>
          Учебная группа:
          <span class="text-green-600">{{ group }}</span>
        </p>
      </div>
    </div>
    <div class="flex flex-col items-end gap-1">
      <p class="text-sm">
        Учебный год:
        <span class="text-green-600 font-medium">{{ academicYear }}</span>
      </p>
      <p class="text-sm">
        Семестр:
        <span class="text-green-600 font-medium">{{ semester }}</span>
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { f7Link, f7Icon } from "framework7-vue";

defineProps<{
  disciplineText: string;
  group?: string;
  academicYear: string;
  semester: string;
}>();

defineEmits<{
  back: [];
}>();
</script>
