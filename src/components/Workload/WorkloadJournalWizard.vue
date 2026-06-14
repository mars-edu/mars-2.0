<template>
  <GuardedPopover
    id="workload-journal-wizard"
    kind="popup"
    :guard-unsaved="false"
    :opened="!!workload"
    @popup:closed="$emit('close')"
  >
    <template #default="{ requestClose }">
      <div class="flex flex-col h-full bg-background">
        <PopoverHeader
          title="Создание журналов"
          :subtitle="workload?.teacherName"
          :on-cancel="requestClose"
        />

        <!-- Step 1: semester -->
        <div v-if="!semester" class="flex-1 flex flex-col items-center justify-center p-8 text-center">
          <div class="w-20 h-20 bg-blue-500/10 rounded-full flex items-center justify-center mb-6 text-blue-500">
            <IconBookOpen class="w-8 h-8" />
          </div>
          <p class="text-muted-foreground font-medium mb-8 max-w-md">
            Выберите семестр, для которого формируются журналы. Для каждой дисциплины
            нужно собрать группы и задать расписание так, чтобы часы совпали с планом.
          </p>
          <div class="flex gap-3">
            <button
              v-for="sem in 2"
              :key="sem"
              @click="selectSemester(sem)"
              class="px-8 py-4 rounded-2xl font-black text-lg border-2 border-border bg-card text-foreground hover:border-blue-500/60 transition-all active:scale-95"
            >
              {{ sem }} семестр
            </button>
          </div>
        </div>

        <!-- Step 2: per-discipline groups -->
        <div v-else class="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
          <div v-if="disciplines.length === 0" class="text-center text-muted-foreground py-12">
            В этом семестре нет дисциплин с запланированными часами.
          </div>

          <div
            v-for="disc in disciplines"
            :key="disc.subjectId"
            class="bg-card border border-border rounded-2xl p-4"
          >
            <div class="flex items-center justify-between mb-3 flex-wrap gap-2">
              <div>
                <h3 class="font-bold text-foreground">{{ disc.name }}</h3>
                <p class="text-xs text-muted-foreground font-bold uppercase tracking-wider mt-0.5">
                  Нужно групп: {{ disc.groupCount }} · план {{ disc.plannedHours }} ч / группа
                </p>
              </div>
              <span
                class="px-2.5 py-1 rounded-full text-[11px] font-black uppercase tracking-wider"
                :class="discComplete(disc) ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'"
              >
                {{ disc.groups.length }}/{{ disc.groupCount }} групп
              </span>
            </div>

            <div class="space-y-4">
              <div
                v-for="(group, gi) in disc.groups"
                :key="group.id"
                class="border border-border rounded-xl p-3 bg-background/40"
              >
                <div class="flex items-center justify-between mb-2">
                  <span class="text-sm font-bold text-foreground">Группа {{ gi + 1 }}</span>
                  <div class="flex items-center gap-2">
                    <span
                      class="text-xs font-black"
                      :class="groupHours(disc, group) === disc.plannedHours && group.studentIds.length > 0
                        ? 'text-emerald-500' : 'text-red-500'"
                    >
                      {{ groupHours(disc, group) }} / {{ disc.plannedHours }} ч
                    </span>
                    <button
                      @click="removeGroup(disc, gi)"
                      class="p-1 text-muted-foreground hover:text-red-500 rounded"
                      title="Удалить группу"
                    >
                      <IconTrash class="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <!-- Students -->
                <div class="mb-3">
                  <p class="text-xs font-bold text-muted-foreground mb-1">
                    Студенты ({{ group.studentIds.length }})
                  </p>
                  <Select
                    :model-value="group.studentIds"
                    @update:model-value="group.studentIds = ($event as string[])"
                    :options="studentOptions(disc, group)"
                    multiple
                    placeholder="Выберите студентов"
                    search-placeholder="Поиск студента..."
                  />
                </div>

                <!-- Schedule -->
                <p class="text-xs font-bold text-muted-foreground mb-1">Расписание</p>
                <div class="flex flex-wrap gap-1.5 mb-2">
                  <button
                    v-for="wd in weekDays"
                    :key="wd.weekId"
                    @click="toggleDay(group, wd.weekId)"
                    class="px-2.5 py-1 rounded-lg text-xs font-bold border transition-all"
                    :class="hasDay(group, wd.weekId)
                      ? 'bg-blue-500 text-white border-blue-500'
                      : 'bg-card text-muted-foreground border-border hover:border-blue-500/50'"
                  >
                    {{ wd.abbr }}
                  </button>
                </div>
                <div
                  v-for="slot in group.daySlots"
                  :key="slot.weekId"
                  class="flex items-center gap-2 mb-1.5"
                >
                  <span class="text-xs font-bold text-foreground w-8">{{ abbrFor(slot.weekId) }}</span>
                  <Select
                    v-model="slot.startId"
                    :options="slotOptions"
                    placeholder="с"
                    class="w-28"
                  />
                  <Select
                    v-model="slot.endId"
                    :options="slotOptions"
                    placeholder="по"
                    class="w-28"
                  />
                </div>
              </div>

              <button
                v-if="disc.groups.length < disc.groupCount"
                @click="addGroup(disc)"
                class="w-full py-2 border-2 border-dashed border-border rounded-xl text-sm font-bold text-muted-foreground hover:border-blue-500/50 hover:text-blue-500 transition-all"
              >
                + Добавить группу
              </button>
            </div>
          </div>
        </div>

        <PopoverFooter
          v-if="semester"
          save-text="Завершить и создать журналы"
          save-variant="primary"
          :disabled="!isComplete"
          :is-loading="creating"
          :on-save="finish"
          :on-cancel="requestClose"
        />
      </div>
    </template>
  </GuardedPopover>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import dayjs from "dayjs";
import GuardedPopover from "@/components/ui/GuardedPopover.vue";
import PopoverHeader from "@/components/ui/PopoverHeader.vue";
import PopoverFooter from "@/components/ui/PopoverFooter.vue";
import Select from "@/components/ui/Select.vue";
import { useWorkloadStore } from "@/stores/workloadStore";
import { useStudentStore } from "@/stores/studentStore";
import { useEducationScheduleStore } from "@/stores/educationScheduleStore";
import { useAcademicYearSemesterStore } from "@/stores/academicYearSemesterStore";
import { useRupEntryStore } from "@/stores/rupEntryStore";
import { useSpecialtyStore } from "@/stores/specialtyStore";
import { computeWeeklySlotHours } from "@/components/Calendar/scheduleHours";
import { itemsNeedingJournals, filterEligibleStudents, semesterValue } from "@convex/workloads/lib";
import type { SavedWorkload } from "@/types/workload";
import IconBookOpen from "~icons/lucide/book-open";
import IconTrash from "~icons/lucide/trash-2";

const props = defineProps<{ workload: SavedWorkload | null }>();
const emit = defineEmits<{ (e: "close"): void; (e: "created", count: number): void }>();

const workloadStore = useWorkloadStore();
const studentStore = useStudentStore();
const educationScheduleStore = useEducationScheduleStore();
const academicYearSemesterStore = useAcademicYearSemesterStore();
const rupEntryStore = useRupEntryStore();
const specialtyStore = useSpecialtyStore();

interface GroupDraft {
  id: string;
  studentIds: string[];
  daySlots: Array<{ weekId: number; startId: string; endId: string }>;
}
interface DiscPlan {
  subjectId: string;
  name: string;
  groupCount: number;
  plannedHours: number;
  specialtyKeys: string[];
  language?: string;
  groups: GroupDraft[];
}

const semester = ref<number | null>(null);
const creating = ref(false);
const disciplines = ref<DiscPlan[]>([]);
let groupSeq = 0;

const weekDays = [
  { weekId: 1, abbr: "ПН" },
  { weekId: 2, abbr: "ВТ" },
  { weekId: 3, abbr: "СР" },
  { weekId: 4, abbr: "ЧТ" },
  { weekId: 5, abbr: "ПТ" },
  { weekId: 6, abbr: "СБ" },
];
const abbrFor = (weekId: number) => weekDays.find((w) => w.weekId === weekId)?.abbr ?? "";

// Specialty _id → legacyId map (students reference specialties by legacyId).
const specialtyKeysFor = (specialtyIds: string[]): string[] => {
  const out: string[] = [];
  for (const sid of specialtyIds) {
    out.push(sid);
    const sp = specialtyStore.specialties.find((s: any) => s.id === sid || s._id === sid);
    if (sp?.legacyId) out.push(sp.legacyId);
  }
  return out;
};

const semesterRecord = computed(() => {
  if (!props.workload) return null;
  const list = academicYearSemesterStore
    .getAcademicYearSemestersByAcademicYear(props.workload.academicYearId)
    .slice()
    .sort((a: any, b: any) => String(a.startDate).localeCompare(String(b.startDate)));
  return list[(semester.value ?? 1) - 1] ?? null;
});

const weekCount = computed(() => {
  const rec = semesterRecord.value;
  if (!rec) return 0;
  const days = dayjs(rec.endDate).diff(dayjs(rec.startDate), "day");
  return Math.max(0, Math.ceil(days / 7));
});

const scheduleIds = computed(() => {
  const rec = semesterRecord.value;
  const list = rec
    ? educationScheduleStore.getSchedulesBySemester(rec.id)
    : educationScheduleStore.getActiveYearSchedules;
  return [...list].sort((a: any, b: any) => a.lessonNumber - b.lessonNumber);
});
const slotOptions = computed(() =>
  scheduleIds.value.map((s: any) => ({ value: s.id, text: `${s.startTime}` }))
);

const allStudents = computed(() =>
  studentStore.getAllStudents.map((s: any) => ({
    id: s.id,
    specialty: s.specialty,
    status: s.status,
    language: s.language,
    name: `${s.surname} ${s.firstName}`,
  }))
);

function selectSemester(sem: number) {
  semester.value = sem;
  const wl = props.workload;
  if (!wl) return;
  groupSeq = 0;
  disciplines.value = itemsNeedingJournals(wl.items as any, sem as any).map((item) => {
    const rup: any = rupEntryStore.getRupEntryById(item.subjectId);
    const groupCount = parseInt(semesterValue(item as any, sem as any, "groupCount")) || 1;
    return {
      subjectId: item.subjectId,
      name: rup?.moduleName ?? item.description ?? "Дисциплина",
      groupCount,
      plannedHours: Math.round(parseFloat(semesterValue(item as any, sem as any, "hoursPerGroup")) || 0),
      specialtyKeys: specialtyKeysFor(rup?.specialtyIds ?? []),
      language: rup?.language,
      groups: [emptyGroup()],
    } as DiscPlan;
  });
}

function emptyGroup(): GroupDraft {
  return { id: `g${groupSeq++}`, studentIds: [], daySlots: [] };
}

function addGroup(disc: DiscPlan) {
  if (disc.groups.length < disc.groupCount) disc.groups.push(emptyGroup());
}
function removeGroup(disc: DiscPlan, gi: number) {
  disc.groups.splice(gi, 1);
  if (disc.groups.length === 0) disc.groups.push(emptyGroup());
}

// Eligible students for a discipline, excluding those already picked in its other groups.
function availableStudents(disc: DiscPlan, group: GroupDraft) {
  const eligible = filterEligibleStudents(allStudents.value as any, disc.specialtyKeys, disc.language) as any[];
  const takenElsewhere = new Set(
    disc.groups.filter((g) => g.id !== group.id).flatMap((g) => g.studentIds)
  );
  return eligible.filter((s) => !takenElsewhere.has(s.id));
}

function studentOptions(disc: DiscPlan, group: GroupDraft) {
  return availableStudents(disc, group).map((s) => ({ value: s.id, text: s.name }));
}

const hasDay = (group: GroupDraft, weekId: number) => group.daySlots.some((d) => d.weekId === weekId);
function toggleDay(group: GroupDraft, weekId: number) {
  const i = group.daySlots.findIndex((d) => d.weekId === weekId);
  if (i >= 0) group.daySlots.splice(i, 1);
  else group.daySlots.push({ weekId, startId: "", endId: "" });
  group.daySlots.sort((a, b) => a.weekId - b.weekId);
}

function groupHours(_disc: DiscPlan, group: GroupDraft): number {
  const ids = scheduleIds.value.map((s: any) => s.id);
  const slots = group.daySlots.filter((d) => d.startId && d.endId);
  return computeWeeklySlotHours(slots, ids) * weekCount.value;
}

function groupValid(disc: DiscPlan, group: GroupDraft): boolean {
  return group.studentIds.length > 0 && groupHours(disc, group) === disc.plannedHours;
}

function discComplete(d: DiscPlan): boolean {
  return d.groups.length === d.groupCount && d.groups.every((g) => groupValid(d, g));
}

const isComplete = computed(
  () => disciplines.value.length > 0 && disciplines.value.every(discComplete)
);

async function finish() {
  const wl = props.workload;
  if (!wl?.id || !semester.value || !isComplete.value) return;
  creating.value = true;
  try {
    const groups = disciplines.value.flatMap((d) =>
      d.groups.map((g, gi) => ({
        subjectId: d.subjectId,
        groupName: d.groups.length > 1 ? `${d.name} — гр. ${gi + 1}` : d.name,
        studentIds: g.studentIds,
        weeklySchedules: g.daySlots
          .filter((s) => s.startId && s.endId)
          .map((s) => ({ weekId: s.weekId, startId: s.startId, endId: s.endId })),
      }))
    );
    const res = await workloadStore.generateJournalGroups(wl.id, semester.value, groups);
    emit("created", res?.journalsCreated ?? 0);
  } finally {
    creating.value = false;
  }
}
</script>
