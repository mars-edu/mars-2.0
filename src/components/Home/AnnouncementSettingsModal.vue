<template>
  <GuardedPopover
    id="announcement-settings-popup"
    kind="popup"
    :opened="opened"
    @popup:closed="$emit('update:opened', false)"
    class="announcement-settings-popup"
  >
    <template v-slot="{ requestClose }">
      <div class="flex flex-col h-full">
        <div class="flex flex-col h-full bg-card">
          <div class="fixed-header">
            <PopoverHeader
              title="Настройки категорий"
              :cancel-text="common_close()"
              :on-cancel="requestClose"
            />
          </div>

          <div class="wizard-content px-6 py-5 space-y-5">
            <div class="settings-summary">
              <div class="flex items-center gap-3 min-w-0">
                <div class="summary-icon">
                  <IconTags class="w-5 h-5" />
                </div>
                <div class="min-w-0">
                  <div class="text-[11px] font-bold uppercase text-muted-foreground tracking-widest">
                    Список категорий
                  </div>
                  <div class="text-sm font-semibold text-foreground truncate">
                    {{ categories.length }} {{ categoryCountLabel }}
                  </div>
                </div>
              </div>
              <button
                type="button"
                class="add-category-button"
                @click="addCategory"
              >
                <IconPlus class="w-4 h-4" />
                <span>Добавить</span>
              </button>
            </div>

            <div v-if="categories.length === 0" class="empty-categories">
              <div class="empty-icon">
                <IconTags class="w-6 h-6" />
              </div>
              <div class="text-sm font-semibold text-foreground">Категорий пока нет</div>
              <button type="button" class="empty-add-button" @click="addCategory">
                <IconPlus class="w-4 h-4" />
                <span>Создать категорию</span>
              </button>
            </div>

            <div v-else class="category-list">
              <div
                v-for="(cat, index) in categories"
                :key="index"
                class="category-row"
              >
                <div class="row-index">
                  {{ String(index + 1).padStart(2, "0") }}
                </div>

                <div class="flex-1 grid grid-cols-1 md:grid-cols-[0.95fr_1fr_1fr_1fr] gap-3 min-w-0">
                  <label class="field-shell">
                    <span class="field-label">
                      <IconHash class="w-3.5 h-3.5" />
                      Slug
                    </span>
                    <f7-input
                      type="text"
                      placeholder="academic"
                      v-model:value="cat.id"
                      class="category-input"
                    />
                  </label>

                  <label class="field-shell">
                    <span class="field-label">
                      <IconType class="w-3.5 h-3.5" />
                      RU
                    </span>
                    <f7-input
                      type="text"
                      placeholder="Академические"
                      v-model:value="cat.labels.ru"
                      class="category-input"
                    />
                  </label>

                  <label class="field-shell">
                    <span class="field-label">
                      <IconType class="w-3.5 h-3.5" />
                      KK
                    </span>
                    <f7-input
                      type="text"
                      placeholder="Оқу бөлімі"
                      v-model:value="cat.labels.kk"
                      class="category-input"
                    />
                  </label>

                  <label class="field-shell">
                    <span class="field-label">
                      <IconType class="w-3.5 h-3.5" />
                      EN
                    </span>
                    <f7-input
                      type="text"
                      placeholder="Academic"
                      v-model:value="cat.labels.en"
                      class="category-input"
                    />
                  </label>
                </div>

                <button
                  type="button"
                  class="delete-category-button"
                  :title="`Удалить ${getCategoryTitle(cat)}`"
                  @click="removeCategory(index)"
                >
                  <IconTrash class="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          <PopoverFooter
            :cancel-text="common_close()"
            save-text="Сохранить"
            save-variant="primary"
            :on-cancel="requestClose"
            :on-save="handleSave"
          />
        </div>
      </div>
    </template>
  </GuardedPopover>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { f7Input } from 'framework7-vue';
import { common_close } from '@/paraglide/messages';
import GuardedPopover from '@/components/ui/GuardedPopover.vue';
import PopoverHeader from '@/components/ui/PopoverHeader.vue';
import PopoverFooter from '@/components/ui/PopoverFooter.vue';
import IconPlus from "~icons/lucide/plus";
import IconTrash from "~icons/lucide/trash-2";
import IconHash from "~icons/lucide/hash";
import IconTags from "~icons/lucide/tags";
import IconType from "~icons/lucide/type";
import type { AnnouncementCategory, AnnouncementContent } from '@/types/announcement';

const props = defineProps<{
  opened: boolean;
  initialCategories: AnnouncementCategory[];
}>();

const emit = defineEmits(['update:opened', 'save']);

const normalizeCategoryForForm = (category: AnnouncementCategory) => ({
  id: category.id,
  labels: {
    ru: category.labels?.ru || category.label || '',
    kk: category.labels?.kk || '',
    en: category.labels?.en || '',
  } satisfies AnnouncementContent,
});

const categories = ref(props.initialCategories.map(normalizeCategoryForForm));

const categoryCountLabel = computed(() => {
  const count = categories.value.length;
  if (count === 1) return "категория";
  if (count > 1 && count < 5) return "категории";
  return "категорий";
});

watch(() => props.opened, (isOpened) => {
  if (isOpened) {
    categories.value = props.initialCategories.map(normalizeCategoryForForm);
  }
});

const addCategory = () => {
  categories.value.push({ id: '', labels: { ru: '', kk: '', en: '' } });
};

const removeCategory = (index: number) => {
  categories.value.splice(index, 1);
};

const handleSave = () => {
  const validCategories = categories.value.filter(
    c => c.id.trim() && Object.values(c.labels).some(value => value?.trim())
  );
  emit('save', validCategories);
  emit('update:opened', false);
};

const getCategoryTitle = (category: { id: string; labels: AnnouncementContent }) => {
  return category.labels.ru || category.labels.kk || category.labels.en || category.id || 'категорию';
};
</script>

<style scoped>
.announcement-settings-popup {
  --f7-popup-tablet-width: 620px;
  --f7-popup-tablet-height: min(760px, calc(100vh - 96px));
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

.settings-summary {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  min-height: 72px;
  padding: 1rem;
  border: 1px solid hsl(var(--border));
  border-radius: 1rem;
  background:
    linear-gradient(135deg, hsl(var(--muted)) 0%, hsl(var(--card)) 72%),
    hsl(var(--card));
}

.summary-icon,
.empty-icon {
  width: 2.75rem;
  height: 2.75rem;
  flex: none;
  display: grid;
  place-items: center;
  border-radius: 0.875rem;
  color: hsl(var(--primary));
  background: hsl(var(--primary) / 0.1);
}

.add-category-button,
.empty-add-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  min-height: 2.5rem;
  padding: 0 0.875rem;
  border: 1px solid hsl(var(--primary) / 0.25);
  border-radius: 0.75rem;
  background: hsl(var(--primary));
  color: hsl(var(--primary-foreground));
  font-size: 0.75rem;
  font-weight: 700;
  transition: transform 140ms ease, box-shadow 140ms ease, opacity 140ms ease;
}

.add-category-button:hover,
.empty-add-button:hover {
  box-shadow: 0 10px 24px hsl(var(--primary) / 0.18);
  transform: translateY(-1px);
}

.add-category-button:active,
.empty-add-button:active {
  transform: scale(0.98);
}

.empty-categories {
  min-height: 260px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.875rem;
  border: 1px dashed hsl(var(--border));
  border-radius: 1rem;
  background: hsl(var(--muted) / 0.45);
  text-align: center;
}

.category-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.category-row {
  display: flex;
  align-items: stretch;
  gap: 0.75rem;
  padding: 0.875rem;
  border: 1px solid hsl(var(--border));
  border-radius: 1rem;
  background: hsl(var(--card));
  transition: border-color 140ms ease, box-shadow 140ms ease, transform 140ms ease;
}

.category-row:hover {
  border-color: hsl(var(--primary) / 0.22);
  box-shadow: 0 12px 28px hsl(var(--foreground) / 0.06);
  transform: translateY(-1px);
}

.row-index {
  width: 2.25rem;
  min-height: 4.75rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 0.75rem;
  background: hsl(var(--muted));
  color: hsl(var(--muted-foreground));
  font-size: 0.6875rem;
  font-weight: 800;
  letter-spacing: 0.08em;
}

.field-shell {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
}

.field-label {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  color: hsl(var(--muted-foreground));
  font-size: 0.625rem;
  font-weight: 800;
  line-height: 1;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.category-input {
  min-height: 2.625rem;
  border: 1px solid transparent;
  border-radius: 0.75rem;
  background: hsl(var(--muted));
  padding: 0.125rem 0.875rem;
  transition: border-color 140ms ease, background-color 140ms ease;
}

.category-input:focus-within {
  border-color: hsl(var(--primary) / 0.32);
  background: hsl(var(--card));
}

.delete-category-button {
  width: 2.625rem;
  min-height: 4.75rem;
  flex: none;
  display: grid;
  place-items: center;
  border-radius: 0.75rem;
  color: hsl(var(--muted-foreground));
  background: hsl(var(--muted));
  transition: background-color 140ms ease, color 140ms ease, transform 140ms ease;
}

.delete-category-button:hover {
  color: hsl(var(--destructive));
  background: hsl(var(--destructive) / 0.1);
}

.delete-category-button:active {
  transform: scale(0.97);
}

:deep(.item-input-wrap) {
  margin-top: 0 !important;
}

:deep(.input-with-value) {
  background: transparent !important;
}

@media (max-width: 640px) {
  .settings-summary {
    align-items: flex-start;
    flex-direction: column;
  }

  .add-category-button {
    width: 100%;
  }

  .category-row {
    display: grid;
    grid-template-columns: 2.25rem 1fr;
  }

  .delete-category-button {
    grid-column: 1 / -1;
    width: 100%;
    min-height: 2.5rem;
  }
}
</style>
