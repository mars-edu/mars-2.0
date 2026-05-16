<template>
  <div class="space-y-4">
    <!-- Controls bar -->
    <div class="bg-card border border-border rounded-xl p-4 flex flex-wrap items-center gap-4">
      <div class="flex items-center gap-2">
        <span class="text-sm font-medium text-foreground">Период:</span>
        <select
          v-model="period"
          class="border border-border rounded-lg px-3 py-2 bg-background text-foreground text-sm outline-none focus:border-primary transition-colors"
        >
          <option v-for="m in months" :key="m" :value="m">{{ m }}</option>
        </select>
      </div>
      <div class="flex items-center gap-2">
        <span class="text-sm font-medium text-foreground">Учебный год:</span>
        <select
          v-model="year"
          class="border border-border rounded-lg px-3 py-2 bg-background text-foreground text-sm outline-none focus:border-primary transition-colors"
        >
          <option v-for="y in years" :key="y" :value="y">{{ y }}</option>
        </select>
      </div>
      <div class="flex items-center gap-2">
        <span class="text-sm font-medium text-foreground">Семестр:</span>
        <select
          v-model="semesterNum"
          class="border border-border rounded-lg px-3 py-2 bg-background text-foreground text-sm outline-none focus:border-primary transition-colors"
        >
          <option value="1">1 семестр</option>
          <option value="2">2 семестр</option>
        </select>
      </div>
      <button
        class="ml-auto px-5 py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors text-sm font-medium"
        @click="generate"
      >
        Сформировать
      </button>
    </div>

    <!-- Student multi-select -->
    <div class="flex items-center gap-3">
      <span class="text-sm font-medium text-foreground">Обучающийся:</span>
      <div class="relative" ref="dropdownRef">
        <button
          class="border border-border rounded-xl px-4 py-2 bg-background text-foreground text-sm flex items-center gap-2 min-w-[220px] justify-between"
          @click="dropdownOpen = !dropdownOpen"
        >
          <span class="truncate">
            {{
              selectedIds.length === 0
                ? "Все обучающиеся"
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
              class="px-4 py-2 text-sm cursor-pointer transition-colors hover:bg-muted/50"
              :class="{ 'bg-primary/10 text-primary font-medium': selectedIds.length === 0 }"
              @click="selectedIds = []; dropdownOpen = false"
            >
              Все обучающиеся
            </div>
            <div
              v-for="s in filteredStudents"
              :key="s.id"
              class="px-4 py-2 text-sm cursor-pointer flex items-center gap-2 transition-colors hover:bg-muted/50"
              :class="{ 'bg-primary/10': selectedIds.includes(s.id) }"
              @click="toggleStudent(s.id)"
            >
              <div
                class="w-4 h-4 rounded border flex items-center justify-center flex-shrink-0"
                :class="
                  selectedIds.includes(s.id)
                    ? 'bg-primary border-primary'
                    : 'border-border'
                "
              >
                <IconCheck
                  v-if="selectedIds.includes(s.id)"
                  class="w-3 h-3 text-primary-foreground"
                />
              </div>
              {{ s.fullName }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Generated attendance tables -->
    <template v-if="isGenerated">
      <div
        v-if="displayStudents.length === 0"
        class="bg-card border border-border rounded-xl p-8 text-center text-muted-foreground"
      >
        Выберите обучающегося для просмотра посещаемости
      </div>
      <div
        v-for="student in displayStudents"
        :key="student.id"
        class="bg-card border border-border rounded-xl overflow-hidden"
      >
        <div class="px-6 py-4 border-b border-border bg-muted/30">
          <h4 class="font-semibold text-foreground">{{ student.fullName }}</h4>
        </div>
        <div class="space-y-6 p-6">
          <div
            v-for="(journal, jIdx) in journals"
            :key="journal.id"
          >
            <p class="text-sm font-semibold text-foreground mb-3">
              {{ jIdx + 1 }}. {{ journal.title }}
            </p>
            <div class="overflow-x-auto">
              <table class="border-collapse">
                <tbody>
                  <tr>
                    <td
                      v-for="cell in getAttendanceCells(journal.id, student.id)"
                      :key="cell.date"
                      class="border border-border text-center h-10 min-w-[52px] px-2"
                    >
                      <span
                        v-if="cell.present === true"
                        class="text-emerald-500 font-bold text-lg"
                      >+</span>
                      <span
                        v-else-if="cell.present === false"
                        class="text-red-500 font-bold text-lg"
                      >-</span>
                    </td>
                  </tr>
                  <tr class="bg-muted/30">
                    <th
                      v-for="cell in getAttendanceCells(journal.id, student.id)"
                      :key="cell.date"
                      class="border border-border text-[10px] font-bold text-muted-foreground text-center px-2 py-1 uppercase tracking-wide"
                    >
                      {{ cell.label }}
                    </th>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from "vue";
import IconChevronDown from "~icons/lucide/chevron-down";
import IconCheck from "~icons/lucide/check";
import type { Mark } from "@/types/marks";

const props = defineProps<{
  students: { id: string; fullName: string }[];
  journals: { id: string; title: string }[];
  getStudentMarks: (journalId: string, studentId: string) => Mark[] | null;
}>();

const months = [
  "Январь","Февраль","Март","Апрель","Май","Июнь",
  "Июль","Август","Сентябрь","Октябрь","Ноябрь","Декабрь",
];
const currentDate = new Date();
const years = ["2023-2024", "2024-2025", "2025-2026", "2026-2027"];

const period = ref(months[currentDate.getMonth()]);
const year = ref("2025-2026");
const semesterNum = ref("1");
const isGenerated = ref(false);
const selectedIds = ref<string[]>([]);
const search = ref("");
const dropdownOpen = ref(false);
const dropdownRef = ref<HTMLElement | null>(null);

const generate = () => { isGenerated.value = true; };

const filteredStudents = computed(() =>
  props.students.filter((s) =>
    s.fullName.toLowerCase().includes(search.value.toLowerCase())
  )
);

const displayStudents = computed(() => {
  if (selectedIds.value.length === 0) return props.students;
  return props.students.filter((s) => selectedIds.value.includes(s.id));
});

const toggleStudent = (id: string) => {
  if (selectedIds.value.includes(id)) {
    selectedIds.value = selectedIds.value.filter((s) => s !== id);
  } else {
    selectedIds.value = [...selectedIds.value, id];
  }
};

const monthIndex = computed(() => months.indexOf(period.value));

const isAbsent = (value: string | number | null): boolean => {
  if (value === null || value === undefined || value === "") return true;
  const s = String(value).trim().toLowerCase();
  return s === "н" || s === "б" || s === "0" || s === "0.0";
};

const getAttendanceCells = (
  journalId: string,
  studentId: string
): { date: string; label: string; present: boolean | null }[] => {
  const marks = props.getStudentMarks(journalId, studentId);
  if (!marks) return [];

  const dateMarks = marks.filter(
    (m: Mark) =>
      m.type === "date" &&
      m.isoDate &&
      new Date(m.isoDate).getMonth() === monthIndex.value
  );

  return dateMarks.map((m: Mark) => {
    const d = new Date(m.isoDate!);
    const label = `${String(d.getDate()).padStart(2, "0")}.${String(d.getMonth() + 1).padStart(2, "0")}`;
    const firstValue = Array.isArray(m.values) ? m.values[0] : null;
    const present = firstValue !== null && firstValue !== undefined && firstValue !== ""
      ? !isAbsent(firstValue)
      : null;
    return { date: m.isoDate!, label, present };
  });
};

const handleClickOutside = (e: MouseEvent) => {
  if (dropdownRef.value && !dropdownRef.value.contains(e.target as Node)) {
    dropdownOpen.value = false;
  }
};
onMounted(() => document.addEventListener("mousedown", handleClickOutside));
onUnmounted(() => document.removeEventListener("mousedown", handleClickOutside));
</script>
