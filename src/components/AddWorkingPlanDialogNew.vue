<template>
  <div>
          <button
          id="add-working-plan-new-button"
            class="w-full py-3 rounded-lg text-white bg-gray-500 hover:bg-primary"
            @click="openWorkingPlanPopover()"
          >
            На базе 9 класса
          </button>

    <f7-popover
      id="add-working-plan-new-popover"
      style="width: 400px !important"
      target="#add-working-plan-new-button"
      close-on-escape
    >
      <div class="working-plan-popover bg-card text-card-foreground">
        <PopoverHeader
          title="Выбрать"
          :disabled="!isValid"
        />

        <div class="p-4 flex flex-col gap-4">
          <button
            class="w-full py-3 rounded-lg text-white bg-gray-500 hover:bg-primary"
            @click="openClass9Popup"
          >
            Создать
          </button>

          <button
            class="w-full py-3 rounded-lg text-white bg-gray-500 hover:bg-primary"
            @click="handleImport"
          >
            Импортировать
          </button>
        </div>
      </div>
    </f7-popover>

    <Class9Popup
      target="#add-working-plan-new-button"
      :specialty-id="specialtyId"
      :course-id="courseId"
      @submit="handleClass9Submit"
      @close="closeClass9Popup"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { f7 } from "framework7-vue";
import PopoverHeader from "@/components/ui/PopoverHeader.vue";
import Class9Popup from "./Class9Popup.vue";

const props = defineProps<{
  disabled?: boolean;
  specialtyId: string;
  courseId: string;
}>();

const emit = defineEmits<{
  (e: "create"): void;
  (e: "import"): void;
  (e: "opened"): void;
}>();

const isValid = computed(() => {
  return true;
});

const showClass9Popup = ref(false);

const openWorkingPlanPopover = () => {
    emit("opened")
  f7.popover.open("#add-working-plan-new-popover", "#add-working-plan-button");
};

const handleClose = () => {
  f7.popover.close("#add-working-plan-new-popover");
};

const openClass9Popup = () => {
  f7.popover.close("#add-working-plan-new-popover");
  setTimeout(() => {
    f7.popover.open("#class9-popover");
  }, 100);
};

const closeClass9Popup = () => {
  f7.popover.close("#class9-popover");
};

const handleClass9Submit = () => {
  closeClass9Popup();
};

const handleImport = () => {
  emit("import");
  handleClose();
};
</script>

<style>
.working-plan-popover {
  max-height: 90vh;
  overflow-y: auto;
}
</style> 