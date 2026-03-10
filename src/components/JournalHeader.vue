<template>
  <div class="flex items-center justify-between">
    <div class="flex items-center gap-3">
      <f7-link
        @click="$emit('back')"
        class="back-button flex items-center justify-center w-10 h-10 rounded-lg hover:bg-muted transition-colors cursor-pointer"
      >
        <IconChevronLeft class="w-6 h-6 text-foreground" />
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
        <p v-if="groupLanguage">
          Язык группы:
          <span class="text-green-600">{{ groupLanguage }}</span>
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
import { f7Link } from "framework7-vue";
import IconChevronLeft from "~icons/lucide/chevron-left";

defineProps<{
  disciplineText: string;
  group?: string;
  groupLanguage?: string;
  academicYear: string;
  semester: string;
}>();

defineEmits<{
  back: [];
}>();
</script>
