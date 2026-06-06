<template>
  <GuardedPopover
    v-slot="{ requestClose }"
    id="rup-entry-view-popover"
    style="width: min(960px, 96vw) !important"
    @popover:closed="$emit('close')"
  >
    <div class="rup-entry-view-popover bg-white text-gray-900">
      <PopoverHeader
        cancel-text="Закрыть"
        :on-cancel="requestClose"
      >
        <template v-if="item" #title>
          <div class="flex items-center gap-3 flex-wrap leading-none">
            <span class="text-2xl font-bold text-gray-900 leading-none">
              {{ item.moduleIndex || "—" }}
            </span>
            <div class="flex items-center gap-1.5 flex-wrap">
              <span
                v-for="lang in itemLanguages"
                :key="lang"
                class="lang-badge"
                :class="`lang-badge-${lang}`"
              >
                {{ lang.toUpperCase() }}
              </span>
            </div>
            <span
              v-for="base in itemBases"
              :key="`b-${base}`"
              class="base-badge"
              :class="`base-badge-${base}`"
            >
              База {{ base }} кл
            </span>
          </div>
        </template>
        <template v-if="item" #subtitle>
          <div class="space-y-1 mt-1">
            <div class="text-xl font-medium text-gray-800 leading-snug">
              {{ item.moduleName || "Без названия" }}
            </div>
            <div class="text-[15px] text-gray-500 leading-relaxed">
              {{ item.learningOutcome || "—" }}
            </div>
          </div>
        </template>
      </PopoverHeader>

      <div class="rup-entry-view-content px-8 pb-2 space-y-7">
        <template v-if="item">
          <!-- Localized info (per-language slots — always show all configured languages) -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div
              v-for="lang in allLanguageSlots"
              :key="lang.code"
              class="p-4 bg-gray-50 rounded-xl border border-gray-100"
            >
              <h4
                class="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2 flex items-center gap-2"
              >
                <span
                  class="lang-dot"
                  :class="`lang-dot-${lang.code}`"
                />
                {{ lang.fullName }}
              </h4>
              <template v-if="lang.variant">
                <p class="font-semibold text-gray-900">
                  <span v-if="lang.variant.moduleIndex">{{ lang.variant.moduleIndex }} — </span>{{ lang.variant.moduleName || "—" }}
                </p>
                <p class="text-sm text-gray-600 mt-1">
                  {{ lang.variant.learningOutcome || "—" }}
                </p>
              </template>
              <span v-else class="text-sm text-gray-400">—</span>
            </div>
          </div>

          <!-- 3. Key metrics -->
          <div
            class="grid grid-cols-2 gap-4"
            :class="currentSemHours ? 'md:grid-cols-5' : 'md:grid-cols-4'"
          >
            <div class="metric-card metric-card-yellow">
              <IconGraduationCap class="w-5 h-5 text-yellow-600 mb-1" />
              <div class="text-2xl font-bold text-gray-900">
                {{ item.totalCredits || "0" }}
              </div>
              <div
                class="text-xs font-medium text-gray-500 uppercase tracking-wide"
              >
                Кредитов
              </div>
            </div>
            <div class="metric-card metric-card-green">
              <IconClock class="w-5 h-5 text-green-600 mb-1" />
              <div class="text-2xl font-bold text-gray-900">
                {{ item.totalHours || "0" }}
              </div>
              <div
                class="text-xs font-medium text-gray-500 uppercase tracking-wide"
              >
                Всего часов
              </div>
            </div>
            <div v-if="currentSemHours" class="metric-card metric-card-gray">
              <IconCalendar class="w-5 h-5 text-gray-700 mb-1" />
              <div class="text-2xl font-bold text-gray-900">
                {{ currentSemHours.hours }}
              </div>
              <div
                class="text-xs font-medium text-gray-500 uppercase tracking-wide"
              >
                Часов ({{ currentSemHours.semesterName }})
              </div>
            </div>
            <div class="metric-card metric-card-gray col-span-2">
              <div
                class="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2"
              >
                Специальности
              </div>
              <div v-if="specialtyChips.length" class="flex flex-wrap gap-1.5">
                <span
                  v-for="specialty in specialtyChips"
                  :key="specialty.id"
                  class="specialty-chip"
                >
                  {{ specialty.codeName || specialty.name }}
                </span>
              </div>
              <span v-else class="text-sm text-gray-400">—</span>
            </div>
          </div>

          <!-- 4. Hours structure (concept order: Теор | Лаб/Практ | СРС | СРСП | Практика | Индивидуальные) -->
          <div>
            <h4 class="section-heading">Структура часов</h4>
            <div
              class="grid grid-cols-2 sm:grid-cols-4 gap-y-4 gap-x-8 text-sm"
            >
              <div>
                <span class="text-gray-500 block">Теоретических</span>
                <span class="font-semibold text-gray-900">{{
                  item.theoreticalHours || "—"
                }}</span>
              </div>
              <div>
                <span class="text-gray-500 block">Лаб/Практ</span>
                <span class="font-semibold text-gray-900">{{
                  item.labPracticalHours || "—"
                }}</span>
              </div>
              <div>
                <span class="text-gray-500 block">СРС</span>
                <span class="font-semibold text-gray-900">{{
                  item.srsHours || "—"
                }}</span>
              </div>
              <div>
                <span class="text-gray-500 block">СРСП</span>
                <span class="font-semibold text-gray-900">{{
                  item.srspHours || "—"
                }}</span>
              </div>
              <div>
                <span class="text-gray-500 block">Практика (ПО/АС)</span>
                <span class="font-semibold text-gray-900">{{
                  item.trainingPracticeHours || "—"
                }}</span>
              </div>
              <div>
                <span class="text-gray-500 block">Индивидуальные</span>
                <span class="font-semibold text-gray-900">{{
                  item.individualAdditionalHours || item.individualHours || "—"
                }}</span>
              </div>
            </div>
          </div>

          <!-- 5. Semester plan -->
          <div>
            <h4 class="section-heading">Семестровый план</h4>
            <div class="border border-gray-200 rounded-lg overflow-hidden">
              <div class="overflow-x-auto">
                <table class="w-full text-sm text-left">
                  <thead
                    class="bg-gray-50 text-gray-500 font-semibold border-b border-gray-200"
                  >
                    <tr>
                      <th class="px-4 py-3">Год / Семестр</th>
                      <th class="px-4 py-3 text-center">Групп</th>
                      <th class="px-4 py-3 text-center">СРС</th>
                      <th class="px-4 py-3 text-center">СРСП</th>
                      <th class="px-4 py-3 text-center">Индив.</th>
                      <th class="px-4 py-3 text-center">Контроль</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-gray-100">
                    <tr v-if="!item.distributionEntries?.length">
                      <td
                        colspan="6"
                        class="px-4 py-6 text-center text-gray-400"
                      >
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
                        <div class="font-medium text-gray-900">
                          {{ getAcademicYearLabel(entry.academicYearId) }}
                        </div>
                        <div class="text-xs text-gray-500">
                          {{ getSemesterLabel(entry.semesterId) }}
                        </div>
                      </td>
                      <td
                        class="px-4 py-3 text-center font-medium text-gray-900"
                      >
                        {{ entry.hours || "—" }}
                      </td>
                      <td class="px-4 py-3 text-center text-gray-600">
                        {{ semesterSharedValue(item.srsHours) }}
                      </td>
                      <td class="px-4 py-3 text-center text-gray-600">
                        {{ semesterSharedValue(item.srspHours) }}
                      </td>
                      <td class="px-4 py-3 text-center text-gray-600">
                        {{ semesterSharedValue(item.individualAdditionalHours || item.individualHours) }}
                      </td>
                      <td class="px-4 py-3 text-center">
                        <div
                          class="flex flex-wrap items-center justify-center gap-1"
                        >
                          <span
                            v-for="label in getControlLabelsArray(entry)"
                            :key="label"
                            class="inline-flex items-center px-2 py-1 rounded text-xs font-medium"
                            :class="
                              label === 'Экз.' || label === 'Экзамен'
                                ? 'bg-red-50 text-red-700'
                                : 'bg-gray-100 text-gray-700'
                            "
                          >
                            {{ label }}
                          </span>
                          <span
                            v-if="!getControlLabelsArray(entry).length"
                            class="text-gray-400 text-xs"
                            >—</span
                          >
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
import { computed } from "vue";
import PopoverHeader from "@/components/ui/PopoverHeader.vue";
import PopoverFooter from "@/components/ui/PopoverFooter.vue";
import GuardedPopover from "@/components/ui/GuardedPopover.vue";
import IconGraduationCap from "~icons/lucide/graduation-cap";
import IconClock from "~icons/lucide/clock";
import IconCalendar from "~icons/lucide/calendar";
import IconPencil from "~icons/lucide/pencil";
import type { RupEntry, DistributionEntry } from "@/stores/rupEntryStore";
import { useRupEntryStore } from "@/stores/rupEntryStore";
import { useAcademicYearStore } from "@/stores/academicYearStore";
import { useAcademicYearSemesterStore } from "@/stores/academicYearSemesterStore";
import { useFinalControlStore } from "@/stores/finalControlStore";
import { useIntermediateControlStore } from "@/stores/intermediateControlStore";
import { useSpecialtyStore } from "@/stores/specialtyStore";
import { useLanguageStore } from "@/stores/languageStore";

const props = defineProps<{
  item: RupEntry | null;
}>();

const emit = defineEmits<{
  (e: "close"): void;
  (e: "edit"): void;
}>();

const rupEntryStore = useRupEntryStore();
const academicYearStore = useAcademicYearStore();
const academicYearSemesterStore = useAcademicYearSemesterStore();
const finalControlStore = useFinalControlStore();
const intermediateControlStore = useIntermediateControlStore();
const specialtyStore = useSpecialtyStore();
const languageStore = useLanguageStore();

const languageVariants = computed<RupEntry[]>(() => {
  if (!props.item) return [];
  if (props.item.groupId) {
    return rupEntryStore.getGroupedVariants(props.item.groupId);
  }
  return [props.item];
});

const itemLanguages = computed<string[]>(() => {
  const langs = languageVariants.value
    .map((v) => v.language)
    .filter((l): l is string => !!l);
  return Array.from(new Set(langs));
});

const itemBases = computed<number[]>(() => {
  if (!props.item) return [];
  const bases = (props.item as any).baseClass;
  if (Array.isArray(bases)) return bases;
  if (typeof bases === "number") return [bases];
  return [];
});

const specialtyChips = computed(() => {
  if (!props.item) return [];
  return (props.item.specialtyIds || [])
    .map((id) => specialtyStore.specialties.find((s: any) => s.id === id))
    .filter((s): s is any => !!s);
});

// Localized info slots — render one card per configured language, fill with variant if present
const SUPPORTED_LANGUAGES = ["en", "ru", "kk"] as const;

const allLanguageSlots = computed(() => {
  return SUPPORTED_LANGUAGES.map((code) => {
    const variant = languageVariants.value.find((v) => v.language === code);
    return {
      code,
      fullName: getLanguageFullName(code),
      variant,
    };
  });
});

// Current-semester hours metric: only computed when there is a single distribution entry
const currentSemHours = computed(() => {
  if (!props.item || !props.item.distributionEntries) return null;
  if (props.item.distributionEntries.length !== 1) return null;
  const entry = props.item.distributionEntries[0];
  if (!entry) return null;

  const num = (v: string | undefined | null) => {
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
  };

  const total =
    num(entry.hours) +
    num(props.item.srsHours) +
    num(props.item.srspHours) +
    num(props.item.trainingPracticeHours) +
    num(props.item.individualAdditionalHours || props.item.individualHours);

  if (!total) return null;

  const semester =
    academicYearSemesterStore.getAcademicYearSemesterById(entry.semesterId);
  const semesterName = semester
    ? `${semester.semesterNumber} семестр`
    : "семестр";

  return { hours: total, semesterName };
});

// Helper: show a value across all distribution rows; "—" if empty/zero
function semesterSharedValue(value: string | undefined) {
  if (!value || value === "0") return "—";
  return value;
}

function getLanguageFullName(code: string | undefined) {
  if (!code) return "—";
  const lang = (languageStore.languages as any[]).find((l) => l.code === code);
  return lang?.name || code.toUpperCase();
}

function getAcademicYearLabel(academicYearId: string) {
  const year = academicYearStore.getAcademicYearById(academicYearId);
  if (!year) return "Не указано";
  return `${year.startYear}-${year.endYear}`;
}

function getSemesterLabel(semesterId: string) {
  const semester =
    academicYearSemesterStore.getAcademicYearSemesterById(semesterId);
  if (!semester) return "Не указано";
  return `Семестр ${semester.semesterNumber}`;
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
      intermediateControlStore.getIntermediateControlById(
        entry.intermediateControlId
      )?.shortName || "П"
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
  max-height: 92vh;
}

.rup-entry-view-content {
  flex: 1;
  overflow-y: auto;
}

.section-heading {
  font-size: 0.875rem;
  font-weight: 700;
  color: #111827;
  margin-bottom: 0.75rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid #f3f4f6;
}

/* Language badges (concept colors) */
.lang-badge {
  display: inline-flex;
  align-items: center;
  padding: 0.125rem 0.5rem;
  font-size: 0.625rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  border-radius: 0.25rem;
}
.lang-badge-kk {
  background-color: #fef3c7;
  color: #92400e;
}
.lang-badge-ru {
  background-color: #e5e7eb;
  color: #1f2937;
}
.lang-badge-en {
  background-color: #ede9fe;
  color: #6d28d9;
}

/* Base badges */
.base-badge {
  display: inline-flex;
  align-items: center;
  padding: 0.125rem 0.5rem;
  font-size: 0.625rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  border-radius: 0.25rem;
}
.base-badge-9 {
  background-color: #ffedd5;
  color: #c2410c;
}
.base-badge-11 {
  background-color: #fef9c3;
  color: #854d0e;
}

/* Language dots */
.lang-dot {
  width: 0.5rem;
  height: 0.5rem;
  border-radius: 50%;
  display: inline-block;
}
.lang-dot-kk {
  background-color: #eab308;
}
.lang-dot-ru {
  background-color: #111827;
}
.lang-dot-en {
  background-color: #a855f7;
}

/* Metric cards */
.metric-card {
  padding: 1rem;
  border-radius: 0.75rem;
  border: 1px solid;
}
.metric-card-yellow {
  background-color: #fefce8;
  border-color: #fef3c7;
}
.metric-card-green {
  background-color: #f0fdf4;
  border-color: #dcfce7;
}
.metric-card-gray {
  background-color: #f9fafb;
  border-color: #f3f4f6;
}

/* Specialty chips */
.specialty-chip {
  display: inline-flex;
  align-items: center;
  padding: 0.25rem 0.5rem;
  background-color: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 0.25rem;
  font-size: 0.8125rem;
  font-weight: 500;
  color: #374151;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

/* Table */
table {
  border-collapse: collapse;
}
thead th {
  font-size: 0.7rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
</style>
