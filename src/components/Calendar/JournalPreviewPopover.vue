<template>
  <f7-popover
    id="journal-preview-popover"
    style="width: 560px !important"
    :arrow="true"
    close-on-escape
    @popover:closed="onClosed"
  >
    <div class="bg-card text-card-foreground">
      <div class="p-4">
        <JournalCard
          :title="title"
          :subtitle="subtitle"
          :schedule="scheduleText"
          :percent="percent"
          @click="noop"
        />
      </div>

      <div class="px-4 pb-4 flex items-center gap-3">
        <button
          type="button"
          class="flex-1 h-11 rounded-xl border border-primary text-primary hover:bg-primary/5 transition-colors"
          @click="handleGoToJournal"
        >
          Перейти журнал
        </button>
        <button
          type="button"
          class="w-11 h-11 rounded-xl border border-input hover:bg-secondary grid place-items-center"
          @click="handleEdit"
        >
          <i class="f7-icons text-foreground">pencil</i>
        </button>
      </div>
    </div>
  </f7-popover>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { f7 } from "framework7-vue";
import JournalCard from "@/components/Cards/JournalCard.vue";
import { useJournalStore, type Journal } from "@/stores/journalStore";
import { useClass9Store } from "@/stores/class9Store";

interface Props {
  event: any;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  (e: "go-to", id: number | string): void;
  (e: "edit"): void;
  (e: "cancel"): void;
}>();

const journalStore = useJournalStore();
const class9Store = useClass9Store();

const title = computed(() => {
  const journal: Journal | null = journalStore.getJournalById(props.event.id);
  if (!journal) {
    const item = class9Store.getClass9ById(props.event.class9Id as any);
    const outcome = item?.learningOutcome?.trim() || "";
    const index = item?.moduleIndex?.trim() || "";
    return `${index} ${outcome}`.trim() || props.event.title || "Журнал";
  }
  if (!journal.students || journal.students.length === 0) return journal.title;
  return journalStore.generateJournalTitle(
    journal.courseNumber,
    journal.students || []
  );
});

const subtitle = computed(() => {
  const journal: Journal | null = journalStore.getJournalById(props.event.id);
  const course = journal?.courseNumber ?? props.event.courseNumber ?? "";
  const group = journal?.group ?? props.event.group ?? "";
  return `${course} курс // ${group}`.trim();
});

const scheduleText = computed(() => {
  const ws = props.event.weeklySchedules?.[0];
  if (!ws) return "расписание не задано";
  const dowMap: Record<number, string> = {
    1: "ПН",
    2: "ВТ",
    3: "СР",
    4: "ЧТ",
    5: "ПТ",
    6: "СБ",
    7: "ВС",
  };
  const day = dowMap[ws.weekId] || "";
  const start = ws.startTime || "";
  const end = ws.endTime || "";
  return `${day} // ${start}-${end}`.trim();
});

const percent = computed(() => 25);

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

const onClosed = () => {
  if (!closingByAction.value) emit("cancel");
  closingByAction.value = false;
};

const noop = () => {};
</script>
