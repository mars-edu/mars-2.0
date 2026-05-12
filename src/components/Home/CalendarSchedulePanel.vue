<template>
  <div class="bg-card rounded-[32px] shadow-sm border border-border h-full flex flex-col p-6">
    <!-- Header -->
    <div class="flex justify-between items-center mb-6 px-2">
      <h2 class="text-lg font-bold text-foreground">{{ m.home_calendar_title() }}</h2>
    </div>

    <!-- Calendar -->
    <div class="mb-6 border-b border-border pb-6">
      <!-- Month nav -->
      <div class="flex justify-between items-center mb-4 px-2">
        <span class="text-sm font-bold text-foreground capitalize">
          {{ currentMonthYear }}
        </span>
        <div class="flex gap-1">
          <button
            class="p-1 hover:bg-muted rounded-md text-muted-foreground hover:text-foreground transition-colors"
            @click="previousMonth"
          >
            <IconChevronLeft class="text-sm" />
          </button>
          <button
            class="p-1 hover:bg-muted rounded-md text-muted-foreground hover:text-foreground transition-colors"
            @click="nextMonth"
          >
            <IconChevronRight class="text-sm" />
          </button>
        </div>
      </div>

      <!-- Grid -->
      <div class="grid grid-cols-7 gap-y-3 gap-x-1 text-center text-sm">
        <div
          v-for="d in weekDays"
          :key="d"
          class="text-muted-foreground text-xs font-medium uppercase"
        >
          {{ d }}
        </div>
        <div
          v-for="date in calendarDays"
          :key="`${date.date.getFullYear()}-${date.date.getMonth()}-${date.day}`"
          class="h-8 flex items-center justify-center relative"
        >
          <button
            class="w-8 h-8 flex items-center justify-center text-xs rounded-full transition-all duration-200"
            :class="[
              isSelectedDate(date)
                ? 'bg-primary text-primary-foreground shadow-md font-bold'
                : date.isToday
                ? 'text-primary font-bold'
                : date.isCurrentMonth
                ? 'text-foreground hover:bg-muted'
                : 'text-muted-foreground/40',
            ]"
            :disabled="!date.isCurrentMonth"
            @click="selectDate(date)"
          >
            {{ date.day }}
          </button>
          <div
            v-if="date.hasSchedule && !date.isToday && !isSelectedDate(date)"
            class="absolute bottom-1 w-1 h-1 bg-muted-foreground/30 rounded-full"
          ></div>
        </div>
      </div>
    </div>

    <!-- Schedule -->
    <div class="flex-1 overflow-y-auto no-scrollbar">
      <div class="flex justify-between items-end mb-4 px-2">
        <h3 class="text-base font-bold text-foreground">{{ m.home_schedule() }}</h3>
        <span class="text-xs text-muted-foreground font-medium uppercase">{{ scheduleLabel }}</span>
      </div>

      <div v-if="schedule.length > 0" class="space-y-3">
        <div
          v-for="(lesson, index) in schedule"
          :key="index"
          @click="selectedLesson = lesson"
          class="group p-4 rounded-2xl bg-muted hover:bg-card border border-transparent hover:border-border hover:shadow-sm cursor-pointer transition-all duration-200 flex items-stretch gap-4"
        >
          <div class="flex flex-col justify-center min-w-[48px]">
            <span class="text-sm font-bold text-foreground leading-none">{{ lesson.startTime }}</span>
            <span class="text-xs text-muted-foreground font-medium mt-1">{{ lesson.endTime }}</span>
          </div>
          
          <div
            class="w-1 rounded-full opacity-40 group-hover:opacity-100 transition-opacity flex-shrink-0"
            :class="lesson.color || 'bg-primary'"
          ></div>

          <div class="flex-1 py-0.5">
            <div class="text-sm font-bold text-foreground mb-0.5 leading-tight group-hover:text-primary transition-colors">
              {{ lesson.subject }}
            </div>
            <div class="flex items-center justify-between mt-2">
              <div class="flex items-center gap-1.5 text-[11px] text-muted-foreground bg-card group-hover:bg-muted px-2 py-1 rounded-md transition-colors font-medium">
                <IconUsers class="w-3 h-3" />
                {{ lesson.group }}
              </div>
              <div class="text-[11px] text-muted-foreground font-medium">
                {{ m.home_schedule_room_prefix() }} {{ lesson.room }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div v-else>
        <div 
          @click="f7.views.main.router.navigate('/journals')"
          class="p-4 rounded-[20px] border border-dashed border-border flex items-center justify-center text-muted-foreground text-xs font-medium cursor-pointer hover:bg-card hover:border-primary/50 hover:text-primary transition-all"
        >
          <IconPlus class="w-3.5 h-3.5 mr-2" /> {{ m.home_schedule_add_lesson() }}
        </div>
      </div>
    </div>

    <ScheduleItemModal
      :lesson="selectedLesson"
      @close="selectedLesson = null"
      @openJournal="handleOpenJournal"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { f7 } from "framework7-vue";
import { useScheduleStore, type Lesson } from "@/stores/scheduleStore";
import ScheduleItemModal from "@/components/Home/ScheduleItemModal.vue";
import IconChevronLeft from "~icons/lucide/chevron-left";
import IconChevronRight from "~icons/lucide/chevron-right";
import IconUsers from "~icons/lucide/users";
import IconPlus from "~icons/lucide/plus";
import * as m from "@/paraglide/messages";
import { useI18n } from "@/composables/useI18n";
import { generateCalendarDays, isSameDate, type CalendarDate } from "@/utils/calendarUtils";

const { locale } = useI18n();
const scheduleStore = useScheduleStore();
const currentDate = ref(new Date());
const selectedLesson = ref<Lesson | null>(null);

const weekDays = computed(() => {
  const baseDate = new Date(2024, 0, 1); // Monday
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(baseDate);
    d.setDate(baseDate.getDate() + i);
    return d.toLocaleDateString(locale.value, { weekday: "short" });
  });
});

const isSelectedDate = (date: CalendarDate): boolean => {
  if (!date.isCurrentMonth) return false;
  const sel = scheduleStore.selectedDate;
  if (!sel) return false;
  return isSameDate(date.date, new Date(sel));
};

const selectDate = (date: CalendarDate) => {
  if (!date.isCurrentMonth) return;
  scheduleStore.setSelectedDate(date.date);
};

const changeMonth = (delta: number) => {
  const d = new Date(currentDate.value);
  d.setMonth(d.getMonth() + delta);
  currentDate.value = d;
  
  const sel = new Date(scheduleStore.selectedDate);
  const lastDayOfNewMonth = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
  scheduleStore.setSelectedDate(new Date(d.getFullYear(), d.getMonth(), Math.min(sel.getDate(), lastDayOfNewMonth)));
};

const previousMonth = () => changeMonth(-1);
const nextMonth = () => changeMonth(1);

const currentMonthYear = computed(() => {
  return currentDate.value.toLocaleDateString(locale.value, { month: "long", year: "numeric" });
});

const calendarDays = computed(() => generateCalendarDays(currentDate.value, scheduleStore));
const schedule = computed(() => scheduleStore.selectedDateSchedule);

const handleOpenJournal = (lesson: Lesson) => {
  f7.views.main.router.navigate("/journals");
};

const scheduleLabel = computed(() => {
  const sel = scheduleStore.selectedDate;
  if (!sel) return m.home_schedule_today();
  
  const d = new Date(sel);
  const today = new Date();
  if (isSameDate(d, today)) return m.home_schedule_today();
  
  const tomorrow = new Date();
  tomorrow.setDate(today.getDate() + 1);
  if (isSameDate(d, tomorrow)) return m.home_schedule_tomorrow();
  
  return d.toLocaleDateString(locale.value, { day: "numeric", month: "short" });
});

onMounted(() => {
  scheduleStore.setSelectedDate(new Date());
});
</script>
