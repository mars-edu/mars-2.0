<template>
  <f7-page
    name="cabinet-management"
    class="flex flex-col h-screen bg-background text-foreground"
  >
    <Header class="hidden md:block flex-shrink-0 border-b border-border" />

    <Sidebar v-model:activeNavItem="activeNavItem" />

    <!-- Outer padding area -->
    <div
      class="flex flex-1 overflow-hidden p-2 md:p-4 transition-all duration-200"
      :class="contentMargin"
    >
      <!-- Big outer card -->
      <div class="flex-1 flex flex-col min-h-0 rounded-2xl border border-border/10 overflow-hidden bg-card shadow-[0_8px_30px_rgba(0,0,0,0.04)]">

        <!-- Title row -->
        <div class="flex items-center justify-between px-8 py-6 pb-2 shrink-0">
          <h1 class="text-xl font-bold text-foreground whitespace-nowrap">{{ cabinet_title() }}</h1>
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
                    :placeholder="cabinet_search()"
                    class="cabinet-search-input w-full pl-10 pr-4 py-2 rounded-lg text-sm text-foreground transition-all"
                  />
                </div>

                <div class="flex items-center gap-2 w-full md:w-auto">
                  <span class="text-xs font-medium text-muted-foreground whitespace-nowrap">{{ cabinet_filter_type() }}:</span>
                  <select
                    v-model="selectedType"
                    class="bg-muted border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:ring-2 focus:ring-primary/20 outline-none transition-all cursor-pointer min-w-[120px]"
                  >
                    <option value="all">{{ catalog_base_all() }}</option>
                    <option value="lecture">{{ cabinet_type_lecture() }}</option>
                    <option value="lab">{{ cabinet_type_lab() }}</option>
                    <option value="gym">{{ cabinet_type_gym() }}</option>
                    <option value="other">{{ cabinet_type_other() }}</option>
                  </select>
                </div>
              </div>

              <div class="flex items-center gap-3 w-full md:w-auto justify-end">
                <button
                  id="add-cabinet-inline-btn"
                  @click="triggerAddCabinet"
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
                      <th class="px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider w-16">{{ cabinet_col_num() }}</th>
                      <th class="px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">{{ cabinet_col_name() }}</th>
                      <th class="px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider w-32 text-center">{{ cabinet_col_capacity() }}</th>
                      <th class="px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider w-36">{{ cabinet_col_type() }}</th>
                      <th class="px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">{{ cabinet_col_description() }}</th>
                      <th class="px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider w-28 text-center">{{ cabinet_col_status() }}</th>
                      <th class="px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider text-right w-32">{{ cabinet_col_actions() }}</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-border">
                    <tr
                      v-for="(cabinet, index) in filteredCabinets"
                      :key="cabinet.id"
                      :id="`cabinet-item-${cabinet.id}`"
                      class="group hover:bg-muted/40 transition-colors cursor-pointer"
                      :class="{ 'opacity-50': !cabinet.isActive }"
                      @click="selectCabinet(cabinet)"
                    >
                      <td class="px-6 py-4 text-sm text-muted-foreground/70 font-medium">{{ index + 1 }}</td>
                      <td class="px-6 py-4">
                        <span class="text-sm font-bold text-foreground">{{ cabinet.name }}</span>
                      </td>
                      <td class="px-6 py-4 text-center">
                        <span class="text-sm font-medium text-muted-foreground">{{ cabinet.capacity }}</span>
                      </td>
                      <td class="px-6 py-4">
                        <span class="text-sm font-medium text-muted-foreground">{{ getTypeLabel(cabinet.type) }}</span>
                      </td>
                      <td class="px-6 py-4">
                        <span class="text-sm text-muted-foreground">{{ cabinet.description || '—' }}</span>
                      </td>
                      <td class="px-6 py-4 text-center">
                        <span
                          class="inline-flex px-2.5 py-1 rounded-full text-xs font-semibold"
                          :class="cabinet.isActive
                            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                            : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'"
                        >
                          {{ cabinet.isActive ? cabinet_status_active() : cabinet_status_inactive() }}
                        </span>
                      </td>
                      <td class="px-6 py-4 text-right">
                        <div class="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            @click.stop="selectCabinet(cabinet)"
                            class="p-2 text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded-lg transition-colors"
                            :title="common_edit()"
                          ><IconEdit class="w-4 h-4" /></button>
                          <button
                            @click.stop="handleToggleActive(cabinet)"
                            class="p-2 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                            :title="cabinet.isActive ? cabinet_status_inactive() : cabinet_status_active()"
                          ><component :is="cabinet.isActive ? IconBan : IconCheck" class="w-4 h-4" /></button>
                          <button
                            @click.stop="handleDelete(cabinet)"
                            class="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                            :title="common_delete()"
                          ><IconTrash class="w-4 h-4" /></button>
                        </div>
                      </td>
                    </tr>
                    <tr v-if="filteredCabinets.length === 0">
                      <td colspan="7" class="px-8 py-24 text-center text-muted-foreground/40 text-sm italic">
                        {{ cabinet_not_found() }}
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
      <AddCabinetButton />
    </template>

    <EditCabinetButton
      v-if="selectedCabinetId"
      :key="`edit-${selectedCabinetId}`"
      :cabinet-id="selectedCabinetId"
    />
  </f7-page>
</template>

<script setup lang="ts">
import { ref, nextTick, computed } from "vue";
import { f7Page, f7 } from "framework7-vue";
import Header from "@/components/Header/Header.vue";
import Sidebar from "@/components/Sidebar/Sidebar.vue";
import AddCabinetButton from "@/components/AddCabinetButton.vue";
import EditCabinetButton from "@/components/EditCabinetButton.vue";
import { useCabinetStore, type Cabinet } from "@/stores/cabinetStore";
import { storeToRefs } from "pinia";
import Fuse from "fuse.js";
import { useSidebar } from "@/composables/useSidebar";
import {
  cabinet_title,
  cabinet_search,
  cabinet_col_num,
  cabinet_col_name,
  cabinet_col_capacity,
  cabinet_col_type,
  cabinet_col_description,
  cabinet_col_status,
  cabinet_col_actions,
  cabinet_filter_type,
  cabinet_type_lecture,
  cabinet_type_lab,
  cabinet_type_gym,
  cabinet_type_other,
  cabinet_status_active,
  cabinet_status_inactive,
  cabinet_not_found,
  catalog_base_all,
  common_edit,
  common_add,
  common_delete,
} from "@/paraglide/messages";

import IconSearch from "~icons/lucide/search";
import IconPlus from "~icons/lucide/plus";
import IconEdit from "~icons/lucide/edit";
import IconTrash from "~icons/lucide/trash-2";
import IconBan from "~icons/lucide/ban";
import IconCheck from "~icons/lucide/check";

const { contentMargin } = useSidebar();
const activeNavItem = ref("cabinet-management");
const cabinetStore = useCabinetStore();
const { cabinets } = storeToRefs(cabinetStore);
const selectedCabinetId = ref<string | null>(null);
const searchTerm = ref("");
const selectedType = ref<string>("all");

const getTypeLabel = (type: string): string => {
  switch (type) {
    case "lecture": return cabinet_type_lecture();
    case "lab": return cabinet_type_lab();
    case "gym": return cabinet_type_gym();
    default: return cabinet_type_other();
  }
};

const filteredCabinets = computed(() => {
  let result = cabinets.value;

  if (selectedType.value !== "all") {
    result = result.filter((c) => c.type === selectedType.value);
  }

  if (!searchTerm.value) return result;

  const fuse = new Fuse(result, {
    keys: ["name", "description"],
    threshold: 0.3,
  });
  return fuse.search(searchTerm.value).map((res) => res.item);
});

const selectCabinet = async (cabinet: Cabinet) => {
  selectedCabinetId.value = cabinet.id;
  await nextTick();
  f7.popover.open(`#edit-cabinet-popover-${cabinet.id}`);
};

const handleToggleActive = async (cabinet: Cabinet) => {
  try {
    await cabinetStore.toggleActive(cabinet.id);
  } catch {
    f7.dialog.alert("Произошла ошибка при изменении статуса кабинета.");
  }
};

const handleDelete = (cabinet: Cabinet) => {
  f7.dialog.confirm(
    `<p>Вы уверены, что хотите удалить кабинет "${cabinet.name}"?</p>
     <p class="text-sm text-muted-foreground mt-2">Это действие нельзя отменить.</p>`,
    "Удалить кабинет?",
    async () => {
      try {
        await cabinetStore.deleteCabinet(cabinet.id);
      } catch {
        f7.dialog.alert("Произошла ошибка при удалении кабинета.");
      }
    }
  );
};

const triggerAddCabinet = () => {
  const btn = document.getElementById("add-cabinet-button");
  if (btn) btn.click();
};
</script>

<style scoped>
.cabinet-search-input {
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
.cabinet-search-input::placeholder {
  color: rgb(156, 163, 175) !important;
}
.cabinet-search-input:focus {
  background-color: rgb(255, 255, 255) !important;
  border-color: rgb(209, 213, 219) !important;
  box-shadow: 0 0 0 3px rgba(34, 197, 94, 0.08) !important;
}
</style>

<style>
@media (min-width: 768px) {
  #add-cabinet-button {
    display: none !important;
  }
}
</style>
