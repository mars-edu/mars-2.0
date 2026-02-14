<template>
  <div>
    <f7-fab
      id="add-button"
      position="right-bottom"
      @click="openAddEventPopover"
    >
      <f7-icon ios="f7:plus" md="material:add" size="16px"></f7-icon>
    </f7-fab>

    <!-- Framework7 Popup (was Popover) -->
    <GuardedPopover
      ref="addEventPopupRef"
      v-slot="{ requestClose }"
      id="add-event-popup"
      kind="popup"
      :opened="isPopupOpen"
      :close-on-escape="true"
      :is-dirty="hasUnsavedChanges"
      @popup:closed="onPopupClosed"
      class="add-event-popup"
    >
      <f7-page>
        <div class="event-popover bg-card text-card-foreground">
          <!-- Header with buttons -->
          <div class="fixed-header">
            <PopoverHeader
              title="Создать"
              save-text="Добавить"
              :disabled="!isFormValid"
              :on-cancel="requestClose"
              :on-save="handleAddEvent"
            />
            <div v-if="formError" class="px-4 pb-2 text-destructive text-sm">
              {{ formError }}
            </div>
          </div>

          <div class="scrollable-content">
            <EventForm
              parent-popover-id="#add-event-popup"
              parent-popover-type="popup"
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
      </f7-page>
    </GuardedPopover>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import { f7 } from "framework7-vue";
import { storeToRefs } from "pinia";
import PopoverHeader from "../ui/PopoverHeader.vue";
import GuardedPopover from "@/components/ui/GuardedPopover.vue";
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
const isPopupOpen = ref(false);
const addEventPopupRef = ref<{ allowNextClose: () => void } | null>(null);

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
      closeAddEventPopoverForced();
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
  // Reset only on explicit user open; avoids losing state when nested popups temporarily close this popup.
  resetForm();
  // Generate temporary event ID for KTP creation
  tempEventId.value = crypto.randomUUID();
  isPopupOpen.value = true;
};

const closeAddEventPopoverForced = () => {
  addEventPopupRef.value?.allowNextClose();
  f7.popup.close("#add-event-popup", true, "programmatic");
};

const onPopupClosed = () => {
  isPopupOpen.value = false;
};

const isDirty = computed(() => {
  return (
    tempEventId.value !== "" ||
    class9Id.value !== "" ||
    useCustomPeriodRaw.value !== false ||
    customStartDate.value !== "" ||
    customEndDate.value !== "" ||
    participants.value.length > 0 ||
    selectedWeekDays.value.length > 0 ||
    eventColor.value !== "#3F51B5"
  );
});

const hasUnsavedChanges = () => isDirty.value;
</script>

<style scoped>
.add-event-popup {
  width: auto;
  min-width: 500px;
  max-width: 90vw;
  max-height: 90vh;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  border-radius: 1rem;
  overflow: hidden;
}

.add-event-popup .page-content {
  padding: 0;
  height: 100%;
}

.event-popover {
  display: flex;
  flex-direction: column;
  max-height: 90vh;
  width: 100%;
  height: 100%;
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
  min-height: 0; /* Allow flexbox to shrink */
}
</style>
