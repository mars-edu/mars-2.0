<template>
  <f7-page
    name="specialty-catalog"
    class="flex flex-col h-screen bg-background text-foreground"
  >
    <Header class="hidden md:block flex-shrink-0 border-b border-border" />

    <Sidebar v-model:activeNavItem="activeNavItem" />

    <!-- Outer padding area — floating card gap, same as DisciplineCatalog -->
    <div
      class="flex flex-1 overflow-hidden p-2 md:p-4 transition-all duration-200"
      :class="contentMargin"
    >
      <!-- Big outer card -->
      <div class="flex-1 flex flex-col min-h-0 rounded-2xl border border-border/10 overflow-hidden bg-card shadow-[0_8px_30px_rgba(0,0,0,0.04)]">

        <!-- Title row -->
        <div class="flex items-center justify-between px-8 py-6 pb-2 shrink-0">
          <h1 class="text-xl font-bold text-foreground whitespace-nowrap">{{ catalog_specialty_title() }}</h1>
        </div>

        <!-- Scrollable content -->
        <div class="flex-1 overflow-y-auto p-6 pb-16 md:pb-6">
          <div class="w-full space-y-6 pb-8">

            <!-- Controls Card -->
            <div class="flex flex-col md:flex-row gap-4 items-center justify-between p-4 rounded-lg shadow-sm border border-border bg-card">
              <div class="flex flex-1 flex-col md:flex-row items-center gap-4 w-full">
                <div class="relative w-full md:w-96">
                  <IconSearch class="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/50 w-[18px] h-[18px]" />
                  <input
                    v-model="searchTerm"
                    type="text"
                    :placeholder="catalog_specialty_search()"
                    class="specialty-search-input w-full pl-10 pr-4 py-2 rounded-lg text-sm text-foreground transition-all"
                  />
                </div>

                <div class="flex items-center gap-2 w-full md:w-auto">
                  <span class="text-xs font-medium text-muted-foreground whitespace-nowrap">{{ catalog_filter_year_foundation() }}:</span>
                  <select
                    v-model="selectedYear"
                    class="bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:ring-2 focus:ring-primary/20 outline-none transition-all cursor-pointer min-w-[120px]"
                  >
                    <option value="all">{{ catalog_base_all() }}</option>
                    <option v-for="year in foundationYears" :key="year" :value="year">
                      {{ year }}
                    </option>
                  </select>
                </div>
              </div>

              <div class="flex items-center gap-3 w-full md:w-auto justify-end">
                <button
                  id="add-specialty-inline-btn"
                  @click="triggerAddSpecialty"
                  class="w-auto flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white font-medium rounded-lg transition-colors shadow-sm"
                >
                  <IconPlus class="w-[18px] h-[18px]" />
                  <span class="hidden sm:inline">{{ common_add() }}</span>
                </button>
              </div>
            </div>

            <!-- Table Card -->
            <div class="bg-card rounded-lg shadow-sm border border-border overflow-hidden">
              <div class="overflow-x-auto">
                <table class="w-full text-left border-collapse">
                  <thead class="bg-muted/50 border-b border-border">
                    <tr>
                      <th class="px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider w-16">{{ catalog_col_num() }}</th>
                      <th class="px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider w-28">{{ catalog_col_code_name() }}</th>
                      <th class="px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider w-36">{{ catalog_col_code() }}</th>
                      <th class="px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">{{ catalog_col_name() }}</th>
                      <th class="px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider w-24 text-center">{{ catalog_col_year() }}</th>
                      <th class="px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider w-36">{{ catalog_col_order_number() }}</th>
                      <th class="px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider text-right w-24">{{ catalog_col_actions() }}</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-border">
                    <tr
                      v-for="(specialty, index) in filteredSpecialties"
                      :key="specialty.id"
                      :id="`specialty-item-${specialty.id}`"
                      class="group hover:bg-muted/40 transition-colors cursor-pointer"
                      :class="{ 'bg-red-50 dark:bg-red-950/20': specialty.isHighlighted }"
                      @click="selectSpecialty(specialty)"
                    >
                      <td class="px-6 py-4 text-sm text-muted-foreground/70 font-medium">{{ index + 1 }}</td>
                      <td class="px-6 py-4">
                        <span class="text-sm font-bold text-foreground">{{ specialty.codeName }}</span>
                      </td>
                      <td class="px-6 py-4">
                        <span class="text-sm font-medium text-muted-foreground">{{ specialty.code }}</span>
                      </td>
                      <td class="px-6 py-4">
                        <div class="font-medium text-foreground text-sm leading-tight">{{ specialty.name }}</div>
                        <div v-if="specialty.details" class="text-[11px] text-muted-foreground/70 mt-0.5 leading-relaxed max-w-xl">{{ specialty.details }}</div>
                      </td>
                      <td class="px-6 py-4 text-center">
                        <span class="text-sm font-medium text-muted-foreground">{{ specialty.year || '—' }}</span>
                      </td>
                      <td class="px-6 py-4">
                        <span class="text-sm font-medium text-muted-foreground">{{ specialty.orderNumber || '—' }}</span>
                      </td>
                      <td class="px-6 py-4 text-right">
                        <div class="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            @click.stop="selectSpecialty(specialty)"
                            class="p-2 text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded-lg transition-colors"
                            :title="common_edit()"
                          ><IconEdit class="w-4 h-4" /></button>
                        </div>
                      </td>
                    </tr>
                    <tr v-if="filteredSpecialties.length === 0">
                      <td colspan="7" class="px-8 py-24 text-center text-muted-foreground/40 text-sm italic">
                        Специальности не найдены
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

    <template #fixed>
      <AddSpecialtyButton />
    </template>

    <EditSpecialtyButton
      v-if="selectedSpecialtyId"
      :key="`edit-${selectedSpecialtyId}`"
      :specialty-id="selectedSpecialtyId"
    />
  </f7-page>
</template>

<script setup lang="ts">
import { ref, nextTick, computed } from "vue";
import { f7Page, f7 } from "framework7-vue";
import Header from "@/components/Header/Header.vue";
import Sidebar from "@/components/Sidebar/Sidebar.vue";
import AddSpecialtyButton from "@/components/AddSpecialtyButton.vue";
import EditSpecialtyButton from "@/components/EditSpecialtyButton.vue";
import { useSpecialtyStore, type Specialty } from "@/stores/specialtyStore";
import { storeToRefs } from "pinia";
import Fuse from "fuse.js";
import { useSidebar } from "@/composables/useSidebar";
import {
  catalog_specialty_title,
  catalog_specialty_search,
  catalog_col_num,
  catalog_col_code_name,
  catalog_col_code,
  catalog_col_name,
  catalog_col_year,
  catalog_col_order_number,
  catalog_col_actions,
  catalog_filter_year_foundation,
  catalog_base_all,
  common_edit,
  common_add,
} from "@/paraglide/messages";
import { useI18n } from "@/composables/useI18n";

import IconSearch from "~icons/lucide/search";
import IconPlus from "~icons/lucide/plus";
import IconEdit from "~icons/lucide/edit";

const { locale } = useI18n();

const { contentMargin } = useSidebar();
const activeNavItem = ref("specialty-catalog");
const specialtyStore = useSpecialtyStore();
const { specialties } = storeToRefs(specialtyStore);
const selectedSpecialtyId = ref<string | null>(null);
const searchTerm = ref("");
const selectedYear = ref<number | string>("all");

const foundationYears = computed(() => {
  const years = specialties.value
    .map((s) => s.year)
    .filter((y): y is number => !!y);
  return [...new Set(years)].sort((a, b) => b - a);
});

const filteredSpecialties = computed(() => {
  let result = specialties.value;

  if (selectedYear.value !== "all") {
    result = result.filter((s) => s.year === selectedYear.value);
  }

  if (!searchTerm.value) return result;

  const fuse = new Fuse(result, {
    keys: ["name", "code", "codeName"],
    threshold: 0.3,
  });
  return fuse.search(searchTerm.value).map((res) => res.item);
});

const selectSpecialty = async (specialty: Specialty) => {
  selectedSpecialtyId.value = specialty.id;
  await nextTick();
  f7.popover.open(`#edit-specialty-popover-${specialty.id}`);
};

const triggerAddSpecialty = () => {
  const btn = document.getElementById("add-specialty-button");
  if (btn) btn.click();
};
</script>

<style scoped>
.specialty-search-input {
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
.specialty-search-input::placeholder {
  color: rgb(156, 163, 175) !important;
}
.specialty-search-input:focus {
  background-color: rgb(255, 255, 255) !important;
  border-color: rgb(209, 213, 219) !important;
  box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.08) !important;
}
</style>

<style>
@media (min-width: 768px) {
  #add-specialty-button {
    display: none !important;
  }
}
</style>
