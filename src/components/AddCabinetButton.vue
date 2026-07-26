<template>
  <div>
    <button
      id="add-cabinet-button"
      class="fixed bottom-20 right-4 md:bottom-6 md:right-6 w-14 h-14 md:w-12 md:h-12 flex items-center justify-center text-white bg-primary hover:bg-primary/90 rounded-full transition-colors shadow-lg z-50"
      aria-label="Add Cabinet"
      type="button"
      @click.stop="openAddCabinetPopover"
    >
      <IconPlus class="w-4 h-4 text-white" />
    </button>

    <GuardedPopover
      v-slot="{ requestClose }"
      id="add-cabinet-popover"
      style="width: 600px !important"
    >
      <div class="cabinet-popover bg-card text-card-foreground">
        <PopoverHeader
          title="Создать кабинет"
          :on-cancel="requestClose"
        />

        <div
          v-if="formError || cabinetStore.getError"
          class="px-4 pt-2 text-destructive text-sm"
        >
          {{ formError || cabinetStore.getError }}
        </div>

        <div class="p-4 space-y-4">
          <div class="space-y-2">
            <label class="text-sm text-foreground" for="cabinet-name">
              Название / Номер кабинета
            </label>
            <f7-input
              id="cabinet-name"
              type="text"
              v-model:value="cabinetName"
              placeholder="Напр: 301 или Каб. информатики"
            ></f7-input>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div class="space-y-2">
              <label class="text-sm text-foreground" for="cabinet-capacity">
                Вместимость
              </label>
              <f7-input
                id="cabinet-capacity"
                type="number"
                v-model:value="cabinetCapacity"
                placeholder="30"
              ></f7-input>
            </div>

            <div class="space-y-2">
              <label class="text-sm text-foreground" for="cabinet-type">
                Тип кабинета
              </label>
              <select
                id="cabinet-type"
                v-model="cabinetType"
                class="w-full bg-muted border border-border rounded-lg px-3 py-2.5 text-sm text-foreground focus:ring-2 focus:ring-primary/20 outline-none transition-all cursor-pointer"
              >
                <option value="lecture">Лекционный</option>
                <option value="lab">Лаборатория</option>
                <option value="gym">Спортзал</option>
                <option value="other">Другое</option>
              </select>
            </div>
          </div>

          <div class="space-y-2">
            <label class="text-sm text-foreground" for="cabinet-description">
              Описание
            </label>
            <f7-input
              id="cabinet-description"
              type="text"
              v-model:value="cabinetDescription"
              placeholder="Описание кабинета (необязательно)"
            ></f7-input>
          </div>
        </div>

        <PopoverFooter
          :on-save="handleSaveCabinet"
          :is-loading="cabinetStore.isLoading"
        />
      </div>
    </GuardedPopover>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import { useFormValidation } from "@/composables/useFormValidation";
import { f7, f7Input } from "framework7-vue";
import IconPlus from "~icons/lucide/plus";
import { cabinetSchema } from '@/validators/cabinet';
import { useCabinetStore } from "@/stores/cabinetStore";
import PopoverHeader from "@/components/ui/PopoverHeader.vue";
import PopoverFooter from "@/components/ui/PopoverFooter.vue";
import GuardedPopover from "@/components/ui/GuardedPopover.vue";

const cabinetStore = useCabinetStore();

const cabinetName = ref("");
const cabinetCapacity = ref<number>(30);
const cabinetType = ref("lecture");
const cabinetDescription = ref("");


const { formError, isFormValid } = useFormValidation(cabinetSchema, () => ({
    name: cabinetName.value,
    capacity: Number(cabinetCapacity.value),
    type: cabinetType.value,
    description: cabinetDescription.value,
  }));

const openAddCabinetPopover = () => {
  f7.popover.open("#add-cabinet-popover", "#add-cabinet-button");
};

function closeAddCabinetPopover() {
  f7.popover.close("#add-cabinet-popover");
  resetForm();
}

async function handleSaveCabinet() {
  if (!isFormValid.value) {
    return;
  }
  try {
    await cabinetStore.addCabinet({
      name: cabinetName.value,
      capacity: Number(cabinetCapacity.value),
      type: cabinetType.value,
      description: cabinetDescription.value || undefined,
    });
    closeAddCabinetPopover();
  } catch (error) {
    f7.dialog.alert("Произошла ошибка при добавлении кабинета.");
  }
}

const resetForm = () => {
  cabinetName.value = "";
  cabinetCapacity.value = 30;
  cabinetType.value = "lecture";
  cabinetDescription.value = "";
  cabinetStore.clearError();
};

defineExpose({ formError });
</script>
