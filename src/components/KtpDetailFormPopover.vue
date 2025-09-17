<template>
  <f7-popover
    :opened="opened"
    @popover:closed="$emit('update:opened', false)"
    class="popover-center-page"
    style="width: 600px !important"
    close-on-escape
    :target-el="target"
  >
    <div class="bg-card text-card-foreground">
      <PopoverHeader
        :title="isEditMode ? 'Редактировать' : 'Создать'"
        :disabled="!isFormValid || ktpStore.loading"
        :is-loading="ktpStore.loading"
        :on-cancel="() => $emit('update:opened', false)"
        :on-save="handleSave"
      />

      <div v-if="formError" class="px-4 pt-2 text-destructive text-sm">
        {{ formError }}
      </div>

      <div class="p-4 space-y-3">
        <div class="space-y-2">
          <label class="text-sm text-foreground" for="ktp-theme">
            Тема занятия
          </label>
          <f7-input
            id="ktp-theme"
            type="textarea"
            v-model:value="formData.theme"
            placeholder="Введите тему занятия"
            resizable
          ></f7-input>
        </div>

        <div class="grid grid-cols-3 gap-4">
          <div class="space-y-2">
            <label class="text-sm text-foreground" for="ktp-total-hours">
              Всего часов
            </label>
            <f7-input
              id="ktp-total-hours"
              type="number"
              v-model:value="formData.totalHours"
              placeholder="0"
            ></f7-input>
          </div>
          <div class="space-y-2">
            <label class="text-sm text-foreground" for="ktp-srsp">СРСП</label>
            <f7-input
              id="ktp-srsp"
              type="number"
              v-model:value="formData.srsp"
              placeholder="0"
            ></f7-input>
          </div>
          <div class="space-y-2">
            <label class="text-sm text-foreground" for="ktp-srs">СРС</label>
            <f7-input
              id="ktp-srs"
              type="number"
              v-model:value="formData.srs"
              placeholder="0"
            ></f7-input>
          </div>
        </div>

        <div class="space-y-2">
          <label class="text-sm text-foreground" for="ktp-homework">
            Что задано?
          </label>
          <f7-input
            id="ktp-homework"
            type="text"
            v-model:value="formData.homework"
            placeholder="Введите домашнее задание"
          ></f7-input>
        </div>

        <div class="space-y-2">
          <label class="text-sm text-foreground" for="ktp-notes">
            Примечание
          </label>
          <f7-input
            id="ktp-notes"
            type="textarea"
            v-model:value="formData.notes"
            placeholder="Введите примечание"
            resizable
          ></f7-input>
        </div>

        <div v-if="isEditMode" class="pt-4 border-t border-border">
          <button
            class="flex items-center justify-center w-full py-2 px-4 bg-destructive/10 hover:bg-destructive/20 rounded-lg text-destructive transition-colors"
            @click="showDeleteConfirmation"
            :disabled="ktpStore.loading"
          >
            <f7-icon
              ios="f7:trash"
              md="material:delete"
              size="18px"
              class="mr-2"
            ></f7-icon>
            Удалить запись
          </button>
        </div>
      </div>
    </div>
  </f7-popover>
</template>

<script setup lang="ts">
import { ref, computed, watch, reactive } from "vue";
import { f7, f7Popover, f7Input, f7Icon } from "framework7-vue";
import { z } from "zod";
import { useKtpStore, type KtpDetail } from "@/stores/ktpStore";
import PopoverHeader from "@/components/ui/PopoverHeader.vue";

const props = defineProps<{
  opened: boolean;
  target: string;
  class9Id: string;
  detailToEdit: KtpDetail | null;
}>();

const emit = defineEmits(["update:opened"]);

const ktpStore = useKtpStore();

const isEditMode = computed(() => !!props.detailToEdit);
const formError = ref("");

const formData = reactive({
  theme: "",
  totalHours: null as number | null,
  srsp: null as number | null,
  srs: null as number | null,
  homework: "",
  notes: "",
});

watch(
  () => props.detailToEdit,
  (newDetail) => {
    if (newDetail) {
      formData.theme = newDetail.theme;
      formData.totalHours = newDetail.totalHours;
      formData.srsp = newDetail.srsp;
      formData.srs = newDetail.srs;
      formData.homework = newDetail.homework;
      formData.notes = newDetail.notes || "";
    } else {
      // Reset for "add" mode
      formData.theme = "";
      formData.totalHours = null;
      formData.srsp = null;
      formData.srs = null;
      formData.homework = "";
      formData.notes = "";
    }
    formError.value = "";
  },
  { immediate: true }
);

const formSchema = z.object({
  theme: z.string().min(1, "Тема не может быть пустой."),
  totalHours: z.number().nullable(),
  srsp: z.number().nullable(),
  srs: z.number().nullable(),
  homework: z.string().nullable(),
  notes: z.string().nullable(),
});

const validationResult = computed(() => {
  return formSchema.safeParse({
    ...formData,
    totalHours: formData.totalHours ? Number(formData.totalHours) : null,
    srsp: formData.srsp ? Number(formData.srsp) : null,
    srs: formData.srs ? Number(formData.srs) : null,
  });
});

const isFormValid = computed(() => validationResult.value.success);

const handleSave = () => {
  if (!isFormValid.value) {
    if (!validationResult.value.success) {
      formError.value = validationResult.value.error.issues[0].message;
    }
    return;
  }

  const dataToSave = {
    ...formData,
    totalHours: formData.totalHours ? Number(formData.totalHours) : null,
    srsp: formData.srsp ? Number(formData.srsp) : null,
    srs: formData.srs ? Number(formData.srs) : null,
  };

  if (isEditMode.value && props.detailToEdit) {
    ktpStore.updateKtpDetail(props.detailToEdit.id, dataToSave);
  } else {
    ktpStore.addKtpDetailForClass9(props.class9Id, dataToSave);
  }
  emit("update:opened", false);
};

const showDeleteConfirmation = () => {
  emit("update:opened", false);
  if (!props.detailToEdit) return;

  f7.dialog.confirm(
    `Вы уверены, что хотите удалить тему "${props.detailToEdit.theme}"?`,
    "Удаление темы",
    () => {
      ktpStore.deleteKtpDetail(props.detailToEdit!.id);
    }
  );
};
</script>

<style>
.popover.popover-center-page {
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  border-radius: 0.5rem;
  overflow: hidden;
}
</style>
