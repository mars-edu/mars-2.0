<template>
  <f7-page
    name="discipline-catalog"
    class="flex flex-col h-screen bg-background text-foreground"
    :data-page-id="`discipline-catalog-${pageId}`"
    data-page-name="discipline-catalog"
  >
    <Header class="hidden md:block flex-shrink-0 border-b border-border" />

    <div class="flex flex-1 overflow-hidden">
      <Sidebar v-model:activeNavItem="activeNavItem" class="hidden md:block" />

      <div
        class="flex-1 overflow-y-auto p-6 md:p-8 bg-[#F3F4F6] pb-16 md:pb-8 transition-all duration-200"
        :class="contentMargin"
      >
        <div class="max-w-7xl mx-auto space-y-6">
          <!-- Top Level Title -->
          <div class="flex justify-between items-center px-1">
            <h1 class="text-xl font-bold text-[#1F2937]">{{ catalog_discipline_title() }}:</h1>
            <div class="text-sm font-medium text-muted-foreground/60">
              {{ activeAcademicYearName.split('-')[0] }}
            </div>
          </div>

          <!-- Main Content Card -->
          <div class="bg-white rounded-2xl shadow-[0_1px_3px_0_rgba(0,0,0,0.05),0_1px_2px_0_rgba(0,0,0,0.03)] border border-border/40 overflow-hidden">
            <!-- Actions Bar inside the card -->
            <div class="p-8 pb-4 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <!-- Search on the left -->
              <div class="relative w-full md:w-[450px]">
                <IconSearch class="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground/40 w-4 h-4" />
                <f7-input
                  v-model:value="searchQuery"
                  type="text"
                  placeholder="Поиск по коду или названию..."
                  class="search-input !bg-white border border-[#E5E7EB] rounded-xl pl-10 h-11 w-full text-sm placeholder:text-muted-foreground/40"
                  clear-button
                ></f7-input>
              </div>
              
              <div class="flex items-center gap-4">
                <!-- Base Filter Toggle -->
                <div class="flex items-center p-1 bg-[#F9FAFB] rounded-xl border border-[#E5E7EB]">
                  <button 
                    @click="baseFilter = 'all'"
                    class="px-4 py-1.5 text-[10px] font-bold rounded-lg transition-all uppercase tracking-wider"
                    :class="baseFilter === 'all' ? 'bg-white text-[#1F2937] shadow-sm ring-1 ring-black/5' : 'text-muted-foreground/60 hover:text-foreground'"
                  >
                    {{ catalog_base_all() }}
                  </button>
                  <button 
                    @click="baseFilter = '9'"
                    class="px-4 py-1.5 text-[10px] font-bold rounded-lg transition-all uppercase tracking-wider"
                    :class="baseFilter === '9' ? 'bg-white text-[#1F2937] shadow-sm ring-1 ring-black/5' : 'text-muted-foreground/60 hover:text-foreground'"
                  >
                    {{ catalog_base_9() }}
                  </button>
                  <button 
                    @click="baseFilter = '11'"
                    class="px-4 py-1.5 text-[10px] font-bold rounded-lg transition-all uppercase tracking-wider"
                    :class="baseFilter === '11' ? 'bg-white text-[#1F2937] shadow-sm ring-1 ring-black/5' : 'text-muted-foreground/60 hover:text-foreground'"
                  >
                    {{ catalog_base_11() }}
                  </button>
                </div>

                <!-- Add Button -->
                <button
                  @click="openAddPopup"
                  class="flex items-center justify-center gap-2 px-6 py-2 bg-[#22C55E] hover:bg-[#16A34A] text-white font-bold rounded-xl transition-all shadow-sm active:scale-[0.98] h-11"
                >
                  <IconPlus class="w-4 h-4" />
                  <span class="text-sm font-bold tracking-wide">{{ catalog_discipline_add() }}</span>
                </button>
              </div>
            </div>

            <!-- Table Content -->
            <div class="overflow-x-auto px-2">
              <table class="w-full border-collapse">
                <thead>
                  <tr class="border-b border-[#F3F4F6]">
                    <th class="px-8 py-5 text-left text-[10px] font-bold text-muted-foreground/40 uppercase tracking-[0.2em] w-32">индекс</th>
                    <th class="px-8 py-5 text-left text-[10px] font-bold text-muted-foreground/40 uppercase tracking-[0.2em]">наименование дисциплины</th>
                    <th class="px-8 py-5 text-center text-[10px] font-bold text-muted-foreground/40 uppercase tracking-[0.2em] w-32">кредиты</th>
                    <th class="px-8 py-5 text-center text-[10px] font-bold text-muted-foreground/40 uppercase tracking-[0.2em] w-32">часы</th>
                    <th class="px-8 py-5 text-center text-[10px] font-bold text-muted-foreground/40 uppercase tracking-[0.2em] w-32">языки</th>
                    <th class="px-8 py-5 text-right text-[10px] font-bold text-muted-foreground/40 uppercase tracking-[0.2em] w-32">действия</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-[#F3F4F6]">
                  <tr
                    v-for="item in filteredItems"
                    :key="item.id"
                    class="group hover:bg-[#F9FAFB]/50 transition-colors"
                  >
                    <td class="px-8 py-10 align-top">
                      <div class="font-bold text-[#1F2937] text-sm uppercase tracking-tight">{{ item.moduleIndex }}</div>
                    </td>
                    <td class="px-8 py-10 align-top">
                      <div class="font-bold text-[#1F2937] text-[15px] tracking-tight leading-none mb-2">{{ item.moduleName }}</div>
                      <div class="text-[11px] text-muted-foreground/70 leading-relaxed max-w-xl">{{ item.learningOutcome }}</div>
                      <div v-if="item.baseClass && item.baseClass.length" class="mt-3 flex gap-1">
                        <span 
                          v-for="base in item.baseClass" 
                          :key="base"
                          class="inline-flex items-center px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-[#FFF1E7] text-[#FF823C] border border-[#FFD8C4]"
                        >
                          База {{ base }} кл
                        </span>
                      </div>
                    </td>
                    <td class="px-8 py-10 text-center align-top">
                       <span class="inline-flex items-center justify-center w-6 h-6 rounded-full text-[11px] font-bold bg-[#FEF9C3] text-[#A16207]">
                        {{ item.totalCredits || 0 }}
                      </span>
                    </td>
                    <td class="px-8 py-10 text-center align-top text-[13px] font-medium text-muted-foreground/70 whitespace-nowrap">
                      {{ item.totalHours || 0 }} ч.
                    </td>
                    <td class="px-8 py-10 text-center align-top">
                      <div class="flex flex-wrap justify-center gap-1">
                        <span 
                          v-if="item.language"
                          class="inline-flex items-center px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider border"
                          :class="{
                            'bg-[#E0E7FF] text-[#4338CA] border-[#C7D2FE]': item.language === 'ru',
                            'bg-[#CCFBF1] text-[#0F766E] border-[#99F6E4]': item.language === 'kk',
                            'bg-[#F3E8FF] text-[#7E22CE] border-[#E9D5FF]': item.language === 'en',
                          }"
                        >
                          {{ item.language.toUpperCase() }}
                        </span>
                        <span v-else class="text-xs text-muted-foreground/40">-</span>
                      </div>
                    </td>
                    <td class="px-8 py-10 text-right align-top">
                      <div class="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-all duration-200">
                        <button 
                          @click="openEditPopup(item)"
                          class="p-2 text-muted-foreground/60 hover:text-[#1F2937] transition-colors"
                          :title="common_edit()"
                        >
                          <IconEdit class="w-4 h-4" />
                        </button>
                        <button 
                          @click="handleDelete(item)"
                          class="p-2 text-muted-foreground/60 hover:text-destructive transition-colors"
                          :title="common_delete()"
                        >
                          <IconTrash class="w-4 h-4" />
                        </button>
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

    <!-- Modals -->
    <Class9Popup
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
import { f7Page, f7Input, f7 } from "framework7-vue";
import Header from "@/components/Header/Header.vue";
import Sidebar from "@/components/Sidebar/Sidebar.vue";
import Class9Popup from "@/components/Class9Popup.vue";
import { useClass9Store, type Class9Data } from "@/stores/class9Store";
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

const { locale } = useI18n();
const pageId = ref(Date.now());
const { contentMargin } = useSidebar();

const activeNavItem = ref("discipline-catalog");
const class9Store = useClass9Store();
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
  let items = class9Store.getAllClass9Items;

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
const editingItem = ref<Class9Data | null>(null);

const openAddPopup = () => {
  editingItem.value = null;
  isPopupOpen.value = true;
  nextTick(() => {
    f7.popover.open("#class9-popover");
  });
};

const openEditPopup = (item: Class9Data) => {
  editingItem.value = { ...item };
  isPopupOpen.value = true;
  nextTick(() => {
    f7.popover.open("#class9-popover");
  });
};

const closePopup = () => {
  isPopupOpen.value = false;
  editingItem.value = null;
};

const handlePopupSubmit = () => {
  closePopup();
};

const handleDelete = (item: Class9Data) => {
  f7.dialog.confirm(
    `<p>Вы уверены, что хотите удалить запись "${item.moduleName}"?</p>
     <p class="text-sm text-muted-foreground mt-2">Это действие нельзя отменить.</p>`,
    "Удаление записи",
    async () => {
      try {
        await class9Store.deleteClass9(item.id);
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
:deep(.search-input .input-outline) {
  border-radius: 0.75rem !important;
}

:deep(.search-input input) {
  height: 2.5rem !important;
  font-size: 0.875rem !important;
}
</style>
