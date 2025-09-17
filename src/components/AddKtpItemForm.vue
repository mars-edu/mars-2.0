<template>
  <f7-popover
    id="add-ktp-item-popover"
    :opened="opened"
    @popover:closed="onPopoverClosed"
    class="popover-center-page"
    style="width: 600px !important"
    close-on-escape
  >
    <div class="bg-card text-card-foreground">
      <PopoverHeader
        title="Результат обучения/дисциплина"
        :disabled="!isFormValid || class9Store.loading"
        :is-loading="class9Store.loading"
        :on-cancel="onPopoverClosed"
        :on-save="handleSave"
      />

      <div v-if="formError" class="px-4 pt-2 text-destructive text-sm">
        {{ formError }}
      </div>

      <div class="p-4 space-y-3">
        <Select
          label="Результат обучения/дисциплина"
          placeholder="Выберите результат обучения/дисциплину"
          v-model="class9Id"
          :options="class9Options"
          name="ktp-item-class9"
          id="ktp-item-class9"
          searchable
          @before-open="closeKtpItemPopover"
          @after-close="openKtpItemPopover"
        />
      </div>
    </div>
  </f7-popover>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import { f7Popover, f7 } from "framework7-vue";
import { storeToRefs } from "pinia";
import { useClass9Store } from "@/stores/class9Store";
import { useKtpStore } from "@/stores/ktpStore";
import { useCalendarStore } from "@/stores/calendarStore";
import PopoverHeader from "@/components/ui/PopoverHeader.vue";
import Select from "@/components/ui/Select.vue";

const props = defineProps<{
  opened: boolean;
}>();

const emit = defineEmits(["update:opened"]);

const class9Store = useClass9Store();
const ktpStore = useKtpStore();
const calendarStore = useCalendarStore();
const { class9Options } = storeToRefs(calendarStore);
const formError = ref("");

const class9Id = ref("");

const isFormValid = computed(() => {
  return !!class9Id.value;
});

const resetForm = () => {
  class9Id.value = "";
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
    formError.value = "Пожалуйста, выберите результат обучения/дисциплину.";
    return;
  }

  try {
    const selectedItem = class9Store.getClass9ById(class9Id.value);
    if (!selectedItem) {
      formError.value = "Выбранный элемент не найден.";
      return;
    }

    // Create initial KTP detail for the selected module/discipline
    const ktp = ktpStore.ensureKtpForClass9(class9Id.value);
    ktpStore.addKtpDetail(ktp.id, {
      theme:
        selectedItem.learningOutcome ||
        `${selectedItem.moduleIndex} ${selectedItem.moduleName}`,
    });

    // Optional toast for feedback
    f7.toast
      .create({
        text: "Элемент КТП создан",
        closeTimeout: 1500,
        cssClass: "color-green",
      })
      .open();

    onPopoverClosed();
  } catch (err) {
    formError.value =
      err instanceof Error ? err.message : "Не удалось добавить запись.";
  }
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
