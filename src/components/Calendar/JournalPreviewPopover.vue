<template>
  <f7-popover
    id="journal-preview-popover"
    style="width: 560px !important"
    :arrow="true"
    close-on-escape
    @popover:closed="onClosed"
  >
    <div class="bg-card text-card-foreground flex flex-col">
      <PopoverHeader
        :onCancel="handleClose"
        cancelText="Закрыть"
        :onSave="handleEdit"
      >
        <template #save="{ disabled, isLoading, onSave }">
          <Button
            variant="success"
            size="md"
            class="ml-auto"
            :disabled="disabled"
            :isLoading="isLoading"
            @click="onSave"
          >
            <f7-icon ios="f7:pencil" md="material:edit" size="20px" />
          </Button>
        </template>
      </PopoverHeader>
      <div class="p-4">
        <JournalCard
          :title="getTitle()"
          :subtitle="getSubtitle()"
          :schedule="getSchedule()"
          :percent="getPercent()"
          @click="handleGoToJournal"
        />
      </div>
    </div>
  </f7-popover>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { f7 } from "framework7-vue";
import JournalCard from "@/components/Cards/JournalCard.vue";
import PopoverHeader from "@/components/ui/PopoverHeader.vue";
import Button from "@/components/ui/Button.vue";
import { useJournalStore, type Journal } from "@/stores/journalStore";
import type { CalendarEvent } from "@/stores/calendarStore";

interface Props {
  event: CalendarEvent & {
    title?: string;
    courseNumber?: number;
    group?: string;
  };
}

const props = defineProps<Props>();

const emit = defineEmits<{
  (e: "go-to", id: number | string): void;
  (e: "edit"): void;
  (e: "cancel"): void;
}>();

const journalStore = useJournalStore();

function getTitle() {
  const journal: Journal | null = journalStore.getJournalById(props.event.id);
  if (!journal) {
    return props.event.title || "Журнал";
  }
  return journalStore.getDisciplineTitle(journal);
}

function getSubtitle() {
  const journal: Journal | null = journalStore.getJournalById(props.event.id);
  if (!journal) {
    return "";
  }
  return journalStore.getJournalSubtitle(journal);
}

function getSchedule() {
  const journal: Journal | null = journalStore.getJournalById(props.event.id);
  if (!journal) {
    return "";
  }
  return journalStore.getJournalScheduleText(journal);
}

function getPercent() {
  const journal: Journal | null = journalStore.getJournalById(props.event.id);
  if (!journal) {
    return 0;
  }
  return journalStore.getJournalPercent(journal);
}

const closingByAction = ref(false);

const handleGoToJournal = () => {
  closingByAction.value = true;
  emit("go-to", props.event.id);
  f7.popover.close("#journal-preview-popover");
};

const handleEdit = () => {
  closingByAction.value = true;
  f7.popover.close("#journal-preview-popover");
  emit("edit");
};

const handleClose = () => {
  f7.popover.close("#journal-preview-popover");
};

const onClosed = () => {
  if (!closingByAction.value) emit("cancel");
  closingByAction.value = false;
};
</script>
