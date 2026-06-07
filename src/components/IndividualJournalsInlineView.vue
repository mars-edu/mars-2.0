<template>
  <div class="space-y-6">
    <div
      v-if="children.length === 0"
      class="text-center py-12 text-muted-foreground text-sm"
    >
      Индивидуальные журналы не найдены
    </div>

    <div
      v-for="(child, idx) in children"
      :key="child.id"
      class="bg-card rounded-2xl border border-border shadow-sm overflow-hidden"
    >
      <!-- Card header -->
      <div
        class="bg-muted/60 px-6 py-4 border-b border-border flex items-center justify-between"
      >
        <div class="flex items-center gap-3">
          <div
            class="w-8 h-8 rounded-full bg-card border border-border flex items-center justify-center"
          >
            <IconUsers class="w-4 h-4 text-muted-foreground" />
          </div>
          <div>
            <div class="font-bold text-[15px]">
              {{ child.customTitle || `Индивидуальный журнал #${idx + 1}` }}
            </div>
            <div
              class="text-[10px] uppercase tracking-wider text-muted-foreground flex items-center gap-2"
            >
              <span>Дни: {{ daysLabel(child) }}</span>
              <span>•</span>
              <span>Студентов: {{ child.participants.length }}</span>
            </div>
          </div>
        </div>
        <span
          class="text-[11px] font-mono text-muted-foreground bg-card px-2 py-1 rounded border border-border"
        >
          ID: {{ child.id.slice(-6) }}
        </span>
      </div>

      <!-- Grade table -->
      <div class="overflow-x-auto">
        <div
          v-if="!journalMarksFor(child.id) || journalMarksFor(child.id)!.studentMarks.length === 0"
          class="px-6 py-8 text-center text-sm text-muted-foreground"
        >
          Нет данных
        </div>
        <table v-else class="w-full text-sm border-collapse">
          <thead>
            <tr>
              <th
                class="border-r border-b border-border p-2 w-48 min-w-[12rem] text-left text-[11px] uppercase tracking-wide text-muted-foreground font-bold sticky left-0 bg-muted z-10 align-middle"
              >
                Студент
              </th>
              <th
                v-for="(mark, mIdx) in headerMarks(child.id)"
                :key="mIdx"
                :class="[
                  'border-r border-b border-border p-2 text-center text-[11px] font-semibold align-middle',
                  isFinalMark(mark)
                    ? 'bg-destructive/5 text-destructive min-w-[60px]'
                    : mark.type === 'session'
                    ? 'bg-muted text-muted-foreground min-w-[70px]'
                    : 'bg-background text-muted-foreground min-w-[56px]',
                ]"
              >
                {{ markHeaderLabel(mark) }}
              </th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="studentId in child.participants"
              :key="studentId"
              class="hover:bg-muted/30 transition-colors"
            >
              <td
                class="border-r border-b border-border px-3 py-1.5 text-[13px] font-medium sticky left-0 bg-card z-10 whitespace-nowrap"
              >
                {{ studentStore.getStudentFullName(studentId) }}
              </td>
              <td
                v-for="(mark, mIdx) in studentMarksFor(child.id, studentId)"
                :key="mIdx"
                class="border-r border-b border-border p-0 align-middle"
              >
                <div class="flex flex-col gap-0.5 py-1 px-1">
                  <input
                    v-for="(val, vIdx) in mark.values"
                    :key="vIdx"
                    type="text"
                    :value="val ?? ''"
                    :disabled="isReadonly(child)"
                    :class="[
                      'w-full h-7 border border-input rounded-md text-center text-xs bg-muted/50 focus:bg-card focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all',
                      isReadonly(child) ? 'opacity-50 cursor-not-allowed' : '',
                    ]"
                    @change="onMarkChange(child.id, studentId, mIdx, vIdx, ($event.target as HTMLInputElement).value)"
                  />
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, watch } from "vue";
import IconUsers from "~icons/lucide/users";
import { useCalendarStore } from "@/stores/calendarStore";
import { useMarksStore } from "@/stores/marksStore";
import { useStudentStore } from "@/stores/studentStore";
import { useJournalMarkTemplate } from "@/composables/useJournalMarkTemplate";
import { getWeekDays } from "@/constants/calendar";
import type { CalendarEvent } from "@/stores/calendarStore";
import type { Mark } from "@/types/marks";

const props = defineProps<{
  mainEventId: string;
}>();

const calendarStore = useCalendarStore();
const marksStore = useMarksStore();
const studentStore = useStudentStore();
const { buildMarkTemplate } = useJournalMarkTemplate();

// Computed children: calendar events whose sourceGroupEventId === mainEventId
const children = computed(() =>
  calendarStore.events.filter(
    (e) => e.sourceGroupEventId === props.mainEventId
  )
);

// Initialize and load marks for each child whenever the child list changes.
// This mirrors the exact sequence JournalTab.vue uses in rebuildMarks():
//   1. initializeJournalMarks  — seeds the in-memory template so the grid renders
//   2. loadJournalMarks        — merges persisted backend values into the template
watch(
  () => children.value.map((c) => c.id),
  async (ids) => {
    for (const child of children.value) {
      // Skip if already initialized (template exists in the store)
      if (marksStore.journalMarks[child.id]) continue;

      const template = buildMarkTemplate(child);
      marksStore.initializeJournalMarks(child.id, child.participants, template);
      try {
        await marksStore.loadJournalMarks(child.id);
      } catch (err) {
        console.warn("[IndividualJournalsInlineView] Failed to load marks for child:", child.id, err);
      }
    }
  },
  { immediate: true }
);

// Helper: get journal marks for a child event id
// Pinia auto-unwraps shallowRef on store access, so journalMarks behaves as Record<string, JournalMarks>
const journalMarksFor = (childId: string) =>
  marksStore.journalMarks[childId] ?? null;

// Helper: days label from weeklySchedules
const weekDays = getWeekDays();
const daysLabel = (child: CalendarEvent): string => {
  if (!child.weeklySchedules || child.weeklySchedules.length === 0) return "—";
  const uniqueWeekIds = [...new Set(child.weeklySchedules.map((ws) => ws.weekId))];
  const names = uniqueWeekIds
    .map((wid) => weekDays.find((d) => d.weekId === wid)?.abbreviation ?? String(wid))
    .filter(Boolean);
  return names.join(", ");
};

// Helper: get the canonical marks array (from the first student who has marks)
const headerMarks = (childId: string): Mark[] => {
  const journal = journalMarksFor(childId);
  if (!journal) return [];
  const first = journal.studentMarks[0];
  return first?.marks ?? [];
};

// Helper: get marks for a specific student in a child journal
const studentMarksFor = (childId: string, studentId: string): Mark[] => {
  const journal = journalMarksFor(childId);
  if (!journal) return [];
  const sm = journal.studentMarks.find((s) => s.studentId === studentId);
  return sm?.marks ?? headerMarks(childId).map((m) => ({ ...m, values: m.values.map(() => null) }));
};

// Helper: derive column header label for a mark
const markHeaderLabel = (mark: Mark): string => {
  if (mark.label) return String(mark.label);
  if (mark.type === "date" && mark.isoDate) {
    // Format as DD.MM
    const parts = mark.isoDate.split("-");
    if (parts.length === 3) return `${parts[2]}.${parts[1]}`;
  }
  if (mark.type === "date" && mark.date) return String(mark.date);
  return mark.type === "session" ? "Сессия" : "—";
};

// Helper: detect "final" column
const isFinalMark = (mark: Mark): boolean =>
  mark.type === "session" && mark.controlType === "final";

// Helper: determine if a child journal cell is readonly
const mainEvent = computed(() =>
  calendarStore.events.find((e) => e.id === props.mainEventId)
);

const isReadonly = (child: CalendarEvent): boolean =>
  !!(child.isClosed || mainEvent.value?.isClosed);

// Handler: write mark change through marksStore.updateStudentMark
const onMarkChange = (
  childId: string,
  studentId: string,
  markIndex: number,
  valueIndex: number,
  value: string
) => {
  marksStore.updateStudentMark(
    childId,
    studentId,
    markIndex,
    valueIndex,
    value === "" ? null : value
  );
};
</script>
