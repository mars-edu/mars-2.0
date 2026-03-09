<template>
  <GuardedPopover
    v-slot="{ requestClose }"
    id="class9-view-popover"
    positioning="center"
    style="width: min(920px, 96vw) !important"
    @popover:closed="$emit('close')"
  >
    <div class="class9-view-popover bg-card text-card-foreground">
      <PopoverHeader
        title="Просмотр рабочего учебного плана"
        cancel-text="Закрыть"
        :on-cancel="requestClose"
      />

      <div class="class9-view-content p-4 space-y-4">
        <template v-if="item">
          <div class="rounded-lg border border-input bg-muted/20 p-4 space-y-2">
            <div class="flex items-center gap-2 flex-wrap">
              <span class="text-lg font-semibold text-foreground">
                {{ item.moduleIndex || "—" }}
              </span>
              <span class="text-lg font-medium text-foreground/90">
                {{ item.moduleName || "Без названия" }}
              </span>
              <span
                v-if="item.language"
                class="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide"
                :class="{
                  'bg-indigo-100 text-indigo-700': item.language === 'ru',
                  'bg-teal-100 text-teal-700': item.language === 'kk',
                  'bg-purple-100 text-purple-700': item.language === 'en',
                }"
              >
                {{ item.language.toUpperCase() }}
              </span>
            </div>
            <div class="text-sm text-muted-foreground">
              {{ item.learningOutcome || "Наименование результата обучения не указано" }}
            </div>
          </div>

          <div class="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
            <div class="metric-card">
              <div class="metric-label">Всего кредитов</div>
              <div class="metric-value">{{ item.totalCredits || "0" }}</div>
            </div>
            <div class="metric-card">
              <div class="metric-label">Всего часов</div>
              <div class="metric-value">{{ item.totalHours || "0" }}</div>
            </div>
            <div class="metric-card">
              <div class="metric-label">Теоретических</div>
              <div class="metric-value">{{ item.theoreticalHours || "0" }}</div>
            </div>
            <div class="metric-card">
              <div class="metric-label">Лаб/Практ</div>
              <div class="metric-value">{{ item.labPracticalHours || "0" }}</div>
            </div>
            <div class="metric-card">
              <div class="metric-label">СРСП</div>
              <div class="metric-value">{{ item.srspHours || "0" }}</div>
            </div>
            <div class="metric-card">
              <div class="metric-label">СРС</div>
              <div class="metric-value">{{ item.srsHours || "0" }}</div>
            </div>
            <div class="metric-card">
              <div class="metric-label">Практика</div>
              <div class="metric-value">{{ item.trainingPracticeHours || "0" }}</div>
            </div>
            <div class="metric-card">
              <div class="metric-label">Индивидуальные</div>
              <div class="metric-value">{{ item.individualHours || "0" }}</div>
            </div>
            <div class="metric-card">
              <div class="metric-label">Индивидуальные (доп.)</div>
              <div class="metric-value">{{ item.individualAdditionalHours || "0" }}</div>
            </div>
          </div>

          <div class="space-y-2">
            <div class="text-sm font-semibold text-foreground">
              Распределение по курсам и семестрам
            </div>
            <div class="distribution-table border border-input rounded-lg">
              <div class="overflow-x-auto">
                <div class="distribution-grid distribution-header">
                  <div>Учебный год</div>
                  <div>Семестр</div>
                  <div class="text-center">Групп</div>
                  <div>Форма контроля</div>
                </div>
                <div v-if="!item.distributionEntries?.length" class="empty-state">
                  Нет записей распределения
                </div>
                <div
                  v-else
                  v-for="entry in item.distributionEntries"
                  :key="entry.id"
                  class="distribution-grid distribution-row"
                >
                  <div>{{ getAcademicYearLabel(entry.academicYearId) }}</div>
                  <div>{{ getSemesterLabel(entry.semesterId) }}</div>
                  <div class="text-center font-medium">{{ entry.hours || "0" }}</div>
                  <div>{{ getControlLabel(entry) }}</div>
                </div>
              </div>
            </div>
          </div>
        </template>
      </div>

      <PopoverFooter
        save-text="Редактировать"
        :on-save="handleEdit"
        :disabled="!item"
      />
    </div>
  </GuardedPopover>
</template>

<script setup lang="ts">
import PopoverHeader from "@/components/ui/PopoverHeader.vue";
import PopoverFooter from "@/components/ui/PopoverFooter.vue";
import GuardedPopover from "@/components/ui/GuardedPopover.vue";
import type { Class9Data, DistributionEntry } from "@/stores/class9Store";
import { useAcademicYearStore } from "@/stores/academicYearStore";
import { useAcademicYearSemesterStore } from "@/stores/academicYearSemesterStore";
import { useFinalControlStore } from "@/stores/finalControlStore";
import { useIntermediateControlStore } from "@/stores/intermediateControlStore";

defineProps<{
  item: Class9Data | null;
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

function handleEdit() {
  emit("edit");
}
</script>

<style scoped>
.class9-view-popover {
  display: flex;
  flex-direction: column;
  max-height: 85vh;
}

.class9-view-content {
  overflow-y: auto;
}

.metric-card {
  border: 1px solid hsl(var(--border));
  border-radius: 0.65rem;
  padding: 0.6rem 0.7rem;
  background: hsl(var(--muted) / 0.2);
}

.metric-label {
  color: hsl(var(--muted-foreground));
  font-size: 0.75rem;
  line-height: 1rem;
}

.metric-value {
  margin-top: 0.2rem;
  color: hsl(var(--foreground));
  font-weight: 600;
}

.distribution-table {
  margin-top: 0.25rem;
}

.distribution-grid {
  display: grid;
  grid-template-columns: minmax(180px, 1fr) minmax(140px, 1fr) 110px minmax(220px, 1.4fr);
  gap: 0.5rem;
  min-width: 700px;
}

.distribution-header {
  padding: 0.5rem 0.75rem;
  background: #f3f4f6;
  border-bottom: 1px solid #e5e7eb;
  font-size: 0.75rem;
  line-height: 1rem;
  font-weight: 600;
  color: #4b5563;
  align-items: center;
}

.distribution-row {
  padding: 0.5rem 0.75rem;
  align-items: center;
  border-bottom: 1px solid #f3f4f6;
  background: #fff;
  font-size: 0.875rem;
}

.distribution-row:last-child {
  border-bottom: none;
}

.empty-state {
  padding: 0.9rem 1rem;
  font-size: 0.875rem;
  color: hsl(var(--muted-foreground));
  background: #fff;
}
</style>
