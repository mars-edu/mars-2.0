<template>
  <AccordionItem id="schedule">
    <template #title>{{ edu_schedule_bell() }}</template>
    <template #actions>
      <div class="flex gap-2">
        <CopyEducationScheduleButton v-if="selectedSemesterId" :semester-id="selectedSemesterId" />
        <AddEducationScheduleButton v-if="selectedSemesterId" :semester-id="selectedSemesterId" />
      </div>
    </template>
    <div
      v-if="educationScheduleStore.isLoading"
      class="p-4 flex justify-center"
    >
      <f7-preloader />
    </div>
    <div
      v-else-if="educationScheduleStore.getError"
      class="p-4 text-destructive"
    >
      {{ educationScheduleStore.getError }}
    </div>
    <div v-else-if="schedules.length === 0">
      <NoData
        :title="edu_schedule_no_bell()"
        :description="edu_schedule_no_bell_desc()"
        :icon="IconClock"
      />
    </div>
    <div v-else ref="schedulesGridRef" class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
      <div
        v-for="schedule in schedules"
        :key="schedule.id"
        :data-id="schedule.id"
        class="relative group p-4 bg-muted/20 border border-border rounded-xl hover:bg-card hover:shadow-sm transition-all cursor-pointer"
        :id="`schedule-item-${schedule.id}`"
        @click.stop="openEditSchedule(schedule)"
      >
        <div class="flex flex-col gap-1">
          <div class="flex items-center justify-between">
            <span class="text-sm font-bold text-foreground">
              Урок {{ schedule.lessonNumber }}
            </span>
            <div class="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                class="p-1 text-muted-foreground hover:text-primary transition-colors"
                @click.stop="openEditSchedule(schedule)"
                aria-label="Edit Schedule"
                type="button"
              >
                <IconPencil class="w-[14px] h-[14px]" />
              </button>
              <button
                class="p-1 text-muted-foreground hover:text-destructive transition-colors"
                @click.stop="deleteSchedule(schedule)"
                aria-label="Delete Schedule"
                type="button"
              >
                <IconTrash class="w-[14px] h-[14px]" />
              </button>
            </div>
          </div>
          <div class="flex items-center justify-between mt-1">
            <span class="text-[10px] uppercase tracking-wider font-bold text-muted-foreground">
              {{ schedule.startTime }} - {{ schedule.endTime }}
            </span>
          </div>
        </div>
      </div>
      <EditEducationScheduleButton
        v-if="selectedScheduleId"
        :schedule-id="selectedScheduleId"
      />
    </div>
  </AccordionItem>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, nextTick, watch } from "vue";
import Sortable from "sortablejs";
import { f7, f7Preloader } from "framework7-vue";
import IconClock from "~icons/lucide/clock";
import IconPencil from "~icons/lucide/pencil";
import IconTrash from "~icons/lucide/trash-2";
import AccordionItem from "@/components/ui/accordion/AccordionItem.vue";
import NoData from "@/components/ui/accordion/NoData.vue";
import AddEducationScheduleButton from "@/components/AddEducationScheduleButton.vue";
import CopyEducationScheduleButton from "@/components/CopyEducationScheduleButton.vue";
import EditEducationScheduleButton from "@/components/EditEducationScheduleButton.vue";
import { useEducationScheduleStore } from "@/stores/educationScheduleStore";
import type { EducationSchedule } from "@/types/education-schedule";
import {
  edu_schedule_bell,
  edu_schedule_no_bell,
  edu_schedule_no_bell_desc,
  common_delete,
  common_cancel,
} from "@/paraglide/messages";

const props = defineProps<{
  selectedSemesterId: string;
  schedules: EducationSchedule[];
}>();

const educationScheduleStore = useEducationScheduleStore();
const selectedScheduleId = ref<string | null>(null);
const schedulesGridRef = ref<HTMLElement | null>(null);
let sortableInstance: Sortable | null = null;

function initSortable() {
  if (sortableInstance) {
    sortableInstance.destroy();
    sortableInstance = null;
  }
  if (schedulesGridRef.value && props.schedules.length > 0) {
    sortableInstance = new Sortable(schedulesGridRef.value, {
      animation: 150,
      ghostClass: "opacity-50",
      onEnd: async () => {
        if (!schedulesGridRef.value) return;
        const ids = Array.from(schedulesGridRef.value.children)
          .map((el) => (el as HTMLElement).dataset.id)
          .filter(Boolean) as string[];
        if (ids.length > 0 && props.selectedSemesterId) {
          await educationScheduleStore.reorderSchedules(props.selectedSemesterId, ids);
        }
      },
    });
  }
}

watch(
  () => props.schedules,
  async () => {
    await nextTick();
    initSortable();
  },
  { deep: true }
);

onMounted(() => {
  nextTick(() => {
    initSortable();
  });
});

onBeforeUnmount(() => {
  if (sortableInstance) {
    sortableInstance.destroy();
    sortableInstance = null;
  }
});

function openEditSchedule(schedule: EducationSchedule) {
  selectedScheduleId.value = schedule.id;
  setTimeout(() => {
    f7.popover.open(`#edit-schedule-popover-${schedule.id}`);
  }, 50);
}

function deleteSchedule(schedule: EducationSchedule) {
  f7.dialog
    .create({
      title: "Удаление звонка",
      text: `Вы действительно хотите удалить звонок урока ${schedule.lessonNumber}?`,
      buttons: [
        {
          text: common_cancel(),
          color: "gray",
        },
        {
          text: common_delete(),
          color: "red",
          onClick: async () => {
            await educationScheduleStore.deleteSchedule(schedule.id);
          },
        },
      ],
    })
    .open();
}
</script>
