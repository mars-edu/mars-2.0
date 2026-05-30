<template>
  <GuardedPopover
    v-slot="{ requestClose }"
    id="add-ktp-item-popover"
    :opened="opened"
    @popover:closed="onPopoverClosed"
    positioning="center"
    style="width: 575px !important; max-width: calc(100vw - 32px) !important"
  >
    <div class="bg-card text-card-foreground rounded-2xl overflow-hidden flex flex-col" style="max-height: 80dvh">
      <!-- Header -->
      <PopoverHeader
        title="Создание КТП"
        subtitle="Выберите результат обучения/дисциплину для нового плана"
        :on-cancel="requestClose"
      />

      <!-- Body -->
      <div class="flex-1 overflow-y-auto px-8 pb-6 space-y-6">
        <!-- Error banner -->
        <div
          v-if="formError"
          class="flex items-center gap-2 p-3 rounded-xl bg-destructive/10 text-destructive text-sm font-medium"
        >
          <IconAlertCircle class="w-4 h-4 flex-shrink-0" />
          {{ formError }}
        </div>

        <!-- RUP Entry Select -->
        <div>
          <label class="block text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2 ml-1">
            Результат обучения / дисциплина
          </label>
          <Select
            placeholder="Выберите из списка..."
            v-model="rupEntryId"
            :options="filteredRupEntryOptions"
            name="ktp-item-rupEntry"
            id="ktp-item-rupEntry"
            searchable
          />
        </div>

        <!-- Info hint -->
        <div
          v-if="!rupEntryId"
          class="flex items-start gap-3 p-4 rounded-xl bg-muted/50 text-muted-foreground text-sm"
        >
          <IconInfo class="w-5 h-5 flex-shrink-0 mt-0.5" />
          <div>
            Тематический план будет привязан к выбранной дисциплине
            для учебного года и семестра, указанных на странице.
          </div>
        </div>

        <!-- Selected entry preview -->
        <div
          v-if="selectedEntry"
          class="p-4 rounded-xl border border-border bg-muted/30 space-y-2"
        >
          <div class="flex items-center gap-2">
            <IconBookOpen class="w-4 h-4 text-primary" />
            <span class="text-sm font-semibold">{{ selectedEntry.moduleIndex }} — {{ selectedEntry.moduleName }}</span>
          </div>
          <p
            v-if="selectedEntry.learningOutcome"
            class="text-xs text-muted-foreground ml-6"
          >
            {{ selectedEntry.learningOutcome }}
          </p>
        </div>
      </div>

      <!-- Footer -->
      <PopoverFooter
        save-text="Создать"
        save-variant="success"
        :on-save="handleSave"
        :on-cancel="requestClose"
        :disabled="!isFormValid || rupEntryStore.loading"
        :is-loading="rupEntryStore.loading"
      />
    </div>
  </GuardedPopover>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import { f7 } from "framework7-vue";
import { storeToRefs } from "pinia";
import { useRupEntryStore } from "@/stores/rupEntryStore";
import { useKtpStore } from "@/stores/ktpStore";
import PopoverHeader from "@/components/ui/PopoverHeader.vue";
import PopoverFooter from "@/components/ui/PopoverFooter.vue";
import GuardedPopover from "@/components/ui/GuardedPopover.vue";
import Select from "@/components/ui/Select.vue";
import IconAlertCircle from "~icons/lucide/alert-circle";
import IconInfo from "~icons/lucide/info";
import IconBookOpen from "~icons/lucide/book-open";

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

// Show a preview of the selected RUP entry
const selectedEntry = computed(() => {
  if (!rupEntryId.value) return null;
  return rupEntryStore.getRupEntryById(rupEntryId.value) ?? null;
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
        text: "Тематический план создан",
        closeTimeout: 1500,
        cssClass: "color-green",
      })
      .open();

    emit("update:opened", false);
  } catch (err) {
    formError.value =
      err instanceof Error ? err.message : "Не удалось добавить запись.";
  }
};
</script>
