<template>
  <div>
    <f7-fab
      id="add-button"
      position="right-bottom"
      @click="openAddEventPopover"
    >
      <f7-icon ios="f7:plus" md="material:add" size="16px"></f7-icon>
    </f7-fab>

    <!-- Framework7 Popover -->
    <f7-popover
      id="add-event-popover"
      class="max-h-screen"
      style="width: 500px !important"
      :arrow="false"
      close-on-escape
    >
      <div class="event-popover bg-card text-card-foreground">
        <!-- Header with buttons -->
        <div class="fixed-header">
          <PopoverHeader
            title="Создать"
            save-text="Добавить"
            :disabled="!isFormValid"
            :on-cancel="closeAddEventPopover"
            :on-save="handleAddEvent"
          />
          <div v-if="formError" class="px-4 pb-2 text-destructive text-sm">
            {{ formError }}
          </div>
        </div>

        <div class="scrollable-content">
          <EventForm
            :parent-popover-id="'#add-event-popover'"
            mode="add"
            :event-id="tempEventId"
            :semester="semesterId"
            :semester-dates="semesterDates"
            :total-planned-hours="totalPlannedHours"
            :semester-planned-hours="semesterPlannedHours"
            :selected-hours="selectedHours"
            :hours-exceeded-error="hoursExceededError"
            :date-validation-error="dateValidationError"
            class="overflow-y-auto"
            v-model:class9Id="class9Id"
            v-model:useCustomPeriod="useCustomPeriod"
            v-model:startDate="customStartDate"
            v-model:endDate="customEndDate"
            v-model:participants="participants"
            v-model:color="eventColor"
            v-model:selectedWeekDays="selectedWeekDays"
          />
        </div>
      </div>
    </f7-popover>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import { f7 } from "framework7-vue";
import { storeToRefs } from "pinia";
import PopoverHeader from "../ui/PopoverHeader.vue";
import EventForm from "./EventForm.vue";
import { useCalendarStore, type CalendarEvent } from "@/stores/calendarStore";
import { useUserStore } from "@/stores/userStore";
import { useAcademicYearSemesterStore } from "@/stores/academicYearSemesterStore";
import { useEventFormDerived, type WeekDaySchedule } from "./useEventFormDerived";

const emit = defineEmits<{
  (e: "event-added", event: CalendarEvent): void;
  (e: "import-ktp-existing"): void;
}>();

const calendarStore = useCalendarStore();
const userStore = useUserStore();
const academicYearSemesterStore = useAcademicYearSemesterStore();
const { getActiveAcademicYearSemester } = storeToRefs(academicYearSemesterStore);

const effectiveTeacherId = computed(() => {
  if (userStore.isAdmin) {
    return calendarStore.selectedTeacherId || undefined;
  }
  if (userStore.isTeacher) {
    return userStore.currentUser?.id;
  }
  return undefined;
});

const class9Id = ref("");
const useCustomPeriodRaw = ref(false);
const customStartDate = ref("");
const customEndDate = ref("");
const participants = ref<string[]>([]);
const formError = ref<string | null>(null);
const eventColor = ref("#3F51B5");
const tempEventId = ref<string>(""); // Pre-generated event ID for creating KTP before saving

const selectedWeekDays = ref<WeekDaySchedule[]>([]);

const semesterId = computed(() => getActiveAcademicYearSemester.value?.id || "");

const {
  semesterDates,
  effectiveStartDate,
  effectiveEndDate,
  dateValidationError,
  totalPlannedHours,
  semesterPlannedHours,
  selectedHours,
  hoursExceededError,
  isValid: isFormValid,
} = useEventFormDerived({
  class9Id,
  useCustomPeriod: useCustomPeriodRaw,
  customStartDate,
  customEndDate,
  selectedWeekDays,
  semesterId,
});

const useCustomPeriod = computed({
  get: () => useCustomPeriodRaw.value,
  set: (v: boolean) => {
    useCustomPeriodRaw.value = v;
    if (v) {
      if (!customStartDate.value && semesterDates.value?.startDate) {
        customStartDate.value = semesterDates.value.startDate;
      }
      if (!customEndDate.value && semesterDates.value?.endDate) {
        customEndDate.value = semesterDates.value.endDate;
      }
    }
  },
});

const handleAddEvent = async () => {
  try {
    formError.value = null;

    if (!semesterId.value) {
      formError.value = "Не удалось определить семестр.";
      return;
    }
    if (!effectiveStartDate.value || !effectiveEndDate.value) {
      formError.value = "Не удалось определить период.";
      return;
    }

    const eventData: Omit<CalendarEvent, "id" | "createdAt" | "updatedAt"> = {
      class9Id: class9Id.value,
      teacherId: effectiveTeacherId.value,
      startDate: effectiveStartDate.value,
      endDate: effectiveEndDate.value,
      participants: participants.value,
      weeklySchedules: selectedWeekDays.value.map(({ weekId, startId, endId }) => ({
        weekId,
        startId,
        endId,
      })),
      color: eventColor.value,
      useCustomPeriod: useCustomPeriod.value,
      semester: semesterId.value,
    };

    const newEvent = await calendarStore.addEvent(eventData, tempEventId.value);

    if (newEvent) {
      emit("event-added", newEvent);
      closeAddEventPopover();
      resetForm();
    } else {
      throw new Error("Failed to create event");
    }
  } catch (error) {
    console.error("❌ handleAddEvent error", error);
    formError.value = "Ошибка при добавлении события.";
  }
};

const resetForm = () => {
  class9Id.value = "";
  useCustomPeriodRaw.value = false;
  customStartDate.value = "";
  customEndDate.value = "";
  participants.value = [];
  selectedWeekDays.value = [];
  formError.value = null;
  eventColor.value = "#3F51B5";
  tempEventId.value = ""; // Reset temporary event ID
};

const openAddEventPopover = () => {
  // Generate temporary event ID for KTP creation
  tempEventId.value = crypto.randomUUID();
  f7.popover.open("#add-event-popover");
};

const closeAddEventPopover = () => {
  f7.popover.close("#add-event-popover");
};
</script>

<style scoped>
.event-popover {
  height: 100%;
  display: flex;
  flex-direction: column;
  max-height: 100dvh;
}

.fixed-header {
  position: sticky;
  top: 0;
  z-index: 10;
  background-color: var(--f7-popover-bg-color);
  border-bottom: 1px solid var(--f7-border-color);
}

.scrollable-content {
  flex: 1;
  overflow-y: auto;
  height: calc(100dvh - 120px); /* Adjust height as needed */
}
#add-event-popover {
  left: 50%;
  transform: translateX(-50%);
}
</style>
