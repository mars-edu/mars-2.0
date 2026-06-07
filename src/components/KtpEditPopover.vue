<template>
  <GuardedPopover
    v-slot="{ requestClose }"
    id="ktp-edit-popover"
    :opened="opened"
    @popover:closed="emit('update:opened', false)"
    style="width: 420px !important; max-width: calc(100vw - 32px) !important"
  >
    <div class="bg-card text-card-foreground rounded-2xl overflow-hidden flex flex-col">
      <PopoverHeader
        title="Редактировать КТП"
        subtitle="Цвет и языки обучения"
        :on-cancel="requestClose"
      />

      <div class="flex-1 overflow-y-auto px-8 pb-6 space-y-6">
        <!-- Color -->
        <div>
          <label class="block text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2 ml-1">
            Цвет
          </label>
          <div class="flex gap-2">
            <button
              v-for="color in KTP_COLORS"
              :key="color"
              type="button"
              class="w-8 h-8 rounded-lg transition-all"
              :class="selectedColor === color ? 'ring-2 ring-offset-2 ring-primary scale-110' : 'hover:scale-105'"
              :style="{ backgroundColor: color }"
              @click="selectedColor = color"
            />
          </div>
        </div>

        <!-- Languages -->
        <div>
          <label class="block text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2 ml-1">
            Языки обучения
          </label>
          <div class="flex gap-2">
            <button
              v-for="lang in KTP_LANGUAGES"
              :key="lang"
              type="button"
              class="px-4 py-2 rounded-xl text-sm font-bold transition-all"
              :class="selectedLanguages.includes(lang)
                ? 'bg-primary text-primary-foreground scale-105'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'"
              @click="toggleLanguage(lang)"
            >
              {{ lang }}
            </button>
          </div>
        </div>
      </div>

      <PopoverFooter
        save-text="Сохранить"
        :on-save="handleSave"
        :on-cancel="requestClose"
        :disabled="saving"
        :is-loading="saving"
      />
    </div>
  </GuardedPopover>
</template>

<script setup lang="ts">
import { ref, watch } from "vue";
import { f7 } from "framework7-vue";
import { useKtpStore, type Ktp } from "@/stores/ktpStore";
import { KTP_COLORS, KTP_LANGUAGES } from "@/lib/ktpHelpers";
import GuardedPopover from "@/components/ui/GuardedPopover.vue";
import PopoverHeader from "@/components/ui/PopoverHeader.vue";
import PopoverFooter from "@/components/ui/PopoverFooter.vue";

const props = defineProps<{
  opened: boolean;
  ktp: Ktp | null;
}>();

const emit = defineEmits(["update:opened"]);

const ktpStore = useKtpStore();
const selectedColor = ref(KTP_COLORS[0]);
const selectedLanguages = ref<string[]>([]);
const saving = ref(false);

watch(
  () => [props.opened, props.ktp] as const,
  ([opened, ktp]) => {
    if (opened && ktp) {
      selectedColor.value = ktp.color || KTP_COLORS[0];
      // Single-select UI: keep only the first language from legacy multi-select data
      selectedLanguages.value = (ktp.languages || []).slice(0, 1);
    }
  },
  { immediate: true }
);

// Single-select: picking a language replaces the previous one; clicking
// the selected language deselects it. Stored as array for schema compat.
const toggleLanguage = (lang: string) => {
  selectedLanguages.value = selectedLanguages.value.includes(lang)
    ? []
    : [lang];
};

const handleSave = async () => {
  if (!props.ktp) return;
  saving.value = true;
  try {
    await ktpStore.updateKtp(props.ktp.id, {
      color: selectedColor.value,
      languages: selectedLanguages.value,
    });
    f7.toast
      .create({ text: "КТП обновлён", closeTimeout: 1500, cssClass: "color-green" })
      .open();
    emit("update:opened", false);
  } catch {
    f7.toast
      .create({ text: "Не удалось сохранить КТП", closeTimeout: 3000, cssClass: "color-red" })
      .open();
    // popover stays open
  } finally {
    saving.value = false;
  }
};
</script>
