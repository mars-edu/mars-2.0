<template>
  <div>
    <slot name="trigger" :open="openColumnConfigPopover"></slot>
    <GuardedPopover
      id="column-config-popover"
      style="width: 600px !important"
      :target="popoverTarget"
      :on-closed="handlePopoverClosed"
    >
      <div class="column-config-popover bg-card text-card-foreground">
        <div
          class="flex justify-between items-center px-4 py-3 border-b border-input"
        >
          <button
            class="text-muted-foreground hover:text-foreground"
            @click="handleCancel"
          >
            Отменить
          </button>
          <span class="text-foreground font-semibold">Создать</span>
          <button
            class="text-primary hover:text-primary/80 disabled:text-muted-foreground"
            :disabled="!!formError"
            @click="handleSaveColumns"
          >
            Сохранить
          </button>
        </div>
        <div v-if="formError" class="px-4 pt-2 text-destructive text-sm">
          {{ formError }}
        </div>
        <div class="p-4 space-y-6">
          <div class="grid grid-cols-[1fr,auto] gap-4 mb-2">
            <div class="text-foreground text-sm font-medium">
              Наименование столбца
            </div>
            <div class="text-foreground text-sm font-medium w-24 text-center">
              Ширина
            </div>
          </div>
          <template v-for="(column, index) in columns" :key="index">
            <div class="grid grid-cols-[1fr,auto,auto] gap-4 items-center">
              <f7-input
                type="text"
                v-model:value="columns[index].name"
                placeholder="Столбец"
              />
              <button
                class="w-24 px-3 py-2 bg-primary text-primary-foreground rounded-[10px] font-medium text-[15px]"
                @click="toggleWidth(index)"
              >
                {{ column.width === 1 ? "Узкий" : "Широкий" }}
              </button>
              <button
                class="w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center"
                @click="deleteColumn(index)"
              >
                <IconTrash class="w-3 h-3" />
              </button>
            </div>
          </template>
          <div class="flex justify-start mt-6">
            <button
              class="w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center"
              @click="addColumn"
            >
              <IconPlus class="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </GuardedPopover>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import { f7 } from "framework7-vue";
import IconTrash from "~icons/lucide/trash-2";
import IconPlus from "~icons/lucide/plus";
import { useColumnConfigStore } from "@/stores/columnConfig";
import { useSelectedItemsStore } from "@/stores/selectedItemsStore";
import { z } from "zod";
import GuardedPopover from "@/components/ui/GuardedPopover.vue";

interface Column {
  name: string;
  width: number;
}

const props = defineProps({
  courseId: {
    type: String,
    default: "",
  },
});

const columnStore = useColumnConfigStore();
const selectedItemsStore = useSelectedItemsStore();

const columnSchema = z.object({
  columns: z
    .array(
      z.object({
        name: z.string(),
        width: z.number().min(1).max(3),
      })
    )
    .refine(
      (columns) => columns.some((col) => col.name.trim() !== ""),
      "Пожалуйста, укажите название хотя бы для одного столбца"
    ),
});

const currentCourseId = computed(
  () => props.courseId || selectedItemsStore.selectedCourseId
);

const columns = computed({
  get: () => {
    if (currentCourseId.value) {
      return columnStore.getColumnsForCourse(currentCourseId.value);
    }
    return [];
  },
  set: (value) => {
    if (currentCourseId.value) {
      columnStore.setColumnsForCourse(currentCourseId.value, value);
    }
  },
});

const formError = computed(() => {
  const result = columnSchema.safeParse({ columns: columns.value });
  if (!result.success) {
    return result.error.issues[0].message;
  }
  return "";
});

const popoverTarget = ref<string | HTMLElement>("#column-config-button");
const shouldResetOnClose = ref(true);

const openColumnConfigPopover = (event?: Event) => {
  if (event && event.currentTarget) {
    popoverTarget.value = event.currentTarget as HTMLElement;
    f7.popover.open(
      "#column-config-popover",
      event.currentTarget as HTMLElement
    );
  } else {
    popoverTarget.value = "#column-config-button";
    f7.popover.open("#column-config-popover", "#column-config-button");
  }
  shouldResetOnClose.value = true;
};

const closeColumnConfigPopover = (reason: "cancel" | "programmatic" = "programmatic") => {
  f7.popover.close("#column-config-popover", true, reason);
};

const handleCancel = () => {
  shouldResetOnClose.value = true;
  closeColumnConfigPopover("cancel");
};

const handlePopoverClosed = () => {
  if (shouldResetOnClose.value) {
    resetForm();
  }
  shouldResetOnClose.value = true;
};

const addColumn = () => {
  const newColumns = [...columns.value, { name: "", width: 1 }];
  if (currentCourseId.value) {
    columnStore.setColumnsForCourse(currentCourseId.value, newColumns);
  }
};

const toggleWidth = (index: number) => {
  const newColumns = [...columns.value];
  newColumns[index].width = newColumns[index].width === 1 ? 3 : 1;
  if (currentCourseId.value) {
    columnStore.setColumnsForCourse(currentCourseId.value, newColumns);
  }
};

const deleteColumn = (index: number) => {
  if (columns.value.length > 1) {
    const newColumns = [...columns.value];
    newColumns.splice(index, 1);
    if (currentCourseId.value) {
      columnStore.setColumnsForCourse(currentCourseId.value, newColumns);
    }
  } else {
    if (currentCourseId.value) {
      columnStore.setColumnsForCourse(currentCourseId.value, []);
    }
  }
};

const handleSaveColumns = () => {
  const validationResult = columnSchema.safeParse({ columns: columns.value });
  if (!validationResult.success) return;

  shouldResetOnClose.value = false;
  closeColumnConfigPopover("programmatic");
};

const resetForm = () => {
  if (currentCourseId.value) {
    columnStore.resetColumnsForCourse(currentCourseId.value);
  }
};
</script>
