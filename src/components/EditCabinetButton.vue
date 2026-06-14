<template>
  <div>
    <GuardedPopover
      v-slot="{ requestClose }"
      v-if="cabinet"
      :id="'edit-cabinet-popover-' + cabinet.id"
      style="width: 600px !important"
      :on-closed="resetForm">
      <div class="cabinet-popover bg-card text-card-foreground">
        <PopoverHeader
          title="Редактировать кабинет"
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
            <label class="text-sm text-foreground" for="edit-cabinet-name">
              Название / Номер кабинета
            </label>
            <f7-input
              id="edit-cabinet-name"
              type="text"
              v-model:value="cabinetName"
              placeholder="Напр: 301 или Каб. информатики"
            ></f7-input>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div class="space-y-2">
              <label class="text-sm text-foreground" for="edit-cabinet-capacity">
                Вместимость
              </label>
              <f7-input
                id="edit-cabinet-capacity"
                type="number"
                v-model:value="cabinetCapacity"
                placeholder="30"
              ></f7-input>
            </div>

            <div class="space-y-2">
              <label class="text-sm text-foreground" for="edit-cabinet-type">
                Тип кабинета
              </label>
              <select
                id="edit-cabinet-type"
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
            <label class="text-sm text-foreground" for="edit-cabinet-description">
              Описание
            </label>
            <f7-input
              id="edit-cabinet-description"
              type="text"
              v-model:value="cabinetDescription"
              placeholder="Описание кабинета (необязательно)"
            ></f7-input>
          </div>

          <div class="pt-4 border-t border-border">
            <button
              class="flex items-center justify-center w-full py-2 px-4 bg-destructive/10 hover:bg-destructive/20 rounded-lg text-destructive transition-colors"
              @click="showDeleteConfirmation"
              :disabled="cabinetStore.isLoading"
            >
              <IconTrash class="w-[18px] h-[18px] mr-2" />
              Удалить кабинет
            </button>
          </div>
        </div>

        <PopoverFooter
          :on-save="handleUpdateCabinet"
          :is-loading="cabinetStore.isLoading"
        />
      </div>
    </GuardedPopover>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watchEffect } from "vue";
import { useFormValidation } from "@/composables/useFormValidation";
import { f7, f7Input } from "framework7-vue";
import IconTrash from "~icons/lucide/trash-2";
import { z } from "zod";
import { useCabinetStore } from "@/stores/cabinetStore";
import PopoverHeader from "@/components/ui/PopoverHeader.vue";
import PopoverFooter from "@/components/ui/PopoverFooter.vue";
import GuardedPopover from "@/components/ui/GuardedPopover.vue";

const props = defineProps<{
  cabinetId: string;
}>();

const cabinetStore = useCabinetStore();

// Get cabinet from store by ID - always fresh data
const cabinet = computed(() => cabinetStore.getCabinetById(props.cabinetId));

const cabinetName = ref("");
const cabinetCapacity = ref<number>(30);
const cabinetType = ref("lecture");
const cabinetDescription = ref("");

// Update form fields whenever cabinet data changes
watchEffect(() => {
  if (cabinet.value) {
    cabinetName.value = cabinet.value.name;
    cabinetCapacity.value = cabinet.value.capacity;
    cabinetType.value = cabinet.value.type;
    cabinetDescription.value = cabinet.value.description || "";
  }
});

const cabinetSchema = z.object({
  name: z.string().min(1, "Пожалуйста, введите название кабинета"),
  capacity: z.number().min(1, "Вместимость должна быть больше 0"),
  type: z.string().min(1, "Пожалуйста, выберите тип кабинета"),
  description: z.string().optional().default(""),
});

const { formError, isFormValid } = useFormValidation(cabinetSchema, () => ({
    name: cabinetName.value,
    capacity: Number(cabinetCapacity.value),
    type: cabinetType.value,
    description: cabinetDescription.value,
  }));

const closeEditCabinetPopover = () => {
  if (!cabinet.value) return;
  f7.popover.close(`#edit-cabinet-popover-${cabinet.value.id}`);
  resetForm();
};

const handleUpdateCabinet = async () => {
  if (!isFormValid.value || !cabinet.value) {
    return;
  }
  try {
    await cabinetStore.updateCabinet(cabinet.value.id, {
      name: cabinetName.value,
      capacity: Number(cabinetCapacity.value),
      type: cabinetType.value,
      description: cabinetDescription.value || undefined,
    });
    closeEditCabinetPopover();
  } catch (error) {
    f7.dialog.alert("Произошла ошибка при обновлении кабинета.");
  }
};

const showDeleteConfirmation = () => {
  if (!cabinet.value) return;
  f7.popover.close(`#edit-cabinet-popover-${cabinet.value.id}`);

  f7.dialog.confirm(
    `<p>Вы уверены, что хотите удалить кабинет "${cabinet.value.name}"?</p>
     <p class="text-sm text-muted-foreground mt-2">Это действие нельзя отменить.</p>`,
    "Удаление кабинета",
    async () => {
      if (!cabinet.value) return;
      try {
        await cabinetStore.deleteCabinet(cabinet.value.id);
      } catch (error) {
        console.error("Failed to delete cabinet:", error);
        f7.dialog.alert("Произошла ошибка при удалении кабинета.");
      }
    }
  );
};

const resetForm = () => {
  if (!cabinet.value) return;
  cabinetName.value = cabinet.value.name;
  cabinetCapacity.value = cabinet.value.capacity;
  cabinetType.value = cabinet.value.type;
  cabinetDescription.value = cabinet.value.description || "";
  cabinetStore.clearError();
};


defineExpose({ formError });
</script>
