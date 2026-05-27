<template>
  <GuardedPopover
    ref="assignTestPopupRef"
    v-slot="{ requestClose }"
    id="assign-test-popup"
    kind="popup"
    :opened="opened"
    :close-on-escape="true"
    @popup:closed="$emit('update:opened', false)"
    style="width: 500px !important"
  >
    <div class="cabinet-popover bg-card text-card-foreground flex flex-col h-full max-h-[90vh]">
      <PopoverHeader title="Назначить тест" :subtitle="test?.title" :on-cancel="requestClose" />

      <div class="p-6 space-y-6 overflow-y-auto flex-1">
        <div class="space-y-4">
          <div class="space-y-2">
            <label class="text-[13px] font-medium text-muted-foreground uppercase tracking-wide ml-1">Выберите группу (журнал)</label>
            <select
              v-model="assignment.journalId"
              class="w-full bg-muted border-none rounded-xl px-4 py-3 text-[15px] text-foreground focus:ring-2 focus:ring-primary/20 outline-none transition-all cursor-pointer"
            >
              <option value="" disabled>-- Выберите журнал --</option>
              <option v-for="j in journals" :key="j.id" :value="j.id">
                {{ journalStore.getJournalTitle(j) }} ({{ journalStore.getDisciplineTitle(j) }})
              </option>
            </select>
          </div>
          
          <div class="space-y-2">
            <label class="text-[13px] font-medium text-muted-foreground uppercase tracking-wide ml-1">Дата проведения</label>
            <input
              v-model="assignment.date"
              type="date"
              class="w-full bg-muted border-none rounded-xl px-4 py-3 text-[15px] text-foreground focus:ring-2 focus:ring-primary/20 outline-none transition-all"
            />
          </div>
        </div>
      </div>

      <PopoverFooter
        :on-save="onAssign"
        :on-cancel="requestClose"
        :disabled="!isValid"
        save-text="Назначить"
      />
    </div>
  </GuardedPopover>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import { useJournalStore } from '@/stores/journalStore';
import GuardedPopover from "@/components/ui/GuardedPopover.vue";
import PopoverHeader from "@/components/ui/PopoverHeader.vue";
import PopoverFooter from "@/components/ui/PopoverFooter.vue";

const props = defineProps<{
  opened: boolean;
  test: any;
}>();

const emit = defineEmits<{
  (e: 'update:opened', val: boolean): void;
  (e: 'assign', data: { testId: string; journalId: string; date: string }): void;
}>();

const journalStore = useJournalStore();
const journals = computed(() => journalStore.journals);

const assignTestPopupRef = ref<{ allowNextClose: () => void } | null>(null);

const assignment = ref({
  journalId: '',
  date: new Date().toISOString().split('T')[0],
});

watch(() => props.opened, (val) => {
  if (val) {
    assignment.value.journalId = '';
    assignment.value.date = new Date().toISOString().split('T')[0];
  }
});

onMounted(async () => {
  if (journals.value.length === 0) {
    await journalStore.loadJournals();
  }
});

const isValid = computed(() => {
  return assignment.value.journalId && assignment.value.date;
});

function onAssign() {
  if (!props.test) return;
  emit('assign', {
    testId: props.test._id,
    journalId: assignment.value.journalId,
    date: assignment.value.date,
  });
  if (assignTestPopupRef.value) assignTestPopupRef.value.allowNextClose();
  emit('update:opened', false);
}
</script>
