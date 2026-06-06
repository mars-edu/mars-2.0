<template>
  <GuardedPopover
    id="add-announcement-popup"
    kind="popup"
    :opened="opened"
    @popup:closed="$emit('update:opened', false)"
    class="add-announcement-popup"
    :is-dirty="hasUnsavedChanges"
  >
    <template v-slot="{ requestClose }">
      <div class="flex flex-col h-full">
        <div class="flex flex-col h-full bg-card">
          <div class="fixed-header">
            <PopoverHeader
              :title="home_announcements_modal_title()"
              :cancel-text="common_close()"
              :on-cancel="requestClose"
            />
          </div>

          <div class="wizard-content px-8 py-4 space-y-8">
            <!-- Shared Metadata Fields at the top -->
            <div class="space-y-6">
              <div class="grid grid-cols-2 gap-4">
                <div class="space-y-1.5">
                  <label class="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/70 ml-1">
                    {{ common_date() }}
                  </label>
                  <f7-input
                    type="text"
                    :placeholder="home_announcements_modal_placeholder_date()"
                    v-model:value="form.date"
                    class="bg-muted rounded-xl px-4 py-1 border border-transparent focus-within:border-primary/20 transition-colors"
                  />
                </div>
                <div class="space-y-1.5">
                  <label class="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/70 ml-1">
                    {{ common_category() }}
                  </label>
                  <Select
                    v-model="form.category"
                    :options="categoryOptions"
                    :placeholder="common_category()"
                  />
                </div>
              </div>

              <div class="space-y-2">
                <label class="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/70 ml-1">
                  {{ home_announcements_modal_field_type() }}
                </label>
                <div class="flex bg-muted p-1 rounded-xl">
                  <button
                    v-for="t in types"
                    :key="t.id"
                    type="button"
                    @click="form.type = t.id"
                    class="flex-1 py-2 rounded-lg text-xs font-bold capitalize transition-all"
                    :class="form.type === t.id ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'"
                  >
                    {{ t.label }}
                  </button>
                </div>
              </div>
            </div>

            <!-- Separator -->
            <div class="h-px bg-border/50 w-full"></div>

            <!-- Localized Content Fields at the bottom -->
            <div class="space-y-6">
              <div class="flex items-center justify-between">
                <label class="text-[11px] font-bold uppercase tracking-widest text-foreground">
                  Содержание объявления
                </label>
                <!-- Language Tabs -->
                <div class="flex p-1 bg-muted rounded-xl w-fit">
                  <button
                    v-for="lang in languages"
                    :key="lang.id"
                    type="button"
                    @click="activeLang = lang.id"
                    class="px-3 py-1 rounded-lg text-[10px] font-bold uppercase transition-all"
                    :class="activeLang === lang.id ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'"
                  >
                    {{ lang.id }}
                  </button>
                </div>
              </div>

              <div class="space-y-1.5">
                <label class="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/70 ml-1">
                  {{ home_announcements_modal_field_title() }} ({{ activeLang.toUpperCase() }})
                </label>
                <f7-input
                  type="text"
                  :placeholder="home_announcements_modal_placeholder_title()"
                  v-model:value="form.titles[activeLang]"
                  class="bg-muted rounded-xl px-4 py-1 border border-transparent focus-within:border-primary/20 transition-colors"
                />
              </div>

              <div class="space-y-1.5">
                <label class="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/70 ml-1">
                  {{ common_description() }} ({{ activeLang.toUpperCase() }})
                </label>
                <f7-input
                  type="textarea"
                  :placeholder="home_announcements_modal_placeholder_description()"
                  v-model:value="form.descriptions[activeLang]"
                  class="bg-muted rounded-xl px-4 py-1 h-32 border border-transparent focus-within:border-primary/20 transition-colors"
                  resizable
                />
              </div>
            </div>
          </div>

          <PopoverFooter
            :cancel-text="common_close()"
            :save-text="home_announcements_modal_submit()"
            :disabled="!isFormValid"
            save-variant="primary"
            :on-cancel="requestClose"
            :on-save="handleSubmit"
          />
        </div>
      </div>
    </template>
  </GuardedPopover>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue';
import { f7Input } from 'framework7-vue';
import {
  home_announcements_modal_title,
  common_close,
  home_announcements_modal_field_title,
  home_announcements_modal_placeholder_title,
  common_date,
  home_announcements_modal_placeholder_date,
  common_category,
  home_announcements_filter_academic,
  home_announcements_filter_contests,
  home_announcements_filter_events,
  common_other,
  home_announcements_modal_field_type,
  home_announcements_modal_placeholder_description,
  common_description,
  home_announcements_modal_submit,
} from '@/paraglide/messages';
import { useI18n } from '@/composables/useI18n';
import { getAnnouncementTypes } from '@/utils/homeUtils';
import GuardedPopover from '@/components/ui/GuardedPopover.vue';
import PopoverHeader from '@/components/ui/PopoverHeader.vue';
import PopoverFooter from '@/components/ui/PopoverFooter.vue';
import Select from '@/components/ui/Select.vue';
import type { AnnouncementCategory } from '@/types/announcement';

const { locale } = useI18n();
const props = defineProps<{
  opened: boolean;
  categories?: AnnouncementCategory[];
}>();

const emit = defineEmits(['update:opened', 'add']);

const languages = [
  { id: 'ru', label: 'RU' },
  { id: 'kk', label: 'KK' },
  { id: 'en', label: 'EN' },
];

const activeLang = ref<string>(['ru', 'kk', 'en'].includes(locale.value) ? locale.value : 'ru');

const types = computed(() => getAnnouncementTypes(locale.value));

const getLocalizedValue = (values: Record<string, string | undefined> | undefined) => {
  if (!values) return "";
  return values[locale.value] || values.ru || values.kk || values.en || "";
};

const categoryOptions = computed(() => {
  if (props.categories && props.categories.length > 0) {
    return props.categories.map(c => ({
      value: c.id,
      text: getLocalizedValue(c.labels) || c.label || c.id,
    }));
  }
  return [
    { value: 'academic', text: home_announcements_filter_academic() },
    { value: 'contests', text: home_announcements_filter_contests() },
    { value: 'events', text: home_announcements_filter_events() },
    { value: 'other', text: common_other() },
  ];
});

const initialForm = {
  titles: { ru: '', kk: '', en: '' },
  descriptions: { ru: '', kk: '', en: '' },
  date: '',
  category: 'academic',
  type: 'info',
};

const form = reactive({
  titles: { ...initialForm.titles },
  descriptions: { ...initialForm.descriptions },
  date: initialForm.date,
  category: initialForm.category,
  type: initialForm.type,
});

const isFormValid = computed(() => {
  return form.titles[activeLang.value].trim() !== '' && form.descriptions[activeLang.value].trim() !== '';
});

const isDirty = computed(() => {
  return JSON.stringify(form) !== JSON.stringify(initialForm);
});

const hasUnsavedChanges = () => isDirty.value;

const handleSubmit = () => {
  const submissionData = {
    title: form.titles[activeLang.value] || form.titles.ru || form.titles.kk || form.titles.en,
    description: form.descriptions[activeLang.value] || form.descriptions.ru || form.descriptions.kk || form.descriptions.en,
    titles: { ...form.titles },
    descriptions: { ...form.descriptions },
    date: form.date,
    category: form.category,
    type: form.type,
    id: Date.now()
  };
  
  emit('add', submissionData);
  emit('update:opened', false);
  resetForm();
};

const resetForm = () => {
  form.titles = { ...initialForm.titles };
  form.descriptions = { ...initialForm.descriptions };
  form.date = initialForm.date;
  form.category = initialForm.category;
  form.type = initialForm.type;
};

watch(() => props.opened, (isOpened) => {
  if (!isOpened) {
    resetForm();
  } else {
    activeLang.value = ['ru', 'kk', 'en'].includes(locale.value) ? locale.value : 'ru';
  }
});
</script>

<style scoped>
.add-announcement-popup {
  --f7-popup-tablet-width: 600px;
  --f7-popup-tablet-height: min(850px, calc(100vh - 80px));
}



.fixed-header {
  position: sticky;
  top: 0;
  z-index: 10;
  background-color: var(--f7-popover-bg-color);
}

.wizard-content {
  flex: 1;
  overflow-y: auto;
  min-height: 0;
}

:deep(.item-input-wrap) {
  margin-top: 0 !important;
}

:deep(.input-with-value) {
  background: transparent !important;
}
</style>
