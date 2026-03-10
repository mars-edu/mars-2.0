<template>
  <div>
    <GuardedPopover
      v-slot="{ requestClose }"
      :id="'edit-semester-popover-' + semesterId"
      style="width: 600px !important"
      :target="`#semester-item-${semesterId}`"
    >
      <div class="semester-popover bg-card text-card-foreground">
        <PopoverHeader
          title="Редактировать семестр"
          :on-cancel="requestClose"
        />
        <div
          v-if="formError || semesterStore.getError"
          class="px-4 pt-2 text-destructive text-sm"
        >
          {{ formError || semesterStore.getError }}
        </div>

        <div class="p-4 space-y-4">
          <div class="space-y-2">
            <label
              class="text-sm text-foreground"
              for="semester-short-name-edit"
            >
              Название семестра <span class="text-destructive ml-1">*</span>
            </label>
            <f7-input
              id="semester-short-name-edit"
              type="text"
              v-model:value="shortName"
            />
          </div>

          <div class="pt-4 border-t border-border">
            <button
              class="flex items-center justify-center w-full py-2 px-4 bg-destructive/10 hover:bg-destructive/20 rounded-lg text-destructive transition-colors"
              @click="confirmDelete"
              :disabled="semesterStore.isLoading"
            >
              <IconTrash class="w-[18px] h-[18px] mr-2" />
              Удалить семестр
            </button>
          </div>
        </div>

        <PopoverFooter
          :on-save="handleUpdateSemester"
          :disabled="!isFormValid || semesterStore.isLoading"
          :is-loading="semesterStore.isLoading"
        />
      </div>
    </GuardedPopover>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from "vue";
import { f7, f7Input, f7Popover } from "framework7-vue";
import IconTrash from "~icons/lucide/trash-2";
import PopoverHeader from "@/components/ui/PopoverHeader.vue";
import PopoverFooter from "@/components/ui/PopoverFooter.vue";
import GuardedPopover from "@/components/ui/GuardedPopover.vue";
import { z } from "zod";
import { useSemesterStore } from "@/stores/semesterStore";
const props = defineProps<{ semesterId: string }>();

const semesterStore = useSemesterStore();

const semester = computed(() =>
  semesterStore.getSemesterById(props.semesterId)
);

const shortName = ref("");
const formError = ref("");

const semesterSchema = z.object({
  shortName: z.string().min(1, "Пожалуйста, введите название семестра"),
});

const validationResult = computed(() => {
  return semesterSchema.safeParse({
    shortName: shortName.value,
  });
});

const isFormValid = computed(() => validationResult.value.success);

const closePopover = () => {
  f7.popover.close(`#edit-semester-popover-${props.semesterId}`);
  semesterStore.clearError();
};

const handleUpdateSemester = async () => {
  if (!isFormValid.value) {
    if (!validationResult.value.success) {
      formError.value = validationResult.value.error.issues[0].message;
    }
    return;
  }

  try {
    await semesterStore.updateSemester(props.semesterId, {
      shortName: shortName.value,
    });
    closePopover();
  } catch (error) {
    console.error("Failed to update semester:", error);
  }
};

const confirmDelete = () => {
  f7.popover.close(`#edit-semester-popover-${props.semesterId}`);
  f7.dialog.confirm(
    `<p>Вы уверены, что хотите удалить семестр "${
      semester.value?.shortName ?? ""
    }"?</p><p class="text-sm text-muted-foreground mt-2">Это действие нельзя отменить.</p>`,
    "Удаление семестра",
    async () => {
      try {
        await semesterStore.deleteSemester(props.semesterId);
      } catch (error) {
        console.error("Failed to delete semester:", error);
        f7.dialog.alert("Произошла ошибка при удалении семестра.");
      }
    }
  );
};

const resetForm = () => {
  shortName.value = semester.value?.shortName ?? "";
  formError.value = "";
  semesterStore.clearError();
};

watch(
  semester,
  (s) => {
    if (s) {
      shortName.value = s.shortName;
    }
  },
  { immediate: true }
);
</script>
