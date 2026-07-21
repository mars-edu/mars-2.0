<template>
  <f7-page name="datepicker-demo" class="flex flex-col h-screen bg-background text-foreground">
    <Header class="hidden md:block flex-shrink-0 border-b border-border" />
    <Sidebar v-model:activeNavItem="activeNavItem" />

    <div
      class="flex flex-1 overflow-hidden p-2 md:p-4 transition-all duration-200"
      :class="contentMargin"
    >
      <div class="flex-1 flex flex-col min-h-0 rounded-2xl border border-border/10 overflow-hidden bg-card shadow-[0_8px_30px_rgba(0,0,0,0.04)]">

        <!-- Header -->
        <div class="flex flex-col md:flex-row items-start md:items-center justify-between px-8 py-6 pb-4 shrink-0 gap-3 border-b border-border/30">
          <div>
            <h1 class="text-xl font-bold text-foreground">🗓️ DatePicker — Demo</h1>
            <p class="text-sm text-muted-foreground mt-0.5">Сравнение @vuepic/vue-datepicker и Framework7 Calendar. Значения сохраняются в localStorage.</p>
          </div>
          <button
            @click="clearAll"
            class="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-red-500 hover:bg-red-500/10 border border-red-500/20 transition-all"
          >
            <IconTrash class="w-4 h-4" />
            Очистить всё
          </button>
        </div>

        <!-- Scrollable content -->
        <div class="flex-1 overflow-y-auto p-6 pb-16 md:pb-6 space-y-8">

          <!-- ─────────────────────────────────────────── -->
          <!-- SECTION: @vuepic/vue-datepicker             -->
          <!-- ─────────────────────────────────────────── -->
          <section>
            <div class="flex items-center gap-3 mb-4">
              <div class="w-8 h-8 rounded-lg bg-violet-500/15 flex items-center justify-center">
                <IconCalendar class="w-4 h-4 text-violet-500" />
              </div>
              <div>
                <h2 class="text-base font-semibold text-foreground">@vuepic/vue-datepicker</h2>
                <p class="text-xs text-muted-foreground">Полнофункциональный Vue 3 компонент с rich UI</p>
              </div>
              <span class="ml-auto text-xs font-mono bg-violet-500/10 text-violet-600 dark:text-violet-400 px-2 py-1 rounded-lg">npm pkg</span>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">

              <!-- Single date -->
              <div class="demo-card">
                <div class="demo-card-label">Single Date</div>
                <VueDatePicker
                  v-model="vuepic.single"
                  :enable-time-picker="false"
                  :locale="ruLocale"
                  format="dd.MM.yyyy"
                  placeholder="Выберите дату"
                  auto-apply
                  :dark="isDark"
                  @update:model-value="save"
                />
                <div class="demo-card-result">
                  <span class="demo-result-label">Результат:</span>
                  <span class="demo-result-value">{{ vuepic.single ? formatDisplay(vuepic.single) : '—' }}</span>
                </div>
              </div>

              <!-- Date + Time -->
              <div class="demo-card">
                <div class="demo-card-label">Date + Time</div>
                <VueDatePicker
                  v-model="vuepic.datetime"
                  :locale="ruLocale"
                  :format="formatVuepicDatetime"
                  placeholder="Выберите дату и время"
                  :dark="isDark"
                  @update:model-value="save"
                />
                <div class="demo-card-result">
                  <span class="demo-result-label">Результат:</span>
                  <span class="demo-result-value">{{ vuepic.datetime ? formatDisplayDatetime(vuepic.datetime) : '—' }}</span>
                </div>
              </div>

              <!-- Date Range -->
              <div class="demo-card">
                <div class="demo-card-label">Date Range</div>
                <VueDatePicker
                  v-model="vuepic.range"
                  range
                  :enable-time-picker="false"
                  :locale="ruLocale"
                  format="dd.MM.yyyy"
                  placeholder="Выберите диапазон"
                  auto-apply
                  :dark="isDark"
                  @update:model-value="save"
                />
                <div class="demo-card-result">
                  <span class="demo-result-label">Результат:</span>
                  <span class="demo-result-value">
                    {{ vuepic.range && vuepic.range[0] ? formatDisplay(vuepic.range[0]) : '—' }}
                    {{ vuepic.range && vuepic.range[1] ? ' → ' + formatDisplay(vuepic.range[1]) : '' }}
                  </span>
                </div>
              </div>

              <!-- Multi dates -->
              <div class="demo-card">
                <div class="demo-card-label">Multi Select</div>
                <VueDatePicker
                  v-model="vuepic.multi"
                  multi-dates
                  :enable-time-picker="false"
                  :locale="ruLocale"
                  format="dd.MM.yyyy"
                  placeholder="Выберите несколько дат"
                  auto-apply
                  :dark="isDark"
                  @update:model-value="save"
                />
                <div class="demo-card-result">
                  <span class="demo-result-label">Выбрано:</span>
                  <span class="demo-result-value">{{ vuepic.multi?.length ? vuepic.multi.length + ' дат' : '—' }}</span>
                </div>
              </div>

              <!-- Inline -->
              <div class="demo-card md:col-span-2">
                <div class="demo-card-label">Inline (встроенный)</div>
                <VueDatePicker
                  v-model="vuepic.inline"
                  inline
                  auto-apply
                  :enable-time-picker="false"
                  :locale="ruLocale"
                  :dark="isDark"
                  @update:model-value="save"
                />
                <div class="demo-card-result">
                  <span class="demo-result-label">Результат:</span>
                  <span class="demo-result-value">{{ vuepic.inline ? formatDisplay(vuepic.inline) : '—' }}</span>
                </div>
              </div>

            </div>
          </section>

          <!-- Divider -->
          <div class="flex items-center gap-4">
            <div class="flex-1 h-px bg-border" />
            <span class="text-xs font-semibold text-muted-foreground uppercase tracking-widest">vs</span>
            <div class="flex-1 h-px bg-border" />
          </div>

          <!-- ─────────────────────────────────────────── -->
          <!-- SECTION: Framework7 native                  -->
          <!-- ─────────────────────────────────────────── -->
          <section>
            <div class="flex items-center gap-3 mb-4">
              <div class="w-8 h-8 rounded-lg bg-orange-500/15 flex items-center justify-center">
                <IconCalendarDays class="w-4 h-4 text-orange-500" />
              </div>
              <div>
                <h2 class="text-base font-semibold text-foreground">Framework7 Native Calendar</h2>
                <p class="text-xs text-muted-foreground">Встроенный f7-input — нативный мобильный стиль, уже в стеке</p>
              </div>
              <span class="ml-auto text-xs font-mono bg-orange-500/10 text-orange-600 dark:text-orange-400 px-2 py-1 rounded-lg">built-in</span>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">

              <!-- Single date -->
              <div class="demo-card">
                <div class="demo-card-label">Single Date</div>
                <div class="f7-input-wrapper">
                  <f7-input
                    type="datepicker"
                    placeholder="Выберите дату"
                    readonly
                    :value="f7.single"
                    :calendar-params="{
                      ...calendarParams,
                      closeOnSelect: true,
                      on: { change: (c: any, v: any) => onF7Change('single', v) }
                    }"
                  />
                </div>
                <div class="demo-card-result">
                  <span class="demo-result-label">Результат:</span>
                  <span class="demo-result-value">{{ f7.single?.length ? formatDisplay(f7.single[0]) : '—' }}</span>
                </div>
              </div>

              <!-- Date Range -->
              <div class="demo-card">
                <div class="demo-card-label">Date Range</div>
                <div class="f7-input-wrapper">
                  <f7-input
                    type="datepicker"
                    placeholder="Выберите диапазон"
                    readonly
                    :value="f7.range"
                    :calendar-params="{
                      ...calendarParams,
                      rangePicker: true,
                      on: { change: (c: any, v: any) => onF7Change('range', v) }
                    }"
                  />
                </div>
                <div class="demo-card-result">
                  <span class="demo-result-label">Результат:</span>
                  <span class="demo-result-value">
                    {{ f7.range?.length ? formatDisplay(f7.range[0]) : '—' }}
                    {{ f7.range?.length > 1 && f7.range[1] ? ' → ' + formatDisplay(f7.range[1]) : '' }}
                  </span>
                </div>
              </div>

              <!-- Multi dates -->
              <div class="demo-card">
                <div class="demo-card-label">Multi Select</div>
                <div class="f7-input-wrapper">
                  <f7-input
                    type="datepicker"
                    placeholder="Выберите несколько дат"
                    readonly
                    :value="f7.multi"
                    :calendar-params="{
                      ...calendarParams,
                      multiple: true,
                      closeOnSelect: false,
                      on: { change: (c: any, v: any) => onF7Change('multi', v) }
                    }"
                  />
                </div>
                <div class="demo-card-result">
                  <span class="demo-result-label">Выбрано:</span>
                  <span class="demo-result-value">{{ f7.multi?.length ? f7.multi.length + ' дат' : '—' }}</span>
                </div>
              </div>

            </div>
          </section>

          <!-- ─────────────────────────────────────────── -->
          <!-- SECTION: Comparison Table                   -->
          <!-- ─────────────────────────────────────────── -->
          <section>
            <div class="flex items-center gap-3 mb-4">
              <div class="w-8 h-8 rounded-lg bg-blue-500/15 flex items-center justify-center">
                <IconTable class="w-4 h-4 text-blue-500" />
              </div>
              <h2 class="text-base font-semibold text-foreground">Сравнение</h2>
            </div>

            <div class="rounded-xl border border-border overflow-hidden">
              <table class="w-full text-sm text-left">
                <thead class="bg-muted/50 border-b border-border">
                  <tr>
                    <th class="px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider w-1/3">Критерий</th>
                    <th class="px-5 py-3 text-xs font-semibold text-violet-500 uppercase tracking-wider w-1/3">@vuepic/vue-datepicker</th>
                    <th class="px-5 py-3 text-xs font-semibold text-orange-500 uppercase tracking-wider w-1/3">Framework7 Calendar</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-border">
                  <tr v-for="row in comparisonTable" :key="row.label" class="hover:bg-muted/30 transition-colors">
                    <td class="px-5 py-3 font-medium text-foreground">{{ row.label }}</td>
                    <td class="px-5 py-3 text-muted-foreground" v-html="row.vuepic" />
                    <td class="px-5 py-3 text-muted-foreground" v-html="row.f7" />
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

        </div>
      </div>
    </div>
  </f7-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import dayjs from 'dayjs';
import { VueDatePicker } from '@vuepic/vue-datepicker';
import '@vuepic/vue-datepicker/dist/main.css';
import '@/css/vue-datepicker.css';
import { ru as ruLocale } from 'date-fns/locale';
import { DATE_UI_FORMAT } from '@/constants/calendar';

import Header from '@/components/Header/Header.vue';
import Sidebar from '@/components/Sidebar/Sidebar.vue';
import { useSidebar } from '@/composables/useSidebar';

import IconCalendar from '~icons/lucide/calendar';
import IconCalendarDays from '~icons/lucide/calendar-days';
import IconTable from '~icons/lucide/table-2';
import IconTrash from '~icons/lucide/trash-2';

// ── Layout ──────────────────────────────────────────────────────────────────
const { contentMargin } = useSidebar();
const activeNavItem = ref('');

// ── Dark mode detection ──────────────────────────────────────────────────────
const isDark = ref(document.documentElement.classList.contains('dark'));

onMounted(() => {
  const observer = new MutationObserver(() => {
    isDark.value = document.documentElement.classList.contains('dark');
  });
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
  onUnmounted(() => observer.disconnect());
});

// ── LocalStorage key ─────────────────────────────────────────────────────────
const LS_KEY = 'datepicker-demo-state';

// ── @vuepic state ─────────────────────────────────────────────────────────────
const vuepic = ref({
  single: null as Date | null,
  datetime: null as Date | null,
  range: null as [Date, Date] | null,
  multi: null as Date[] | null,
  inline: null as Date | null,
});

// ── Framework7 state ──────────────────────────────────────────────────────────
const f7 = ref({
  single: [] as Date[],
  range: [] as Date[],
  multi: [] as Date[],
});

// ── F7 calendar params ────────────────────────────────────────────────────────
const calendarParams = computed(() => ({
  dateFormat: 'dd.mm.yyyy',
  firstDay: 1, // Monday
  monthNames: ['Январь','Февраль','Март','Апрель','Май','Июнь','Июль','Август','Сентябрь','Октябрь','Ноябрь','Декабрь'],
  dayNames: ['Воскресенье','Понедельник','Вторник','Среда','Четверг','Пятница','Суббота'],
  dayNamesShort: ['Вс','Пн','Вт','Ср','Чт','Пт','Сб'],
}));

// ── Formatters ────────────────────────────────────────────────────────────────
function formatDisplay(d: Date | string | null): string {
  if (!d) return '—';
  return dayjs(d).format(DATE_UI_FORMAT);
}

function formatDisplayDatetime(d: Date | null): string {
  if (!d) return '—';
  return dayjs(d).format('DD.MM.YYYY HH:mm');
}

function formatVuepic(d: Date): string {
  return dayjs(d).format(DATE_UI_FORMAT);
}

function formatVuepicDatetime(d: Date): string {
  return dayjs(d).format('DD.MM.YYYY HH:mm');
}

// ── F7 change handler ─────────────────────────────────────────────────────────
function onF7Change(key: keyof typeof f7.value, value: Date[]) {
  f7.value[key] = value;
  save();
}

// ── LocalStorage ──────────────────────────────────────────────────────────────
function save() {
  try {
    const state = {
      vuepic: {
        single: vuepic.value.single?.toISOString() ?? null,
        datetime: vuepic.value.datetime?.toISOString() ?? null,
        range: vuepic.value.range ? [vuepic.value.range[0]?.toISOString(), vuepic.value.range[1]?.toISOString()] : null,
        multi: vuepic.value.multi?.map(d => d.toISOString()) ?? null,
        inline: vuepic.value.inline?.toISOString() ?? null,
      },
      f7: {
        single: f7.value.single.map(d => d.toISOString()),
        range: f7.value.range.map(d => d.toISOString()),
        multi: f7.value.multi.map(d => d.toISOString()),
      },
    };
    localStorage.setItem(LS_KEY, JSON.stringify(state));
  } catch (e) {
    console.warn('[DatepickerDemo] Failed to save to localStorage', e);
  }
}

function load() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return;
    const state = JSON.parse(raw);

    if (state.vuepic) {
      // Strip time for date-only fields to avoid display issues
      const toDateOnly = (iso: string) => {
        const d = new Date(iso);
        d.setHours(0, 0, 0, 0);
        return d;
      };
      vuepic.value.single = state.vuepic.single ? toDateOnly(state.vuepic.single) : null;
      vuepic.value.datetime = state.vuepic.datetime ? new Date(state.vuepic.datetime) : null;
      vuepic.value.range = state.vuepic.range
        ? [toDateOnly(state.vuepic.range[0]), toDateOnly(state.vuepic.range[1])]
        : null;
      vuepic.value.multi = state.vuepic.multi?.map((s: string) => toDateOnly(s)) ?? null;
      vuepic.value.inline = state.vuepic.inline ? toDateOnly(state.vuepic.inline) : null;
    }
    if (state.f7) {
      f7.value.single = state.f7.single?.map((s: string) => new Date(s)) ?? [];
      f7.value.range = state.f7.range?.map((s: string) => new Date(s)) ?? [];
      f7.value.multi = state.f7.multi?.map((s: string) => new Date(s)) ?? [];
    }
  } catch (e) {
    console.warn('[DatepickerDemo] Failed to load from localStorage', e);
  }
}

function clearAll() {
  localStorage.removeItem(LS_KEY);
  vuepic.value = { single: null, datetime: null, range: null, multi: null, inline: null };
  f7.value = { single: [], range: [], multi: [] };
}

onMounted(load);

// ── Watch vuepic for auto-save ────────────────────────────────────────────────
watch(vuepic, save, { deep: true });

// ── Comparison table data ─────────────────────────────────────────────────────
const comparisonTable = [
  { label: 'Зависимость', vuepic: '<code>@vuepic/vue-datepicker</code>', f7: 'Встроено в Framework7' },
  { label: 'Размер бандла', vuepic: '~50 KB (gzip)', f7: '0 KB доп.' },
  { label: 'Тёмная тема', vuepic: '✅ Нативная', f7: '✅ Следует теме F7' },
  { label: 'Range picker', vuepic: '✅ Встроен', f7: '✅ <code>rangePicker: true</code>' },
  { label: 'Multi select', vuepic: '✅ <code>multi-dates</code>', f7: '✅ <code>multiple: true</code>' },
  { label: 'Date + Time', vuepic: '✅ Встроен', f7: '⚠️ Отдельный timepicker' },
  { label: 'Inline mode', vuepic: '✅ <code>inline</code>', f7: '⚠️ Через <code>openIn: "customModal"</code>' },
  { label: 'Локализация', vuepic: '✅ <code>locale="ru"</code>', f7: '✅ Через calendar params' },
  { label: 'v-model', vuepic: '✅ Стандартный', f7: '⚠️ Через <code>:value</code> + events' },
  { label: 'Mobile UX', vuepic: '⚠️ Веб-стиль', f7: '✅ Нативный мобильный sheet' },
  { label: 'Доступность (a11y)', vuepic: '✅ Хорошая', f7: '⚠️ Базовая' },
];
</script>

<style scoped>
/* ─── Demo card layout ────────────────────────────────────────────────────── */
.demo-card {
  @apply flex flex-col gap-3 p-5 rounded-xl border border-border bg-background/60 shadow-sm transition-all duration-200;
}
.demo-card:hover {
  @apply shadow-md border-border/80;
}
.demo-card-label {
  @apply text-xs font-semibold text-muted-foreground uppercase tracking-wider;
}
.demo-card-result {
  @apply flex items-center gap-2 pt-2 border-t border-border/50;
}
.demo-result-label {
  @apply text-xs text-muted-foreground shrink-0;
}
.demo-result-value {
  @apply text-xs font-medium text-foreground font-mono truncate;
}
.f7-input-wrapper {
  @apply rounded-xl border border-border bg-muted/40 px-3 py-1 min-h-[44px] flex items-center;
}

</style>
