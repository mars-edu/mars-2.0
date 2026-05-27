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
              Основание (необязательно)
            </div>
            <textarea 
              class="w-full bg-card rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.04)] border border-border/60 p-4 text-[15px] focus:border-orange-500/50 focus:ring-4 focus:ring-orange-500/10 outline-none transition-all min-h-[100px] resize-none"
              placeholder="Например: Заявление студента, Справка..."
              v-model="retakeReason"
            ></textarea>
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
          @click="step = 'confirm'"
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

const retakeTypeOptions = [
  { value: "rk1", label: "РК 1" },
  { value: "rk2", label: "РК 2" },
  { value: "exam", label: "Экзамен" },
];

watch(() => props.isOpen, (newVal) => {
  if (newVal) {
    step.value = "form";
    selectedStudentIds.value = [];
    retakeType.value = "rk1";
    retakeReason.value = "";
    isSubmitting.value = false;
  }
});

const close = () => {
  emit("close");
};

const submit = () => {
  isSubmitting.value = true;
  setTimeout(() => {
    emit("submit", {
      studentIds: selectedStudentIds.value,
      type: retakeType.value,
      reason: retakeReason.value,
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
  border-radius: 2rem !important;
  overflow: hidden;
}

.retake-popup .page-content {
  padding: 0;
  height: 100%;
}
</style>
