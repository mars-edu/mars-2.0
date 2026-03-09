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
        class="flex-1 overflow-y-auto p-3 md:p-4 bg-background pb-16 md:pb-6 transition-all duration-200"
        :class="contentMargin"
      >
        <div class="flex flex-col gap-4">
          <div class="flex items-center justify-between">
            <h1 class="text-xl font-semibold">Каталог дисциплин</h1>
            <div class="flex gap-2">
              <f7-input
                v-model:value="searchQuery"
                type="text"
                placeholder="Поиск..."
                class="border border-border rounded-lg !bg-white"
                clear-button
              ></f7-input>
            </div>
          </div>

          <div
            class="bg-card text-card-foreground rounded-xl p-4 md:p-4 shadow-sm"
          >
            <div class="overflow-x-auto">
              <table class="w-full border-collapse">
                <thead>
                  <tr class="bg-muted/50">
                    <th class="px-4 py-3 text-left">№</th>
                    <th class="px-4 py-3 text-left">Модуль</th>
                    <th class="px-4 py-3 text-left">Результат обучения</th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="(discipline, index) in filteredDisciplines"
                    :key="discipline._id"
                    :id="`discipline-item-${discipline._id}`"
                    class="border-b border-border hover:bg-muted/30"
                    :class="{ 'bg-red-100': discipline.isHighlighted }"
                    @click="selectDiscipline(discipline)"
                  >
                    <td class="px-4 py-3">{{ index + 1 }}</td>
                    <td class="px-4 py-3">{{ discipline.moduleName }}</td>
                    <td class="px-4 py-3">{{ discipline.learningOutcome }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>

    <template #fixed>
      <AddDisciplineButton />
    </template>

    <EditDisciplineButton
      v-if="selectedDisciplineId"
      :key="`edit-${selectedDisciplineId}`"
      :discipline-id="selectedDisciplineId"
    />
  </f7-page>
</template>

<script setup lang="ts">
import { useSidebar } from "@/composables/useSidebar";
const { contentMargin } = useSidebar();
import { ref, computed, nextTick } from "vue";
import { f7Page, f7Input, f7 } from "framework7-vue";
import Header from "@/components/Header/Header.vue";
import Sidebar from "@/components/Sidebar/Sidebar.vue";
import AddDisciplineButton from "@/components/AddDisciplineButton.vue";
import EditDisciplineButton from "@/components/EditDisciplineButton.vue";
import { useDisciplineStore, type Discipline } from "@/stores/disciplineStore";

// Unique page ID that changes on each mount to track navigation
const pageId = ref(Date.now());

const activeNavItem = ref("discipline-catalog");
const disciplineStore = useDisciplineStore();
const selectedDisciplineId = ref<string | null>(null);
const searchQuery = ref("");

const filteredDisciplines = computed(() => {
  if (!searchQuery.value.trim()) {
    return disciplineStore.getAllDisciplines;
  }

  const query = searchQuery.value.toLowerCase().trim();
  return disciplineStore.getAllDisciplines.filter((discipline) => {
    return (
      discipline.moduleName?.toLowerCase().includes(query) ||
      discipline.learningOutcome?.toLowerCase().includes(query)
    );
  });
});

const selectDiscipline = async (discipline: Discipline) => {
  selectedDisciplineId.value = discipline._id;
  await nextTick();
  f7.popover.open(
    `#edit-discipline-popover-${discipline._id}`,
    `#discipline-item-${discipline._id}`
  );
};
</script>
