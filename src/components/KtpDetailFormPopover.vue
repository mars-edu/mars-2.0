<template>
  <GuardedPopover
    v-slot="{ requestClose }"
    id="ktp-detail-form-popover"
    :opened="opened"
    @popover:closed="$emit('update:opened', false)"
    positioning="center"
    style="width: 600px !important; max-width: calc(100vw - 32px) !important"
    :arrow="false"
  >
    <div class="bg-card text-card-foreground">
      <PopoverHeader
        :title="isEditMode ? 'Редактировать' : 'Создать'"
        :on-cancel="requestClose"
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
              type="text"
              inputmode="numeric"
              pattern="[0-9]*"
              v-model:value="formData.totalHours"
              placeholder="0"
            ></f7-input>
          </div>
          <div class="space-y-2">
            <label class="text-sm text-foreground" for="ktp-srsp">СРСП</label>
            <f7-input
              id="ktp-srsp"
              type="text"
              inputmode="numeric"
              pattern="[0-9]*"
              v-model:value="formData.srsp"
              placeholder="0"
            ></f7-input>
          </div>
          <div class="space-y-2">
            <label class="text-sm text-foreground" for="ktp-srs">СРС</label>
            <f7-input
              id="ktp-srs"
              type="text"
              inputmode="numeric"
              pattern="[0-9]*"
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
            <IconTrash class="w-[18px] h-[18px] mr-2" />
            Удалить запись
          </button>
        </div>
      </div>

      <PopoverFooter
        :on-save="handleSave"
        :disabled="!isFormValid || ktpStore.loading"
        :is-loading="ktpStore.loading"
      />
    </div>
  </GuardedPopover>
</template>

<script setup lang="ts">
import { ref, computed, watch, reactive } from "vue";
import { f7, f7Popover, f7Input } from "framework7-vue";
import IconTrash from "~icons/lucide/trash-2";
import { z } from "zod";
import { useKtpStore, type KtpDetail } from "@/stores/ktpStore";
import { useNestedPopover } from "@/composables/useNestedPopover";
import PopoverHeader from "@/components/ui/PopoverHeader.vue";
import PopoverFooter from "@/components/ui/PopoverFooter.vue";
import GuardedPopover from "@/components/ui/GuardedPopover.vue";

const props = defineProps<{
  opened: boolean;
  ktpId: string;
  detailToEdit: KtpDetail | null;
}>();

const emit = defineEmits(["update:opened"]);

const ktpStore = useKtpStore();

// Nested popover management
const { confirmWithParent } = useNestedPopover({
  parentPopoverId: "#ktp-detail-form-popover",
});

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

const resetForm = () => {
  formData.theme = "";
  formData.totalHours = null;
  formData.srsp = null;
  formData.srs = null;
  formData.homework = "";
  formData.notes = "";
  formError.value = "";
};

const loadDetailData = (detail: KtpDetail) => {
  formData.theme = detail.theme;
  formData.totalHours = detail.totalHours;
  formData.srsp = detail.srsp;
  formData.srs = detail.srs;
  formData.homework = detail.homework;
  formData.notes = detail.notes || "";
  formError.value = "";
};

// Reset form when popover opens
watch(
  () => props.opened,
  (isOpen) => {
    if (isOpen) {
      if (props.detailToEdit) {
        loadDetailData(props.detailToEdit);
      } else {
        resetForm();
      }
    }
  }
);

// Also handle when detailToEdit changes while popover is open
watch(
  () => props.detailToEdit,
  (newDetail) => {
    if (props.opened) {
      if (newDetail) {
        loadDetailData(newDetail);
      } else {
        resetForm();
      }
    }
  }
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
    ktpStore.addKtpDetail(props.ktpId, dataToSave);
  }
  emit("update:opened", false);
};

const showDeleteConfirmation = () => {
  if (!props.detailToEdit) return;

  confirmWithParent(
    "Удаление темы",
    `Вы уверены, что хотите удалить тему "${props.detailToEdit.theme}"?`,
    () => {
      ktpStore.deleteKtpDetail(props.detailToEdit!.id);
      emit("update:opened", false);
    },
    () => {
      // On cancel, parent reopens automatically
    }
  );
};
</script>
