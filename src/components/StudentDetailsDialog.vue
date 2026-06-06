<template>
  <GuardedPopover
    v-slot="{ requestClose }"
    v-if="student"
    :id="'student-details-popup-' + student.id"
    kind="popup"
    class="student-details-popup"
    @popover:closed="onClosed"
  >
    <div class="flex flex-col h-full">
      <div class="flex flex-col h-full bg-background text-foreground overflow-hidden">
        <!-- Header -->
        <PopoverHeader
          :on-cancel="requestClose"
          cancel-text="Закрыть"
        >
          <template #title>
            <div class="flex items-center gap-3">
              <span class="truncate">{{ studentFullName }}</span>
              <div :class="['px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider shrink-0', getStatusBadgeClass(student.status)]">
                {{ getStatusFullText(student.status) }}
              </div>
            </div>
          </template>
          <template #subtitle>
            <div class="flex items-center gap-1.5 mt-1">
              <span>ID: <span class="font-mono text-[13px] opacity-70">{{ student.id }}</span></span>
              <span class="opacity-30">•</span>
              <span>{{ m.student_details_course() }}: {{ studentCourse }}</span>
              <span class="opacity-30">•</span>
              <span>{{ getGenderText(student.gender) }}</span>
            </div>
          </template>
        </PopoverHeader>

        <!-- Tabs -->
        <div class="px-8 flex-shrink-0">
          <div class="flex gap-1 border-b border-border">
            <button 
              v-for="tab in tabs" 
              :key="tab.id"
              @click="activeTab = tab.id"
              :class="[
                'relative py-3 px-4 text-[14px] font-semibold transition-all duration-200',
                activeTab === tab.id 
                  ? 'text-primary' 
                  : 'text-muted-foreground hover:text-foreground'
              ]"
            >
              {{ tab.label }}
              <div 
                v-if="activeTab === tab.id"
                class="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-t-full"
              />
            </button>
          </div>
        </div>

        <!-- Content -->
        <div class="p-8 overflow-y-auto flex-1 bg-[#F2F2F7]/30">
          
          <!-- Info Tab -->
          <div v-if="activeTab === 'info'" class="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in duration-300">
            <!-- Personal Data -->
            <div class="bg-card p-6 rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.04)] border border-border/60">
              <h3 class="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/70 mb-6">{{ m.student_details_personal_data() }}</h3>
              <div class="space-y-4 text-[15px]">
                <div class="flex justify-between items-start gap-4 border-b border-border/50 pb-3">
                  <span class="text-muted-foreground/70 shrink-0">{{ m.student_details_surname() }}</span>
                  <span class="font-semibold text-right">{{ student.surname }}</span>
                </div>
                <div class="flex justify-between items-start gap-4 border-b border-border/50 pb-3">
                  <span class="text-muted-foreground/70 shrink-0">{{ m.student_details_firstname() }}</span>
                  <span class="font-semibold text-right">{{ student.firstName }}</span>
                </div>
                <div class="flex justify-between items-start gap-4 border-b border-border/50 pb-3">
                  <span class="text-muted-foreground/70 shrink-0">{{ m.student_details_patronymic() }}</span>
                  <span class="font-semibold text-right">{{ student.patronymic || '-' }}</span>
                </div>
              </div>
            </div>

            <!-- Academic Data -->
            <div class="bg-card p-6 rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.04)] border border-border/60">
              <h3 class="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/70 mb-6">{{ m.student_details_academic_data() }}</h3>
              <div class="space-y-4 text-[15px]">
                <div class="flex justify-between items-start gap-4 border-b border-border/50 pb-3">
                  <span class="text-muted-foreground/70 shrink-0">{{ m.student_details_specialty() }}</span>
                  <span class="font-semibold text-right">
                    {{ getSpecialtyName(student.specialty) }}
                  </span>
                </div>
                <div class="flex justify-between items-start gap-4 border-b border-border/50 pb-3">
                  <span class="text-muted-foreground/70 shrink-0">{{ m.student_details_language() }}</span>
                  <span class="font-semibold uppercase text-right">{{ student.language }}</span>
                </div>
                <div class="flex justify-between items-start gap-4 border-b border-border/50 pb-3">
                  <span class="text-muted-foreground/70 shrink-0">{{ m.student_details_course() }}</span>
                  <span class="font-semibold text-right">{{ studentCourse }}</span>
                </div>
                <div class="flex justify-between items-start gap-4 border-b border-border/50 pb-3">
                  <span class="text-muted-foreground/70 shrink-0">{{ m.student_details_base() }}</span>
                  <span class="font-semibold text-right">{{ student.base || 9 }} кл.</span>
                </div>
              </div>
            </div>
          </div>

          <!-- History Tab -->
          <div v-if="activeTab === 'history'" class="space-y-4 animate-in fade-in duration-300">
            <div v-if="student.history && student.history.length > 0" class="space-y-3">
              <div 
                v-for="(record, idx) in sortedHistory" 
                :key="idx" 
                class="bg-card p-5 rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.04)] border border-border/60 flex justify-between items-center hover:bg-muted/5 transition-colors"
              >
                <div>
                  <div class="font-semibold text-[15px]">{{ record.description }}</div>
                  <div class="text-[13px] text-muted-foreground mt-1">
                    {{ record.date }}
                  </div>
                </div>
                <div class="text-right">
                  <div class="text-[12px] font-bold bg-[#F2F2F7] px-3 py-1.5 rounded-lg text-foreground border border-border/20">
                    {{ m.student_details_transfer_order_number() }} {{ record.orderNumber }}
                  </div>
                </div>
              </div>
            </div>
            <div v-else class="text-center py-20 bg-card rounded-2xl border border-dashed border-border">
              <IconClock class="w-12 h-12 mb-4 mx-auto opacity-10" />
              <div class="text-muted-foreground font-medium">{{ m.student_details_history_empty() }}</div>
            </div>
          </div>

          <!-- Actions Tab -->
          <div v-if="activeTab === 'actions'" class="flex flex-col md:flex-row gap-6 h-full animate-in fade-in duration-300">
            <!-- Sidebar for actions -->
            <div class="w-full md:w-1/3 flex flex-col gap-3">
              <button 
                @click="actionType = 'transfer'"
                :class="[
                  'p-5 rounded-2xl border text-left flex items-center gap-4 transition-all duration-200',
                  actionType === 'transfer' 
                    ? 'bg-primary/5 border-primary ring-1 ring-primary/20' 
                    : 'bg-card border-border/60 hover:border-foreground/20 hover:bg-muted/30 shadow-[0_2px_12px_rgba(0,0,0,0.02)]'
                ]"
              >
                <div class="bg-blue-100 p-2.5 rounded-xl text-blue-600"><IconArrowRight class="w-5 h-5" /></div>
                <div>
                  <div class="font-bold text-[15px] leading-tight">{{ m.student_details_action_transfer() }}</div>
                  <div class="text-xs text-muted-foreground mt-1">{{ m.student_details_action_transfer_desc() }}</div>
                </div>
              </button>

              <button 
                @click="actionType = 'expel'"
                :class="[
                  'p-5 rounded-2xl border text-left flex items-center gap-4 transition-all duration-200',
                  actionType === 'expel' 
                    ? 'bg-destructive/5 border-destructive ring-1 ring-destructive/20' 
                    : 'bg-card border-border/60 hover:border-foreground/20 hover:bg-muted/30 shadow-[0_2px_12px_rgba(0,0,0,0.02)]'
                ]"
              >
                <div class="bg-red-100 p-2.5 rounded-xl text-red-600"><IconUserX class="w-5 h-5" /></div>
                <div>
                  <div class="font-bold text-[15px] leading-tight">{{ m.student_details_action_expel() }}</div>
                  <div class="text-xs text-muted-foreground mt-1">{{ m.student_details_action_expel_desc() }}</div>
                </div>
              </button>

              <button 
                disabled
                class="p-5 rounded-2xl border bg-card border-border/40 opacity-40 cursor-not-allowed flex items-center gap-4 shadow-none"
              >
                <div class="bg-green-100 p-2.5 rounded-xl text-green-600"><IconUserCheck class="w-5 h-5" /></div>
                <div>
                  <div class="font-bold text-[15px] leading-tight">{{ m.student_details_action_restoration() }}</div>
                  <div class="text-xs text-muted-foreground mt-1">{{ m.student_details_action_restoration_desc() }}</div>
                </div>
              </button>
            </div>

            <!-- Action Panel -->
            <div class="w-full md:w-2/3 bg-card rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.04)] border border-border/60 p-8">
              <div v-if="!actionType" class="h-full flex flex-col items-center justify-center text-muted-foreground">
                <IconClock class="w-16 h-16 mb-6 opacity-10" />
                <p class="font-medium">{{ m.student_details_action_choose() }}</p>
              </div>

              <!-- Transfer Action -->
              <div v-if="actionType === 'transfer'" class="space-y-6">
                <div class="flex items-center gap-3 border-b border-border pb-4">
                  <IconArrowRight class="w-5 h-5 text-primary" />
                  <h3 class="text-lg font-bold">{{ m.student_details_transfer_title() }}</h3>
                </div>
                
                <div class="space-y-2">
                  <label class="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/70 ml-1">{{ m.student_details_transfer_new_specialty() }}</label>
                  <Select 
                    v-model="newSpecialty"
                    :options="availableSpecialties"
                    :placeholder="m.common_not_specified()"
                    id="new-specialty"
                  />
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div class="space-y-2">
                    <label class="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/70 ml-1">{{ m.student_details_transfer_order_number() }}</label>
                    <f7-input 
                      type="text" 
                      placeholder="№..."
                      v-model:value="orderNumber"
                    />
                  </div>
                  <div class="space-y-2">
                    <label class="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/70 ml-1">{{ m.student_details_transfer_order_date() }}</label>
                    <f7-input 
                      type="date" 
                      v-model:value="orderDate"
                    />
                  </div>
                </div>

                <div class="pt-4 flex justify-end">
                  <f7-button 
                    fill
                    large
                    class="rounded-xl font-bold bg-[#FFCC00] text-black shadow-lg shadow-yellow-500/20"
                    @click="handleTransfer"
                    :disabled="!newSpecialty || !orderNumber || studentStore.isLoading"
                  >
                    <f7-preloader v-if="studentStore.isLoading" size="16" class="mr-2" color="black" />
                    {{ m.student_details_transfer_confirm() }}
                  </f7-button>
                </div>
              </div>

              <!-- Expel / Status Change Action -->
              <div v-if="actionType === 'expel'" class="space-y-6">
                <div class="flex items-center gap-3 border-b border-border pb-4">
                  <IconUserX class="w-5 h-5 text-destructive" />
                  <h3 class="text-lg font-bold text-destructive">{{ m.student_details_expel_title() }}</h3>
                </div>
                
                <div class="space-y-2">
                  <label class="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/70 ml-1">{{ m.student_details_expel_reason() }}</label>
                  <Select 
                    v-model="reason"
                    :options="reasonOptions"
                    :placeholder="m.common_not_specified()"
                    id="expel-reason"
                  />
                </div>

                <div v-if="reason === 'other'" class="space-y-2">
                  <label class="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/70 ml-1">{{ m.student_details_expel_custom_reason() }}</label>
                  <f7-input 
                    type="text" 
                    :placeholder="m.common_search()"
                    v-model:value="customReason"
                  />
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div class="space-y-2">
                    <label class="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/70 ml-1">{{ m.student_details_transfer_order_number() }}</label>
                    <f7-input 
                      type="text" 
                      placeholder="№..."
                      v-model:value="orderNumber"
                    />
                  </div>
                  <div class="space-y-2">
                    <label class="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/70 ml-1">{{ m.student_details_transfer_order_date() }}</label>
                    <f7-input 
                      type="date" 
                      v-model:value="orderDate"
                    />
                  </div>
                </div>
                
                <div class="bg-destructive/5 p-4 rounded-xl text-xs text-destructive border border-destructive/10 flex gap-3">
                  <IconAlertTriangle class="w-5 h-5 flex-shrink-0" />
                  <p class="leading-relaxed">{{ m.student_details_expel_warning() }}</p>
                </div>

                <div class="pt-4 flex justify-end">
                  <f7-button 
                    fill
                    large
                    class="rounded-xl font-bold bg-[#EF4444] text-white shadow-lg shadow-red-500/20"
                    @click="handleExpel"
                    :disabled="!reason || !orderNumber || (reason === 'other' && !customReason) || studentStore.isLoading"
                  >
                    <f7-preloader v-if="studentStore.isLoading" size="16" class="mr-2" color="white" />
                    {{ m.student_details_expel_confirm() }}
                  </f7-button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </GuardedPopover>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { f7, f7Input, f7Button, f7Preloader } from 'framework7-vue';
import { useStudentStore } from '@/stores/studentStore';
import { useSpecialtyStore } from '@/stores/specialtyStore';
import { useAcademicYearStore } from '@/stores/academicYearStore';
import GuardedPopover from '@/components/ui/GuardedPopover.vue';
import PopoverHeader from '@/components/ui/PopoverHeader.vue';
import Select from '@/components/ui/Select.vue';
import type { StudentStatus, MovementHistory } from '@/types/student';
import { useStudentHelpers } from '@/composables/useStudentHelpers';
import * as m from '@/paraglide/messages';

import IconX from '~icons/lucide/x';
import IconClock from '~icons/lucide/clock';
import IconAlertTriangle from '~icons/lucide/alert-triangle';
import IconArrowRight from '~icons/lucide/arrow-right';
import IconUserX from '~icons/lucide/user-x';
import IconUserCheck from '~icons/lucide/user-check';

const props = defineProps<{
  studentId: string;
}>();

const emit = defineEmits<{
  (e: 'closed'): void;
}>();

const studentStore = useStudentStore();
const specialtyStore = useSpecialtyStore();
const academicYearStore = useAcademicYearStore();
const { getStatusFullText, getStatusBadgeClass, getGenderText } = useStudentHelpers();

const student = computed(() => studentStore.getStudentById(props.studentId));

const activeTab = ref<'info' | 'history' | 'actions'>('info');
const actionType = ref<'transfer' | 'expel' | null>(null);

const tabs = computed(() => [
  { id: 'info', label: m.student_details_tab_info() },
  { id: 'history', label: m.student_details_tab_history() },
  { id: 'actions', label: m.student_details_tab_actions() },
] as const);

// Action Form States
const orderNumber = ref('');
const orderDate = ref(new Date().toISOString().split('T')[0]);
const newSpecialty = ref('');
const reason = ref('');
const customReason = ref('');

const studentFullName = computed(() => {
  if (!student.value) return '';
  return `${student.value.surname} ${student.value.firstName} ${student.value.patronymic}`;
});

const studentCourse = computed(() => {
  if (!student.value) return 0;
  return studentStore.getCourseByStudentId(student.value.id) || 0;
});

const sortedHistory = computed(() => {
  if (!student.value?.history) return [];
  return [...student.value.history].sort((a, b) => b.date.localeCompare(a.date));
});

const getSpecialtyName = (id: string) => {
  const specialty = specialtyStore.getSpecialtyById(id);
  return specialty ? `${specialty.name} (${specialty.code})` : id;
};

const availableSpecialties = computed(() => {
  return specialtyStore.specialties
    .filter(s => s.id !== student.value?.specialty)
    .map(s => ({
      value: s.id,
      text: `${s.name} (${s.code})`
    }));
});

const reasonOptions = computed(() => [
  { value: 'academic_leave', text: m.student_status_academic_leave_full() },
  { value: 'По собственному желанию', text: m.student_status_expelled_full() },
  { value: 'Академическая неуспеваемость', text: 'Академическая неуспеваемость' },
  { value: 'Нарушение правил внутреннего распорядка', text: 'Нарушение правил' },
  { value: 'Финансовая задолженность', text: 'Финансовая задолженность' },
  { value: 'other', text: 'Свой вариант...' },
]);

const handleTransfer = async () => {
  if (!student.value || !newSpecialty.value || !orderNumber.value) return;
  
  const historyRecord: MovementHistory = {
    date: orderDate.value,
    type: 'transfer',
    orderNumber: orderNumber.value,
    description: m.student_details_history_transfer({
        from: getSpecialtyName(student.value.specialty),
        to: getSpecialtyName(newSpecialty.value)
    })
  };

  const updatedHistory = [historyRecord, ...(student.value.history || [])];

  try {
    await studentStore.updateStudent(student.value.id, {
      specialty: newSpecialty.value,
      history: updatedHistory
    });
    actionType.value = null;
    resetActionForm();
    f7.toast.create({ text: m.student_details_transfer_success(), closeTimeout: 3000, cssClass: 'color-green' }).open();
  } catch (error) {
    f7.toast.create({ text: m.student_details_transfer_error(), closeTimeout: 3000, cssClass: 'color-red' }).open();
  }
};

const handleExpel = async () => {
  if (!student.value || !reason.value || !orderNumber.value) return;
  if (reason.value === 'other' && !customReason.value) return;

  let statusToSet: StudentStatus = 'expelled';
  let typeToSet: MovementHistory['type'] = 'expulsion';
  let descriptionText = m.student_details_history_expulsion({
    reason: reason.value === 'other' ? customReason.value : reason.value
  });

  if (reason.value === 'academic_leave') {
    statusToSet = 'academic_leave';
    typeToSet = 'status_change';
    descriptionText = m.student_details_history_academic_leave();
  }

  const historyRecord: MovementHistory = {
    date: orderDate.value,
    type: typeToSet,
    orderNumber: orderNumber.value,
    description: descriptionText
  };

  const updatedHistory = [historyRecord, ...(student.value.history || [])];

  try {
    await studentStore.updateStudent(student.value.id, {
      status: statusToSet,
      history: updatedHistory
    });
    actionType.value = null;
    resetActionForm();
    f7.toast.create({ text: m.student_details_status_success(), closeTimeout: 3000, cssClass: 'color-green' }).open();
  } catch (error) {
    f7.toast.create({ text: m.student_details_status_error(), closeTimeout: 3000, cssClass: 'color-red' }).open();
  }
};

const resetActionForm = () => {
  orderNumber.value = '';
  orderDate.value = new Date().toISOString().split('T')[0];
  newSpecialty.value = '';
  reason.value = '';
  customReason.value = '';
};

const onClosed = () => {
  activeTab.value = 'info';
  actionType.value = null;
  resetActionForm();
  emit('closed');
};
</script>

<style scoped>
.student-details-popup {
  --f7-popup-tablet-width: 800px;
  --f7-popup-tablet-height: min(900px, 85vh);
}



/* Custom transitions */
.animate-in {
  animation-duration: 0.3s;
  animation-fill-mode: both;
}

@keyframes fade-in {
  from { opacity: 0; transform: translateY(4px); }
  to { opacity: 1; transform: translateY(0); }
}

.fade-in {
  animation-name: fade-in;
}
</style>
