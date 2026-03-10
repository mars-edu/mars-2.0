<template>
  <div class="flex p-0.5 rounded-full bg-muted">
    <button
      v-for="lang in availableLocales"
      :key="lang.code"
      class="px-3 py-1 rounded-full text-xs font-bold transition-all"
      :class="
        lang.code === locale
          ? 'bg-card text-foreground shadow-sm'
          : 'text-muted-foreground hover:text-foreground'
      "
      @click="setLocale(lang.code)"
    >
      {{ lang.code.toUpperCase() }}
    </button>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from "@/composables/useI18n";

const { locale, availableLocales, setLocale } = useI18n();
</script>
