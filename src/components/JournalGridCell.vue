<template>
  <td
    class="px-1 py-2 text-center border-r border-border min-w-[56px] w-16 align-top transition-colors relative"
    :class="[
      header.isFinalSummary
        ? 'bg-destructive/5 font-bold'
        : 'hover:bg-muted/80',
      {
        'bg-muted/40 font-semibold': header.type === 'session' || header.type === 'pk' || header.type === 'e' || header.type === 'i',
        'bg-muted/30 cursor-not-allowed': header.type === 'date' && header.isoDate && isFuture,
      },
    ]"
  >
    <div class="flex flex-col gap-1 w-full h-full">
      <div
        v-for="mIdx in (header.dynamicRows || 1)"
        :key="mIdx"
        class="h-8 flex items-center justify-center transition-transform duration-300 relative"
        :class="{
          'scale-175 z-10': editingMarkIndex === (mIdx - 1),
        }"
      >
        <div
          v-if="!isViewOnly"
          class="absolute top-0 right-0 w-1.5 h-1.5"
          :class="{
            'bg-destructive rounded-bl-sm': marks[mIdx - 1] === 'Н',
          }"
        ></div>

        <EditableMarkCell
          v-if="editingMarkIndex === (mIdx - 1)"
          :model-value="editedValue"
          @update:model-value="$emit('update:editedValue', $event)"
          @confirm="$emit('confirm-edit')"
          @cancel="$emit('cancel-edit')"
          @navigate="(dir: string) => $emit('navigate', dir)"
          :is-zoomed="true"
        />
        <div
          v-else
          @click="onCellClick(mIdx - 1)"
          class="w-full h-full cursor-pointer flex items-center justify-center"
          :title="
            header.type === 'date' && isFuture
              ? 'Нельзя выставлять оценки авансом'
              : undefined
          "
        >
          <MarkCell
            :mark="marks[mIdx - 1]"
            :disabled="header.type === 'date' && header.isoDate && isFuture"
          />
        </div>
      </div>
    </div>
  </td>
</template>

<script setup lang="ts">
import EditableMarkCell from "@/components/ui/EditableMarkCell.vue";
import MarkCell from "@/components/ui/MarkCell.vue";

import { f7 } from "framework7-vue";

const props = defineProps<{
  header: any;
  marks: any[];
  editingMarkIndex: number | null;
  editedValue: string;
  isViewOnly: boolean;
  isFuture: boolean;
  isPast: boolean;
}>();

const emit = defineEmits<{
  (e: 'cell-click', markIndex: number): void;
  (e: 'update:editedValue', value: string): void;
  (e: 'confirm-edit'): void;
  (e: 'cancel-edit'): void;
  (e: 'navigate', direction: string): void;
}>();

const onCellClick = (markIndex: number) => {
  if (props.isViewOnly) return;
  if (props.header.type === 'date' && props.header.isoDate) {
    if (props.isFuture) {
      f7.toast.create({
        text: 'Нельзя выставлять оценки авансом',
        position: 'center',
        closeTimeout: 2000,
      }).open();
      return;
    }
  }
  if (props.header.isFinalSummary) return;
  emit('cell-click', markIndex);
};
</script>
