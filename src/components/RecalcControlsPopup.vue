<template>
  <GuardedPopover
    id="recalc-popup"
    kind="popup"
    :guard-unsaved="false"
    :close-by-backdrop-click="true"
    :on-closed="handleClosed"
  >
    <div class="bg-card text-card-foreground h-full flex flex-col">
      <!-- Header -->
      <div class="px-6 pt-6 pb-4 flex justify-between items-center border-b border-border">
        <h2 class="text-xl font-bold text-foreground tracking-tight">{{ journal_recalc_controls() }}</h2>
        <button
          type="button"
          @click="closePopup"
          class="w-9 h-9 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:bg-muted/80 transition-colors"
        >
          <IconCircleX class="w-5 h-5" />
        </button>
      </div>

      <!-- Content -->
      <div class="flex-1 overflow-y-auto px-6 py-5 space-y-6">
        <!-- Control Selector -->
        <div>
          <Select
            v-model="selectedRecalcControl"
            :options="recalcControlOptions"
            label="Выберите контроль"
            placeholder="Выберите..."
          />
        </div>

        <!-- Student Selection -->
        <div class="space-y-3">
          <div class="flex items-center justify-between">
            <h3 class="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              Выберите студентов
            </h3>
            <button
              type="button"
              @click="toggleAllRecalcStudents"
              class="text-xs font-bold text-foreground hover:underline"
            >
              {{ selectedRecalcStudentIds.length === students.length ? 'Снять всех' : 'Выбрать всех' }}
            </button>
          </div>
          <div class="grid grid-cols-1 gap-2">
            <label
              v-for="student in students"
              :key="student.studentId"
              class="flex items-center gap-3 p-3 rounded-xl border border-border hover:bg-muted cursor-pointer transition-colors"
            >
              <input
                type="checkbox"
                :checked="selectedRecalcStudentIds.includes(student.studentId)"
                @change="toggleRecalcStudent(student.studentId)"
                class="w-4 h-4 rounded border-border text-primary focus:ring-primary"
              />
              <span class="text-sm font-medium text-foreground">{{ student.name }}</span>
            </label>
          </div>
        </div>
      </div>

      <!-- Footer -->
      <PopoverFooter
        cancel-text="Отмена"
        :save-text="journal_recalc_controls()"
        save-variant="primary"
        :disabled="selectedRecalcStudentIds.length === 0 || !selectedRecalcControl"
        :on-cancel="closePopup"
        :on-save="handleSave"
      />
    </div>
  </GuardedPopover>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { f7 } from 'framework7-vue';
import IconCircleX from '~icons/lucide/circle-x';
import GuardedPopover from '@/components/ui/GuardedPopover.vue';
import PopoverFooter from '@/components/ui/PopoverFooter.vue';
import Select from '@/components/ui/Select.vue';
import { journal_recalc_controls } from '@/paraglide/messages';

const props = defineProps<{
  students: any[];
  recalcControlOptions: Array<{ value: string; text: string }>;
}>();

const emit = defineEmits<{
  submit: [control: string, studentIds: string[]];
  closed: [];
}>();

const selectedRecalcControl = ref('');
const selectedRecalcStudentIds = ref<string[]>([]);

const handleClosed = () => {
  selectedRecalcControl.value = '';
  selectedRecalcStudentIds.value = [];
  emit('closed');
};

const closePopup = () => {
  f7.popup.close('#recalc-popup');
};

const toggleRecalcStudent = (studentId: string) => {
  const idx = selectedRecalcStudentIds.value.indexOf(studentId);
  if (idx >= 0) {
    selectedRecalcStudentIds.value.splice(idx, 1);
  } else {
    selectedRecalcStudentIds.value.push(studentId);
  }
};

const toggleAllRecalcStudents = () => {
  if (selectedRecalcStudentIds.value.length === props.students.length) {
    selectedRecalcStudentIds.value = [];
  } else {
    selectedRecalcStudentIds.value = props.students.map(s => s.studentId);
  }
};

const handleSave = () => {
  if (!selectedRecalcControl.value || selectedRecalcStudentIds.value.length === 0) return;
  emit('submit', selectedRecalcControl.value, selectedRecalcStudentIds.value);
  closePopup();
};

defineExpose({
  open() {
    selectedRecalcControl.value = '';
    selectedRecalcStudentIds.value = props.students.map(s => s.studentId);
    f7.popup.open('#recalc-popup');
  }
});
</script>
