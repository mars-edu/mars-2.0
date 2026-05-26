<template>
  <GuardedPopover
    ref="editPopupRef"
    v-slot="{ requestClose }"
    id="edit-journal-popup"
    kind="popup"
    :opened="isPopupOpen"
    :close-on-escape="true"
    :is-dirty="hasUnsavedChanges"
    @popup:closed="onPopupClosed"
    class="edit-journal-popup"
  >
    <f7-page>
      <AddEventWizard
        mode="edit"
        :session-key="sessionKey"
        :request-close="requestClose"
        :form-error="formError"
        :is-submitting="calendarStore.isLoading"
        :semester-id="semesterId"
        :semester-dates="semesterDates"
        :total-planned-hours="totalPlannedHours"
        :semester-planned-hours="semesterPlannedHours"
        :selected-hours="selectedHours"
        :hours-exceeded-error="hoursExceededError"
        :slot-time-error="slotTimeError"
        :date-validation-error="dateValidationError"
        :derived-is-valid="isFormValid"
        :temp-event-id="eventId ?? ''"
        v-model:class9Id="class9Id"
        v-model:useCustomPeriod="useCustomPeriod"
        v-model:startDate="customStartDate"
        v-model:endDate="customEndDate"
        v-model:participants="participants"
        v-model:color="eventColor"
        v-model:selectedWeekDays="selectedWeekDays"
        v-model:useIndividualJournals="useIndividualJournals"
        v-model:gradingType="gradingType"
        v-model:individualJournals="individualJournals"
        @submit="handleUpdateEvent"
      />
    </f7-page>
  </GuardedPopover>
</template>

<script setup lang="ts">
import { ref, computed, watchEffect } from "vue";
import { f7 } from "framework7-vue";
import { storeToRefs } from "pinia";
import GuardedPopover from "@/components/ui/GuardedPopover.vue";
import AddEventWizard from "./AddEventWizard.vue";
import { useCalendarStore, type CalendarEvent } from "@/stores/calendarStore";
import { useUserStore } from "@/stores/userStore";
import { useAcademicYearSemesterStore } from "@/stores/academicYearSemesterStore";
import { useEducationScheduleStore } from "@/stores/educationScheduleStore";
import { useEventFormDerived, type WeekDaySchedule } from "./useEventFormDerived";
import { getWeekDays } from "@/constants/calendar";
import type { IndividualJournalDraft } from "./useAddEventWizard";

const props = defineProps<{
  eventId: string;
}>();

const emit = defineEmits<{
  (e: "updated"): void;
  (e: "cancel"): void;
}>();

const calendarStore = useCalendarStore();
const userStore = useUserStore();
const academicYearSemesterStore = useAcademicYearSemesterStore();
const educationScheduleStore = useEducationScheduleStore();
const { getActiveAcademicYearSemester } = storeToRefs(academicYearSemesterStore);
const { getActiveYearSchedules } = storeToRefs(educationScheduleStore);

const effectiveTeacherId = computed(() => {
  if (userStore.isAdmin) {
    return calendarStore.selectedTeacherId || undefined;
  }
  if (userStore.isTeacher) {
    return userStore.currentUser?.id;
  }
  return undefined;
});

const event = computed(() => calendarStore.getEventById(props.eventId));

const class9Id = ref("");
const useCustomPeriodRaw = ref(false);
const customStartDate = ref("");
const customEndDate = ref("");
const participants = ref<string[]>([]);
const formError = ref<string | null>(null);
const eventColor = ref("#3F51B5");
const selectedWeekDays = ref<WeekDaySchedule[]>([]);
const useIndividualJournals = ref(false);
const gradingType = ref<"combined" | "separate" | "">("");
const individualJournals = ref<IndividualJournalDraft[]>([]);

const isPopupOpen = ref(false);
const sessionKey = ref(0);
const editPopupRef = ref<{ allowNextClose: () => void } | null>(null);
const dataLoaded = ref(false);

const semesterId = computed(() => {
  if (event.value?.semester) return event.value.semester;
  return getActiveAcademicYearSemester.value?.id || "";
});

const {
  semesterDates,
  effectiveStartDate,
  effectiveEndDate,
  dateValidationError,
  totalPlannedHours,
  semesterPlannedHours,
  selectedHours,
  hoursExceededError,
  slotTimeError,
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

function loadEventData() {
  if (!event.value) return;

  class9Id.value = event.value.class9Id;
  useCustomPeriodRaw.value = event.value.useCustomPeriod || false;
  customStartDate.value = event.value.startDate || "";
  customEndDate.value = event.value.endDate || "";
  participants.value = [...event.value.participants];
  eventColor.value = event.value.color || "#3F51B5";
  selectedWeekDays.value = event.value.weeklySchedules?.map((ws) => {
    const schedules = getActiveYearSchedules.value;
    const startId =
      ws.startId ||
      schedules.find((s) => s.startTime === ws.startTime)?.id ||
      "";
    const endId =
      ws.endId || schedules.find((s) => s.endTime === ws.endTime)?.id || "";
    return {
      weekId: ws.weekId,
      russianWeekDay: getWeekDays().find((d) => d.weekId === ws.weekId)?.name || "",
      startId,
      endId,
    };
  }) || [];

  dataLoaded.value = true;
}

const handleUpdateEvent = async () => {
  if (!event.value) return;
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

    const updateData = {
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

    await calendarStore.updateEvent(event.value.id, updateData);
    emit("updated");
    closePopupForced();
  } catch (error) {
    console.error("❌ handleUpdateEvent error", error);
    formError.value = "Ошибка при обновлении журнала.";
  }
};

const open = () => {
  loadEventData();
  sessionKey.value += 1;
  isPopupOpen.value = true;
};

const closePopupForced = () => {
  editPopupRef.value?.allowNextClose();
  f7.popup.close("#edit-journal-popup", true, "programmatic");
};

const onPopupClosed = () => {
  isPopupOpen.value = false;
  dataLoaded.value = false;
  emit("cancel");
};

const hasUnsavedChanges = () => {
  if (!dataLoaded.value || !event.value) return false;
  return (
    class9Id.value !== event.value.class9Id ||
    eventColor.value !== (event.value.color || "#3F51B5") ||
    participants.value.length !== event.value.participants.length ||
    JSON.stringify(selectedWeekDays.value) !== JSON.stringify(event.value.weeklySchedules?.map((ws) => ({
      weekId: ws.weekId,
      russianWeekDay: getWeekDays().find((d) => d.weekId === ws.weekId)?.name || "",
      startId: ws.startId || "",
      endId: ws.endId || "",
    })) || [])
  );
};

defineExpose({
  open,
});
</script>

<style scoped>
.edit-journal-popup {
  --f7-popup-tablet-width: 672px;
  --f7-popup-tablet-height: min(900px, calc(100vh - 80px));
  border-radius: 2rem !important;
  overflow: hidden;
}

.edit-journal-popup .page-content {
  padding: 0;
  height: 100%;
}
</style>
