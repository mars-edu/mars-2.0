<template>
  <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
    <!-- Line chart: monthly dynamics -->
    <div class="bg-card rounded-xl border border-border shadow-sm p-5">
      <h3 class="text-base font-semibold text-foreground mb-4">
        Динамика успеваемости
      </h3>
      <apexchart
        v-if="monthlyData.length > 0"
        type="line"
        height="280"
        :options="lineOptions"
        :series="lineSeries"
      />
      <div
        v-else
        class="h-[280px] flex items-center justify-center text-muted-foreground text-sm"
      >
        Недостаточно данных
      </div>
    </div>

    <!-- Donut chart: grade distribution -->
    <div class="bg-card rounded-xl border border-border shadow-sm p-5">
      <h3 class="text-base font-semibold text-foreground mb-4">
        Распределение оценок
      </h3>
      <apexchart
        v-if="hasGradeData"
        type="donut"
        height="280"
        :options="donutOptions"
        :series="donutSeries"
      />
      <div
        v-else
        class="h-[280px] flex items-center justify-center text-muted-foreground text-sm"
      >
        Нет данных об оценках
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, defineAsyncComponent } from "vue";

const apexchart = defineAsyncComponent(() => import("vue3-apexcharts"));

const props = defineProps<{
  monthlyData: { month: string; avgScore: number }[];
  overallAverages: (number | null)[];
}>();

// Line chart
const lineSeries = computed(() => [
  {
    name: "Средний балл",
    data: props.monthlyData.map((d) => parseFloat(d.avgScore.toFixed(1))),
  },
]);

const lineOptions = computed(() => ({
  chart: { toolbar: { show: false }, zoom: { enabled: false } },
  stroke: { curve: "smooth", width: 3 },
  xaxis: { categories: props.monthlyData.map((d) => d.month) },
  yaxis: { min: 0, max: 100 },
  colors: ["#3B82F6"],
  grid: { borderColor: "var(--color-border)", xaxis: { lines: { show: false } } },
  tooltip: { theme: "light" },
  dataLabels: { enabled: false },
}));

// Donut chart
const gradeLabels = ["Отлично (≥90)", "Хорошо (75–89)", "Удовл. (50–74)", "Неудовл. (<50)"];
const gradeColors = ["#10B981", "#3B82F6", "#F59E0B", "#EF4444"];

const donutSeries = computed(() => {
  const scores = props.overallAverages.filter((s): s is number => s !== null);
  return [
    scores.filter((s) => s >= 90).length,
    scores.filter((s) => s >= 75 && s < 90).length,
    scores.filter((s) => s >= 50 && s < 75).length,
    scores.filter((s) => s < 50).length,
  ];
});

const hasGradeData = computed(() =>
  donutSeries.value.some((v) => v > 0)
);

const donutOptions = computed(() => ({
  labels: gradeLabels,
  colors: gradeColors,
  chart: { toolbar: { show: false } },
  legend: { position: "bottom" },
  dataLabels: { enabled: true },
  plotOptions: {
    pie: { donut: { size: "65%" } },
  },
  tooltip: { theme: "light" },
}));
</script>
