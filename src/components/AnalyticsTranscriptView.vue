<template>
  <div class="space-y-6">
    <!-- Filters -->
    <div class="bg-card border border-border rounded-xl p-5 flex flex-wrap items-end gap-4">
      <div>
        <label class="text-sm font-medium text-foreground block mb-1">Год поступления (с)</label>
        <input
          v-model="yearFrom"
          type="number"
          placeholder="2020"
          class="border border-border rounded-lg px-3 py-2 bg-background text-foreground text-sm outline-none focus:border-primary w-28"
        />
      </div>
      <div>
        <label class="text-sm font-medium text-foreground block mb-1">Год поступления (по)</label>
        <input
          v-model="yearTo"
          type="number"
          placeholder="2025"
          class="border border-border rounded-lg px-3 py-2 bg-background text-foreground text-sm outline-none focus:border-primary w-28"
        />
      </div>
      <div class="flex-1 min-w-[220px]">
        <label class="text-sm font-medium text-foreground block mb-1">Обучающийся</label>
        <div class="relative" ref="dropdownRef">
          <button
            class="w-full border border-border rounded-xl px-4 py-2 bg-background text-foreground text-sm flex items-center justify-between gap-2"
            @click="dropdownOpen = !dropdownOpen"
          >
            <span class="truncate">
              {{
                selectedIds.length === 0
                  ? "Выберите обучающихся..."
                  : `Выбрано: ${selectedIds.length}`
              }}
            </span>
            <IconChevronDown class="w-4 h-4 text-muted-foreground flex-shrink-0" />
          </button>
          <div
            v-if="dropdownOpen"
            class="absolute z-20 mt-1 w-full bg-card border border-border rounded-xl shadow-lg max-h-72 flex flex-col py-2"
          >
            <div class="px-3 pb-2 border-b border-border">
              <input
                v-model="search"
                type="text"
                placeholder="Поиск..."
                class="w-full px-3 py-1.5 text-sm border border-border rounded-lg outline-none focus:border-primary bg-background"
              />
            </div>
            <div class="overflow-y-auto flex-1 py-1">
              <div
                v-for="s in filteredStudents"
                :key="s.id"
                class="px-4 py-2 text-sm cursor-pointer flex items-center gap-2 transition-colors hover:bg-muted/50"
                :class="{ 'bg-primary/10': selectedIds.includes(s.id) }"
                @click="toggleStudent(s.id)"
              >
                <div
                  class="w-4 h-4 rounded border flex items-center justify-center flex-shrink-0"
                  :class="selectedIds.includes(s.id) ? 'bg-primary border-primary' : 'border-border'"
                >
                  <IconCheck v-if="selectedIds.includes(s.id)" class="w-3 h-3 text-primary-foreground" />
                </div>
                {{ s.fullName }}
              </div>
              <div v-if="filteredStudents.length === 0" class="px-4 py-3 text-sm text-muted-foreground text-center">
                Ничего не найдено
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Transcripts -->
    <div
      v-if="selectedIds.length === 0"
      class="bg-card border border-border rounded-xl p-8 text-center text-muted-foreground"
    >
      Выберите обучающихся для просмотра транскриптов
    </div>

    <div
      v-for="studentId in selectedIds"
      :key="studentId"
      class="bg-card border border-border rounded-xl overflow-hidden"
    >
      <template v-if="getTranscript(studentId)">
        <!-- Student header -->
        <div class="px-6 py-5 border-b border-border bg-muted/20 flex flex-col md:flex-row md:items-center justify-between gap-2">
          <div>
            <h3 class="text-lg font-bold text-foreground">
              {{ getTranscript(studentId)!.fullName }}
            </h3>
            <p class="text-sm text-muted-foreground">
              Год поступления: {{ getTranscript(studentId)!.enrollmentYear }}
            </p>
          </div>
          <div class="text-right">
            <p class="text-sm text-muted-foreground font-medium">Кумулятивный GPA</p>
            <p class="text-2xl font-bold text-foreground">{{ getTranscript(studentId)!.cumulativeGpa.toFixed(2) }}</p>
          </div>
        </div>

        <!-- Transcript table -->
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead class="bg-muted/40 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              <tr>
                <th class="px-4 py-3 text-center w-10">№</th>
                <th class="px-4 py-3 text-left">Дисциплина</th>
                <th class="px-4 py-3 text-center w-20">Кредиты</th>
                <th class="px-4 py-3 text-center w-20">Оценка (%)</th>
                <th class="px-4 py-3 text-center w-16">Буква</th>
                <th class="px-4 py-3 text-center w-32">Традиционная</th>
                <th class="px-4 py-3 text-center w-16">GPA</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-border">
              <tr
                v-for="(row, idx) in getTranscript(studentId)!.rows"
                :key="row.disciplineId"
                class="hover:bg-muted/20 transition-colors"
              >
                <td class="px-4 py-3 text-center text-muted-foreground">{{ idx + 1 }}</td>
                <td class="px-4 py-3 font-medium text-foreground">{{ row.title }}</td>
                <td class="px-4 py-3 text-center">{{ row.credits }}</td>
                <td class="px-4 py-3 text-center">
                  <span
                    class="inline-flex items-center justify-center w-10 h-8 rounded-lg text-xs font-bold"
                    :class="gradeColor(row.score)"
                  >
                    {{ row.score !== null ? row.score.toFixed(0) : '—' }}
                  </span>
                </td>
                <td class="px-4 py-3 text-center font-bold">{{ row.letter }}</td>
                <td class="px-4 py-3 text-center text-xs">{{ row.traditional }}</td>
                <td class="px-4 py-3 text-center font-semibold">{{ row.gpa }}</td>
              </tr>
            </tbody>
            <tfoot class="border-t-2 border-border bg-muted/30">
              <tr>
                <td colspan="2" class="px-4 py-3 font-semibold text-foreground">Итого</td>
                <td class="px-4 py-3 text-center font-semibold">
                  {{ getTranscript(studentId)!.rows.reduce((sum, r) => sum + r.credits, 0) }}
                </td>
                <td colspan="3"></td>
                <td class="px-4 py-3 text-center font-bold text-foreground">
                  {{ getTranscript(studentId)!.cumulativeGpa.toFixed(2) }}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from "vue";
import IconChevronDown from "~icons/lucide/chevron-down";
import IconCheck from "~icons/lucide/check";
import type { Mark } from "@/types/marks";

interface StudentInfo {
  id: string;
  fullName: string;
  enrollmentYear: string;
}

interface JournalInfo {
  id: string;
  title: string;
}

const props = defineProps<{
  students: StudentInfo[];
  journals: JournalInfo[];
  getStudentMarks: (journalId: string, studentId: string) => Mark[] | null;
}>();

const yearFrom = ref("");
const yearTo = ref("");
const search = ref("");
const selectedIds = ref<string[]>([]);
const dropdownOpen = ref(false);
const dropdownRef = ref<HTMLElement | null>(null);

const filteredStudents = computed(() =>
  props.students.filter((s) => {
    const matchSearch = s.fullName.toLowerCase().includes(search.value.toLowerCase());
    const matchFrom = yearFrom.value ? parseInt(s.enrollmentYear) >= parseInt(yearFrom.value) : true;
    const matchTo = yearTo.value ? parseInt(s.enrollmentYear) <= parseInt(yearTo.value) : true;
    return matchSearch && matchFrom && matchTo;
  })
);

const toggleStudent = (id: string) => {
  selectedIds.value = selectedIds.value.includes(id)
    ? selectedIds.value.filter((s) => s !== id)
    : [...selectedIds.value, id];
};

const getGradeDetails = (score: number) => {
  if (score >= 95) return { letter: "A", gpa: "4.0", traditional: "Отлично" };
  if (score >= 90) return { letter: "A-", gpa: "3.67", traditional: "Отлично" };
  if (score >= 85) return { letter: "B+", gpa: "3.33", traditional: "Хорошо" };
  if (score >= 80) return { letter: "B", gpa: "3.0", traditional: "Хорошо" };
  if (score >= 75) return { letter: "B-", gpa: "2.67", traditional: "Хорошо" };
  if (score >= 70) return { letter: "C+", gpa: "2.33", traditional: "Удовлетворительно" };
  if (score >= 65) return { letter: "C", gpa: "2.0", traditional: "Удовлетворительно" };
  if (score >= 60) return { letter: "C-", gpa: "1.67", traditional: "Удовлетворительно" };
  if (score >= 55) return { letter: "D+", gpa: "1.33", traditional: "Удовлетворительно" };
  if (score >= 50) return { letter: "D", gpa: "1.0", traditional: "Удовлетворительно" };
  return { letter: "F", gpa: "0.0", traditional: "Неудовлетворительно" };
};

const gradeColor = (score: number | null) => {
  if (score === null) return "bg-muted text-muted-foreground";
  if (score >= 90) return "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400";
  if (score >= 75) return "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400";
  if (score >= 50) return "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400";
  return "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400";
};

const CREDITS_DEFAULT = 3;

const getTranscript = (studentId: string) => {
  const student = props.students.find((s) => s.id === studentId);
  if (!student) return null;

  const rows = props.journals
    .map((journal) => {
      const marks = props.getStudentMarks(journal.id, studentId);
      if (!marks) return null;

      const numericValues: number[] = [];
      marks.forEach((m: Mark) => {
        if (!Array.isArray(m.values)) return;
        m.values.forEach((v) => {
          const n = typeof v === "number" ? v : parseFloat(String(v).replace(",", "."));
          if (Number.isFinite(n)) numericValues.push(n);
        });
      });

      if (numericValues.length === 0) return null;
      const score = numericValues.reduce((a, b) => a + b, 0) / numericValues.length;
      const details = getGradeDetails(score);
      return {
        disciplineId: journal.id,
        title: journal.title,
        credits: CREDITS_DEFAULT,
        score,
        ...details,
      };
    })
    .filter((r): r is NonNullable<typeof r> => r !== null);

  const totalCredits = rows.reduce((sum, r) => sum + r.credits, 0);
  const cumulativeGpa =
    totalCredits > 0
      ? rows.reduce((sum, r) => sum + parseFloat(r.gpa) * r.credits, 0) / totalCredits
      : 0;

  return {
    fullName: student.fullName,
    enrollmentYear: student.enrollmentYear,
    rows,
    cumulativeGpa,
  };
};

const handleClickOutside = (e: MouseEvent) => {
  if (dropdownRef.value && !dropdownRef.value.contains(e.target as Node)) {
    dropdownOpen.value = false;
  }
};
onMounted(() => document.addEventListener("mousedown", handleClickOutside));
onUnmounted(() => document.removeEventListener("mousedown", handleClickOutside));
</script>
