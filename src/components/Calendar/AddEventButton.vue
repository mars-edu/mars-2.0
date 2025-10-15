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
            class="overflow-y-auto"
            :start-date="dayjs(startDate[0]).format(DATE_UI_FORMAT)"
            :end-date="dayjs(endDate[0]).format(DATE_UI_FORMAT)"
            v-model:class9Id="class9Id"
            v-model:useCustomPeriod="useCustomPeriod"
            v-model:participants="participants"
            v-model:color="eventColor.hex"
            v-model:selectedWeekDays="selectedWeekDays"
            @update:startDate="(v:string) => {
              console.log('📥 AddEventButton received update:startDate:', v);
              startDate = [dayjs(v, DATE_UI_FORMAT, true).toDate()];
            }"
            @update:endDate="(v:string) => {
              console.log('📥 AddEventButton received update:endDate:', v);
              endDate = [dayjs(v, DATE_UI_FORMAT, true).toDate()];
            }"
            @update:valid="(v:boolean)=>{
              console.log('📥 AddEventButton received update:valid:', v);
              isFormValid=v
            }"
            @update:semester="(v:string)=>{
              console.log('📥 AddEventButton received update:semester (id):', v);
              semester=v
            }"
          />
        </div>
      </div>
    </f7-popover>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from "vue";
import { f7 } from "framework7-vue";
import PopoverHeader from "../ui/PopoverHeader.vue";
import EventForm from "./EventForm.vue";
import { useCalendarStore, type CalendarEvent } from "@/stores/calendarStore";
import dayjs from "dayjs";
import "dayjs/locale/ru";
import customParseFormat from "dayjs/plugin/customParseFormat";

dayjs.locale("ru");
dayjs.extend(customParseFormat);
import { useRupStore } from "@/stores/rupStore";
import { useUserStore } from "@/stores/userStore";
import { DATE_UI_FORMAT } from "@/constants/calendar";

const emit = defineEmits<{
  (e: "event-added", event: CalendarEvent): void;
  (e: "import-ktp-existing"): void;
}>();

const calendarStore = useCalendarStore();
const rupStore = useRupStore();
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

const class9Id = ref("");
const useCustomPeriod = ref(false);
const startDate = ref<Date[]>([new Date()]);
const endDate = ref<Date[]>([new Date()]);
const participants = ref<string[]>([]);
const formError = ref<string | null>(null);
const eventColor = ref({ hex: "#3F51B5" });
const semester = ref("");

const selectedWeekDays = ref<
  {
    weekId: number;
    russianWeekDay: string;
    startId: string;
    endId: string;
  }[]
>([]);

const isFormValid = ref(false);

// Add watchers to track changes
watch(class9Id, (newVal, oldVal) => {
  console.log("🔄 AddEventButton class9Id changed:", { oldVal, newVal });
});

watch(useCustomPeriod, (newVal, oldVal) => {
  console.log("🔄 AddEventButton useCustomPeriod changed:", { oldVal, newVal });
});

watch(startDate, (newVal, oldVal) => {
  console.log("🔄 AddEventButton startDate changed:", { oldVal, newVal });
});

watch(endDate, (newVal, oldVal) => {
  console.log("🔄 AddEventButton endDate changed:", { oldVal, newVal });
});

watch(participants, (newVal, oldVal) => {
  console.log("🔄 AddEventButton participants changed:", { oldVal, newVal });
});

watch(
  selectedWeekDays,
  (newVal, oldVal) => {
    console.log("🔄 AddEventButton selectedWeekDays changed:", {
      oldVal,
      newVal,
    });
  },
  { deep: true }
);

watch(eventColor, (newVal, oldVal) => {
  console.log("🔄 AddEventButton eventColor changed:", { oldVal, newVal });
});

const handleAddEvent = async () => {
  try {
    console.log("🔄 handleAddEvent called", {
      class9Id: class9Id.value,
      startDate: startDate.value,
      endDate: endDate.value,
      participants: participants.value,
      selectedWeekDays: selectedWeekDays.value,
      eventColor: eventColor.value.hex,
      useCustomPeriod: useCustomPeriod.value,
    });

    formError.value = null;

    const eventData: Omit<CalendarEvent, "id" | "createdAt" | "updatedAt"> = {
      class9Id: class9Id.value,
      teacherId: effectiveTeacherId.value,
      startDate: dayjs(startDate.value[0]).format(DATE_UI_FORMAT),
      endDate: dayjs(endDate.value[0]).format(DATE_UI_FORMAT),
      participants: participants.value,
      weeklySchedules: selectedWeekDays.value,
      color: eventColor.value.hex,
      useCustomPeriod: useCustomPeriod.value,
      semester: semester.value,
    };

    console.log("📤 handleAddEvent calling calendarStore.addEvent", eventData);
    const newEvent = await calendarStore.addEvent(eventData);

    console.log("✅ handleAddEvent success", newEvent);
    emit("event-added", newEvent);
    closeAddEventPopover();
    resetForm();
  } catch (error) {
    console.error("❌ handleAddEvent error", error);
    formError.value = "Ошибка при добавлении события.";
  }
};

const resetForm = () => {
  class9Id.value = "";
  useCustomPeriod.value = false;
  startDate.value = [new Date()];
  endDate.value = [new Date()];
  participants.value = [];
  selectedWeekDays.value = [];
  formError.value = null;
  eventColor.value = { hex: "#3F51B5" };
  semester.value = "";
};

const openAddEventPopover = () => {
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
