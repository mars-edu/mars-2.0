<template>
  <div v-if="selectedTeacherId" class="bg-card rounded-3xl shadow-xl border border-border overflow-hidden">
    <div class="overflow-x-auto">
      <table class="w-full text-sm text-left border-collapse">
        <thead class="text-[11px] text-muted-foreground uppercase bg-muted/30 border-b border-border">
          <tr>
            <th rowspan="2" class="px-4 py-3 font-bold border-r border-border min-w-[240px]">Дисциплина</th>
            <th rowspan="2" class="px-3 py-3 font-bold border-r border-border min-w-[180px]">Специальность / Язык</th>
            <th rowspan="2" class="px-2 py-3 font-bold text-center border-r border-border w-16">Курс</th>
            <th rowspan="2" class="px-2 py-3 font-bold text-center border-r border-border w-16 whitespace-nowrap">Студенты</th>
            <th :colspan="semesterCount" class="px-2 py-2 text-center border-b border-r border-border font-bold bg-orange-50/10 text-orange-600">Недели по семестрам</th>
            <th :colspan="semesterCount" class="px-2 py-2 text-center border-b border-r border-border font-bold bg-slate-50/10 text-slate-600">Часы на дисциплину</th>
            <th :colspan="semesterCount" class="px-2 py-2 text-center border-b border-r border-border font-bold bg-green-50/10 text-green-600">Часы в группе</th>
            <th :colspan="semesterCount" class="px-2 py-2 text-center border-b border-r border-border font-bold">Количество групп</th>
            <th rowspan="2" class="px-4 py-3 text-center font-bold border-r border-border w-20">Всего</th>
            <th rowspan="2" class="px-4 py-3 text-center w-16 font-bold">Удалить</th>
          </tr>
          <tr class="bg-muted/10">
            <template v-for="ref in yearSemesterRefs" :key="`weeks-h-${ref.semesterId}`">
              <th class="px-1 py-1.5 text-center text-[9px] font-black text-muted-foreground/60 border-r border-border">{{ ref.number }}</th>
            </template>
            <template v-for="ref in yearSemesterRefs" :key="`hours-h-${ref.semesterId}`">
              <th class="px-1 py-1.5 text-center text-[9px] font-black text-muted-foreground/60 border-r border-border">{{ ref.number }}</th>
            </template>
            <template v-for="ref in yearSemesterRefs" :key="`pergroup-h-${ref.semesterId}`">
              <th class="px-1 py-1.5 text-center text-[9px] font-black text-muted-foreground/60 border-r border-border w-16">{{ ref.number }}</th>
            </template>
            <template v-for="ref in yearSemesterRefs" :key="`groups-h-${ref.semesterId}`">
              <th class="px-1 py-1.5 text-center text-[9px] font-black text-muted-foreground/60 border-r border-border">{{ ref.number }}</th>
            </template>
          </tr>
        </thead>
        <tbody class="divide-y divide-border">
          <template v-for="item in currentWorkloadItems" :key="item.id">
            <tr
              class="hover:bg-muted/20 transition-colors group"
              :class="{
                'bg-amber-500/5': item.id.endsWith('_ind'),
                '!border-t-0': item.id.endsWith('_ind'),
              }"
            >
              <td class="px-4 py-2.5 font-bold text-foreground border-r border-border">
                <template v-if="item.id.endsWith('_ind')">
                  <div class="flex items-center gap-2 pl-4">
                    <span class="text-[9px] font-black text-amber-600 bg-amber-500/10 px-1.5 py-0.5 rounded uppercase shrink-0">инд.</span>
                    <span class="text-sm text-foreground">Индивидуальные</span>
                  </div>
                </template>
                <template v-else>
                  <template v-for="entry in [rupEntryStore.getRupEntryById(item.subjectId)]" :key="item.id">
                    <div class="truncate max-w-[320px]" :title="entry?.learningOutcome || item.description">
                      {{ entry?.learningOutcome || item.description }}
                    </div>
                    <div class="text-[10px] text-muted-foreground font-medium mt-0.5">{{ item.index }}</div>
                  </template>
                </template>
              </td>
              <td class="px-2 py-2.5 border-r border-border">
                <template v-if="!item.id.endsWith('_ind')">
                  <div class="flex flex-wrap items-center gap-1">
                    <span
                      v-if="item.language"
                      class="text-[9px] font-black px-1.5 py-0.5 rounded uppercase bg-amber-500/15 text-amber-600 border border-amber-500/30"
                    >{{ item.language }}</span>
                    <span
                      v-for="sid in (item.specialtyIds || [])"
                      :key="sid"
                      class="text-[9px] font-black px-1.5 py-0.5 rounded uppercase bg-emerald-500/10 text-emerald-600 border border-emerald-500/30"
                    >{{ specialtyStore.getSpecialtyById(sid)?.codeName || specShortLabel(sid) }}</span>
                  </div>
                </template>
              </td>
              <td class="px-1 py-2.5 border-r border-border">
                <input
                  type="text"
                  v-model="item.course"
                  class="w-full bg-transparent border-none focus:ring-0 text-sm p-0 text-center font-bold text-muted-foreground outline-none"
                />
              </td>
              <td class="px-1 py-2.5 border-r border-border">
                <input
                  type="text"
                  v-model="item.studentCount"
                  class="w-full bg-transparent border-none focus:ring-0 text-sm p-0 text-center font-bold text-muted-foreground outline-none"
                />
              </td>

              <!-- Weeks -->
              <template v-for="ref in yearSemesterRefs" :key="`weeks-${item.id}-${ref.semesterId}`">
                <td class="px-1 py-2.5 border-r border-border">
                  <input
                    type="number"
                    v-model.number="entryFor(item, ref.semesterId).weeks"
                    @input="recalculateItem(item.id)"
                    class="w-full bg-transparent border-none focus:ring-0 text-sm p-0 text-center font-medium text-foreground outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                </td>
              </template>

              <!-- Hours per week -->
              <template v-for="ref in yearSemesterRefs" :key="`hours-${item.id}-${ref.semesterId}`">
                <td class="px-1 py-2.5 border-r border-border">
                  <input
                    type="number"
                    step="any"
                    v-model.number="entryFor(item, ref.semesterId).hours"
                    @input="recalculateItem(item.id)"
                    class="w-full bg-transparent border-none focus:ring-0 text-sm p-0 text-center font-medium text-foreground outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                </td>
              </template>

              <!-- Hours per group (derived) -->
              <template v-for="ref in yearSemesterRefs" :key="`pergroup-${item.id}-${ref.semesterId}`">
                <td class="px-1 py-2.5 text-center font-bold text-sm border-r border-border text-foreground">
                  {{ formatHours(hoursPerGroup(entryFor(item, ref.semesterId))) }}
                </td>
              </template>

              <!-- Group Count -->
              <template v-for="ref in yearSemesterRefs" :key="`groups-${item.id}-${ref.semesterId}`">
                <td class="px-1 py-2.5 border-r border-border">
                  <div class="flex items-center justify-center gap-1">
                    <button
                      @click="adjustSemesterValue(item.id, ref.semesterId, 'groupCount', -1)"
                      class="w-5 h-5 flex items-center justify-center bg-muted hover:bg-muted/80 rounded text-xs font-bold text-muted-foreground transition-colors"
                    >-</button>
                    <input
                      type="number"
                      v-model.number="entryFor(item, ref.semesterId).groupCount"
                      @input="recalculateItem(item.id)"
                      class="w-10 bg-transparent border-none focus:ring-0 text-sm p-0 text-center font-bold text-foreground outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                    <button
                      @click="adjustSemesterValue(item.id, ref.semesterId, 'groupCount', 1)"
                      class="w-5 h-5 flex items-center justify-center bg-muted hover:bg-muted/80 rounded text-xs font-bold text-muted-foreground transition-colors"
                    >+</button>
                  </div>
                </td>
              </template>

              <td
                class="px-4 py-2.5 text-center font-black text-base border-r border-border"
                :class="item.id.endsWith('_ind') ? 'bg-amber-500/10 text-amber-600' : 'bg-muted/10 text-foreground'"
              >
                {{ item.totalHours }}
                <div v-if="item.id.endsWith('_ind')" class="text-[9px] font-black uppercase tracking-tight mt-0.5">Инд. часы</div>
              </td>
              <td class="px-4 py-2.5 text-center">
                <button
                  @click="$emit('delete-item', item.id)"
                  class="text-muted-foreground hover:text-red-500 transition-all p-1.5 rounded-lg hover:bg-red-500/10 active:scale-90"
                >
                  <IconTrash class="w-4 h-4" />
                </button>
              </td>
            </tr>
            <tr v-if="orphanEntriesFor(item).length" class="bg-red-500/5">
              <td :colspan="6 + semesterCount * 4" class="px-4 py-1.5 text-[11px] font-bold text-red-500">
                <span
                  v-for="entry in orphanEntriesFor(item)"
                  :key="entry.semesterId"
                  class="inline-flex items-center gap-1 mr-3"
                >
                  <span class="uppercase tracking-wide">Семестр не найден</span>
                  (id: {{ entry.semesterId }}) — {{ formatHours(hoursPerGroup(entry)) }} ч./группу × {{ entry.groupCount }} гр.
                </span>
              </td>
            </tr>
          </template>

          <tr v-if="currentWorkloadItems.length === 0">
            <td :colspan="6 + semesterCount * 4" class="px-6 py-20 text-center">
              <div class="flex flex-col items-center justify-center">
                <div class="w-20 h-20 bg-muted rounded-full flex items-center justify-center mb-4 text-muted-foreground/30">
                  <IconLayoutGrid class="w-8 h-8" />
                </div>
                <p class="text-xl font-bold text-muted-foreground">Нагрузка пуста</p>
                <p class="text-sm text-muted-foreground mt-2">Добавьте предметы для формирования нагрузки преподавателя</p>
              </div>
            </td>
          </tr>
        </tbody>
        <tfoot v-if="currentWorkloadItems.length > 0">
          <tr class="bg-muted/20 border-t border-border">
            <td :colspan="4 + semesterCount * 4" class="px-6 py-5 font-bold text-right text-muted-foreground uppercase tracking-wider">
              Итоговая нагрузка:
            </td>
            <td class="px-6 py-5 font-black text-center text-2xl text-foreground">
              {{ totalCurrentWorkloadHours }}
            </td>
            <td></td>
          </tr>
        </tfoot>
      </table>
    </div>

    <div v-if="currentWorkloadItems.length > 0" class="p-6 bg-muted/10 border-t border-border flex justify-end">
      <button
        @click="$emit('save')"
        class="flex items-center gap-2 px-8 py-4 bg-green-500 hover:bg-green-600 text-white rounded-2xl font-black text-lg transition-all shadow-xl shadow-green-500/30 active:scale-95"
      >
        <IconSave class="w-6 h-6" />
        СОХРАНИТЬ НАГРУЗКУ
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import IconLayoutGrid from "~icons/lucide/layout-grid";
import IconTrash from "~icons/lucide/trash-2";
import IconSave from "~icons/lucide/save";
import { useRupEntryStore } from "@/stores/rupEntryStore";
import { useSpecialtyStore } from "@/stores/specialtyStore";
import type { WorkloadItem, WorkloadSemesterEntry } from "@/types/workload";
import {
  formatHours,
  hoursPerGroup,
  type YearSemesterRef,
} from "@/lib/workloadHours";

const rupEntryStore = useRupEntryStore();
const specialtyStore = useSpecialtyStore();

const props = defineProps<{
  selectedTeacherId: string;
  semesterCount: number;
  yearSemesterRefs: YearSemesterRef[];
  currentWorkloadItems: WorkloadItem[];
  totalCurrentWorkloadHours: number;
  entryFor: (item: WorkloadItem, semesterId: string) => WorkloadSemesterEntry;
  orphanEntriesFor: (item: WorkloadItem) => WorkloadSemesterEntry[];
  specShortLabel: (id: string) => string;
}>();

const emit = defineEmits<{
  (e: "recalculate", itemId: string): void;
  (e: "adjust-semester", itemId: string, semesterId: string, field: "weeks" | "hours" | "groupCount", delta: number): void;
  (e: "delete-item", itemId: string): void;
  (e: "save"): void;
}>();

function recalculateItem(itemId: string) {
  emit("recalculate", itemId);
}

function adjustSemesterValue(
  itemId: string,
  semesterId: string,
  field: "weeks" | "hours" | "groupCount",
  delta: number
) {
  emit("adjust-semester", itemId, semesterId, field, delta);
}
</script>
