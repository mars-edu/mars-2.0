<template>
  <div class="overflow-x-auto rounded-2xl border border-border bg-card shadow-sm">
    <table class="w-full text-sm border-collapse">
      <thead class="bg-muted/80 backdrop-blur sticky top-0 z-20 shadow-sm">
        <tr>
          <th class="border-r border-b border-border p-2 w-14 min-w-[56px] max-w-[56px] text-center text-[11px] uppercase tracking-wide text-muted-foreground font-bold sticky left-0 bg-muted z-30 align-middle">
            №
          </th>
          <th
            class="border-r border-b border-border p-3 text-left min-w-[250px] text-[11px] uppercase tracking-wide text-muted-foreground font-bold sticky left-14 bg-muted z-30 align-middle"
          >
            Обучающийся
          </th>
          <th
            v-for="(header, index) in displayedHeaders"
            :key="header.isFinalSummary ? 'final-summary' : header.index"
            class="px-1 py-2 text-center text-[12px] font-medium text-foreground border-r border-b border-border w-14 min-w-[50px] relative"
            :class="[
              header.isFinalSummary
                ? 'bg-destructive/5 text-destructive font-bold cursor-default w-20'
                : 'cursor-pointer hover:bg-muted/80',
              {
                'bg-muted/70 text-foreground font-bold w-16': header.type === 'session',
              },
            ]"
            @click="
              !header.isFinalSummary && header.index >= 0
                ? $emit('header-click', header, header.index)
                : null
            "
          >
            <div class="flex flex-col items-center">
              <IconPaperclip
                v-if="header.type === 'date' && getKtpForHeader(header.index) !== null"
                class="h-8 text-gray-400 cursor-pointer"
                @click.stop="$emit('paperclip-click', header, index)"
                :id="`paperclip-${index}`"
              />
              <span v-html="header.label.replace('\n', '<br/>')"></span>
            </div>
          </th>
        </tr>
      </thead>
      <tbody @click="onTbodyClick">
        <tr
          v-for="(student, studentIndex) in displayedStudents"
          :key="student.id"
          v-memo="[marksMatrix[studentIndex], editingCell?.studentIndex === studentIndex ? editedValue : false, displayedHeaders.length, isViewOnly]"
          class="border-b border-border group hover:bg-muted/60 transition-colors"
          style="content-visibility: auto; contain-intrinsic-size: 40px;"
        >
          <td
            class="px-2 py-2 w-14 min-w-[56px] max-w-[56px] text-center border-r border-border text-[12px] font-medium text-muted-foreground align-middle sticky left-0 bg-card group-hover:bg-muted z-10 transition-colors"
          >
            {{ studentIndex + 1 }}
          </td>
          <td
            class="px-3 py-2 border-r border-border align-middle cursor-pointer bg-card group-hover:bg-muted transition-colors min-w-[250px] sticky left-14 z-10"
            @click="$emit('student-click', student, studentIndex)"
          >
            <div class="flex items-center justify-between gap-2">
              <span
                v-if="student.name"
                class="whitespace-nowrap font-medium text-[13px] text-foreground"
                :title="student.name"
              >
                {{ student.name }}
              </span>
              <span
                v-else
                class="block h-4 w-32 rounded bg-muted animate-pulse"
                aria-hidden="true"
              />
              <div
                v-if="getStudentAverageScore"
                class="ml-2 px-1.5 py-0.5 rounded-md text-[10px] font-bold text-white shadow-sm min-w-[28px] text-center flex-shrink-0"
                :class="getScoreBadgeClass(getStudentAverageScore(student.studentId))"
              >
                {{ getStudentAverageScore(student.studentId) }}
              </div>
            </div>
          </td>
          <td
            v-for="(header, index) in displayedHeaders"
            :key="header.isFinalSummary ? 'final-summary' : header.index"
            class="p-0 border-r border-border align-middle relative h-10 w-14 min-w-[50px]"
            :class="[
              header.isFinalSummary
                ? 'bg-destructive/5 font-bold'
                : 'hover:bg-muted/80',
              {
                'bg-muted/40 font-semibold': header.type === 'session',
                'bg-muted/30 cursor-not-allowed': header.type === 'date' && header.isoDate && (isFutureDate(header.isoDate) || isPastDate(header.isoDate)),
              },
            ]"
          >
            <div
              class="flex w-full h-full"
              :class="{
                'divide-x divide-border': header.dynamicRows > 1,
              }"
            >
              <div
                v-for="mIdx in header.dynamicRows"
                :key="mIdx"
                class="flex-1 flex items-center justify-center min-w-[24px]"
              >
                <div
                  v-if="!isViewOnly"
                  class="absolute top-0 right-0 w-1.5 h-1.5"
                  :class="{
                    'bg-destructive rounded-bl-sm':
                      marksMatrix[studentIndex]?.[header.index]?.[mIdx - 1] === 'Н',
                  }"
                ></div>

                <EditableMarkCell
                  v-if="
                    editingCell?.studentIndex === studentIndex &&
                    editingCell?.colIndex === header.index &&
                    editingCell?.markIndex === (mIdx - 1)
                  "
                  :model-value="editedValue"
                  @update:model-value="$emit('update:editedValue', $event)"
                  @confirm="$emit('confirm-edit')"
                  @cancel="$emit('cancel-edit')"
                  @navigate="(dir: string) => $emit('navigate', dir)"
                  :is-zoomed="true"
                />
                <div
                  v-else
                  class="journal-cell-delegate flex items-center justify-center w-full h-full text-[13px] font-medium cursor-pointer"
                  :class="{
                    'text-destructive font-bold':
                      marksMatrix[studentIndex]?.[header.index]?.[mIdx - 1] === 'Н',
                    'text-muted-foreground cursor-not-allowed opacity-50':
                      header.type === 'date' && header.isoDate && (isFutureDate(header.isoDate) || isPastDate(header.isoDate)),
                  }"
                  :data-sidx="studentIndex"
                  :data-cidx="header.index"
                  :data-midx="mIdx - 1"
                  :data-future="header.type === 'date' && header.isoDate && isFutureDate(header.isoDate) ? 'true' : 'false'"
                  :data-past="header.type === 'date' && header.isoDate && isPastDate(header.isoDate) ? 'true' : 'false'"
                  :data-final="header.isFinalSummary ? 'true' : 'false'"
                  :title="
                    header.type === 'date' && header.isoDate && isFutureDate(header.isoDate)
                      ? journal_future_date_tooltip
                      : header.type === 'date' && header.isoDate && isPastDate(header.isoDate)
                        ? 'Нельзя изменять оценки за прошедшие даты'
                        : undefined
                  "
                >
                  <span v-if="marksMatrix[studentIndex]?.[header.index]?.[mIdx - 1]">
                    {{ marksMatrix[studentIndex]?.[header.index]?.[mIdx - 1] }}
                  </span>
                  <div
                    v-else
                    class="w-full h-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <IconPlus class="w-3 h-3 text-primary" />
                  </div>
                </div>
              </div>
            </div>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup lang="ts">
import IconPaperclip from "~icons/lucide/paperclip";
import IconPlus from "~icons/lucide/plus";
import EditableMarkCell from "@/components/ui/EditableMarkCell.vue";

const props = defineProps<{
  displayedStudents: Array<any>;
  displayedHeaders: Array<any>;
  marksMatrix: Record<number, Record<number, string[]>>;
  editingCell: { studentIndex: number; colIndex: number; markIndex: number } | null;
  editedValue: string;
  isViewOnly: boolean;
  journal_future_date_tooltip: string;
  getKtpForHeader: (index: number) => any;
  isFutureDate: (isoDate: string | undefined) => boolean;
  isPastDate: (isoDate: string | undefined) => boolean;
  getStudentAverageScore?: (studentId: string) => string;
  getScoreBadgeClass?: (score: string) => string;
}>();

const emit = defineEmits<{
  (e: 'header-click', header: any, index: number): void;
  (e: 'paperclip-click', header: any, index: number): void;
  (e: 'cell-click', studentIndex: number, colIndex: number, markIndex: number): void;
  (e: 'student-click', student: any, studentIndex: number): void;
  (e: 'update:editedValue', value: string): void;
  (e: 'confirm-edit'): void;
  (e: 'cancel-edit'): void;
  (e: 'navigate', direction: string): void;
}>();

const getScoreBadgeClass = (score: string): string => {
  if (!props.getScoreBadgeClass) return 'bg-gray-400';
  return props.getScoreBadgeClass(score);
};

const onTbodyClick = (e: MouseEvent) => {
  const target = e.target as HTMLElement;
  const cell = target.closest('.journal-cell-delegate');
  if (cell) {
    const sIdx = Number(cell.getAttribute('data-sidx'));
    const cIdx = Number(cell.getAttribute('data-cidx'));
    const mIdx = Number(cell.getAttribute('data-midx'));
    const isFuture = cell.getAttribute('data-future') === 'true';
    const isPast = cell.getAttribute('data-past') === 'true';
    const isFinal = cell.getAttribute('data-final') === 'true';

    if (isFuture || isPast || isFinal) return;

    emit('cell-click', sIdx, cIdx, mIdx);
  }
};
</script>
