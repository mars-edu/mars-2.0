<template>
  <div>
    <!-- Scheduled Final Controls Section -->
    <AccordionItem id="scheduled-final-controls">
      <template #title>{{ edu_schedule_final_controls() }}</template>
      <template #actions>
        <div class="flex gap-2">
          <CopyScheduledFinalControlButton v-if="selectedSemesterId" :semester-id="selectedSemesterId" />
          <AddScheduledFinalControlButton v-if="selectedSemesterId" :semester-id="selectedSemesterId" />
        </div>
      </template>
      <div v-if="scheduledFinalControlStore.isLoading" class="p-4 flex justify-center">
        <f7-preloader />
      </div>
      <div v-else-if="scheduledFinalControlStore.getError" class="p-4 text-destructive">
        {{ scheduledFinalControlStore.getError }}
      </div>
      <div v-else-if="scheduledFinalControls.length === 0">
        <NoData
          :title="edu_schedule_no_final_controls()"
          :description="edu_schedule_no_final_controls_desc()"
          :icon="IconCircleCheck"
        />
      </div>
      <div v-else class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        <div
          v-for="control in scheduledFinalControls"
          :key="control.id"
          class="relative group p-4 rounded-xl border transition-all cursor-pointer bg-muted/30 border-border hover:border-border/80 hover:bg-card hover:shadow-sm"
          :id="`scheduled-final-control-item-${control.id}`"
          @click.stop="openEditScheduledFinalControl(control)"
        >
          <div class="flex flex-col gap-1 w-full">
            <div class="flex items-center justify-between">
              <span class="text-sm font-bold text-muted-foreground group-hover:text-foreground transition-colors">
                {{ control.shortName }}
              </span>
              <div class="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  class="p-1 text-muted-foreground hover:text-primary transition-colors"
                  @click.stop="openEditScheduledFinalControl(control)"
                  aria-label="Edit Scheduled Final Control"
                  type="button"
                >
                  <IconPencil class="w-[14px] h-[14px]" />
                </button>
                <button
                  class="p-1 text-muted-foreground hover:text-destructive transition-colors"
                  @click.stop="deleteScheduledFinalControl(control)"
                  aria-label="Delete Scheduled Final Control"
                  type="button"
                >
                  <IconTrash class="w-[14px] h-[14px]" />
                </button>
              </div>
            </div>
            <div class="flex items-center justify-between mt-1">
              <span class="text-[10px] uppercase tracking-wider font-medium text-muted-foreground">
                {{ formatUiDate(control.startDate) }} - {{ formatUiDate(control.endDate) }}
              </span>
            </div>
          </div>
        </div>
        <EditScheduledFinalControlButton
          v-if="selectedScheduledFinalControlId"
          :control-id="selectedScheduledFinalControlId"
        />
      </div>
    </AccordionItem>

    <!-- Scheduled Intermediate Controls Section -->
    <AccordionItem id="scheduled-intermediate-controls">
      <template #title>{{ edu_schedule_intermediate_controls() }}</template>
      <template #actions>
        <div class="flex gap-2">
          <CopyScheduledIntermediateControlButton v-if="selectedSemesterId" :semester-id="selectedSemesterId" />
          <AddScheduledIntermediateControlButton v-if="selectedSemesterId" :semester-id="selectedSemesterId" />
        </div>
      </template>
      <div v-if="scheduledIntermediateControlStore.isLoading" class="p-4 flex justify-center">
        <f7-preloader />
      </div>
      <div v-else-if="scheduledIntermediateControlStore.getError" class="p-4 text-destructive">
        {{ scheduledIntermediateControlStore.getError }}
      </div>
      <div v-else-if="scheduledIntermediateControls.length === 0">
        <NoData
          :title="edu_schedule_no_intermediate_controls()"
          :description="edu_schedule_no_intermediate_controls_desc()"
          :icon="IconCircleCheck"
        />
      </div>
      <div v-else class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        <div
          v-for="control in scheduledIntermediateControls"
          :key="control.id"
          class="relative group p-4 rounded-xl border transition-all cursor-pointer bg-muted/30 border-border hover:border-border/80 hover:bg-card hover:shadow-sm"
          :id="`scheduled-intermediate-control-item-${control.id}`"
          @click.stop="openEditScheduledIntermediateControl(control)"
        >
          <div class="flex flex-col gap-1 w-full">
            <div class="flex items-center justify-between">
              <span class="text-sm font-bold text-muted-foreground group-hover:text-foreground transition-colors">
                {{ control.shortName }}
              </span>
              <div class="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  class="p-1 text-muted-foreground hover:text-primary transition-colors"
                  @click.stop="openEditScheduledIntermediateControl(control)"
                  aria-label="Edit Scheduled Intermediate Control"
                  type="button"
                >
                  <IconPencil class="w-[14px] h-[14px]" />
                </button>
                <button
                  class="p-1 text-muted-foreground hover:text-destructive transition-colors"
                  @click.stop="deleteScheduledIntermediateControl(control)"
                  aria-label="Delete Scheduled Intermediate Control"
                  type="button"
                >
                  <IconTrash class="w-[14px] h-[14px]" />
                </button>
              </div>
            </div>
            <div class="flex items-center justify-between mt-1">
              <span class="text-[10px] uppercase tracking-wider font-medium text-muted-foreground">
                {{ formatUiDate(control.startDate) }} - {{ formatUiDate(control.endDate) }}
              </span>
            </div>
          </div>
        </div>
        <EditScheduledIntermediateControlButton
          v-if="selectedScheduledIntermediateControlId"
          :control-id="selectedScheduledIntermediateControlId"
        />
      </div>
    </AccordionItem>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { f7, f7Preloader } from "framework7-vue";
import dayjs from "dayjs";
import IconCircleCheck from "~icons/lucide/circle-check";
import IconPencil from "~icons/lucide/pencil";
import IconTrash from "~icons/lucide/trash-2";
import AccordionItem from "@/components/ui/accordion/AccordionItem.vue";
import NoData from "@/components/ui/accordion/NoData.vue";
import AddScheduledFinalControlButton from "@/components/AddScheduledFinalControlButton.vue";
import CopyScheduledFinalControlButton from "@/components/CopyScheduledFinalControlButton.vue";
import EditScheduledFinalControlButton from "@/components/EditScheduledFinalControlButton.vue";
import AddScheduledIntermediateControlButton from "@/components/AddScheduledIntermediateControlButton.vue";
import CopyScheduledIntermediateControlButton from "@/components/CopyScheduledIntermediateControlButton.vue";
import EditScheduledIntermediateControlButton from "@/components/EditScheduledIntermediateControlButton.vue";
import { useScheduledFinalControlStore } from "@/stores/scheduledFinalControlStore";
import { useScheduledIntermediateControlStore } from "@/stores/scheduledIntermediateControlStore";
import type { ScheduledFinalControl } from "@/types/scheduled-final-control";
import type { ScheduledIntermediateControl } from "@/types/scheduled-intermediate-control";
import {
  edu_schedule_final_controls,
  edu_schedule_no_final_controls,
  edu_schedule_no_final_controls_desc,
  edu_schedule_intermediate_controls,
  edu_schedule_no_intermediate_controls,
  edu_schedule_no_intermediate_controls_desc,
  common_delete,
  common_cancel,
} from "@/paraglide/messages";

const props = defineProps<{
  selectedSemesterId: string;
  scheduledFinalControls: ScheduledFinalControl[];
  scheduledIntermediateControls: ScheduledIntermediateControl[];
}>();

const scheduledFinalControlStore = useScheduledFinalControlStore();
const scheduledIntermediateControlStore = useScheduledIntermediateControlStore();
const selectedScheduledFinalControlId = ref<string | null>(null);
const selectedScheduledIntermediateControlId = ref<string | null>(null);

function formatUiDate(dateStr: string): string {
  if (!dateStr) return "";
  const d = dayjs(dateStr);
  return d.isValid() ? d.format("DD.MM.YYYY") : dateStr;
}

function openEditScheduledFinalControl(control: ScheduledFinalControl) {
  selectedScheduledFinalControlId.value = control.id;
  setTimeout(() => {
    f7.popover.open(`#edit-scheduled-final-control-popover-${control.id}`);
  }, 50);
}

function deleteScheduledFinalControl(control: ScheduledFinalControl) {
  f7.dialog
    .create({
      title: "Удаление контроля",
      text: `Вы действительно хотите удалить форму контроля "${control.shortName}"?`,
      buttons: [
        {
          text: common_cancel(),
          color: "gray",
        },
        {
          text: common_delete(),
          color: "red",
          onClick: async () => {
            await scheduledFinalControlStore.deleteScheduledFinalControl(control.id);
          },
        },
      ],
    })
    .open();
}

function openEditScheduledIntermediateControl(control: ScheduledIntermediateControl) {
  selectedScheduledIntermediateControlId.value = control.id;
  setTimeout(() => {
    f7.popover.open(`#edit-scheduled-intermediate-control-popover-${control.id}`);
  }, 50);
}

function deleteScheduledIntermediateControl(control: ScheduledIntermediateControl) {
  f7.dialog
    .create({
      title: "Удаление контроля",
      text: `Вы действительно хотите удалить форму контроля "${control.shortName}"?`,
      buttons: [
        {
          text: common_cancel(),
          color: "gray",
        },
        {
          text: common_delete(),
          color: "red",
          onClick: async () => {
            await scheduledIntermediateControlStore.deleteScheduledIntermediateControl(control.id);
          },
        },
      ],
    })
    .open();
}
</script>
