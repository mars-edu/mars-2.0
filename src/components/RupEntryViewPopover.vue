<template>
  <GuardedPopover
    v-slot="{ requestClose }"
    id="rup-entry-view-popover"
    positioning="center"
    style="width: min(920px, 96vw) !important"
    @popover:closed="$emit('close')"
  >
    <div class="rup-entry-view-popover bg-white text-gray-900">
      <PopoverHeader
        title="Просмотр модуля"
        cancel-text="Закрыть"
        :on-cancel="requestClose"
      />

      <div class="rup-entry-view-content px-8 pb-6 space-y-6">
        <template v-if="item">
          <!-- Module Identity Card -->
          <div class="space-y-2">
            <div class="flex items-center gap-3 flex-wrap">
              <span class="text-2xl font-bold text-gray-900">
                {{ item.moduleIndex || "—" }}
              </span>
              <div class="flex items-center gap-1.5">
                <span
                  v-if="item.language === 'kk' || !item.language"
                  class="lang-dot lang-dot--kk"
                  title="Казахский"
                />
                <span
                  v-if="item.language === 'ru' || !item.language"
                  class="lang-dot lang-dot--ru"
                  title="Русский"
                />
                <span
                  v-if="item.language === 'en'"
                  class="lang-dot lang-dot--en"
                  title="Английский"
                />
                <span
                  v-if="item.language"
                  class="text-xs font-semibold text-gray-400 uppercase tracking-wide"
                >
                  {{ item.language }}
                </span>
              </div>
            </div>
            <div class="text-xl font-medium text-gray-800">
              {{ item.moduleName || "Без названия" }}
            </div>
            <div class="text-gray-500 text-sm leading-relaxed">
              {{ item.learningOutcome || "Наименование результата обучения не указано" }}
            </div>
          </div>

          <!-- Key Metrics Cards -->
          <div class="grid grid-cols-2 gap-4">
            <div class="bg-yellow-50 rounded-xl border border-yellow-100 p-4 flex items-start gap-3">
              <div class="w-9 h-9 rounded-lg bg-yellow-100 flex items-center justify-center flex-shrink-0">
                <IconGraduationCap class="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <div class="text-2xl font-bold text-gray-900">{{ item.totalCredits || "0" }}</div>
                <div class="text-xs font-medium text-gray-500 uppercase tracking-wide">Кредиты</div>
              </div>
            </div>
            <div class="bg-green-50 rounded-xl border border-green-100 p-4 flex items-start gap-3">
              <div class="w-9 h-9 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0">
                <IconClock class="w-5 h-5 text-green-600" />
              </div>
              <div>
                <div class="text-2xl font-bold text-gray-900">{{ item.totalHours || "0" }}</div>
                <div class="text-xs font-medium text-gray-500 uppercase tracking-wide">Всего часов</div>
              </div>
            </div>
          </div>

          <!-- Hours Structure -->
          <div>
            <div class="text-sm font-bold text-gray-900 mb-3 border-b border-gray-100 pb-2">
              Структура часов
            </div>
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-y-4 gap-x-8 text-sm">
              <div>
                <span class="text-gray-500 block">Теоретических</span>
                <span class="font-semibold text-gray-900">{{ item.theoreticalHours || "0" }}</span>
              </div>
              <div>
                <span class="text-gray-500 block">Лаб/Практ</span>
                <span class="font-semibold text-gray-900">{{ item.labPracticalHours || "0" }}</span>
              </div>
              <div>
                <span class="text-gray-500 block">СРСП</span>
                <span class="font-semibold text-gray-900">{{ item.srspHours || "0" }}</span>
              </div>
              <div>
                <span class="text-gray-500 block">СРС</span>
                <span class="font-semibold text-gray-900">{{ item.srsHours || "0" }}</span>
              </div>
              <div>
                <span class="text-gray-500 block">Практика</span>
                <span class="font-semibold text-gray-900">{{ item.trainingPracticeHours || "0" }}</span>
              </div>
              <div>
                <span class="text-gray-500 block">Индивидуальные</span>
                <span class="font-semibold text-gray-900">{{ item.individualHours || "0" }}</span>
              </div>
              <div>
                <span class="text-gray-500 block">Индивидуальные (доп.)</span>
                <span class="font-semibold text-gray-900">{{ item.individualAdditionalHours || "0" }}</span>
              </div>
            </div>
          </div>

          <!-- Distribution Table -->
          <div>
            <div class="text-sm font-bold text-gray-900 mb-3 border-b border-gray-100 pb-2">
              Распределение по курсам и семестрам
            </div>
            <div class="border border-gray-200 rounded-lg overflow-hidden">
              <div class="overflow-x-auto">
                <table class="w-full text-sm text-left">
                  <thead class="bg-gray-50 text-gray-500 font-semibold border-b border-gray-200">
                    <tr>
                      <th class="px-4 py-3">Учебный год</th>
                      <th class="px-4 py-3">Семестр</th>
                      <th class="px-4 py-3 text-center">Групп</th>
                      <th class="px-4 py-3">Форма контроля</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-gray-100">
                    <tr v-if="!item.distributionEntries?.length">
                      <td colspan="4" class="px-4 py-4 text-gray-400">
                        Нет записей распределения
                      </td>
                    </tr>
                    <tr
                      v-else
                      v-for="entry in item.distributionEntries"
                      :key="entry.id"
                      class="hover:bg-gray-50 transition-colors"
                    >
                      <td class="px-4 py-3">
                        <div class="font-medium text-gray-900">{{ getAcademicYearLabel(entry.academicYearId) }}</div>
                      </td>
                      <td class="px-4 py-3">
                        <div class="text-xs text-gray-500">{{ getSemesterLabel(entry.semesterId) }}</div>
                      </td>
                      <td class="px-4 py-3 text-center font-medium text-gray-900">{{ entry.hours || "0" }}</td>
                      <td class="px-4 py-3">
                        <div class="flex flex-wrap gap-1">
                          <span
                            v-for="label in getControlLabelsArray(entry)"
                            :key="label"
                            class="inline-flex items-center px-2 py-1 rounded text-xs font-medium"
                            :class="label === 'Экз.'
                              ? 'bg-red-50 text-red-700'
                              : 'bg-gray-100 text-gray-700'"
                          >
                            {{ label }}
                          </span>
                          <span
                            v-if="getControlLabelsArray(entry).length === 0"
                            class="text-gray-400 text-xs"
                          >
                            Не выбрано
                          </span>
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </template>
      </div>

      <PopoverFooter
        cancel-text="Закрыть"
        save-text="Редактировать"
        save-variant="primary"
        :on-cancel="requestClose"
        :on-save="handleEdit"
        :disabled="!item"
      >
        <template #save-icon>
          <IconPencil class="w-4 h-4" />
        </template>
      </PopoverFooter>
    </div>
  </GuardedPopover>
</template>

<script setup lang="ts">
import PopoverHeader from "@/components/ui/PopoverHeader.vue";
import PopoverFooter from "@/components/ui/PopoverFooter.vue";
import GuardedPopover from "@/components/ui/GuardedPopover.vue";
import IconGraduationCap from "~icons/lucide/graduation-cap";
import IconClock from "~icons/lucide/clock";
import IconPencil from "~icons/lucide/pencil";
import type { RupEntry, DistributionEntry } from "@/stores/rupEntryStore";
import { useAcademicYearStore } from "@/stores/academicYearStore";
import { useAcademicYearSemesterStore } from "@/stores/academicYearSemesterStore";
import { useFinalControlStore } from "@/stores/finalControlStore";
import { useIntermediateControlStore } from "@/stores/intermediateControlStore";

defineProps<{
  item: RupEntry | null;
}>();

const emit = defineEmits<{
  (e: "close"): void;
  (e: "edit"): void;
}>();

const academicYearStore = useAcademicYearStore();
const academicYearSemesterStore = useAcademicYearSemesterStore();
const finalControlStore = useFinalControlStore();
const intermediateControlStore = useIntermediateControlStore();

function getAcademicYearLabel(academicYearId: string) {
  const year = academicYearStore.getAcademicYearById(academicYearId);
  if (!year) return "Не указано";
  return `${year.startYear}-${year.endYear}`;
}

function getSemesterLabel(semesterId: string) {
  const semester = academicYearSemesterStore.getAcademicYearSemesterById(semesterId);
  if (!semester) return "Не указано";
  return `Семестр ${semester.semesterNumber}`;
}

function getControlLabel(entry: DistributionEntry) {
  const labels: string[] = [];
  if (entry.finalControlId) {
    labels.push(
      finalControlStore.getFinalControlById(entry.finalControlId)?.shortName ||
        "Ф"
    );
  }
  if (entry.intermediateControlId) {
    labels.push(
      intermediateControlStore.getIntermediateControlById(entry.intermediateControlId)
        ?.shortName || "П"
    );
  }
  if (entry.examEnabled) labels.push("Экз.");
  if (entry.creditEnabled) labels.push("Зач.");
  if (entry.controlLessonEnabled) labels.push("Контр.");
  return labels.length ? labels.join(", ") : "Не выбрано";
}

function getControlLabelsArray(entry: DistributionEntry): string[] {
  const labels: string[] = [];
  if (entry.finalControlId) {
    labels.push(
      finalControlStore.getFinalControlById(entry.finalControlId)?.shortName ||
        "Ф"
    );
  }
  if (entry.intermediateControlId) {
    labels.push(
      intermediateControlStore.getIntermediateControlById(entry.intermediateControlId)
        ?.shortName || "П"
    );
  }
  if (entry.examEnabled) labels.push("Экз.");
  if (entry.creditEnabled) labels.push("Зач.");
  if (entry.controlLessonEnabled) labels.push("Контр.");
  return labels;
}

function handleEdit() {
  emit("edit");
}
</script>

<style scoped>
.rup-entry-view-popover {
  display: flex;
  flex-direction: column;
  max-height: 85vh;
}

.rup-entry-view-content {
  overflow-y: auto;
}

.lang-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  display: inline-block;
  flex-shrink: 0;
}

.lang-dot--kk {
  background-color: #facc15;
}

.lang-dot--ru {
  background-color: #111827;
}

.lang-dot--en {
  background-color: #a855f7;
}

table {
  border-collapse: collapse;
}

thead th {
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.025em;
}
</style>
