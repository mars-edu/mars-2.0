<template>
  <f7-page
    name="discipline-catalog"
    class="flex flex-col h-screen bg-background text-foreground"
    :data-page-id="`discipline-catalog-${pageId}`"
    data-page-name="discipline-catalog"
  >
    <Header class="hidden md:block flex-shrink-0 border-b border-border" />

    <Sidebar v-model:activeNavItem="activeNavItem" />

    <!-- Outer padding area — creates the floating card gap like concept's m-4 -->
    <div
      class="flex flex-1 overflow-hidden p-2 md:p-4 transition-all duration-200"
      :class="contentMargin"
    >
      <!-- Big outer card — matches concept's rounded-2xl shadow wrapper -->
      <div class="flex-1 flex flex-col min-h-0 rounded-2xl border border-border/10 overflow-hidden bg-card shadow-[0_8px_30px_rgba(0,0,0,0.04)]">

        <!-- Title row — matches concept's px-8 py-6 pb-2 -->
        <div class="flex items-center justify-between px-8 py-6 pb-2 shrink-0">
          <h1 class="text-xl font-bold text-foreground whitespace-nowrap">{{ catalog_discipline_title() }}:</h1>
          <button class="flex w-fit items-center gap-1 text-muted-foreground font-medium hover:text-foreground px-3 py-1.5 rounded-md hover:bg-muted/60 transition-colors">
            <span class="text-lg">{{ activeAcademicYearName }}</span>
            <IconChevronDown class="w-4 h-4" />
          </button>
        </div>

        <!-- Scrollable content — matches concept's flex-1 overflow-y-auto p-6 -->
        <div class="flex-1 overflow-y-auto p-6 pb-16 md:pb-6">
          <div class="w-full space-y-6 pb-8">

            <!-- Controls Card — matches concept's p-4 rounded-lg shadow-sm border -->
            <div class="flex flex-col md:flex-row gap-4 items-center justify-between p-4 rounded-lg shadow-sm border border-border bg-card">
              <div class="relative w-full md:w-96">
                <IconSearch class="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/50 w-[18px] h-[18px]" />
                <input
                  v-model="searchQuery"
                  type="text"
                  placeholder="Поиск по коду или названию..."
                  class="catalog-search-input w-full pl-10 pr-4 py-2 rounded-lg text-sm text-foreground transition-all"
                />
              </div>

              <div class="flex items-center gap-3 w-full md:w-auto">
                <div class="flex items-center gap-2 p-1 rounded-lg border border-border bg-muted/50">
                  <button
                    @click="baseFilter = 'all'"
                    class="px-3 py-1.5 text-sm font-medium rounded-md transition-all whitespace-nowrap"
                    :class="baseFilter === 'all' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground/60 hover:text-foreground'"
                  >{{ catalog_base_all() }}</button>
                  <button
                    @click="baseFilter = '9'"
                    class="px-3 py-1.5 text-sm font-medium rounded-md transition-all whitespace-nowrap"
                    :class="baseFilter === '9' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground/60 hover:text-foreground'"
                  >{{ catalog_base_9() }}</button>
                  <button
                    @click="baseFilter = '11'"
                    class="px-3 py-1.5 text-sm font-medium rounded-md transition-all whitespace-nowrap"
                    :class="baseFilter === '11' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground/60 hover:text-foreground'"
                  >{{ catalog_base_11() }}</button>
                </div>

                <button
                  @click="openAddPopup"
                  class="w-auto flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white font-medium rounded-lg transition-colors shadow-sm"
                >
                  <IconPlus class="w-[18px] h-[18px]" />
                  <span class="hidden sm:inline">{{ catalog_discipline_add() }}</span>
                </button>
              </div>
            </div>

            <!-- Table Card — matches concept's rounded-lg shadow-sm border -->
            <div class="bg-card rounded-lg shadow-sm border border-border overflow-hidden">
              <div class="overflow-x-auto">
                <table class="w-full text-left border-collapse">
                  <thead class="bg-muted/50 border-b border-border">
                    <tr>
                      <th class="px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider w-32">{{ catalog_col_index() }}</th>
                      <th class="px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">{{ catalog_col_name() }}</th>
                      <th class="px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider text-center w-32">{{ catalog_col_credits() }}</th>
                      <th class="px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider text-center w-32">{{ catalog_col_hours() }}</th>
                      <th class="px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider text-center w-32">{{ catalog_col_languages() }}</th>
                      <th class="px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider text-right w-32">{{ catalog_col_actions() }}</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-border">
                    <tr
                      v-for="item in filteredItems"
                      :key="item.id"
                      class="group hover:bg-muted/40 transition-colors"
                    >
                      <td class="px-6 py-4 font-bold text-foreground text-sm">{{ item.moduleIndex }}</td>
                      <td class="px-6 py-4">
                        <div class="font-medium text-foreground text-sm leading-tight">{{ item.moduleName }}</div>
                        <div class="text-[11px] text-muted-foreground/70 mt-0.5 leading-relaxed max-w-xl">{{ item.learningOutcome }}</div>
                        <div v-if="item.baseClass && item.baseClass.length" class="mt-1 flex gap-1">
                          <span
                            v-for="base in item.baseClass"
                            :key="base"
                            class="inline-block text-[10px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wide"
                            :class="base === 9 ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-400' : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-400'"
                          >База {{ base }} кл</span>
                        </div>
                      </td>
                      <td class="px-6 py-4 text-center">
                        <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-400">
                          {{ item.totalCredits || 0 }}
                        </span>
                      </td>
                      <td class="px-6 py-4 text-center text-sm font-medium text-muted-foreground/70 whitespace-nowrap">
                        {{ item.totalHours || 0 }} ч.
                      </td>
                      <td class="px-6 py-4">
                        <div class="flex flex-wrap justify-center gap-1">
                          <template v-if="item.variants && item.variants.length > 0">
                            <span
                              v-for="v in item.variants"
                              :key="v.language"
                              class="text-[10px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wide"
                              :class="getLanguageBadgeClass(v.language)"
                            >{{ getLanguageLabel(v.language) }}</span>
                          </template>
                          <span
                            v-else-if="item.language"
                            class="text-[10px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wide"
                            :class="getLanguageBadgeClass(item.language)"
                          >{{ getLanguageLabel(item.language) }}</span>
                          <span v-else class="text-xs text-muted-foreground/40">-</span>
                        </div>
                      </td>
                      <td class="px-6 py-4 text-right">
                        <div class="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            @click="openEditPopup(item)"
                            class="p-2 text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded-lg transition-colors"
                            :title="common_edit()"
                          ><IconEdit class="w-4 h-4" /></button>
                          <button
                            @click="handleDelete(item)"
                            class="p-2 text-muted-foreground/40 hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                            :title="common_delete()"
                          ><IconTrash class="w-4 h-4" /></button>
                        </div>
                      </td>
                    </tr>
                    <tr v-if="filteredItems.length === 0">
                      <td colspan="6" class="px-8 py-24 text-center text-muted-foreground/40 text-sm italic">
                        {{ catalog_no_disciplines() }}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>

    <!-- Modals -->
    <RupEntryPopup
      v-if="isPopupOpen"
      :specialty-ids="[]"
      :academic-year-id="activeAcademicYearId"
      :initial-data="editingItem"
      :edit-mode="!!editingItem"
      @close="closePopup"
      @submit="handlePopupSubmit"
    />
  </f7-page>
</template>

<script setup lang="ts">
import { ref, computed, nextTick } from "vue";
import { f7Page, f7 } from "framework7-vue";
import Header from "@/components/Header/Header.vue";
import Sidebar from "@/components/Sidebar/Sidebar.vue";
import RupEntryPopup from "@/components/RupEntryPopup.vue";
import { useRupEntryStore, type RupEntry } from "@/stores/rupEntryStore";
import { getLanguageLabel, getLanguageBadgeClass } from "@/utils/languageBadge";
import { useAcademicYearStore } from "@/stores/academicYearStore";
import { useSidebar } from "@/composables/useSidebar";
import {
  catalog_discipline_title,
  catalog_discipline_search,
  catalog_discipline_add,
  catalog_col_index,
  catalog_col_name,
  catalog_col_credits,
  catalog_col_hours,
  catalog_col_languages,
  catalog_col_actions,
  catalog_no_disciplines,
  catalog_base_all,
  catalog_base_9,
  catalog_base_11,
  common_edit,
  common_delete,
} from "@/paraglide/messages";
import { useI18n } from "@/composables/useI18n";

// Lucide icons
import IconSearch from "~icons/lucide/search";
import IconPlus from "~icons/lucide/plus";
import IconEdit from "~icons/lucide/edit";
import IconTrash from "~icons/lucide/trash-2";
import IconChevronDown from "~icons/lucide/chevron-down";

const { locale } = useI18n();
const pageId = ref(Date.now());
const { contentMargin } = useSidebar();

const activeNavItem = ref("discipline-catalog");
const rupEntryStore = useRupEntryStore();
const academicYearStore = useAcademicYearStore();

const searchQuery = ref("");
const baseFilter = ref<"all" | "9" | "11">("all");

const activeAcademicYearName = computed(() => {
  return academicYearStore.getActiveAcademicYear?.name || "";
});

const activeAcademicYearId = computed(() => {
  return academicYearStore.getActiveAcademicYear?.id || "";
});

const filteredItems = computed(() => {
  let items = rupEntryStore.getAllRupEntries;

  // Filter by Active Academic Year
  if (activeAcademicYearId.value) {
    items = items.filter(item => item.academicYearId === activeAcademicYearId.value);
  }

  // Filter by Base
  if (baseFilter.value !== "all") {
    const baseNum = parseInt(baseFilter.value);
    items = items.filter(item => item.baseClass && item.baseClass.includes(baseNum));
  }

  // Filter by Search Query
  if (searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase().trim();
    items = items.filter(item => 
      item.moduleIndex.toLowerCase().includes(query) ||
      item.moduleName.toLowerCase().includes(query) ||
      item.learningOutcome.toLowerCase().includes(query)
    );
  }

  return items.sort((a, b) => a.moduleIndex.localeCompare(b.moduleIndex));
});

// Popup logic
const isPopupOpen = ref(false);
const editingItem = ref<RupEntry | null>(null);

const openAddPopup = () => {
  editingItem.value = null;
  isPopupOpen.value = true;
  nextTick(() => {
    f7.popover.open("#rup-entry-popover");
  });
};

const openEditPopup = (item: RupEntry) => {
  editingItem.value = { ...item };
  isPopupOpen.value = true;
  nextTick(() => {
    f7.popover.open("#rup-entry-popover");
  });
};

const closePopup = () => {
  isPopupOpen.value = false;
  editingItem.value = null;
};

const handlePopupSubmit = () => {
  closePopup();
};

const handleDelete = (item: RupEntry) => {
  f7.dialog.confirm(
    `<p>Вы уверены, что хотите удалить запись "${item.moduleName}"?</p>
     <p class="text-sm text-muted-foreground mt-2">Это действие нельзя отменить.</p>`,
    "Удаление записи",
    async () => {
      try {
        await rupEntryStore.deleteRupEntry(item.id);
        f7.toast.create({
          text: "Запись удалена",
          closeTimeout: 2000,
        }).open();
      } catch (error) {
        console.error("Failed to delete item:", error);
        f7.dialog.alert("Произошла ошибка при удалении.");
      }
    }
  );
};
</script>

<style scoped>
.catalog-search-input {
  background-color: rgb(243, 244, 246) !important;
  border: 1px solid rgb(229, 231, 235) !important;
  color: hsl(var(--foreground)) !important;
  outline: none !important;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05) !important;
  padding: 0.5rem 1rem 0.5rem 2.5rem !important;
  font-size: 0.875rem !important;
  line-height: 1.25rem !important;
  border-radius: 0.5rem !important;
  width: 100% !important;
}
.catalog-search-input::placeholder {
  color: rgb(156, 163, 175) !important;
}
.catalog-search-input:focus {
  background-color: rgb(255, 255, 255) !important;
  border-color: rgb(209, 213, 219) !important;
  box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.08) !important;
}
</style>

