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
        class="overflow-y-auto"
        :start-date="dayjs(startDate[0]).format(DATE_UI_FORMAT)"
        :end-date="dayjs(endDate[0]).format(DATE_UI_FORMAT)"
        v-model:class9Id="class9Id"
        v-model:useCustomPeriod="useCustomPeriod"
        v-model:participants="participants"
        v-model:color="eventColor.hex"
        v-model:selectedWeekDays="selectedWeekDays"
        @update:startDate="(v:string) => startDate = [dayjs(v, DATE_UI_FORMAT, true).toDate()]"
        @update:endDate="(v:string) => endDate = [dayjs(v, DATE_UI_FORMAT, true).toDate()]"
        @update:valid="(v:boolean)=>{ isFormValid=v }"
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
import { ref, computed } from "vue";
import { f7 } from "framework7-vue";
import PopoverHeader from "@/components/ui/PopoverHeader.vue";
import EventForm from "./EventForm.vue";
import { useCalendarStore, type CalendarEvent } from "@/stores/calendarStore";
import { useClass9Store } from "@/stores/class9Store";
import { useSelectedItemsStore } from "@/stores/selectedItemsStore";
import { useEducationScheduleStore } from "@/stores/educationScheduleStore";
import { useSemesterStore } from "@/stores/semesterStore";
import { useAcademicYearSemesterStore } from "@/stores/academicYearSemesterStore";
import { storeToRefs } from "pinia";
import dayjs from "dayjs";
import "dayjs/locale/ru";
import customParseFormat from "dayjs/plugin/customParseFormat";

// Set Russian locale for consistent date parsing
dayjs.locale("ru");
dayjs.extend(customParseFormat);
import { WEEK_DAYS, DATE_UI_FORMAT } from "@/constants/calendar";

const props = defineProps<{ event: CalendarEvent }>();

const emit = defineEmits<{
  (e: "updated", event: CalendarEvent): void;
  (e: "cancel"): void;
}>();

const calendarStore = useCalendarStore();
const class9Store = useClass9Store();
const academicYearSemesterStore = useAcademicYearSemesterStore();
const selectedItemsStore = useSelectedItemsStore();
const educationScheduleStore = useEducationScheduleStore();
const semesterStore = useSemesterStore();

const { getActiveYearSchedules } = storeToRefs(educationScheduleStore);
const { selectedClass9Item } = storeToRefs(selectedItemsStore);
const { getActiveAcademicYearSemester } = storeToRefs(
  academicYearSemesterStore
);

const class9Id = ref(props.event.class9Id);
const useCustomPeriod = ref(props.event.useCustomPeriod || false);

// Convert date string to Date array for datepicker
const formatDateArray = (date: any): Date[] => {
  if (!date) {
    return [new Date()];
  }

  // Handle arrays
  if (Array.isArray(date)) {
    return formatDateArray(date[0]);
  }

  // Convert to string and parse
  const dateStr = String(date);
  let parsed;

  // Handle ISO format
  if (dateStr.includes("T")) {
    parsed = dayjs(dateStr);
  }
  // Handle DD/MM/YYYY format with strict parsing
  else if (dateStr.includes("/")) {
    parsed = dayjs(dateStr, DATE_UI_FORMAT, true);
  }
  // Try general parsing
  else {
    parsed = dayjs(dateStr);
  }

  return parsed.isValid() ? [parsed.toDate()] : [new Date()];
};

const startDate = ref<Date[]>(formatDateArray(props.event.startDate));
const endDate = ref<Date[]>(formatDateArray(props.event.endDate));
const participants = ref<string[]>([...props.event.participants]);
const eventColor = ref({ hex: props.event.color || "#3F51B5" });

const formError = ref<string | null>(null);
const isFormValid = ref(false);
const selectedWeekDays = ref<
  {
    weekId: number;
    russianWeekDay: string;
    startId: string;
    endId: string;
  }[]
>(
  props.event.weeklySchedules?.map((ws) => {
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
  }) || []
);

const handleUpdateEvent = async () => {
  try {
    formError.value = null;

    const updateData = {
      class9Id: class9Id.value,
      startDate: dayjs(startDate.value[0]).format(DATE_UI_FORMAT),
      endDate: dayjs(endDate.value[0]).format(DATE_UI_FORMAT),
      participants: participants.value,
      weeklySchedules: selectedWeekDays.value,
      color: eventColor.value.hex,
      useCustomPeriod: useCustomPeriod.value,
      semester: (getActiveAcademicYearSemester.value as any)?.id ?? "",
    };

    await calendarStore.updateEvent(props.event.id, updateData);

    const emitData = {
      ...props.event,
      class9Id: class9Id.value,
      startDate: dayjs(startDate.value[0]).format(DATE_UI_FORMAT),
      endDate: dayjs(endDate.value[0]).format(DATE_UI_FORMAT),
      participants: participants.value,
      weeklySchedules: selectedWeekDays.value,
      color: eventColor.value.hex,
      useCustomPeriod: useCustomPeriod.value,
      semester: (getActiveAcademicYearSemester.value as any)?.id ?? "",
    };

    emit("updated", emitData);

    closeEditEventPopover();
  } catch (err) {
    formError.value = "Ошибка при обновлении события.";
  }
};

const showDeleteConfirmation = () => {
  f7.popover.close("#edit-event-popover");
  const eventTitle = calendarStore.getEventTitle(props.event);
  f7.dialog.confirm(
    `<p>Вы уверены, что хотите удалить событие \"${eventTitle}\"?</p>
     <p class="text-sm text-muted-foreground mt-2">Это действие нельзя отменить.</p>`,
    "Удаление события",
    async () => {
      try {
        await calendarStore.deleteEvent(props.event.id);
        emit("updated", props.event);
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
