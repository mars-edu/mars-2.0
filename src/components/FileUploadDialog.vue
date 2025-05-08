<template>
  <f7-dialog
    v-if="opened"
    :opened="opened"
    @dialog:closed="closeDialog"
    class="fixed inset-0 flex items-center justify-center z-50 p-4 bg-black bg-opacity-50"
  >
    <div
      class="bg-background text-foreground rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden"
    >
      <div
        class="flex justify-between items-center p-4 border-b border-border flex-shrink-0"
      >
        <div class="text-xl font-semibold w-full">
          {{
            uploadStage === 1
              ? "Загрузка файла"
              : uploadStage === 2
              ? "Выберите лист"
              : "Выберите столбцы для импорта"
          }}
        </div>
        <button
          class="p-2 text-muted-foreground hover:text-foreground transition-colors w-fit"
          @click="closeDialog"
        >
          <f7-icon ios="f7:xmark" md="material:close" size="24px"></f7-icon>
        </button>
      </div>

      <div class="p-4 md:p-6 overflow-y-auto flex-grow">
        <template v-if="uploadStage === 1">
          <div class="flex flex-col items-center">
            <div
              class="w-full h-40 border-2 border-dashed border-primary/50 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-primary hover:bg-primary/5 transition-colors mb-6"
              @click="triggerFileInput"
              :class="{ 'pointer-events-none opacity-70': isLoading }"
            >
              <f7-icon
                v-if="!isLoading"
                ios="f7:cloud_upload"
                md="material:cloud_upload"
                size="48px"
                class="text-primary mb-2"
              ></f7-icon>
              <f7-icon
                v-else
                ios="f7:arrow_clockwise"
                md="material:refresh"
                size="48px"
                class="text-primary mb-2 animate-spin"
              ></f7-icon>
              <div class="text-sm text-center text-muted-foreground">
                {{
                  isLoading
                    ? "Обработка файла..."
                    : uploadedFile
                    ? uploadedFile.name
                    : "Нажмите или перетащите файл сюда"
                }}
              </div>
              <div class="text-xs text-muted-foreground mt-1">
                Поддерживаемые форматы: .xls, .xlsx
              </div>
              <input
                type="file"
                ref="fileInput"
                @change="handleFileUpload"
                accept=".xls,.xlsx"
                class="hidden"
                :disabled="isLoading"
              />
            </div>
            <div v-if="error" class="text-sm text-red-500 text-center mt-2">
              {{ error }}
            </div>
          </div>
        </template>

        <template v-else-if="uploadStage === 2">
          <div class="flex flex-col">
            <div class="mb-4 text-sm text-muted-foreground">
              Выберите лист для импорта из файла:
              <strong class="text-foreground">{{ uploadedFile?.name }}</strong>
            </div>
            <div class="space-y-2">
              <div
                v-for="sheet in availableSheets"
                :key="sheet"
                class="p-3 border border-border rounded-lg hover:border-primary/50 cursor-pointer transition-all"
                :class="{
                  'border-primary bg-primary/5': selectedSheet === sheet,
                }"
                @click="selectSheet(sheet)"
              >
                <div class="font-medium">{{ sheet }}</div>
              </div>
              <div
                v-if="availableSheets.length === 0"
                class="text-center text-muted-foreground p-4"
              >
                Листы не найдены в файле.
              </div>
            </div>
          </div>
        </template>

        <template v-else-if="uploadStage === 3">
          <div class="flex flex-col">
            <div class="mb-4 text-sm text-muted-foreground">
              Выберите столбцы для импорта из листа
              <strong class="text-foreground">{{ selectedSheet }}</strong
              >:
            </div>
            <div
              class="max-h-[calc(90vh-250px)] min-h-[100px] overflow-y-auto mb-1 border border-border rounded-md p-1"
            >
              <div class="space-y-1">
                <label
                  v-for="col in availableColumns"
                  :key="col"
                  class="flex items-center gap-3 p-2.5 hover:bg-muted/50 rounded-lg cursor-pointer transition-colors"
                  :class="{
                    'bg-primary/10 text-primary': selectedColumns.includes(col),
                  }"
                >
                  <input
                    type="checkbox"
                    v-model="selectedColumns"
                    :value="col"
                    class="form-checkbox h-5 w-5 text-primary rounded border-primary/50 focus:ring-primary/50"
                  />
                  <span class="font-medium">{{ col }}</span>
                </label>
                <div
                  v-if="availableColumns.length === 0"
                  class="text-center text-muted-foreground p-4"
                >
                  Нет доступных столбцов для выбора.
                </div>
              </div>
            </div>
          </div>
        </template>
      </div>

      <div class="p-4 border-t border-border flex-shrink-0">
        <template v-if="uploadStage === 1">
          <div class="flex gap-3 justify-end w-full">
            <button
              class="w-1/3 md:w-auto px-4 py-2 border border-primary text-primary rounded-lg hover:bg-primary/5 transition-colors"
              @click="closeDialog"
              :disabled="isLoading"
            >
              Отмена
            </button>
            <button
              class="w-2/3 md:w-auto px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              :disabled="!uploadedFile || isLoading"
              @click="handleSheetList"
            >
              {{ isLoading ? "Обработка..." : "Далее" }}
              <f7-icon
                v-if="!isLoading"
                ios="f7:arrow_right"
                md="material:arrow_forward"
                class="ml-1"
              ></f7-icon>
            </button>
          </div>
        </template>
        <template v-else-if="uploadStage === 2">
          <div class="flex gap-3 justify-end">
            <button
              class="w-1/3 md:w-auto px-4 py-2 border border-primary text-primary rounded-lg hover:bg-primary/5 transition-colors flex items-center justify-center"
              @click="uploadStage = 1"
              :disabled="isLoadingStage2"
            >
              <f7-icon
                ios="f7:arrow_left"
                md="material:arrow_back"
                class="mr-1"
              ></f7-icon>
              Назад
            </button>
            <button
              class="w-2/3 md:w-auto px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              :disabled="!selectedSheet || isLoadingStage2"
              @click="handleColumnList"
            >
              <template v-if="isLoadingStage2">
                <f7-icon
                  ios="f7:arrow_clockwise"
                  md="material:refresh"
                  class="animate-spin mr-1"
                ></f7-icon>
                Загрузка...
              </template>
              <template v-else>
                Далее
                <f7-icon
                  ios="f7:arrow_right"
                  md="material:arrow_forward"
                  class="ml-1"
                ></f7-icon>
              </template>
            </button>
          </div>
        </template>
        <template v-else-if="uploadStage === 3">
          <div class="flex gap-3 justify-end">
            <button
              class="w-1/3 md:w-auto px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              :disabled="selectedColumns.length === 0 || isLoadingStage3"
              @click="confirmColumnSelection"
            >
              <template v-if="isLoadingStage3">
                <f7-icon
                  ios="f7:arrow_clockwise"
                  md="material:refresh"
                  class="animate-spin mr-1"
                ></f7-icon>
                Импорт...
              </template>
              <template v-else>
                Импортировать
                <f7-icon
                  ios="f7:checkmark_alt"
                  md="material:check"
                  class="ml-1"
                ></f7-icon>
              </template>
            </button>
          </div>
        </template>
      </div>
    </div>
  </f7-dialog>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { f7Icon } from "framework7-vue";
import { f7 } from "framework7-vue";
import { fileClient } from "../lib/http-client";

const props = defineProps<{
  opened: boolean;
}>();

const emit = defineEmits<{
  (e: "update:opened", value: boolean): void;
  (e: "import", columns: string[]): void;
}>();

const uploadStage = ref(1);
const uploadedFile = ref<File | null>(null);
const selectedColumns = ref<string[]>([]);
const selectedSheet = ref<string>("");
const fileInput = ref<HTMLInputElement | null>(null);
const isLoading = ref(false);
const error = ref<string | null>(null);
const availableColumns = ref<string[]>([]);
const availableSheets = ref<string[]>([]);
const isLoadingStage2 = ref(false);
const isLoadingStage3 = ref(false);

const closeDialog = () => {
  emit("update:opened", false);
  uploadStage.value = 1;
  uploadedFile.value = null;
  selectedColumns.value = [];
  selectedSheet.value = "";
  error.value = null;
  availableColumns.value = [];
  availableSheets.value = [];
  isLoading.value = false;
  isLoadingStage2.value = false;
  isLoadingStage3.value = false;
};

const isExcelFile = (file: File): boolean => {
  const validTypes = [
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/x-excel",
    "application/excel",
  ];
  return validTypes.includes(file.type) || /\.(xls|xlsx)$/i.test(file.name);
};

const handleFileUpload = async (e: Event) => {
  const files = (e.target as HTMLInputElement).files;
  if (files && files.length > 0) {
    const file = files[0];
    if (!isExcelFile(file)) {
      f7.dialog.alert(
        "Пожалуйста, выберите файл Excel (.xls или .xlsx)",
        "Неверный формат файла"
      );
      (e.target as HTMLInputElement).value = "";
      return;
    }
    uploadedFile.value = file;
    await handleSheetList();
  }
};

const handleSheetList = async () => {
  if (!uploadedFile.value) return;

  isLoading.value = true;
  error.value = null;

  try {
    const formData = new FormData();
    formData.append("file", uploadedFile.value);

    const response = await fileClient.listExcelSheets(formData);
    if (response.success && response.sheets) {
      availableSheets.value = response.sheets;
      uploadStage.value = 2;
    } else {
      throw new Error("Failed to list sheets");
    }
  } catch (err) {
    error.value =
      "Ошибка при обработке файла. Пожалуйста, попробуйте другой файл.";
    uploadedFile.value = null;
    if (fileInput.value) fileInput.value.value = "";
  } finally {
    isLoading.value = false;
  }
};

const selectSheet = (sheet: string) => {
  selectedSheet.value = sheet;
};

const handleColumnList = async () => {
  if (!uploadedFile.value || !selectedSheet.value) return;

  isLoadingStage2.value = true;
  error.value = null;

  try {
    const formData = new FormData();
    formData.append("file", uploadedFile.value);
    formData.append("sheetName", selectedSheet.value);

    const response = await fileClient.parseExcelColumns(formData);
    if (response.success && response.columns) {
      availableColumns.value = response.columns;
      uploadStage.value = 3;
    } else {
      throw new Error("Failed to parse columns");
    }
  } catch (err) {
    error.value =
      "Ошибка при обработке листа. Пожалуйста, выберите другой лист.";
  } finally {
    isLoadingStage2.value = false;
  }
};

const confirmColumnSelection = async () => {
  isLoadingStage3.value = true;
  try {
    emit("import", selectedColumns.value);
    closeDialog();
  } finally {
    isLoadingStage3.value = false;
  }
};

const triggerFileInput = () => {
  fileInput.value?.click();
};
</script>
