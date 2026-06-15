<template>
  <GuardedPopover
    id="workload-journal-wizard"
    kind="popup"
    :guard-unsaved="false"
    :opened="!!workload"
    style="width: 1200px; max-width: 95vw; height: 88vh"
    @popup:closed="$emit('close')"
  >
    <template #default="{ requestClose }">
      <!-- Step 1: semester -->
      <div v-if="!semester" class="flex flex-col h-full bg-background items-center justify-center p-8 text-center">
        <div class="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mb-6 text-emerald-500">
          <IconCalendar class="w-9 h-9" />
        </div>
        <h3 class="text-2xl font-black text-foreground mb-2">Выберите семестр</h3>
        <p class="text-muted-foreground font-bold mb-8 max-w-md text-sm leading-relaxed">
          Выберите учебный семестр, для дисциплин которого нужно распределить
          специальности, языки и сформировать журналы.
        </p>
        <div class="grid grid-cols-2 gap-4 w-full max-w-md">
          <button
            @click="selectSemester(1)"
            class="py-6 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-600 rounded-3xl font-black transition-all active:scale-95 flex flex-col items-center gap-1"
          >
            <span class="text-3xl">Ⅰ</span><span>1 семестр</span>
          </button>
          <button
            @click="selectSemester(2)"
            class="py-6 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-600 rounded-3xl font-black transition-all active:scale-95 flex flex-col items-center gap-1"
          >
            <span class="text-3xl">Ⅱ</span><span>2 семестр</span>
          </button>
        </div>
        <button @click="requestClose" class="w-full max-w-md mt-6 py-4 bg-muted hover:bg-muted/70 text-muted-foreground rounded-2xl font-bold transition-all">
          ОТМЕНА
        </button>
      </div>

      <!-- Step 2: 3-column wizard -->
      <div v-else class="flex flex-col h-full bg-background">
        <!-- Header -->
        <div class="p-5 border-b border-border flex items-center justify-between shrink-0">
          <div>
            <div class="flex items-center gap-2">
              <span class="px-2.5 py-1 bg-emerald-500/10 text-emerald-600 text-[10px] font-black rounded-lg uppercase tracking-wider border border-emerald-500/20">{{ semester }} семестр</span>
              <span class="text-xs text-muted-foreground font-bold">•</span>
              <span class="text-xs text-muted-foreground font-bold">Параметры журналов преподавателя</span>
            </div>
            <h2 class="text-xl font-black text-foreground tracking-tight mt-1">
              Процесс формирования журналов: {{ workload?.teacherName }}
            </h2>
          </div>
          <button @click="requestClose" class="w-10 h-10 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted rounded-full transition-all">
            <IconX class="w-5 h-5" />
          </button>
        </div>

        <div class="flex-1 overflow-hidden flex flex-col md:flex-row">
          <!-- LEFT: discipline list -->
          <div class="md:flex-[1.2] border-r border-border p-5 flex flex-col overflow-hidden bg-muted/20 min-w-0">
            <div class="flex items-center justify-between mb-4 shrink-0">
              <span class="text-[11px] font-black text-muted-foreground uppercase tracking-widest">Список дисциплин</span>
              <span class="px-2.5 py-1 bg-card border border-border rounded-lg text-[11px] font-black text-muted-foreground">{{ disciplines.length }} ДИСЦИПЛИН</span>
            </div>
            <div class="flex-1 overflow-y-auto pr-1 space-y-2.5">
              <button
                v-for="d in disciplines"
                :key="d.id"
                @click="setActive(d.id)"
                class="w-full text-left p-4 rounded-2xl border-2 transition-all flex items-start gap-3 relative"
                :class="activeId === d.id
                  ? 'bg-emerald-600 border-emerald-600 text-white shadow-lg'
                  : 'bg-card border-border hover:border-emerald-500/40'"
              >
                <div class="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                  :class="activeId === d.id ? 'bg-white/10 text-white' : 'bg-emerald-500/10 text-emerald-600'">
                  <IconBookOpen class="w-5 h-5" />
                </div>
                <div class="flex-1 min-w-0 pr-3">
                  <div class="flex items-center gap-1.5 mb-1 text-[12px] font-black"
                    :class="activeId === d.id ? 'text-emerald-100' : 'text-muted-foreground'">
                    <span :class="activeId === d.id ? 'text-white' : 'text-emerald-600'">{{ d.index }}</span>
                    <span class="opacity-50">•</span><span>{{ d.course }} курс</span>
                  </div>
                  <h4 class="text-sm font-black truncate" :class="activeId === d.id ? 'text-white' : 'text-foreground'">{{ d.name }}</h4>
                  <div class="text-[12px] font-bold mt-1.5 flex items-center gap-2"
                    :class="activeId === d.id ? 'text-emerald-100' : 'text-muted-foreground'">
                    <span>часы: {{ d.plannedHours }} ч.</span><span>•</span>
                    <span>группы: {{ stagedFor(d.id).length }}/{{ d.groupCount }}</span>
                  </div>
                </div>
                <div v-if="discComplete(d)" class="w-6 h-6 rounded-full flex items-center justify-center shrink-0"
                  :class="activeId === d.id ? 'bg-white/20 text-white' : 'bg-emerald-500 text-white'">
                  <IconCheckSm class="w-3.5 h-3.5" />
                </div>
              </button>
              <div v-if="disciplines.length === 0" class="text-center text-muted-foreground py-12 text-sm">
                Нет дисциплин с часами в этом семестре
              </div>
            </div>
          </div>

          <!-- MIDDLE: config for active discipline -->
          <div class="md:flex-[1.2] border-r border-border flex flex-col overflow-hidden p-5 min-w-0">
            <template v-if="active">
              <div class="pb-4 border-b border-border shrink-0">
                <div class="flex items-center gap-2 mb-1 flex-wrap">
                  <span class="text-[12px] font-black uppercase tracking-widest text-emerald-600">{{ active.index }}</span>
                  <span class="text-muted-foreground/40">•</span>
                  <span class="text-[11px] uppercase font-bold text-muted-foreground bg-muted border border-border rounded-md px-2 py-0.5">часы: {{ active.plannedHours }} ч.</span>
                  <span class="text-[11px] uppercase font-bold border rounded-md px-2 py-0.5"
                    :class="stagedFor(active.id).length === active.groupCount ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600' : 'bg-amber-500/10 border-amber-500/30 text-amber-600'">
                    Группы: {{ stagedFor(active.id).length }} из {{ active.groupCount }}
                  </span>
                </div>
                <h3 class="text-base font-black text-foreground">{{ active.name }}</h3>
              </div>

              <div class="flex-1 overflow-y-auto pt-4 space-y-5 pr-1">
                <!-- languages -->
                <div class="space-y-2">
                  <span class="text-[12px] font-black text-muted-foreground uppercase tracking-widest">Языки обучения</span>
                  <div class="flex flex-wrap gap-2">
                    <button v-for="l in LANGS" :key="l.value" @click="toggleLang(l.value)"
                      class="px-3 py-1.5 rounded-xl text-xs font-black border transition-all"
                      :class="draft.langs.includes(l.value) ? 'bg-amber-500/10 border-amber-500/40 text-amber-600' : 'bg-card border-border text-muted-foreground hover:border-amber-400/40'">
                      {{ l.text }}
                    </button>
                  </div>
                </div>
                <!-- specialties -->
                <div class="space-y-2 pt-3 border-t border-border">
                  <div class="flex items-center justify-between">
                    <span class="text-[12px] font-black text-muted-foreground uppercase tracking-widest">Специальности</span>
                    <span class="text-[11px] font-black text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded">выбрано: {{ draft.specIds.length }}</span>
                  </div>
                  <div class="flex flex-wrap gap-2">
                    <button v-for="sp in active.specialties" :key="sp.id" @click="toggleSpec(sp.id)"
                      class="min-w-10 h-10 px-2 rounded-xl text-xs font-black border transition-all flex items-center justify-center"
                      :class="draft.specIds.includes(sp.id) ? 'bg-foreground border-foreground text-background' : 'bg-card border-border text-foreground hover:border-foreground/40'">
                      {{ sp.label }}
                    </button>
                  </div>
                </div>
                <!-- students -->
                <div class="pt-3 border-t border-border">
                  <div class="flex items-center justify-between mb-2">
                    <span class="text-[12px] font-black text-muted-foreground uppercase tracking-widest">Студенты ({{ draft.studentIds.length }}/{{ candidates.length }})</span>
                    <div class="flex gap-2">
                      <button @click="selectAllStudents" class="text-[10px] font-bold text-emerald-600 bg-emerald-500/10 px-2 py-1 rounded">Выбрать всех</button>
                      <button @click="draft.studentIds = []" class="text-[10px] font-bold text-muted-foreground bg-muted px-2 py-1 rounded">Сброс</button>
                    </div>
                  </div>
                  <div class="space-y-1.5 max-h-72 overflow-y-auto">
                    <button v-for="st in candidates" :key="st.id" @click="toggleStudent(st.id)"
                      class="w-full text-left p-2.5 rounded-xl border flex items-center gap-3 transition-all"
                      :class="draft.studentIds.includes(st.id) ? 'bg-emerald-500/5 border-emerald-500/40' : 'bg-card border-border hover:border-border/70'">
                      <span class="w-4 h-4 rounded-[6px] border flex items-center justify-center shrink-0"
                        :class="draft.studentIds.includes(st.id) ? 'bg-emerald-600 border-emerald-600' : 'bg-card border-muted-foreground/40'">
                        <IconCheckSm v-if="draft.studentIds.includes(st.id)" class="w-3 h-3 text-white" />
                      </span>
                      <span class="min-w-0">
                        <span class="block font-bold text-foreground text-xs truncate">{{ st.name }}</span>
                        <span class="block text-[9px] text-muted-foreground font-bold uppercase tracking-wider">{{ st.language }}</span>
                      </span>
                    </button>
                    <div v-if="candidates.length === 0" class="py-6 text-center text-xs text-muted-foreground bg-muted/40 rounded-xl">
                      {{ draft.specIds.length === 0 ? 'Выберите специальность' : 'Нет свободных студентов' }}
                    </div>
                  </div>
                </div>
              </div>

              <div class="pt-4 border-t border-border shrink-0">
                <button @click="stageGroup" :disabled="draft.studentIds.length === 0"
                  class="w-full py-3.5 rounded-xl font-bold text-sm uppercase tracking-wider transition-all flex items-center justify-center gap-2"
                  :class="draft.studentIds.length > 0 ? 'bg-foreground text-background hover:opacity-90 active:scale-95' : 'bg-muted text-muted-foreground cursor-not-allowed'">
                  <IconBookOpen class="w-4 h-4" /> Сформировать группу
                </button>
              </div>
            </template>
            <div v-else class="flex-1 flex flex-col items-center justify-center text-center p-8">
              <div class="w-20 h-20 bg-muted rounded-full flex items-center justify-center mb-5 text-emerald-400">
                <IconBookOpen class="w-8 h-8" />
              </div>
              <h3 class="text-lg font-black text-foreground mb-1">Выберите дисциплину</h3>
              <p class="text-muted-foreground text-sm max-w-xs">Выберите дисциплину слева для настройки её журнала</p>
            </div>
          </div>

          <!-- RIGHT: staged journals -->
          <div class="md:flex-[1.5] flex flex-col bg-muted/20 overflow-hidden min-w-0">
            <div class="p-5 flex flex-col h-full overflow-hidden">
              <div class="flex justify-between items-center mb-4 shrink-0">
                <span class="text-base font-black text-foreground uppercase tracking-tight">Сформированные журналы</span>
                <span class="bg-emerald-500/10 text-emerald-600 text-[12px] font-black px-2.5 py-1 rounded-md border border-emerald-500/20">{{ staged.length }}</span>
              </div>
              <div class="flex-1 overflow-y-auto space-y-4 pr-1">
                <div v-for="(j, ji) in staged" :key="j.id" class="bg-card p-4 rounded-2xl border border-border shadow-sm">
                  <div class="flex justify-between items-start mb-2">
                    <div class="flex items-center gap-2.5 min-w-0">
                      <div class="w-7 h-7 rounded-lg bg-emerald-600 text-white font-black text-xs flex items-center justify-center shrink-0">{{ ji + 1 }}</div>
                      <h4 class="font-black text-foreground text-sm truncate">{{ j.name }}</h4>
                    </div>
                    <button @click="removeStaged(j.id)" class="text-muted-foreground hover:text-red-500 p-1"><IconTrash class="w-4 h-4" /></button>
                  </div>
                  <div class="flex flex-wrap gap-1.5 mb-3">
                    <span class="text-[10px] font-black bg-muted text-foreground px-2 py-0.5 rounded-md border border-border">{{ j.course }} курс</span>
                    <span v-for="l in j.langs" :key="l" class="text-[10px] font-black bg-muted text-muted-foreground px-2 py-0.5 rounded-md border border-border uppercase">{{ l }}</span>
                    <span v-for="s in j.specLabels" :key="s" class="text-[10px] font-black bg-muted text-muted-foreground px-2 py-0.5 rounded-md border border-border">{{ s }}</span>
                    <span class="text-[10px] font-black bg-muted text-muted-foreground px-2 py-0.5 rounded-md border border-border">{{ j.studentIds.length }} студ.</span>
                  </div>
                  <!-- validity -->
                  <div class="mb-3 p-2.5 rounded-xl border flex items-center justify-between"
                    :class="stagedValid(j) ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600' : 'bg-amber-500/10 border-amber-500/20 text-amber-600'">
                    <span class="text-[10px] font-black uppercase tracking-wider">{{ stagedValid(j) ? 'Расписание сформировано' : 'Часы не совпадают' }}</span>
                    <span class="text-[10px] font-black px-2 py-0.5 rounded-lg bg-card border" :class="stagedValid(j) ? 'border-emerald-500/30' : 'border-amber-500/30'">
                      {{ stagedHours(j) }} / {{ targetHours(j) }} ч.
                    </span>
                  </div>
                  <!-- schedule -->
                  <div class="border-t border-border pt-3">
                    <span class="text-[11px] font-black text-muted-foreground uppercase tracking-widest">Расписание</span>
                    <div class="flex flex-wrap gap-1.5 my-2">
                      <button v-for="wd in WEEKDAYS" :key="wd.weekId" @click="toggleDay(j, wd.weekId)"
                        class="px-2.5 py-1 rounded-lg text-xs font-bold border transition-all"
                        :class="j.daySlots.some(s => s.weekId === wd.weekId) ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-card text-muted-foreground border-border hover:border-emerald-500/40'">
                        {{ wd.abbr }}
                      </button>
                    </div>
                    <div v-for="slot in j.daySlots" :key="slot.weekId" class="flex items-center gap-2 mb-1.5">
                      <span class="text-xs font-bold text-foreground w-7">{{ abbrFor(slot.weekId) }}</span>
                      <Select :model-value="slot.startId" @update:model-value="slot.startId = ($event as string)" :options="slotOptions" placeholder="с" class="w-24" />
                      <Select :model-value="slot.endId" @update:model-value="slot.endId = ($event as string)" :options="slotOptions" placeholder="по" class="w-24" />
                    </div>
                  </div>
                </div>
                <div v-if="staged.length === 0" class="text-center text-muted-foreground py-12 text-sm">
                  Пока нет сформированных групп.<br />Соберите группу в средней колонке.
                </div>
              </div>
              <div class="pt-4 border-t border-border shrink-0">
                <button @click="finish" :disabled="!isComplete || creating"
                  class="w-full py-4 rounded-2xl font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2"
                  :class="isComplete && !creating ? 'bg-emerald-600 text-white hover:bg-emerald-700 active:scale-95' : 'bg-muted text-muted-foreground cursor-not-allowed'">
                  Завершить и создать журналы
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>
  </GuardedPopover>
</template>

<script setup lang="ts">
import { ref, computed, watch } from "vue";
import dayjs from "dayjs";
import GuardedPopover from "@/components/ui/GuardedPopover.vue";
import Select from "@/components/ui/Select.vue";
import { useWorkloadStore } from "@/stores/workloadStore";
import { useStudentStore } from "@/stores/studentStore";
import { useEducationScheduleStore } from "@/stores/educationScheduleStore";
import { useAcademicYearSemesterStore } from "@/stores/academicYearSemesterStore";
import { useRupEntryStore } from "@/stores/rupEntryStore";
import { useSpecialtyStore } from "@/stores/specialtyStore";
import { computeWeeklySlotHours } from "@/components/Calendar/scheduleHours";
import { itemsNeedingJournals, semesterValue } from "@convex/workloads/lib";
import type { SavedWorkload } from "@/types/workload";
import IconBookOpen from "~icons/lucide/book-open";
import IconCalendar from "~icons/lucide/calendar";
import IconTrash from "~icons/lucide/trash-2";
import IconCheckSm from "~icons/lucide/check";
import IconX from "~icons/lucide/x";

const props = defineProps<{ workload: SavedWorkload | null }>();
const emit = defineEmits<{ (e: "close"): void; (e: "created", count: number): void }>();

const workloadStore = useWorkloadStore();
const studentStore = useStudentStore();
const educationScheduleStore = useEducationScheduleStore();
const academicYearSemesterStore = useAcademicYearSemesterStore();
const rupEntryStore = useRupEntryStore();
const specialtyStore = useSpecialtyStore();

const LANGS = [
  { value: "ru", text: "RU" },
  { value: "kk", text: "ҚАЗ" },
  { value: "en", text: "EN" },
];
const WEEKDAYS = [
  { weekId: 1, abbr: "ПН" }, { weekId: 2, abbr: "ВТ" }, { weekId: 3, abbr: "СР" },
  { weekId: 4, abbr: "ЧТ" }, { weekId: 5, abbr: "ПТ" }, { weekId: 6, abbr: "СБ" },
];
const abbrFor = (w: number) => WEEKDAYS.find((x) => x.weekId === w)?.abbr ?? "";

interface Spec { id: string; legacyId?: string; label: string }
interface Discipline {
  id: string; subjectId: string; name: string; index: string; course: string;
  groupCount: number; plannedHours: number; specialties: Spec[]; defaultLang: string;
}
interface Staged {
  id: string; itemId: string; subjectId: string; name: string; course: string;
  specIds: string[]; specLabels: string[]; langs: string[]; studentIds: string[];
  daySlots: Array<{ weekId: number; startId: string; endId: string }>;
}

const semester = ref<number | null>(null);
const activeId = ref<string | null>(null);
const creating = ref(false);
const staged = ref<Staged[]>([]);
const draft = ref<{ langs: string[]; specIds: string[]; studentIds: string[] }>({
  langs: ["ru"], specIds: [], studentIds: [],
});
let seq = 0;

const specLabel = (name: string) => (name || "").split(/[\s-]+/)[0] || name;
const specKeys = (id: string): string[] => {
  const sp: any = specialtyStore.specialties.find((s: any) => s.id === id || s._id === id);
  return sp?.legacyId ? [id, sp.legacyId] : [id];
};

const semesterRecord = computed(() => {
  if (!props.workload) return null;
  return academicYearSemesterStore
    .getAcademicYearSemestersByAcademicYear(props.workload.academicYearId)
    .slice()
    .sort((a: any, b: any) => String(a.startDate).localeCompare(String(b.startDate)))[(semester.value ?? 1) - 1] ?? null;
});
const weekCount = computed(() => {
  const r = semesterRecord.value;
  if (!r) return 0;
  return Math.max(0, Math.ceil(dayjs(r.endDate).diff(dayjs(r.startDate), "day") / 7));
});
const scheduleSlots = computed(() => {
  const r = semesterRecord.value;
  const list = r ? educationScheduleStore.getSchedulesBySemester(r.id) : educationScheduleStore.getActiveYearSchedules;
  return [...list].sort((a: any, b: any) => a.lessonNumber - b.lessonNumber);
});
const slotOptions = computed(() => scheduleSlots.value.map((s: any) => ({ value: s.id, text: s.startTime })));

const allStudents = computed(() =>
  studentStore.getAllStudents.map((s: any) => ({
    id: s.id, specialty: s.specialty, status: s.status, language: s.language,
    name: `${s.surname} ${s.firstName}`,
  }))
);

const disciplines = ref<Discipline[]>([]);

function selectSemester(sem: number) {
  semester.value = sem;
  const wl = props.workload;
  if (!wl) return;
  disciplines.value = itemsNeedingJournals(wl.items as any, sem as any).map((item) => {
    const rup: any = rupEntryStore.getRupEntryById(item.subjectId);
    const specialties: Spec[] = (rup?.specialtyIds ?? []).map((sid: string) => {
      const sp: any = specialtyStore.specialties.find((s: any) => s.id === sid || s._id === sid);
      return { id: sid, legacyId: sp?.legacyId, label: specLabel(sp?.name ?? sid) };
    });
    return {
      id: item.id, subjectId: item.subjectId,
      name: rup?.moduleName ?? item.description ?? "Дисциплина",
      index: rup?.moduleIndex ?? item.index ?? "",
      course: item.course || "1",
      groupCount: parseInt(semesterValue(item as any, sem as any, "groupCount")) || 1,
      plannedHours: Math.round(parseFloat(semesterValue(item as any, sem as any, "hoursPerGroup")) || 0),
      specialties,
      defaultLang: (item as any).language ?? rup?.language ?? "ru",
    } as Discipline;
  });
  if (disciplines.value[0]) setActive(disciplines.value[0].id);
}

// Reset wizard each time it opens for a workload.
watch(
  () => props.workload?.id,
  (id) => {
    if (id) {
      semester.value = null;
      activeId.value = null;
      staged.value = [];
      disciplines.value = [];
      draft.value = { langs: ["ru"], specIds: [], studentIds: [] };
    }
  }
);

const active = computed(() => disciplines.value.find((d) => d.id === activeId.value) || null);

function setActive(id: string) {
  activeId.value = id;
  const d = disciplines.value.find((x) => x.id === id);
  draft.value = { langs: [d?.defaultLang ?? "ru"], specIds: [], studentIds: [] };
}

const stagedFor = (itemId: string) => staged.value.filter((s) => s.itemId === itemId);

// students of the active discipline matching selected specs + langs, minus already staged here
const candidates = computed(() => {
  const d = active.value;
  if (!d || draft.value.specIds.length === 0) return [];
  const keys = new Set(draft.value.specIds.flatMap((id) => specKeys(id)));
  const taken = new Set(stagedFor(d.id).flatMap((s) => s.studentIds));
  return allStudents.value.filter(
    (st) =>
      keys.has(st.specialty) &&
      (st.status === undefined || st.status === "active") &&
      (draft.value.langs.length === 0 || draft.value.langs.includes(st.language)) &&
      !taken.has(st.id)
  );
});

function toggleLang(l: string) {
  const i = draft.value.langs.indexOf(l);
  if (i >= 0) { if (draft.value.langs.length > 1) draft.value.langs.splice(i, 1); }
  else draft.value.langs.push(l);
  autoSelect();
}
function toggleSpec(id: string) {
  const i = draft.value.specIds.indexOf(id);
  if (i >= 0) draft.value.specIds.splice(i, 1);
  else draft.value.specIds.push(id);
  autoSelect();
}
function autoSelect() {
  draft.value.studentIds = candidates.value.map((c) => c.id);
}
function selectAllStudents() { draft.value.studentIds = candidates.value.map((c) => c.id); }
function toggleStudent(id: string) {
  const i = draft.value.studentIds.indexOf(id);
  if (i >= 0) draft.value.studentIds.splice(i, 1);
  else draft.value.studentIds.push(id);
}

function stageGroup() {
  const d = active.value;
  if (!d || draft.value.studentIds.length === 0) return;
  staged.value.push({
    id: `s${seq++}`, itemId: d.id, subjectId: d.subjectId, name: d.name, course: d.course,
    specIds: [...draft.value.specIds],
    specLabels: d.specialties.filter((s) => draft.value.specIds.includes(s.id)).map((s) => s.label),
    langs: [...draft.value.langs], studentIds: [...draft.value.studentIds], daySlots: [],
  });
  draft.value = { langs: [d.defaultLang], specIds: [], studentIds: [] };
}
function removeStaged(id: string) { staged.value = staged.value.filter((s) => s.id !== id); }

function toggleDay(j: Staged, weekId: number) {
  const i = j.daySlots.findIndex((s) => s.weekId === weekId);
  if (i >= 0) j.daySlots.splice(i, 1);
  else j.daySlots.push({ weekId, startId: "", endId: "" });
  j.daySlots.sort((a, b) => a.weekId - b.weekId);
}

const targetHours = (j: Staged) => disciplines.value.find((d) => d.id === j.itemId)?.plannedHours ?? 0;
function stagedHours(j: Staged) {
  const ids = scheduleSlots.value.map((s: any) => s.id);
  return computeWeeklySlotHours(j.daySlots.filter((s) => s.startId && s.endId), ids) * weekCount.value;
}
function stagedValid(j: Staged) {
  return j.studentIds.length > 0 && stagedHours(j) === targetHours(j);
}
function discComplete(d: Discipline) {
  const list = stagedFor(d.id);
  return list.length === d.groupCount && list.every(stagedValid);
}
const isComplete = computed(
  () => disciplines.value.length > 0 && disciplines.value.every(discComplete)
);

async function finish() {
  const wl = props.workload;
  if (!wl?.id || !semester.value || !isComplete.value) return;
  creating.value = true;
  try {
    const groups = staged.value.map((j) => {
      const total = stagedFor(j.itemId).length;
      const idx = stagedFor(j.itemId).findIndex((x) => x.id === j.id) + 1;
      return {
        subjectId: j.subjectId,
        groupName: total > 1 ? `${j.name} — гр. ${idx}` : j.name,
        studentIds: j.studentIds,
        weeklySchedules: j.daySlots.filter((s) => s.startId && s.endId)
          .map((s) => ({ weekId: s.weekId, startId: s.startId, endId: s.endId })),
      };
    });
    const res = await workloadStore.generateJournalGroups(wl.id, semester.value, groups);
    emit("created", res?.journalsCreated ?? 0);
  } finally {
    creating.value = false;
  }
}
</script>
