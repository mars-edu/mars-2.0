<template>
  <GuardedPopover
    v-slot="{ requestClose }"
    id="rup-entry-view-popover"
    style="width: min(960px, 96vw) !important"
    @popover:closed="$emit('close')"
  >
    <div class="flex flex-col max-h-[92vh] bg-card text-foreground">
      <PopoverHeader
        cancel-text="Закрыть"
        :on-cancel="requestClose"
      >
        <template v-if="item" #title>
          <div class="flex items-center gap-3 flex-wrap leading-none">
            <span class="text-2xl font-bold text-foreground leading-none">
              {{ item.moduleIndex || "—" }}
            </span>
            <div class="flex items-center gap-1.5 flex-wrap">
              <span
                v-for="lang in itemLanguages"
                :key="lang"
                class="inline-flex items-center px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide rounded"
                :class="getLanguageBadgeClass(lang)"
              >
                {{ getLanguageLabel(lang) }}
              </span>
            </div>
            <span
              v-for="base in itemBases"
              :key="`b-${base}`"
              class="inline-flex items-center px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide rounded"
              :class="baseBadgeClass(base)"
            >
              База {{ base }} кл
            </span>
          </div>
        </template>
        <template v-if="item" #subtitle>
          <div class="space-y-1 mt-1">
            <div class="text-xl font-medium text-foreground leading-snug">
              {{ item.moduleName || "Без названия" }}
            </div>
            <div class="text-[15px] text-muted-foreground leading-relaxed">
              {{ item.learningOutcome || "—" }}
            </div>
          </div>
        </template>
      </PopoverHeader>

      <div class="flex-1 overflow-y-auto px-8 pb-2 space-y-7">
        <template v-if="item">
          <!-- Localized info (per-language slots from studyLanguageStore) -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div
              v-for="lang in allLanguageSlots"
              :key="lang.code"
              class="p-4 bg-muted/50 rounded-xl border border-border"
            >
              <h4
                class="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-2 flex items-center gap-2"
              >
                <span
                  class="w-2 h-2 rounded-full inline-block"
                  :style="{ backgroundColor: lang.color || '#6b7280' }"
                />
                {{ lang.name }}
              </h4>
              <template v-if="lang.variant">
                <p class="font-semibold text-foreground">
                  <span v-if="lang.variant.moduleIndex">{{ lang.variant.moduleIndex }} — </span>{{ lang.variant.moduleName || "—" }}
                </p>
                <p class="text-sm text-muted-foreground mt-1">
                  {{ lang.variant.learningOutcome || "—" }}
                </p>
              </template>
              <span v-else class="text-sm text-muted-foreground">—</span>
            </div>
          </div>

          <!-- 3. Key metrics -->
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div class="p-3.5 bg-muted/30 rounded-xl border border-border/80">
              <span class="text-xs text-muted-foreground font-medium flex items-center gap-1.5 mb-1">
                <IconGraduationCap class="w-3.5 h-3.5" />
                Кредиты
              </span>
              <span class="text-2xl font-bold text-foreground">{{ item.totalCredits || "—" }}</span>
            </div>
            <div class="p-3.5 bg-muted/30 rounded-xl border border-border/80">
              <span class="text-xs text-muted-foreground font-medium flex items-center gap-1.5 mb-1">
                <IconClock class="w-3.5 h-3.5" />
                Всего часов
              </span>
              <span class="text-2xl font-bold text-foreground">{{ item.totalHours || "—" }}</span>
            </div>
            <div class="p-3.5 bg-muted/30 rounded-xl border border-border/80">
              <span class="text-xs text-muted-foreground font-medium flex items-center gap-1.5 mb-1">
                <IconClock class="w-3.5 h-3.5 text-primary" />
                Групповые
              </span>
              <span class="text-2xl font-bold text-primary">{{ item.groupHours || "—" }}</span>
            </div>
            <div class="p-3.5 bg-muted/30 rounded-xl border border-border/80">
              <span class="text-xs text-muted-foreground font-medium flex items-center gap-1.5 mb-1">
                <IconCalendar class="w-3.5 h-3.5" />
                Текущий семестр
              </span>
              <span v-if="currentSemHours" class="text-2xl font-bold text-foreground">
                {{ currentSemHours.hours }}
                <span class="text-xs font-normal text-muted-foreground ml-1">
                  ({{ currentSemHours.semesterName }})
                </span>
              </span>
              <span v-else class="text-sm font-medium text-muted-foreground/60 mt-1 block">
                Не указано
              </span>
            </div>
          </div>

          <!-- Specialties -->
          <div v-if="specialtyChips.length" class="space-y-2">
            <h4 class="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Специальности ({{ specialtyChips.length }})
            </h4>
            <div class="flex flex-wrap gap-2">
              <div
                v-for="spec in specialtyChips"
                :key="spec.id"
                class="px-3 py-2 bg-muted/40 rounded-xl border border-border flex items-center gap-2"
              >
                <span class="w-2 h-2 rounded-full bg-primary" />
                <div>
                  <span class="text-sm font-semibold text-foreground">{{ spec.codeName || spec.name }}</span>
                  <span v-if="spec.name && spec.codeName" class="text-xs text-muted-foreground ml-1.5">
                    — {{ spec.name }}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <!-- 4. Hours breakdown table -->
          <div class="space-y-2">
            <h4 class="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Структура часов
            </h4>
            <div class="border border-border rounded-xl overflow-hidden bg-card">
              <table class="w-full text-sm">
                <thead>
                  <tr class="bg-muted/40 border-b border-border text-xs text-muted-foreground">
                    <th class="text-left font-semibold px-4 py-2.5">Семестр</th>
                    <th class="text-center font-semibold px-3 py-2.5">Всего</th>
                    <th class="text-center font-semibold px-3 py-2.5">Теор.</th>
                    <th class="text-center font-semibold px-3 py-2.5">Лаб./Практ.</th>
                    <th class="text-center font-semibold px-3 py-2.5">СРСП</th>
                    <th class="text-center font-semibold px-3 py-2.5">СРС</th>
                    <th class="text-center font-semibold px-3 py-2.5">Пр. обуч.</th>
                    <th class="text-center font-semibold px-3 py-2.5">Индив.</th>
                    <th class="text-center font-semibold px-3 py-2.5">Контроль</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-border text-foreground">
                  <tr
                    v-for="entry in item.distributionEntries"
                    :key="entry.id"
                    class="hover:bg-muted/20 transition-colors"
                  >
                    <td class="px-4 py-3 font-semibold text-foreground">
                      {{ getSemesterName(entry.semesterId) }}
                    </td>
                    <td class="px-3 py-3 text-center font-bold text-foreground">
                      {{ entry.hours || "—" }}
                    </td>
                    <td class="px-3 py-3 text-center text-muted-foreground">
                      {{ semesterSharedValue(item.theoreticalHours) }}
                    </td>
                    <td class="px-3 py-3 text-center text-muted-foreground">
                      {{ semesterSharedValue(item.labPracticalHours) }}
                    </td>
                    <td class="px-3 py-3 text-center text-muted-foreground">
                      {{ entry.srspHours || semesterSharedValue(item.srspHours) }}
                    </td>
                    <td class="px-3 py-3 text-center text-muted-foreground">
                      {{ entry.srsHours || semesterSharedValue(item.srsHours) }}
                    </td>
                    <td class="px-3 py-3 text-center text-muted-foreground">
                      {{ semesterSharedValue(item.trainingPracticeHours) }}
                    </td>
                    <td class="px-3 py-3 text-center text-muted-foreground">
                      {{ individualCellValue(entry) }}
                    </td>
                    <td class="px-3 py-3 text-center">
                      <div class="flex items-center justify-center gap-1 flex-wrap">
                        <span
                          v-for="(label, idx) in controlLabels(entry)"
                          :key="idx"
                          class="px-1.5 py-0.5 rounded text-[11px] font-bold bg-red-500/10 text-red-600 border border-red-500/20"
                        >
                          {{ label }}
                        </span>
                        <span
                          v-if="controlLabels(entry).length === 0"
                          class="text-xs text-muted-foreground/40"
                        >
                          —
                        </span>
                      </div>
                    </td>
                  </tr>
                  <tr v-if="!item.distributionEntries || item.distributionEntries.length === 0">
                    <td colspan="9" class="px-4 py-8 text-center text-muted-foreground italic text-xs">
                      Распределение по семестрам не задано
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </template>
      </div>

      <PopoverFooter
        :show-save="false"
        :on-cancel="requestClose"
      >
        <template #left>
          <f7-button
            fill
            class="!h-10 !px-5 !rounded-xl !bg-primary !text-primary-foreground font-semibold flex items-center gap-2"
            @click="handleEdit"
          >
            <IconPencil class="w-4 h-4" />
            Редактировать
          </f7-button>
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
import type { RupEntry, DistributionEntry } from "@/types/rup-entry";
import { useAcademicYearSemesterStore } from "@/stores/academicYearSemesterStore";
import { useFinalControlStore } from "@/stores/finalControlStore";
import { useIntermediateControlStore } from "@/stores/intermediateControlStore";
import { useSpecialtyStore, type Specialty } from "@/stores/specialtyStore";
import { useStudyLanguageStore } from "@/stores/studyLanguageStore";
import { getLanguageLabel, getLanguageBadgeClass } from "@/utils/languageBadge";
import { parseNumber } from "@/utils/parseNumber";
import { f7Button } from "framework7-vue";

const props = defineProps<{
  item: RupEntry | null;
}>();

const emit = defineEmits<{
  (e: "close"): void;
  (e: "edit"): void;
}>();

const academicYearSemesterStore = useAcademicYearSemesterStore();
const finalControlStore = useFinalControlStore();
const intermediateControlStore = useIntermediateControlStore();
const specialtyStore = useSpecialtyStore();
const languageStore = useStudyLanguageStore();

const itemLanguages = computed<string[]>(() => {
  if (!props.item?.variants) return [];
  return props.item.variants.map((v) => v.language);
});

const itemBases = computed<number[]>(() => {
  if (!props.item) return [];
  const bases = props.item.baseClass;
  if (Array.isArray(bases)) return bases;
  if (typeof bases === "number") return [bases];
  return [];
});

const specialtyChips = computed(() => {
  if (!props.item) return [];
  return (props.item.specialtyIds || [])
    .map((id) => specialtyStore.specialties.find((s: Specialty) => s.id === id))
    .filter((s): s is Specialty => !!s);
});

// Localized info slots from studyLanguageStore
const allLanguageSlots = computed(() => {
  const currentLanguages = languageStore.languages;
  const variants = props.item?.variants || [];

  return currentLanguages.map((lang) => {
    const variant = variants.find((v) => v.language === lang.code);
    return {
      code: lang.code,
      name: lang.name,
      color: lang.color,
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

  const total =
    parseNumber(entry.hours) +
    parseNumber(props.item.srsHours) +
    parseNumber(props.item.srspHours) +
    parseNumber(props.item.trainingPracticeHours) +
    parseNumber(props.item.individualAdditionalHours || props.item.individualHours);

  if (!total) return null;

  const semester =
    academicYearSemesterStore.getAcademicYearSemesterById(entry.semesterId);
  const semesterName = semester
    ? `${semester.semesterNumber} семестр`
    : "семестр";

  return { hours: total, semesterName };
});

function semesterSharedValue(value: string | undefined) {
  if (!value || value === "0") return "—";
  return value;
}

function individualCellValue(entry: DistributionEntry) {
  const own = parseNumber(entry.individualHours);
  if (own > 0) return String(own);
  const item = props.item;
  if (!item) return "—";
  const distSum = (item.distributionEntries || []).reduce(
    (s: number, d: any) => s + parseNumber(d.individualHours),
    0
  );
  if (distSum > 0) return "—";
  const additional =
    parseNumber(item.individualAdditionalHours) || parseNumber(item.individualHours);
  if (additional <= 0) return "—";
  const activeCount = (item.distributionEntries || []).filter(
    (d: any) => parseNumber(d.hours) > 0
  ).length;
  const targetCount =
    activeCount > 0 ? activeCount : (item.distributionEntries || []).length || 1;
  const perSem = additional / targetCount;
  return Number.isInteger(perSem) ? String(perSem) : perSem.toFixed(1);
}

function getSemesterName(semesterId: string): string {
  const semester =
    academicYearSemesterStore.getAcademicYearSemesterById(semesterId);
  if (semester) {
    return `${semester.semesterNumber} семестр`;
  }
  return "Семестр";
}

function controlLabels(entry: DistributionEntry): string[] {
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

function baseBadgeClass(base: number): string {
  const map: Record<number, string> = {
    9:  'bg-orange-100 text-orange-700 dark:bg-orange-400/15 dark:text-orange-300',
    11: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-400/15 dark:text-yellow-300',
  };
  return map[base] ?? 'bg-muted text-muted-foreground';
}

function handleEdit() {
  emit("edit");
}
</script>
