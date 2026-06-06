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
          <JournalGridHeader
            v-for="(header, index) in displayedHeaders"
            :key="header.isFinalSummary ? 'final-summary' : header.index"
            :header="header"
            :index="header.index"
            :has-ktp="header.type === 'date' && getKtpForHeader(header.index) !== null"
            :is-clickable="true"
            @header-click="(h, i) => $emit('header-click', h, i)"
            @paperclip-click="(h, i) => $emit('paperclip-click', h, i)"
          />
        </tr>
      </thead>
      <tbody class="divide-y divide-border">
        <tr
          v-for="(student, studentIndex) in displayedStudents"
          :key="student.id"
          v-memo="[marksMatrix[studentIndex], editingCell?.studentIndex === studentIndex ? editedValue : false, displayedHeaders.length, isViewOnly]"
          class="border-b border-border group hover:bg-muted/60 transition-colors"
          style="content-visibility: auto; contain-intrinsic-size: 64px;"
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
          <JournalGridCell
            v-for="(header, index) in displayedHeaders"
            :key="header.isFinalSummary ? 'final-summary' : header.index"
            :header="header"
            :marks="marksMatrix[studentIndex]?.[header.index] || []"
            :editing-mark-index="
              editingCell?.studentIndex === studentIndex && editingCell?.colIndex === header.index
                ? editingCell?.markIndex
                : null
            "
            :edited-value="editedValue"
            :is-view-only="isViewOnly"
            :is-future="header.type === 'date' && header.isoDate ? isFutureDate(header.isoDate) : false"
            :is-past="header.type === 'date' && header.isoDate ? isPastDate(header.isoDate) : false"
            @cell-click="(mIdx) => $emit('cell-click', studentIndex, header.index, mIdx)"
            @update:editedValue="$emit('update:editedValue', $event)"
            @confirm-edit="$emit('confirm-edit')"
            @cancel-edit="$emit('cancel-edit')"
            @navigate="(dir) => $emit('navigate', dir)"
          />
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup lang="ts">
import JournalGridCell from "@/components/JournalGridCell.vue";
import JournalGridHeader from "@/components/JournalGridHeader.vue";

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

</script>
