<template>
  <GuardedPopover
    id="journal-settings-popover"
    kind="popup"
    :guard-unsaved="false"
    :close-by-backdrop-click="true"
    :on-closed="handleClosed"
  >
    <div class="bg-card text-card-foreground h-full flex flex-col">
      <!-- Header -->
      <div class="px-6 pt-6 pb-4 flex justify-between items-center border-b border-border">
        <div>
          <h2 class="text-xl font-bold text-foreground tracking-tight">Настройки журнала</h2>
          <p class="text-sm text-muted-foreground mt-1">Персональные настройки для текущего курса</p>
        </div>
        <button
          type="button"
          @click="closePopup"
          class="w-9 h-9 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:bg-muted/80 transition-colors"
        >
          <IconCircleX class="w-5 h-5" />
        </button>
      </div>

      <!-- Content -->
      <div class="flex-1 overflow-y-auto px-6 py-6 space-y-8">
        <!-- Section 1: Calculation Method -->
        <section class="space-y-4">
          <div class="flex items-center gap-2 text-foreground">
            <IconCalculator class="w-5 h-5 text-green-500" />
            <h3 class="text-lg font-bold">{{ journal_settings_field_calculation() }}</h3>
          </div>
          <div class="flex gap-3">
            <button
              type="button"
              @click="localSettings.calculationType = 'calculated'"
              :class="[
                'flex-1 p-4 rounded-2xl border-2 transition-all text-left',
                localSettings.calculationType === 'calculated'
                  ? 'border-primary bg-primary/5'
                  : 'border-border bg-muted/40',
              ]"
            >
              <div class="font-bold text-foreground">{{ journal_settings_calc_calculated() }}</div>
              <div class="text-xs text-muted-foreground mt-1">Система рассчитывает средний балл за период</div>
            </button>
            <button
              type="button"
              @click="localSettings.calculationType = 'manual'"
              :class="[
                'flex-1 p-4 rounded-2xl border-2 transition-all text-left',
                localSettings.calculationType === 'manual'
                  ? 'border-primary bg-primary/5'
                  : 'border-border bg-muted/40',
              ]"
            >
              <div class="font-bold text-foreground">{{ journal_settings_calc_manual() }}</div>
              <div class="text-xs text-muted-foreground mt-1">Оценки выставляются преподавателем самостоятельно</div>
            </button>
          </div>

          <div
            v-if="localSettings.calculationType === 'calculated'"
            class="space-y-3"
          >
            <Select
              v-model="localSettings.calculationMethod"
              :options="calculationMethodOptions"
              :label="journal_settings_field_account_for()"
              placeholder="Выберите метод"
            />
          </div>
        </section>

        <!-- Section 2: Final Control Form -->
        <section class="space-y-4">
          <div class="flex items-center gap-2 text-foreground">
            <IconFileText class="w-5 h-5 text-orange-500" />
            <h3 class="text-lg font-bold">Форма итогового контроля</h3>
          </div>
          <Select
            v-model="localSettings.finalControlForm"
            :options="finalControlFormOptions"
            label="Выберите форму"
            placeholder="Выберите..."
          />
        </section>

        <!-- Section 3: Final Grade Formula -->
        <section class="space-y-4">
          <div class="flex items-center gap-2 text-foreground">
            <IconSparkles class="w-5 h-5 text-purple-500" />
            <h3 class="text-lg font-bold">Формула расчета итоговой</h3>
          </div>
          <div class="p-5 bg-muted/40 rounded-2xl border border-border space-y-4">
            <div class="flex items-center justify-between">
              <span class="text-sm font-medium text-foreground">Вес промежуточных контролей (РК)</span>
              <div class="flex items-center gap-2">
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="1"
                  :value="localSettings.finalGradeFormula?.intermediateWeight ?? 0.6"
                  @input="updateFormulaWeight('intermediateWeight', $event)"
                  class="w-16 bg-card border border-border rounded-lg px-2 py-1 text-center font-bold text-foreground text-sm"
                />
                <span class="text-xs text-muted-foreground">(60% = 0.6)</span>
              </div>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-sm font-medium text-foreground">Вес итогового контроля</span>
              <div class="flex items-center gap-2">
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="1"
                  :value="localSettings.finalGradeFormula?.finalWeight ?? 0.4"
                  @input="updateFormulaWeight('finalWeight', $event)"
                  class="w-16 bg-card border border-border rounded-lg px-2 py-1 text-center font-bold text-foreground text-sm"
                />
                <span class="text-xs text-muted-foreground">(40% = 0.4)</span>
              </div>
            </div>
            <div class="pt-3 border-t border-border flex justify-between items-center">
              <span class="text-sm font-bold text-foreground">Итоговая формула:</span>
              <code class="bg-card px-3 py-1 rounded-lg border border-border text-xs font-mono text-green-600">
                (РК_среднее * {{ localSettings.finalGradeFormula?.intermediateWeight ?? 0.6 }}) + (Итоговый * {{ localSettings.finalGradeFormula?.finalWeight ?? 0.4 }})
              </code>
            </div>
          </div>
        </section>
      </div>

      <!-- Footer -->
      <PopoverFooter
        cancel-text="Отмена"
        save-text="Сохранить"
        :on-cancel="closePopup"
        :on-save="handleSave"
      />
    </div>
  </GuardedPopover>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { f7 } from 'framework7-vue';
import IconCircleX from '~icons/lucide/circle-x';
import IconCalculator from '~icons/lucide/calculator';
import IconFileText from '~icons/lucide/file-text';
import IconSparkles from '~icons/lucide/sparkles';
import GuardedPopover from '@/components/ui/GuardedPopover.vue';
import PopoverFooter from '@/components/ui/PopoverFooter.vue';
import Select from '@/components/ui/Select.vue';
import {
  journal_settings_field_calculation,
  journal_settings_calc_calculated,
  journal_settings_calc_manual,
  journal_settings_field_account_for,
  journal_settings_account_assigned,
  journal_settings_account_all,
} from '@/paraglide/messages';

const props = defineProps<{
  initialSettings: any;
}>();

const emit = defineEmits<{
  save: [settings: any];
  closed: [];
}>();

const localSettings = ref(JSON.parse(JSON.stringify(props.initialSettings)));

watch(() => props.initialSettings, (newVal) => {
  localSettings.value = JSON.parse(JSON.stringify(newVal));
}, { deep: true });

const calculationMethodOptions = computed(() => [
  { value: 'only-assigned', text: journal_settings_account_assigned() },
  { value: 'all-days', text: journal_settings_account_all() },
]);

const finalControlFormOptions = [
  { value: 'written', text: 'Письменный' },
  { value: 'oral', text: 'Устный' },
  { value: 'mixed', text: 'Смешанный' },
];

const updateFormulaWeight = (field: 'intermediateWeight' | 'finalWeight', event: Event) => {
  const value = parseFloat((event.target as HTMLInputElement).value) || (field === 'intermediateWeight' ? 0.6 : 0.4);
  localSettings.value.finalGradeFormula = {
    ...localSettings.value.finalGradeFormula,
    [field]: value,
  };
};

const handleClosed = () => {
  emit('closed');
};

const closePopup = () => {
  f7.popup.close('#journal-settings-popover');
};

const handleSave = () => {
  emit('save', localSettings.value);
  closePopup();
};
</script>
