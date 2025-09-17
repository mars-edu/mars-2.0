<template>
  <f7-popup
    :opened="isPopupOpen"
    @popup:closed="onPopupClosed"
    class="select-search-popup"
  >
    <f7-page>
      <div class="event-popover bg-card text-card-foreground h-full">
        <PopoverHeader
          :title="title"
          cancel-text="Назад"
          save-text="Выбрать"
          :on-cancel="internalClose"
          :on-save="saveSelection"
          :disabled="localSelected.size === 0"
        />
        <div class="p-4 space-y-4">
          <f7-input
            type="text"
            :placeholder="searchPlaceholder || 'Поиск...'"
            v-model:value="searchTerm"
            clear-button
          />

          <div class="text-sm text-muted-foreground">
            Найдено: {{ filteredOptions.length }}
          </div>

          <div class="h-full overflow-y-auto border border-input rounded-lg">
            <table class="w-full text-sm">
              <tbody>
                <tr
                  v-for="opt in filteredOptions"
                  :key="String(opt.value)"
                  :class="rowClass(opt)"
                  @click="selectOption(opt.value)"
                >
                  <td class="p-2 w-12">
                    <template v-if="isMultiple">
                      <f7-checkbox :checked="localSelected.has(opt.value)" />
                    </template>
                    <template v-else>
                      <f7-radio :checked="localSelected.has(opt.value)" />
                    </template>
                  </td>
                  <td class="p-2">{{ opt.text }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </f7-page>
  </f7-popup>
</template>

<script setup lang="ts">
import { ref, computed, reactive } from "vue";
import Fuse from "fuse.js";
import { f7Input, f7Radio, f7Popup, f7Page } from "framework7-vue";
import PopoverHeader from "./PopoverHeader.vue";

interface SelectOption {
  value: string | number;
  text: string;
}

const props = defineProps<{
  options: Array<SelectOption>;
  title?: string;
  searchPlaceholder?: string;
  multiple?: boolean;
}>();

const emit = defineEmits<{
  (e: "select", value: string | number | Array<string | number>): void;
  (e: "close"): void;
}>();

const isPopupOpen = ref(false);
const searchTerm = ref("");

const localSelected = reactive(new Set<string | number>());

const filteredOptions = computed(() => {
  const term = searchTerm.value.trim();
  if (!term) return props.options;

  const fuse = new Fuse(props.options, {
    keys: ["text"],
    threshold: 0.4,
  });
  return fuse.search(term).map((r) => r.item);
});

const isMultiple = computed(() => !!props.multiple);

function rowClass(opt: SelectOption) {
  const selected = localSelected.has(opt.value);
  return [
    "cursor-pointer border-b border-input last:border-b-0 hover:bg-muted/50",
    { "bg-primary/10": selected },
  ];
}

function selectOption(val: string | number) {
  if (isMultiple.value) {
    if (localSelected.has(val)) {
      localSelected.delete(val);
    } else {
      localSelected.add(val);
    }
  } else {
    localSelected.clear();
    localSelected.add(val);
  }
}

function internalClose() {
  isPopupOpen.value = false;
}

function onPopupClosed() {
  emit("close");
}

function saveSelection() {
  if (localSelected.size === 0) return internalClose();

  if (isMultiple.value) {
    emit("select", Array.from(localSelected));
  } else {
    emit("select", Array.from(localSelected)[0]);
  }
  internalClose();
}

function open(current: string | number | Array<string | number>) {
  localSelected.clear();
  if (current !== undefined && current !== null) {
    if (Array.isArray(current)) {
      current.forEach((v) => localSelected.add(v));
    } else {
      localSelected.add(current);
    }
  }
  searchTerm.value = "";
  isPopupOpen.value = true;
}

defineExpose({ open });
</script>

<style>
.select-search-popup {
  width: 600px;
  height: auto;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  border-radius: 1rem;
  overflow: hidden;
}
.select-search-popup .page-content {
  padding: 0;
}
</style>
