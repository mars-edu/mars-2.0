<template>
  <f7-popover
    id="edit-event-popover"
    style="width: 500px !important"
    class="max-h-screen"
    :arrow="false"
    close-on-escape
  >
    <div class="event-popover bg-card text-card-foreground">
      <!-- Header with buttons -->
      <PopoverHeader
        title="Редактировать"
        save-text="Сохранить"
        :disabled="!isFormValid"
        :on-cancel="closeEditEventPopoverGuarded"
        :on-save="handleUpdateEventGuarded"
      />
      <div v-if="formError" class="px-4 pt-2 text-destructive text-sm">
        {{ formError }}
      </div>

      <EventForm
        :parent-popover-id="'#edit-event-popover'"
        mode="edit"
        :event-id="props.eventId"
        class="overflow-y-auto"
        v-if="event"
        :semester="effectiveSemesterId"
        :semester-dates="semesterDates"
        :total-planned-hours="totalPlannedHours"
        :semester-planned-hours="semesterPlannedHours"
        :selected-hours="selectedHours"
        :hours-exceeded-error="hoursExceededError"
        :date-validation-error="dateValidationError"
        v-model:class9Id="class9Id"
        v-model:useCustomPeriod="useCustomPeriod"
        v-model:startDate="customStartDate"
        v-model:endDate="customEndDate"
        v-model:participants="participants"
        v-model:color="eventColor"
        v-model:selectedWeekDays="selectedWeekDays"
      >
        <div class="pt-4 border-t border-border">
          <button
            class="flex items-center justify-center w-full py-2 px-4 bg-destructive/10 hover:bg-destructive/20 rounded-lg text-destructive transition-colors"
            @click="showDeleteConfirmation"
            :disabled="calendarStore.isLoading"
          >
            <f7-icon
              ios="f7:trash"
              md="material:delete"
              size="18px"
              class="mr-2"
            />
            Удалить
          </button>
        </div>
      </EventForm>
    </div>
  </f7-popover>
</template>

<script setup lang="ts">
import { ref, computed, watchEffect } from "vue";
import { f7 } from "framework7-vue";
import PopoverHeader from "@/components/ui/PopoverHeader.vue";
import EventForm from "./EventForm.vue";
import { useCalendarStore, type CalendarEvent } from "@/stores/calendarStore";
import { useClass9Store } from "@/stores/class9Store";
import { useEducationScheduleStore } from "@/stores/educationScheduleStore";
import { useAcademicYearSemesterStore } from "@/stores/academicYearSemesterStore";
import { useUserStore } from "@/stores/userStore";
import { storeToRefs } from "pinia";
import { WEEK_DAYS, DATE_UI_FORMAT } from "@/constants/calendar";
import { useEventFormDerived, type WeekDaySchedule } from "./useEventFormDerived";

const props = defineProps<{ eventId: string }>();

const emit = defineEmits<{
  (e: "updated", event: CalendarEvent): void;
  (e: "cancel"): void;
}>();

const calendarStore = useCalendarStore();

// Get event from store by ID - always fresh data
const event = computed(() => calendarStore.getEventById(props.eventId));
const class9Store = useClass9Store();
const academicYearSemesterStore = useAcademicYearSemesterStore();
const educationScheduleStore = useEducationScheduleStore();
const userStore = useUserStore();

const effectiveTeacherId = computed(() => {
  if (userStore.isAdmin) {
    return calendarStore.selectedTeacherId || undefined;
  }
  if (userStore.isTeacher) {
    return userStore.currentUser?.id;
  }
  return undefined;
});

const { getActiveYearSchedules } = storeToRefs(educationScheduleStore);
const { getActiveAcademicYearSemester } = storeToRefs(
  academicYearSemesterStore
);

const class9Id = ref("");
const semester = ref("");
const useCustomPeriodRaw = ref(false);
const customStartDate = ref("");
const customEndDate = ref("");

const participants = ref<string[]>([]);
const eventColor = ref("#3F51B5");

const formError = ref<string | null>(null);
const selectedWeekDays = ref<WeekDaySchedule[]>([]);

const effectiveSemesterId = computed(() => {
  return semester.value || (getActiveAcademicYearSemester.value as any)?.id || "";
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
  isValid: isFormValid,
} = useEventFormDerived({
  class9Id,
  useCustomPeriod: useCustomPeriodRaw,
  customStartDate,
  customEndDate,
  selectedWeekDays,
  semesterId: effectiveSemesterId,
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

// Update form fields whenever event data changes
watchEffect(() => {
  if (event.value) {
    class9Id.value = event.value.class9Id;
    useCustomPeriodRaw.value = event.value.useCustomPeriod || false;
    semester.value = event.value.semester || "";
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
        russianWeekDay: WEEK_DAYS.find((d) => d.weekId === ws.weekId)?.name || "",
        startId,
        endId,
      };
    }) || [];
  }
});

const handleUpdateEvent = async () => {
  if (!event.value) return;
  try {
    formError.value = null;

    if (!effectiveSemesterId.value) {
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
      semester: effectiveSemesterId.value,
    };

    await calendarStore.updateEvent(event.value.id, updateData);

    const emitData = {
      ...event.value,
      class9Id: class9Id.value,
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
      semester: effectiveSemesterId.value,
    };

    emit("updated", emitData);

    closeEditEventPopover();
  } catch (err) {
    formError.value = "Ошибка при обновлении события.";
  }
};

const showDeleteConfirmation = () => {
  if (!event.value) return;
  f7.popover.close("#edit-event-popover");
  const eventTitle = calendarStore.getEventTitle(event.value);
  f7.dialog.confirm(
    `<p>Вы уверены, что хотите удалить событие \"${eventTitle}\"?</p>
     <p class="text-sm text-muted-foreground mt-2">Это действие нельзя отменить.</p>`,
    "Удаление события",
    async () => {
      if (!event.value) return;
      try {
        await calendarStore.deleteEvent(event.value.id);
        emit("updated", event.value);
      } catch (error) {
        f7.dialog.alert(
          "Произошла ошибка при удалении события.",
          "Ошибка",
          () => {
            f7.popover.open("#edit-event-popover");
          }
        );
      }
    },
    () => {
      f7.popover.open("#edit-event-popover");
    }
  );
};

const closeEditEventPopover = () => {
  f7.popover.close("#edit-event-popover");
  emit("cancel");
};

const closeEditEventPopoverGuarded = () => {
  f7.popover.close("#edit-event-popover");
  emit("cancel");
};

const handleUpdateEventGuarded = () => {
  handleUpdateEvent();
};

const onClosed = () => {
  emit("cancel");
};

/* EventForm internally handles date/semester synchronization and participants/KTP popups */
</script>

<style scoped>
#edit-event-popover {
  left: 50%;
  transform: translateX(-50%);
}
</style>
