<template>
  <GuardedPopover
    ref="viewTestPopupRef"
    v-slot="{ requestClose }"
    id="view-test-popup"
    kind="popup"
    :opened="opened"
    :close-on-escape="true"
    @popup:closed="$emit('update:opened', false)"
    style="width: 800px !important"
  >
    <div class="cabinet-popover bg-card text-card-foreground flex flex-col h-full max-h-[90vh]">
      <PopoverHeader :title="test?.title" subtitle="Просмотр теста" :on-cancel="requestClose" />

      <div class="p-6 space-y-6 overflow-y-auto flex-1">
        <div v-if="test" class="space-y-6">
          <div class="flex gap-4 text-sm text-muted-foreground">
            <span class="flex items-center gap-1"><IconFileText class="w-4 h-4 text-emerald-500" /> {{ test.questionsCount }} вопросов</span>
            <span class="flex items-center gap-1"><IconClock class="w-4 h-4 text-emerald-500" /> {{ test.duration }} мин.</span>
          </div>
          
          <div class="space-y-4">
            <div v-for="(q, i) in test.questions" :key="q.id" class="p-4 bg-muted/30 rounded-xl border border-border">
              <p class="font-bold mb-3 text-foreground">{{ i + 1 }}. {{ q.text }}</p>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                <div v-for="(opt, idx) in q.options" :key="idx" class="px-3 py-2 rounded-lg transition-colors" :class="idx === q.correctIndex ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400 font-bold border border-emerald-200 dark:border-emerald-800/50' : 'bg-background text-muted-foreground border border-border'">
                  {{ String.fromCharCode(65 + idx) }}. {{ opt }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="border-t border-input flex items-center justify-between px-8 py-6 flex-shrink-0 bg-white/80 backdrop-blur-xl gap-4">
        <button
          class="w-auto py-3.5 px-6 text-[15px] font-semibold transition-colors rounded-2xl text-gray-500 hover:bg-gray-50 flex-1 border border-border"
          @click="requestClose"
        >
          Закрыть
        </button>
        <button
          class="w-auto py-3.5 px-8 text-[15px] font-bold transition-all rounded-xl flex items-center justify-center gap-2 shadow-lg active:scale-95 flex-1 bg-red-500 hover:bg-red-600 text-white"
          @click="onDelete"
        >
          Удалить
        </button>
        <button
          class="w-auto py-3.5 px-8 text-[15px] font-bold transition-all rounded-xl flex items-center justify-center gap-2 shadow-lg active:scale-95 flex-1 bg-amber-500 hover:bg-amber-600 text-white"
          @click="onEdit"
        >
          Редактировать
        </button>
      </div>
    </div>
  </GuardedPopover>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import IconFileText from '~icons/lucide/file-text';
import IconClock from '~icons/lucide/clock';
import GuardedPopover from "@/components/ui/GuardedPopover.vue";
import PopoverHeader from "@/components/ui/PopoverHeader.vue";

const props = defineProps<{
  opened: boolean;
  test: any;
}>();

const emit = defineEmits<{
  (e: 'update:opened', val: boolean): void;
  (e: 'edit', test: any): void;
  (e: 'delete', id: string): void;
}>();

const viewTestPopupRef = ref<{ allowNextClose: () => void } | null>(null);

function onEdit() {
  emit('edit', props.test);
}

function onDelete() {
  if (viewTestPopupRef.value) viewTestPopupRef.value.allowNextClose();
  emit('delete', props.test._id);
}
</script>
