<template>
  <GuardedPopover
    v-slot="{ requestClose }"
    id="ktp-detail-form-popover"
    :opened="opened"
    @popover:closed="$emit('update:opened', false)"
    style="width: 650px !important; max-width: calc(100vw - 32px) !important"
    :arrow="false"
  >
    <div class="bg-card text-card-foreground">
      <PopoverHeader
        :title="locked ? 'Просмотр (заблокировано)' : isEditMode ? 'Редактировать' : 'Создать'"
        :on-cancel="requestClose"
      />

      <div v-if="locked" class="px-4 pt-2 flex items-center gap-2 text-amber-600 text-sm">
        <IconLock class="w-4 h-4 flex-shrink-0" />
        <span>Дата прошла — редактирование заблокировано</span>
      </div>

      <div v-if="formError" class="px-4 pt-2 text-destructive text-sm">
        {{ formError }}
      </div>

      <div v-if="hoursWarning" class="px-4 pt-2 text-amber-600 text-sm flex items-center gap-1">
        <IconAlertTriangle class="w-4 h-4 flex-shrink-0" />
        {{ hoursWarning }}
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
            :disabled="locked"
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
              :disabled="locked"
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
              :disabled="locked"
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
              :disabled="locked"
            ></f7-input>
          </div>
        </div>

        <div class="grid grid-cols-3 gap-4">
          <div class="space-y-2">
            <label class="text-sm text-foreground" for="ktp-theoretical">Теория</label>
            <f7-input
              id="ktp-theoretical"
              type="text"
              inputmode="numeric"
              pattern="[0-9]*"
              v-model:value="formData.theoretical"
              placeholder="0"
              :disabled="locked"
            ></f7-input>
          </div>
          <div class="space-y-2">
            <label class="text-sm text-foreground" for="ktp-practical">Практика</label>
            <f7-input
              id="ktp-practical"
              type="text"
              inputmode="numeric"
              pattern="[0-9]*"
              v-model:value="formData.practical"
              placeholder="0"
              :disabled="locked"
            ></f7-input>
          </div>
          <div class="space-y-2">
            <label class="text-sm text-foreground" for="ktp-individual">Индивид.</label>
            <f7-input
              id="ktp-individual"
              type="text"
              inputmode="numeric"
              pattern="[0-9]*"
              v-model:value="formData.individual"
              placeholder="0"
              :disabled="locked"
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
            :disabled="locked"
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
            :disabled="locked"
          ></f7-input>
        </div>

        <div v-if="isEditMode && !locked" class="pt-4 border-t border-border">
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
        v-if="!locked"
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
import IconLock from "~icons/lucide/lock";
import IconAlertTriangle from "~icons/lucide/alert-triangle";
import { z } from "zod";
import { useKtpStore, type KtpDetail } from "@/stores/ktpStore";
import { useNestedParent } from "@/composables/useNestedParent";
import { toNullableNumber } from "@/lib/ktpHelpers";
import PopoverHeader from "@/components/ui/PopoverHeader.vue";
import PopoverFooter from "@/components/ui/PopoverFooter.vue";
import GuardedPopover from "@/components/ui/GuardedPopover.vue";

const props = defineProps<{
  opened: boolean;
  ktpId: string;
  detailToEdit: KtpDetail | null;
  locked?: boolean;
  remainingHours?: number;
}>();

const emit = defineEmits(["update:opened"]);

const ktpStore = useKtpStore();

// Nested popover management
const { confirmWithParent } = useNestedParent({
  parentId: "#ktp-detail-form-popover",
});

const isEditMode = computed(() => !!props.detailToEdit);
const formError = ref("");

const formData = reactive({
  theme: "",
  totalHours: null as number | null,
  srsp: null as number | null,
  srs: null as number | null,
  theoretical: null as number | null,
  practical: null as number | null,
  individual: null as number | null,
  homework: "",
  notes: "",
});

const resetForm = () => {
  formData.theme = "";
  formData.totalHours = null;
  formData.srsp = null;
  formData.srs = null;
  formData.theoretical = null;
  formData.practical = null;
  formData.individual = null;
  formData.homework = "";
  formData.notes = "";
  formError.value = "";
};

const loadDetailData = (detail: KtpDetail) => {
  formData.theme = detail.theme;
  formData.totalHours = detail.totalHours;
  formData.srsp = detail.srsp;
  formData.srs = detail.srs;
  formData.theoretical = detail.theoretical;
  formData.practical = detail.practical;
  formData.individual = detail.individual;
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
  theoretical: z.number().nullable(),
  practical: z.number().nullable(),
  individual: z.number().nullable(),
  homework: z.string().nullable(),
  notes: z.string().nullable(),
});

const validationResult = computed(() => {
  return formSchema.safeParse({
    ...formData,
    totalHours: toNullableNumber(formData.totalHours),
    srsp: toNullableNumber(formData.srsp),
    srs: toNullableNumber(formData.srs),
    theoretical: toNullableNumber(formData.theoretical),
    practical: toNullableNumber(formData.practical),
    individual: toNullableNumber(formData.individual),
  });
});

const isFormValid = computed(() => validationResult.value.success);

// Hours warning computed
const hoursWarning = computed(() => {
  if (props.remainingHours === undefined || props.remainingHours === null) return "";
  const hours = toNullableNumber(formData.totalHours) ?? 0;
  if (hours > 0 && hours > props.remainingHours) {
    return `Внимание: указано ${hours} ч., доступно ${props.remainingHours} ч.`;
  }
  return "";
});

const handleSave = () => {
  if (props.locked) return;

  if (!isFormValid.value) {
    if (!validationResult.value.success) {
      formError.value = validationResult.value.error.issues[0].message;
    }
    return;
  }

  const dataToSave = {
    ...formData,
    totalHours: toNullableNumber(formData.totalHours),
    srsp: toNullableNumber(formData.srsp),
    srs: toNullableNumber(formData.srs),
    theoretical: toNullableNumber(formData.theoretical),
    practical: toNullableNumber(formData.practical),
    individual: toNullableNumber(formData.individual),
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
