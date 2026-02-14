<template>
  <div>
    <button
      id="add-ktp-button"
      class="w-7 h-7 md:p-2 flex items-center justify-center text-white bg-primary hover:bg-primary/90 rounded-full transition-colors"
      :class="{
        'opacity-50 cursor-not-allowed': disabled,
      }"
      @click.stop="openPopover"
      :disabled="disabled"
      :title="disabled ? 'Нельзя загрузить КТП' : 'Импорт/загрузка КТП'"
    >
      <f7-icon
        ios="f7:plus"
        md="material:add"
        size="16px"
        class="text-white"
      ></f7-icon>
    </button>

    <GuardedPopover
      id="add-ktp-popover"
      style="width: 400px !important"
      target="#add-ktp-button"
    >
      <div class="bg-card text-card-foreground">
        <PopoverHeader title="Выбрать" :disabled="!isValid" />

        <div class="p-4 flex flex-col gap-4">
          <button
            class="w-full py-3 rounded-lg text-white bg-gray-500 hover:bg-primary"
            @click="importExisting"
          >
            Импортировать из существующих
          </button>

          <button
            class="w-full py-3 rounded-lg text-white bg-gray-500 hover:bg-primary"
            @click="triggerFileUpload"
          >
            Загрузить файл
          </button>
        </div>
      </div>
    </GuardedPopover>
    <input
      type="file"
      ref="fileInput"
      class="hidden"
      @change="handleFileChange"
      accept=".pdf,.doc,.docx,.xls,.xlsx"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import { f7 } from "framework7-vue";
import PopoverHeader from "@/components/ui/PopoverHeader.vue";
import GuardedPopover from "@/components/ui/GuardedPopover.vue";

const props = defineProps<{
  disabled?: boolean;
}>();

const emit = defineEmits<{
  (e: "import-existing"): void;
  (e: "file-selected", file: File): void;
}>();

const isValid = computed(() => true);

const openPopover = () => {
  f7.popover.open("#add-ktp-popover", "#add-ktp-button");
};

const importExisting = () => {
  f7.popover.close("#add-ktp-popover");
  emit("import-existing");
};

const fileInput = ref<HTMLInputElement | null>(null);

const triggerFileUpload = () => {
  f7.popover.close("#add-ktp-popover");
  fileInput.value?.click();
};

const handleFileChange = (e: Event) => {
  const input = e.target as HTMLInputElement;
  if (input.files && input.files.length > 0) {
    emit("file-selected", input.files[0]);
  }
};
</script>

<style scoped>
/* No additional styles needed; reuse existing utility classes */
</style>
