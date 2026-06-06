<template>
  <GuardedPopover
    id="retake-popup"
    kind="popup"
    :opened="isOpen"
    :close-on-escape="true"
    @popup:closed="close"
    class="retake-popup"
  >
    <div class="bg-card text-card-foreground h-full flex flex-col">
      <div class="fixed-header">
        <PopoverHeader
          title="Назначение пересдачи"
          :subtitle="step === 'confirm' ? 'Подтвердите действие' : step === 'success' ? 'Заявка отправлена' : 'Укажите параметры заявки'"
          cancel-text="Закрыть"
          :on-cancel="close"
        >
          <div class="flex gap-1.5 pt-4">
            <div class="h-1 flex-1 rounded-full overflow-hidden bg-muted">
              <div class="h-full bg-orange-500 transition-all duration-200" :class="step === 'form' || step === 'confirm' || step === 'success' ? 'w-full' : 'w-0'" />
            </div>
            <div class="h-1 flex-1 rounded-full overflow-hidden bg-muted">
              <div class="h-full bg-orange-500 transition-all duration-200" :class="step === 'confirm' || step === 'success' ? 'w-full' : 'w-0'" />
            </div>
            <div class="h-1 flex-1 rounded-full overflow-hidden bg-muted">
              <div class="h-full bg-orange-500 transition-all duration-200" :class="step === 'success' ? 'w-full' : 'w-0'" />
            </div>
          </div>
        </PopoverHeader>
      </div>

      <div class="wizard-content px-8 py-4 space-y-6 flex-1 overflow-y-auto">
        <!-- Step 1: Form -->
        <section v-if="step === 'form'" class="space-y-6">
          <div class="space-y-1.5">
            <div class="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/70 ml-1">
              Студенты
            </div>
            <div class="bg-card rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.04)] border border-border/60 max-h-48 overflow-y-auto">
              <template v-if="students.length > 0">
                <label v-for="s in students" :key="s.id" class="flex items-center gap-3 p-3 hover:bg-muted/50 cursor-pointer transition-colors border-b border-border/40 last:border-0">
                  <input 
                    type="checkbox" 
                    class="h-5 w-5 rounded border-border text-orange-500 focus:ring-orange-500/50"
                    :value="s.id"
                    v-model="selectedStudentIds"
                  />
                  <span class="text-sm font-medium text-foreground">{{ s.name }}</span>
                </label>
              </template>
              <div v-else class="text-sm text-muted-foreground p-4 text-center">Нет доступных студентов</div>
            </div>
            <div class="text-xs font-medium text-muted-foreground text-right mt-1">
              Выбрано: {{ selectedStudentIds.length }}
            </div>
          </div>

          <div class="space-y-1.5">
            <div class="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/70 ml-1">
              Тип контроля
            </div>
            <Select
              id="retake-type"
              placeholder="Выберите тип"
              v-model="retakeType"
              :options="retakeTypeOptions"
            />
          </div>

          <div class="space-y-1.5">
            <div class="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/70 ml-1">
              Основание <span class="text-red-500">*</span>
            </div>
            <textarea
              class="w-full bg-card rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.04)] border border-border/60 p-4 text-[15px] focus:border-orange-500/50 focus:ring-4 focus:ring-orange-500/10 outline-none transition-all min-h-[100px] resize-none"
              :class="retakeReason.trim() === '' && hasTriedNext ? 'border-red-300 focus:border-red-500 focus:ring-red-500/10' : ''"
              placeholder="Например: Заявление студента, Справка..."
              v-model="retakeReason"
            ></textarea>
            <div v-if="retakeReason.trim() === '' && hasTriedNext" class="text-xs text-red-500 ml-1">
              Укажите основание для пересдачи
            </div>
          </div>

          <!-- File upload -->
          <div class="space-y-1.5">
            <div class="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/70 ml-1">
              Прикрепить файлы
            </div>
            <div
              class="relative w-full rounded-2xl border-2 border-dashed p-6 text-center transition-all cursor-pointer"
              :class="isDragging
                ? 'border-orange-500 bg-orange-50/50'
                : 'border-border/60 hover:border-orange-500/50 hover:bg-orange-50/20'"
              @click="fileInputRef?.click()"
              @dragenter.prevent="isDragging = true"
              @dragover.prevent="isDragging = true"
              @dragleave.prevent="isDragging = false"
              @drop.prevent="onDrop"
            >
              <IconUpload class="w-6 h-6 mx-auto mb-2 text-muted-foreground/50" />
              <p class="text-sm font-medium text-muted-foreground">
                Перетащите файлы сюда или <span class="text-orange-500">выберите</span>
              </p>
              <p class="text-xs text-muted-foreground/60 mt-1">PDF, JPG, PNG до 10 МБ</p>
              <input
                ref="fileInputRef"
                type="file"
                multiple
                accept=".pdf,.jpg,.jpeg,.png"
                class="hidden"
                @change="onFileSelect"
              />
            </div>
            <div v-if="attachedFiles.length > 0" class="space-y-2 mt-2">
              <div
                v-for="(file, idx) in attachedFiles"
                :key="idx"
                class="flex items-center gap-3 bg-muted/50 rounded-xl px-3 py-2"
              >
                <IconFile class="w-4 h-4 text-muted-foreground flex-shrink-0" />
                <span class="text-sm font-medium text-foreground truncate flex-1">{{ file.name }}</span>
                <span class="text-xs text-muted-foreground flex-shrink-0">{{ formatFileSize(file.size) }}</span>
                <button
                  @click.stop="attachedFiles.splice(idx, 1)"
                  class="p-1 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors flex-shrink-0"
                >
                  <IconX class="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          <div class="bg-orange-50/50 border border-orange-100 p-4 rounded-2xl flex gap-3 items-start">
            <IconInfo class="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
            <div class="text-sm text-orange-800 leading-relaxed font-medium">
              Заявка будет отправлена администратору по академическим вопросам на рассмотрение. После одобрения поле пересдачи станет активным.
            </div>
          </div>
        </section>

        <!-- Step 2: Confirmation -->
        <section v-if="step === 'confirm'" class="flex flex-col items-center justify-center text-center py-8">
          <div class="w-20 h-20 bg-orange-50 rounded-full flex items-center justify-center mb-6 text-orange-500 shadow-sm border border-orange-100">
            <IconAlertCircle class="w-10 h-10" />
          </div>
          <h3 class="text-2xl font-bold text-foreground tracking-tight mb-3">Подтверждение</h3>
          <p class="text-muted-foreground text-[15px] max-w-[300px] mx-auto leading-relaxed">
            Вы действительно хотите отправить заявку на пересдачу для <span class="font-bold text-foreground">{{ selectedStudentIds.length }} студентов</span>?
          </p>
        </section>

        <!-- Step 3: Success -->
        <section v-if="step === 'success'" class="flex flex-col items-center justify-center text-center py-8">
          <div class="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mb-6 text-green-500 shadow-sm border border-green-100">
            <IconCheckCircle class="w-10 h-10" />
          </div>
          <h3 class="text-2xl font-bold text-foreground tracking-tight mb-3">Заявка отправлена</h3>
          <p class="text-muted-foreground text-[15px] max-w-[300px] mx-auto leading-relaxed">
            Ваша заявка успешно отправлена и находится на рассмотрении у администратора по академическим вопросам.
          </p>
        </section>
      </div>

      <!-- Footer -->
      <div class="p-6 bg-card border-t border-border flex justify-between gap-4 mt-auto">
        <button 
          v-if="step === 'form'"
          @click="close"
          class="px-6 py-3 rounded-xl font-semibold bg-[#F2F2F7] text-muted-foreground hover:bg-[#E5E5EA] transition-colors"
        >
          Отмена
        </button>
        <button
          v-if="step === 'form'"
          @click="onNext"
          :disabled="selectedStudentIds.length === 0"
          class="px-6 py-3 rounded-xl font-bold bg-orange-500 text-white shadow-lg shadow-orange-500/20 hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed ml-auto"
        >
          Далее
        </button>

        <button 
          v-if="step === 'confirm'"
          @click="step = 'form'"
          class="px-6 py-3 rounded-xl font-semibold bg-[#F2F2F7] text-muted-foreground hover:bg-[#E5E5EA] transition-colors"
        >
          Назад
        </button>
        <button 
          v-if="step === 'confirm'"
          @click="submit"
          :disabled="isSubmitting"
          class="px-6 py-3 rounded-xl font-bold bg-orange-500 text-white shadow-lg shadow-orange-500/20 hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 ml-auto"
        >
          <span v-if="isSubmitting" class="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
          <span>Подтвердить</span>
        </button>

        <button 
          v-if="step === 'success'"
          @click="close"
          class="w-full px-6 py-3 rounded-xl font-bold bg-orange-500 text-white shadow-lg shadow-orange-500/20 hover:opacity-90 transition-all"
        >
          Закрыть
        </button>
      </div>
    </div>
  </GuardedPopover>
</template>

<script setup lang="ts">
import { ref, watch } from "vue";
import GuardedPopover from "@/components/ui/GuardedPopover.vue";
import PopoverHeader from "@/components/ui/PopoverHeader.vue";
import Select from "@/components/ui/Select.vue";
import IconAlertCircle from "~icons/lucide/alert-circle";
import IconInfo from "~icons/lucide/info";
import IconCheckCircle from "~icons/lucide/check-circle";
import IconUpload from "~icons/lucide/upload";
import IconFile from "~icons/lucide/file";
import IconX from "~icons/lucide/x";

const props = defineProps<{
  isOpen: boolean;
  students: Array<any>;
}>();

const emit = defineEmits<{
  (e: "close"): void;
  (e: "submit", payload: any): void;
}>();

const step = ref<"form" | "confirm" | "success">("form");
const selectedStudentIds = ref<string[]>([]);
const retakeType = ref("rk1");
const retakeReason = ref("");
const isSubmitting = ref(false);
const hasTriedNext = ref(false);
const attachedFiles = ref<File[]>([]);
const isDragging = ref(false);
const fileInputRef = ref<HTMLInputElement | null>(null);

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ALLOWED_TYPES = ["application/pdf", "image/jpeg", "image/png"];

function addFiles(files: FileList | File[]) {
  for (const file of files) {
    if (!ALLOWED_TYPES.includes(file.type)) continue;
    if (file.size > MAX_FILE_SIZE) continue;
    if (attachedFiles.value.some((f) => f.name === file.name && f.size === file.size)) continue;
    attachedFiles.value.push(file);
  }
}

function onFileSelect(e: Event) {
  const input = e.target as HTMLInputElement;
  if (input.files) addFiles(input.files);
  input.value = "";
}

function onDrop(e: DragEvent) {
  isDragging.value = false;
  if (e.dataTransfer?.files) addFiles(e.dataTransfer.files);
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} Б`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} КБ`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} МБ`;
}

const retakeTypeOptions = [
  { value: "rk1", text: "РК 1" },
  { value: "rk2", text: "РК 2" },
  { value: "exam", text: "Экзамен" },
];

watch(() => props.isOpen, (newVal) => {
  if (newVal) {
    step.value = "form";
    selectedStudentIds.value = [];
    retakeType.value = "rk1";
    retakeReason.value = "";
    isSubmitting.value = false;
    hasTriedNext.value = false;
    attachedFiles.value = [];
    isDragging.value = false;
  }
});

const close = () => {
  emit("close");
};

const onNext = () => {
  hasTriedNext.value = true;
  if (retakeReason.value.trim() === "") return;
  step.value = "confirm";
};

const submit = () => {
  isSubmitting.value = true;
  setTimeout(() => {
    emit("submit", {
      studentIds: selectedStudentIds.value,
      type: retakeType.value,
      reason: retakeReason.value,
      files: attachedFiles.value,
    });
    isSubmitting.value = false;
    step.value = "success";
  }, 500);
};
</script>

<style scoped>
.retake-popup {
  --f7-popup-tablet-width: 450px;
  --f7-popup-tablet-height: min(600px, calc(100vh - 80px));
}

.retake-popup .page-content {
  padding: 0;
  height: 100%;
}
</style>
