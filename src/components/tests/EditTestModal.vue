<template>
  <GuardedPopover
    ref="editTestPopupRef"
    v-slot="{ requestClose }"
    id="edit-test-popup"
    kind="popup"
    :opened="opened"
    :close-on-escape="true"
    @popup:closed="$emit('update:opened', false)"
    style="width: 800px !important"
  >
    <div class="cabinet-popover bg-card text-card-foreground flex flex-col h-full max-h-[90vh]">
      <PopoverHeader title="Редактирование теста" subtitle="Внесение изменений в тест" :on-cancel="requestClose" />

      <div class="p-8 space-y-6 overflow-y-auto flex-1 no-scrollbar">
        <!-- Basic Info & Settings -->
        <div class="space-y-4">
          <input
            v-model="testData.title"
            type="text"
            placeholder="Название теста"
            class="w-full bg-muted border-none rounded-xl px-4 py-3 text-[15px] text-foreground placeholder-muted-foreground focus:ring-2 focus:ring-primary/20 focus:bg-background transition-all outline-none"
          />
          <input
            v-model="testData.subject"
            type="text"
            placeholder="Предмет"
            class="w-full bg-muted border-none rounded-xl px-4 py-3 text-[15px] text-foreground placeholder-muted-foreground focus:ring-2 focus:ring-primary/20 focus:bg-background transition-all outline-none"
          />
          <div class="flex gap-4">
            <div class="flex-1 space-y-1">
              <label class="text-[10px] uppercase font-bold text-muted-foreground ml-1">Длительность теста (мин)</label>
              <input
                v-model.number="testData.duration"
                type="number"
                placeholder="Время (мин)"
                class="w-full bg-muted border-none rounded-xl px-4 py-3 text-[15px] text-foreground placeholder-muted-foreground focus:ring-2 focus:ring-primary/20 focus:bg-background transition-all outline-none"
              />
            </div>
            
            <label class="flex items-center justify-between px-4 bg-muted rounded-xl cursor-pointer flex-1 mt-4">
              <span class="text-sm font-medium text-foreground">Пробный тест</span>
              <div class="w-10 h-6 rounded-full transition-colors flex items-center p-1" :class="testData.isPractice ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'">
                <div class="w-4 h-4 bg-white rounded-full shadow-sm transition-transform" :class="testData.isPractice ? 'translate-x-4' : 'translate-x-0'"></div>
              </div>
              <input type="checkbox" class="hidden" v-model="testData.isPractice" />
            </label>
            
            <label class="flex items-center justify-between px-4 bg-muted rounded-xl cursor-pointer flex-1 mt-4">
              <span class="text-sm font-medium text-foreground">Перемешать вопросы</span>
              <div class="w-10 h-6 rounded-full transition-colors flex items-center p-1" :class="testData.shuffleQuestions ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'">
                <div class="w-4 h-4 bg-white rounded-full shadow-sm transition-transform" :class="testData.shuffleQuestions ? 'translate-x-4' : 'translate-x-0'"></div>
              </div>
              <input type="checkbox" class="hidden" v-model="testData.shuffleQuestions" />
            </label>
          </div>
        </div>

        <!-- Questions -->
        <div class="space-y-4 pt-4">
          <div class="flex justify-between items-center">
            <label class="block text-[13px] font-medium text-muted-foreground uppercase tracking-wide ml-1">Вопросы</label>
          </div>

          <!-- Question Constructor -->
          <div class="bg-muted p-4 rounded-xl space-y-3">
            <div class="flex gap-2">
              <input
                v-model="currentQuestion.text"
                type="text"
                class="flex-1 bg-background border-none rounded-xl px-4 py-3 text-[15px] text-foreground focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                placeholder="Текст вопроса"
              />
            </div>
            <div class="space-y-2 mt-2">
              <div v-for="(opt, idx) in currentQuestion.options" :key="idx" class="flex items-center gap-2">
                <input
                  type="radio"
                  :name="'correct_edit_new'"
                  :checked="currentQuestion.correctIndex === idx"
                  @change="currentQuestion.correctIndex = idx"
                  class="accent-orange-500 w-4 h-4"
                />
                <input
                  v-model="currentQuestion.options[idx]"
                  type="text"
                  class="flex-1 rounded-xl px-4 py-3 text-[15px] focus:outline-none transition-all border border-transparent"
                  :class="currentQuestion.correctIndex === idx ? 'bg-orange-500/10 border-orange-500 text-orange-700 dark:text-orange-400' : 'bg-background text-foreground'"
                  :placeholder="'Вариант ' + String.fromCharCode(65 + idx)"
                />
              </div>
            </div>
            <div class="flex justify-end pt-2">
              <button
                @click="addQuestion"
                :disabled="!isCurrentQuestionValid"
                class="flex items-center gap-2 px-4 py-2 bg-foreground text-background rounded-xl text-sm font-bold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <IconPlusCircle class="w-4 h-4" /> Добавить вопрос
              </button>
            </div>
          </div>

          <!-- Added Questions List -->
          <div class="space-y-4 mt-4">
            <div v-for="(q, i) in testData.questions" :key="q.id" class="p-4 bg-background rounded-xl border border-border text-sm space-y-2 relative group">
              <div class="flex justify-between items-start">
                <div class="flex items-start gap-3">
                  <IconGripVertical class="w-4 h-4 text-muted-foreground mt-0.5" />
                  <span class="font-bold text-muted-foreground">{{ i + 1 }}.</span>
                  <span class="text-foreground font-bold">{{ q.text }}</span>
                </div>
                <button @click="removeQuestion(q.id)" class="text-muted-foreground hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100">
                  <IconTrash class="w-4 h-4" />
                </button>
              </div>
              <div class="pl-10 grid grid-cols-2 gap-2 mt-2">
                <div v-for="(opt, idx) in q.options" :key="idx" class="px-3 py-2 rounded-lg text-xs" :class="idx === q.correctIndex ? 'bg-green-500/10 text-green-600 font-bold' : 'bg-muted text-muted-foreground'">
                  {{ String.fromCharCode(65 + idx) }}. {{ opt }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <PopoverFooter
        :on-save="saveTest"
        :on-cancel="requestClose"
        :disabled="!isValid"
        save-text="Сохранить"
      />
    </div>
  </GuardedPopover>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import IconPlus from '~icons/lucide/plus';
import IconPlusCircle from '~icons/lucide/plus-circle';
import IconTrash from '~icons/lucide/trash-2';
import IconGripVertical from '~icons/lucide/grip-vertical';
import GuardedPopover from "@/components/ui/GuardedPopover.vue";
import PopoverHeader from "@/components/ui/PopoverHeader.vue";
import PopoverFooter from "@/components/ui/PopoverFooter.vue";

const props = defineProps<{
  opened: boolean;
  initialData: any;
}>();

const emit = defineEmits<{
  (e: 'update:opened', val: boolean): void;
  (e: 'save', test: any): void;
}>();

const editTestPopupRef = ref<{ allowNextClose: () => void } | null>(null);

const testData = ref({
  title: '',
  subject: '',
  duration: 45,
  isPractice: false,
  shuffleQuestions: false,
  questions: [] as any[],
});

const currentQuestion = ref({
  text: '',
  options: ['', '', '', ''],
  correctIndex: 0
});

watch(() => props.opened, (val) => {
  if (val && props.initialData) {
    testData.value = JSON.parse(JSON.stringify(props.initialData));
    if (!testData.value.questions) testData.value.questions = [];
    currentQuestion.value = {
      text: '',
      options: ['', '', '', ''],
      correctIndex: 0
    };
  }
});

const isCurrentQuestionValid = computed(() => {
  if (!currentQuestion.value.text.trim()) return false;
  if (currentQuestion.value.options.some(opt => !opt.trim())) return false;
  return true;
});

function addQuestion() {
  if (!isCurrentQuestionValid.value) return;
  testData.value.questions.push({
    id: Math.random().toString(36).substring(2, 9),
    ...currentQuestion.value
  });
  currentQuestion.value = {
    text: '',
    options: ['', '', '', ''],
    correctIndex: 0
  };
}

const isValid = computed(() => {
  if (!testData.value.title || !testData.value.subject || testData.value.duration <= 0) return false;
  if (testData.value.questions.length === 0) return false;
  return true;
});

function removeQuestion(id: string) {
  testData.value.questions = testData.value.questions.filter((q) => q.id !== id);
}

function saveTest() {
  const payload = {
    ...testData.value,
    questionsCount: testData.value.questions.length,
  };
  if (typeof payload.duration === 'string') {
    payload.duration = parseInt(payload.duration, 10);
  }
  emit('save', payload);
  if (editTestPopupRef.value) editTestPopupRef.value.allowNextClose();
  emit('update:opened', false);
}
</script>
