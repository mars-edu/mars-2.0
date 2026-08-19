<template>
  <AccordionItem id="vacations">
    <template #title>{{ edu_schedule_vacations() }}</template>
    <template #actions>
      <div class="flex gap-2">
        <CopyVacationButton v-if="selectedSemesterId" :semester-id="selectedSemesterId" />
        <AddVacationButton v-if="selectedSemesterId" :semester-id="selectedSemesterId" />
      </div>
    </template>
    <div v-if="vacationStore.isLoading" class="p-4 flex justify-center">
      <f7-preloader />
    </div>
    <div v-else-if="vacationStore.getError" class="p-4 text-destructive">
      {{ vacationStore.getError }}
    </div>
    <div v-else-if="vacations.length === 0">
      <NoData
        :title="edu_schedule_no_vacations()"
        :description="edu_schedule_no_vacations_desc()"
        :icon="IconSun"
      />
    </div>
    <div v-else class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
      <div
        v-for="vacation in vacations"
        :key="vacation.id"
        class="relative group p-4 rounded-xl border transition-all cursor-pointer bg-muted/30 border-border hover:border-border/80 hover:bg-card hover:shadow-sm"
        :id="`vacation-item-${vacation.id}`"
        @click.stop="openEditVacation(vacation)"
      >
        <div class="flex flex-col gap-1 w-full">
          <div class="flex items-center justify-between">
            <span class="text-sm font-bold text-muted-foreground group-hover:text-foreground transition-colors">
              {{ vacation.shortName }}
            </span>
            <div class="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                class="p-1 text-muted-foreground hover:text-primary transition-colors"
                @click.stop="openEditVacation(vacation)"
                aria-label="Edit Vacation"
                type="button"
              >
                <IconPencil class="w-[14px] h-[14px]" />
              </button>
              <button
                class="p-1 text-muted-foreground hover:text-destructive transition-colors"
                @click.stop="deleteVacation(vacation)"
                aria-label="Delete Vacation"
                type="button"
              >
                <IconTrash class="w-[14px] h-[14px]" />
              </button>
            </div>
          </div>
          <div class="flex items-center justify-between mt-1">
            <span class="text-[10px] uppercase tracking-wider font-medium text-muted-foreground">
              {{ formatUiDate(vacation.startDate) }} - {{ formatUiDate(vacation.endDate) }}
            </span>
          </div>
        </div>
      </div>
      <EditVacationButton
        v-if="selectedVacationId"
        :vacation-id="selectedVacationId"
      />
    </div>
  </AccordionItem>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { f7, f7Preloader } from "framework7-vue";
import dayjs from "dayjs";
import IconSun from "~icons/lucide/sun";
import IconPencil from "~icons/lucide/pencil";
import IconTrash from "~icons/lucide/trash-2";
import AccordionItem from "@/components/ui/accordion/AccordionItem.vue";
import NoData from "@/components/ui/accordion/NoData.vue";
import AddVacationButton from "@/components/AddVacationButton.vue";
import CopyVacationButton from "@/components/CopyVacationButton.vue";
import EditVacationButton from "@/components/EditVacationButton.vue";
import { useVacationStore } from "@/stores/vacationStore";
import type { Vacation } from "@/types/vacation";
import {
  edu_schedule_vacations,
  edu_schedule_no_vacations,
  edu_schedule_no_vacations_desc,
  common_delete,
  common_cancel,
} from "@/paraglide/messages";

const props = defineProps<{
  selectedSemesterId: string;
  vacations: Vacation[];
}>();

const vacationStore = useVacationStore();
const selectedVacationId = ref<string | null>(null);

function formatUiDate(dateStr: string): string {
  if (!dateStr) return "";
  const d = dayjs(dateStr);
  return d.isValid() ? d.format("DD.MM.YYYY") : dateStr;
}

function openEditVacation(vacation: Vacation) {
  selectedVacationId.value = vacation.id;
  setTimeout(() => {
    f7.popover.open(`#edit-vacation-popover-${vacation.id}`);
  }, 50);
}

function deleteVacation(vacation: Vacation) {
  f7.dialog
    .create({
      title: "Удаление каникул",
      text: `Вы действительно хотите удалить каникулы "${vacation.shortName}"?`,
      buttons: [
        {
          text: common_cancel(),
          color: "gray",
        },
        {
          text: common_delete(),
          color: "red",
          onClick: async () => {
            await vacationStore.deleteVacation(vacation.id);
          },
        },
      ],
    })
    .open();
}
</script>
