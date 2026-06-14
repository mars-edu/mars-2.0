<template>
  <div>
    <button
      id="add-button"
      class="bg-primary hover:opacity-90 text-primary-foreground px-6 py-2.5 rounded-xl font-bold shadow-lg shadow-primary/20 transition-all flex items-center gap-2 active:scale-95"
      @click="openAddEventPopover"
    >
      <IconPlus class="text-[20px]" />
      <span>Создать</span>
    </button>

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
      <div class="flex flex-col h-full">
        <AddEventWizard
          :session-key="sessionKey"
          :request-close="requestClose"
          :form-error="formError"
          :is-submitting="calendarStore.isLoading"
          :semester-id="semesterId"
          :semester-dates="semesterDates"
          :total-planned-hours="totalPlannedHours"
          :semester-planned-hours="semesterPlannedHours"
          :selected-hours="selectedHours"
          :week-count="weekCount"
          :hours-exceeded-error="hoursExceededError"
          :slot-time-error="slotTimeError"
          :date-validation-error="dateValidationError"
          :derived-is-valid="isFormValid"
          :temp-event-id="tempEventId"
          v-model:rupEntryId="rupEntryId"
          v-model:useCustomPeriod="useCustomPeriod"
          v-model:startDate="customStartDate"
          v-model:endDate="customEndDate"
          v-model:participants="participants"
          v-model:color="eventColor"
          v-model:selectedWeekDays="selectedWeekDays"
          v-model:useIndividualJournals="useIndividualJournals"
          v-model:gradingType="gradingType"
          v-model:individualJournals="individualJournals"
          @submit="handleAddEvent"
        />
      </div>
    </GuardedPopover>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import IconPlus from "~icons/lucide/plus";
import { f7 } from "framework7-vue";
import { storeToRefs } from "pinia";
import GuardedPopover from "@/components/ui/GuardedPopover.vue";
import AddEventWizard from "./AddEventWizard.vue";
import { useCalendarStore, type CalendarEvent } from "@/stores/calendarStore";
import { useUserStore } from "@/stores/userStore";
import { useAcademicYearSemesterStore } from "@/stores/academicYearSemesterStore";
import { useEventFormDerived, type WeekDaySchedule } from "./useEventFormDerived";
import {
  createEmptyAddWizardDraft,
  serializeAddWizardDraft,
  type AddWizardDraft,
  type IndividualJournalDraft,
} from "./useAddEventWizard";

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

const rupEntryId = ref("");
const useCustomPeriodRaw = ref(false);
const customStartDate = ref("");
const customEndDate = ref("");
const participants = ref<string[]>([]);
const formError = ref<string | null>(null);
const eventColor = ref("#3F51B5");
const tempEventId = ref<string>("");
const selectedWeekDays = ref<WeekDaySchedule[]>([]);
const useIndividualJournals = ref(false);
const gradingType = ref<"combined" | "separate" | "">("");
const individualJournals = ref<IndividualJournalDraft[]>([]);

import { useRupEntryStore } from "@/stores/rupEntryStore";

import { useRupEntryStore } from "@/stores/rupEntryStore";

const isPopupOpen = ref(false);
const sessionKey = ref(0);
const addEventPopupRef = ref<{ allowNextClose: () => void } | null>(null);
const rupEntryStore = useRupEntryStore();

const semesterId = computed(() => {
  const activeSemesterId = getActiveAcademicYearSemester.value?.id;
  if (rupEntryId.value) {
    return rupEntryStore.getAutoSelectedSemesterForRupEntry(rupEntryId.value, activeSemesterId);
  }
  return activeSemesterId || "";
});

const {
  semesterDates,
  effectiveStartDate,
  effectiveEndDate,
  dateValidationError,
  totalPlannedHours,
  semesterPlannedHours,
  weekCount,
  selectedHours,
  hoursExceededError,
  slotTimeError,
  isValid: isFormValid,
} = useEventFormDerived({
  rupEntryId,
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
      rupEntryId: rupEntryId.value,
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

    let newEvent: CalendarEvent | null | undefined;
    if (useIndividualJournals.value && individualJournals.value.length > 0) {
      if (gradingType.value !== "combined" && gradingType.value !== "separate") {
        formError.value = "Не выбран тип оценивания.";
        return;
      }
      newEvent = await calendarStore.addEventWithIndividualJournals(
        eventData,
        gradingType.value,
        individualJournals.value.map((j) => ({
          studentIds: j.studentIds,
          weeklySchedules: j.daySlots.map(({ weekId, startId, endId }) => ({
            weekId,
            startId,
            endId,
          })),
        })),
        tempEventId.value
      );
    } else {
      newEvent = await calendarStore.addEvent(eventData, tempEventId.value);
    }

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
  rupEntryId.value = "";
  useCustomPeriodRaw.value = false;
  customStartDate.value = "";
  customEndDate.value = "";
  participants.value = [];
  selectedWeekDays.value = [];
  formError.value = null;
  eventColor.value = "#3F51B5";
  tempEventId.value = "";
  useIndividualJournals.value = false;
  gradingType.value = "";
  individualJournals.value = [];
};

const openAddEventPopover = () => {
  // Reset only on explicit user open; avoids losing state when nested popups temporarily close this popup.
  resetForm();
  sessionKey.value += 1;
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

const draft = computed<AddWizardDraft>(() => ({
  rupEntryId: rupEntryId.value,
  useCustomPeriod: useCustomPeriodRaw.value,
  startDate: customStartDate.value,
  endDate: customEndDate.value,
  participants: participants.value,
  color: eventColor.value,
  selectedWeekDays: selectedWeekDays.value,
  tempEventId: tempEventId.value,
  useIndividualJournals: useIndividualJournals.value,
  gradingType: gradingType.value,
  individualJournals: individualJournals.value,
}));

const emptyDraft = createEmptyAddWizardDraft();

const isDirty = computed(() => {
  return serializeAddWizardDraft(draft.value) !== serializeAddWizardDraft(emptyDraft);
});

const hasUnsavedChanges = () => isDirty.value;
</script>

<style scoped>
.add-event-popup {
  --f7-popup-tablet-width: 672px;
  --f7-popup-tablet-height: min(900px, calc(100vh - 80px));
}

</style>
