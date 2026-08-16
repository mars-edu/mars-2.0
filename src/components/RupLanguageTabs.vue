<template>
  <div>
    <!-- Language chips -->
    <div class="mb-4">
      <label class="text-sm text-foreground mb-2 block font-medium flex items-center gap-2">
        <IconGlobe class="w-4 h-4 text-muted-foreground" />
        Языки обучения
      </label>
      <div class="flex flex-wrap gap-2">
        <button
          v-for="lang in languageOptions"
          :key="lang.code"
          type="button"
          @click="toggleLanguage(lang.code)"
          class="lang-pill"
          :class="
            selected.includes(lang.code)
              ? `lang-pill-active lang-pill-${lang.code}`
              : 'lang-pill-inactive'
          "
        >
          {{ lang.name }}
        </button>
      </div>
    </div>

    <!-- Per-language text fields (all selected langs shown at once) -->
    <div class="space-y-6">
      <div
        v-for="lang in selected"
        :key="lang"
        class="p-4 bg-muted/50 rounded-xl border border-border"
        @click="onSectionFocus(lang)"
      >
        <div class="flex items-center gap-2 mb-4">
          <div
            class="w-2 h-2 rounded-full"
            :style="{ backgroundColor: getLanguageColor(lang) }"
          ></div>
          <span class="text-sm font-bold uppercase">{{ getLanguageName(lang) }}</span>
        </div>

        <div class="space-y-4">
          <Input
            :id="'module-index-' + lang"
            :model-value="texts[lang]?.moduleIndex ?? ''"
            @update:model-value="(v: string) => updateText(lang, 'moduleIndex', v)"
            label="Индекс модуля/дисциплины"
            placeholder="Введите индекс"
          />
          <Input
            :id="'learning-outcome-' + lang"
            :model-value="texts[lang]?.learningOutcome ?? ''"
            @update:model-value="(v: string) => updateText(lang, 'learningOutcome', v)"
            label="Наименование результата обучения/дисциплина"
            placeholder="Введите результат"
          />
          <Input
            :id="'module-name-' + lang"
            :model-value="texts[lang]?.moduleName ?? ''"
            @update:model-value="(v: string) => updateText(lang, 'moduleName', v)"
            label="Наименование модуля"
            placeholder="Введите наименование"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import Input from "@/components/ui/Input.vue";
import IconGlobe from "~icons/lucide/globe";
import { useStudyLanguageStore } from "@/stores/studyLanguageStore";

/**
 * Extracted from RupEntryPopup (spec P3, step 3). Owns the "language chips +
 * per-language text sections" UI. State (selected langs, per-lang texts,
 * active tab) stays in the parent via v-model — many other parts of the form
 * read it (submit, validation, prefill, copyFromSource).
 *
 * `activeLang` is a soft signal: clicking anywhere in a language section
 * marks that language active, which the parent's validation uses to hint
 * "which tab has the error" (see rupEntrySchema `[{lang}]` prefix).
 */
import type { LanguageTexts } from "@/composables/useLanguageVariants";

const props = defineProps<{
  selected: string[];
  texts: LanguageTexts;
  active: string;
}>();

const emit = defineEmits<{
  (e: "update:selected", value: string[]): void;
  (e: "update:texts", value: LanguageTexts): void;
  (e: "update:active", value: string): void;
}>();

const languageStore = useStudyLanguageStore();

const languageOptions = computed(() =>
  languageStore.languages.map((l) => ({ code: l.code, name: l.name }))
);

function getLanguageName(code: string): string {
  return languageOptions.value.find((l) => l.code === code)?.name ?? code;
}

// Fallback colors mirror the previously-hardcoded pill classes (used only
// when a language row hasn't been given a `color` yet, e.g. legacy rows
// created before this field existed).
const FALLBACK_LANGUAGE_COLORS: Record<string, string> = {
  kk: "#eab308", // bg-yellow-500
  ru: "#111827", // bg-gray-900
  en: "#a855f7", // bg-purple-500
};

function getLanguageColor(code: string): string {
  return (
    languageStore.getByCode(code)?.color ??
    FALLBACK_LANGUAGE_COLORS[code] ??
    "#6b7280"
  );
}

function toggleLanguage(code: string) {
  const idx = props.selected.indexOf(code);
  const nextSelected = [...props.selected];
  const nextTexts: LanguageTexts = { ...props.texts };
  if (idx > -1) {
    // Keep at least one language.
    if (nextSelected.length <= 1) return;
    nextSelected.splice(idx, 1);
    delete nextTexts[code];
    emit("update:selected", nextSelected);
    emit("update:texts", nextTexts);
    if (props.active === code) {
      emit("update:active", nextSelected[0]);
    }
  } else {
    nextSelected.push(code);
    if (!nextTexts[code]) {
      nextTexts[code] = { moduleIndex: "", moduleName: "", learningOutcome: "" };
    }
    emit("update:selected", nextSelected);
    emit("update:texts", nextTexts);
  }
}

function updateText(lang: string, field: "moduleIndex" | "moduleName" | "learningOutcome", value: string) {
  const next: LanguageTexts = { ...props.texts };
  next[lang] = { ...(next[lang] ?? { moduleIndex: "", moduleName: "", learningOutcome: "" }), [field]: value };
  emit("update:texts", next);
  // Editing a language implies it's the "current" one for error attribution.
  if (props.active !== lang) emit("update:active", lang);
}

function onSectionFocus(lang: string) {
  if (props.active !== lang) emit("update:active", lang);
}

defineExpose({ getLanguageName });
</script>
