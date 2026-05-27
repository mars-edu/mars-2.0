<template>
  <GuardedPopover
    v-slot="{ requestClose }"
    id="add-ktp-item-popover"
    :opened="opened"
    @popover:closed="onPopoverClosed"
    positioning="center"
    style="width: 600px !important"
  >
    <div class="bg-card text-card-foreground">
      <PopoverHeader
        title="Результат обучения/дисциплина"
        :on-cancel="requestClose"
      />
      <div v-if="formError" class="px-4 pt-2 text-destructive text-sm">
        {{ formError }}
      </div>

      <div class="p-4 space-y-3">
        <Select
          label="Результат обучения/дисциплина"
          placeholder="Выберите результат обучения/дисциплину"
          v-model="rupEntryId"
          :options="filteredRupEntryOptions"
          name="ktp-item-rupEntry"
          id="ktp-item-rupEntry"
          searchable
          @before-open="closeKtpItemPopover"
          @after-close="openKtpItemPopover"
        />
      </div>

      <PopoverFooter
        :on-save="handleSave"
        :disabled="!isFormValid || rupEntryStore.loading"
        :is-loading="rupEntryStore.loading"
      />
    </div>
  </GuardedPopover>
</template>

<script setup lang="ts">
import { ref, computed, watch } from "vue";
import { f7Popover, f7 } from "framework7-vue";
import { storeToRefs } from "pinia";
import { useRupEntryStore } from "@/stores/rupEntryStore";
import { useKtpStore } from "@/stores/ktpStore";
import PopoverHeader from "@/components/ui/PopoverHeader.vue";
import PopoverFooter from "@/components/ui/PopoverFooter.vue";
import GuardedPopover from "@/components/ui/GuardedPopover.vue";
import Select from "@/components/ui/Select.vue";

const props = defineProps<{
  opened: boolean;
  selectedAcademicYearId?: string;
  selectedSemesterId?: string;
}>();

const emit = defineEmits(["update:opened"]);

const rupEntryStore = useRupEntryStore();
const ktpStore = useKtpStore();
const { rupEntryOptions } = storeToRefs(rupEntryStore);
const formError = ref("");

const rupEntryId = ref("");

// Create filtered rupEntryOptions based on selected academic year and semester from props
const filteredRupEntryOptions = computed(() => {
  if (!props.selectedAcademicYearId || !props.selectedSemesterId) {
    return rupEntryOptions.value;
  }

  return rupEntryOptions.value.filter((option) => {
    const rupEntryItem = rupEntryStore.getRupEntryById(option.value);
    if (!rupEntryItem) return false;

    // Check if rupEntryItem has distributionEntries with matching academicYearId and semesterId
    return rupEntryItem.distributionEntries.some(
      (entry) =>
        entry.academicYearId === props.selectedAcademicYearId &&
        entry.semesterId === props.selectedSemesterId
    );
  });
});

const isFormValid = computed(() => {
  return (
    !!rupEntryId.value &&
    !!props.selectedAcademicYearId &&
    !!props.selectedSemesterId
  );
});

const resetForm = () => {
  rupEntryId.value = "";
  formError.value = "";
};

const onPopoverClosed = () => {
  resetForm();
  emit("update:opened", false);
};

const closeKtpItemPopover = () => {
  f7.popover.close("#add-ktp-item-popover");
};

const openKtpItemPopover = () => {
  f7.popover.open("#add-ktp-item-popover");
};

const handleSave = async () => {
  if (!isFormValid.value) {
    formError.value = "Пожалуйста, заполните все поля.";
    return;
  }

  if (!props.selectedAcademicYearId || !props.selectedSemesterId) {
    formError.value = "Не удалось определить учебный год или семестр.";
    return;
  }

  try {
    const selectedItem = rupEntryStore.getRupEntryById(rupEntryId.value);
    if (!selectedItem) {
      formError.value = "Выбранный элемент не найден.";
      return;
    }

    const ktp = await ktpStore.ensureKtpForRupEntry(
      rupEntryId.value,
      props.selectedAcademicYearId,
      props.selectedSemesterId
    );

    f7.toast
      .create({
        text: "Элемент КТП создан",
        closeTimeout: 1500,
        cssClass: "color-green",
      })
      .open();

    closeKtpItemPopover();
  } catch (err) {
    formError.value =
      err instanceof Error ? err.message : "Не удалось добавить запись.";
  }
};
</script>
