<template>
  <f7-page
    name="education-schedule"
    class="flex flex-col h-screen bg-background text-foreground"
  >
    <Header class="hidden md:block flex-shrink-0 border-b border-border" />

    <div class="flex flex-1 overflow-hidden">
      <Sidebar v-model:activeNavItem="activeNavItem" class="hidden md:block" />

      <div
        class="flex-1 overflow-y-auto p-3 md:p-4 bg-background pb-16 md:pb-6 md:ml-52"
      >
        <div
          class="bg-card text-card-foreground rounded-xl p-4 md:p-4 shadow-sm"
        >
          <div
            class="flex flex-col md:flex-row md:items-center md:gap-3 mb-4 md:mb-4"
          >
            <div
              class="flex flex-col md:flex-row md:items-center md:gap-3 flex-1 mb-4 md:mb-0"
            >
              <span
                class="text-base md:text-lg font-medium md:font-semibold mb-1 md:mb-0"
                >График звонков:</span
              >
            </div>
          </div>

          <Accordion>
            <AccordionItem id="schedule" :default-expanded="true">
              <template #title>Расписание звонков:</template>
              <template #actions>
                <AddEducationScheduleButton />
              </template>
              <div
                v-if="educationScheduleStore.isLoading"
                class="p-4 flex justify-center"
              >
                <f7-preloader></f7-preloader>
              </div>
              <div
                v-else-if="educationScheduleStore.getError"
                class="p-4 text-destructive"
              >
                {{ educationScheduleStore.getError }}
              </div>
              <div v-else class="flex flex-wrap items-center gap-2 md:gap-3">
                <div
                  v-for="schedule in schedules"
                  :key="schedule.id"
                  class="flex items-center gap-2 px-3 py-2 border border-border rounded-lg bg-background hover:bg-muted/50 transition-colors cursor-pointer"
                  :id="`schedule-item-${schedule.id}`"
                  @click.stop="openEditSchedule(schedule)"
                >
                  <span class="font-medium">
                    {{ schedule.lessonNumber }}.
                  </span>
                  <span class="text-sm">
                    {{ schedule.startTime }} - {{ schedule.endTime }}
                  </span>
                  <button
                    class="p-1 hover:bg-primary/10 rounded-md transition-colors"
                    @click.stop="openEditSchedule(schedule)"
                    aria-label="Edit Schedule"
                    type="button"
                  >
                    <f7-icon
                      ios="f7:pencil"
                      md="material:edit"
                      size="18px"
                      class="text-primary"
                    ></f7-icon>
                  </button>
                </div>
                <EditEducationScheduleButton
                  v-for="schedule in schedules"
                  :key="`edit-${schedule.id}`"
                  :schedule="schedule"
                />
              </div>
            </AccordionItem>
          </Accordion>
        </div>
      </div>
    </div>
  </f7-page>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { f7Page, f7Icon, f7, f7Preloader } from "framework7-vue";
import Header from "@/components/Header/Header.vue";
import Sidebar from "@/components/Sidebar/Sidebar.vue";
import Accordion from "@/components/ui/accordion/Accordion.vue";
import AccordionItem from "@/components/ui/accordion/AccordionItem.vue";
import AddEducationScheduleButton from "@/components/AddEducationScheduleButton.vue";
import EditEducationScheduleButton from "@/components/EditEducationScheduleButton.vue";
import { useEducationScheduleStore } from "@/stores/educationScheduleStore";
import { storeToRefs } from "pinia";
import type { EducationSchedule } from "@/stores/educationScheduleStore";

const activeNavItem = ref("education-schedule");
const educationScheduleStore = useEducationScheduleStore();
const { schedules } = storeToRefs(educationScheduleStore);

const openEditSchedule = (schedule: EducationSchedule) => {
  const targetEl = document.getElementById(`schedule-item-${schedule.id}`);
  if (targetEl) {
    f7.popover.open(`#edit-schedule-popover-${schedule.id}`, targetEl);
  }
};

onMounted(async () => {
  await educationScheduleStore.fetchSchedules();
});
</script>
