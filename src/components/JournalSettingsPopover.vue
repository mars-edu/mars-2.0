<template>
  <f7-popover
    id="journal-settings-popover"
    style="width: 500px !important"
    target="#journal-settings-button"
  >
    <div class="journal-settings-popover bg-card text-card-foreground">
      <PopoverHeader
        title="Настройки журнала"
        :disabled="false"
        :is-loading="false"
        :on-cancel="onCancel"
        :on-save="onSave"
      />

      <div class="p-4 space-y-6">
        <!-- Calculation Type Section -->
        <div class="space-y-3">
          <h3 class="text-sm font-medium text-foreground">
            Тип расчета сессии
          </h3>

          <div class="space-y-3">
            <!-- Calculated Option -->
            <div class="space-y-2">
              <label class="flex items-center space-x-3 cursor-pointer">
                <input
                  type="radio"
                  name="calculation-type"
                  value="calculated"
                  v-model="localSettings.calculationType"
                  class="w-4 h-4 text-primary bg-gray-100 border-gray-300 focus:ring-primary"
                />
                <span class="text-sm text-foreground">Расчитываемая</span>
              </label>

              <!-- Sub-options for Calculated -->
              <div
                v-if="localSettings.calculationType === 'calculated'"
                class="ml-7 space-y-2"
              >
                <label class="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="radio"
                    name="calculation-method"
                    value="only-assigned"
                    v-model="localSettings.calculationMethod"
                    class="w-4 h-4 text-primary bg-gray-100 border-gray-300 focus:ring-primary"
                  />
                  <span class="text-sm text-muted-foreground"
                    >Только выставленных дней</span
                  >
                </label>

                <label class="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="radio"
                    name="calculation-method"
                    value="all-days"
                    v-model="localSettings.calculationMethod"
                    class="w-4 h-4 text-primary bg-gray-100 border-gray-300 focus:ring-primary"
                  />
                  <span class="text-sm text-muted-foreground">Всех дней</span>
                </label>
              </div>
            </div>

            <!-- Manual Option -->
            <div>
              <label class="flex items-center space-x-3 cursor-pointer">
                <input
                  type="radio"
                  name="calculation-type"
                  value="manual"
                  v-model="localSettings.calculationType"
                  class="w-4 h-4 text-primary bg-gray-100 border-gray-300 focus:ring-primary"
                />
                <span class="text-sm text-foreground">Выставляемая</span>
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  </f7-popover>
</template>

<script setup lang="ts">
import { ref, watch } from "vue";
import { f7Popover } from "framework7-vue";
import PopoverHeader from "@/components/ui/PopoverHeader.vue";

const props = defineProps<{
  settings: {
    calculationType: "calculated" | "manual";
    calculationMethod: "only-assigned" | "all-days";
  };
}>();

const emit = defineEmits<{
  "update:settings": [settings: typeof props.settings];
  save: [];
  cancel: [];
}>();

const localSettings = ref({ ...props.settings });

watch(
  () => props.settings,
  (newSettings) => {
    localSettings.value = { ...newSettings };
  },
  { deep: true }
);

const onSave = () => {
  emit("update:settings", localSettings.value);
  emit("save");
};

const onCancel = () => {
  localSettings.value = { ...props.settings };
  emit("cancel");
};
</script>
