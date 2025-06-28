<template>
  <div class="smart-select-wrapper space-y-1">
    <label v-if="label" :for="uniqueId" class="text-sm font-medium">
      {{ label }}
    </label>
    <f7-list
      class="smart-select-list-container no-margin no-hairlines"
      v-if="smartSelectReady"
      :class="{
        'opacity-50': disabled,
        'pointer-events-none': disabled || !hasOptions,
      }"
    >
      <f7-list-item
        :title="listTitle"
        :after="selectedOptionText"
        smart-select
        :smart-select-params="smartSelectParams"
        :id="uniqueId"
        :class="{ 'item-smart-select-value': !!modelValue }"
        @smartselect:open="onSmartSelectOpen"
        @smartselect:close="onSmartSelectClose"
      >
        <select
          :name="name"
          :value="modelValue"
          @change="handleChange"
          :disabled="disabled"
        >
          <option value="" disabled :selected="!modelValue">
            {{ placeholder || " " }}
          </option>
          <option
            v-for="option in options"
            :key="option.value"
            :value="option.value"
          >
            {{ option.text }}
          </option>
        </select>
      </f7-list-item>
    </f7-list>
    <f7-input
      v-else
      type="text"
      outline
      disabled
      :placeholder="!hasOptions ? 'Нет данных' : placeholder || ' '"
    />
  </div>
</template>

<script setup lang="ts">
import { f7List, f7ListItem, f7Input } from "framework7-vue";
import { f7, f7ready } from "framework7-vue";
import { computed, getCurrentInstance, onMounted, ref } from "vue";

interface SelectOption {
  value: string | number;
  text: string;
}

const props = defineProps<{
  modelValue: string | number;
  options: Array<SelectOption>;
  label?: string;
  name?: string;
  placeholder?: string;
  id?: string;
  showInternalPlaceholder?: boolean;
  disabled?: boolean;
  searchable?: boolean;
  searchPlaceholder?: string;
  searchCancelText?: string;
}>();

const emit = defineEmits(["update:modelValue", "before-open", "after-close"]);

const hasOptions = computed(() => props.options && props.options.length > 0);

const instance = getCurrentInstance();
const uniqueId = computed(() => props.id || `smart-select-${instance?.uid}`);

const onSmartSelectOpen = () => {
  if (props.searchable) {
    emit("before-open");
  }
};

const onSmartSelectClose = () => {
  if (props.searchable) {
    emit("after-close");
  }
};

const handleChange = (event: Event) => {
  const target = event.target as HTMLSelectElement;
  emit("update:modelValue", target.value);
};

const selectedOptionText = computed(() => {
  if (!hasOptions.value) return "Нет данных";
  const selected = props.options.find(
    (option) => option.value == props.modelValue
  );
  return selected ? selected.text : "";
});

const listTitle = computed(() => {
  if (!hasOptions.value) return " ";
  return props.modelValue ? "" : props.placeholder || " ";
});

const smartSelectView = ref<any>(null);

onMounted(() => {
  f7ready(() => {
    smartSelectView.value = f7?.views?.main || undefined;
  });
});

const smartSelectParams = computed(() => ({
  openIn: props.searchable ? "popup" : "popover",
  closeOnSelect: true,
  setValueText: false,
  virtualList: props.options.length > 20,
  view: smartSelectView.value,
  ...(props.searchable && {
    searchbar: true,
    searchbarPlaceholder: props.searchPlaceholder || "Поиск",
    searchbarDisableButtonText: "Отмена",
  }),
}));

const smartSelectReady = computed(() => {
  return hasOptions.value && smartSelectView.value;
});
</script>

<style lang="postcss">
.popup.smart-select-popup {
  z-index: 13000 !important;
}

.smart-select .item-content {
  @apply !p-2;
}
.smart-select .item-content .item-inner .item-title {
  @apply !text-muted-foreground !text-sm;
}

.smart-select-list-container {
  border-radius: 0.5rem;
  background-color: hsl(var(--background));
  --f7-list-item-padding-horizontal: 0px;
  --f7-list-item-padding-vertical: 0px;
  --f7-list-item-min-height: auto;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

.smart-select-list-container .f7-list-item {
  background-color: transparent;
}

.smart-select-list-container .f7-list-item .item-content {
  padding: 0;
  min-height: 40px;
}

.smart-select-list-container .f7-list-item .item-content .item-inner {
  padding: 0.625rem 0.875rem;
  padding-right: 32px;
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: none;
}

.smart-select-list-container
  .f7-list-item
  .item-content
  .item-inner
  .item-title {
  white-space: nowrap;
  opacity: 1;
  flex-shrink: 0;
  margin-right: 0.5rem;
  color: hsl(var(--muted-foreground));
}

.smart-select-list-container
  .f7-list-item
  .item-content
  .item-inner
  .item-after {
  color: hsl(var(--foreground));
  flex-grow: 1;
  flex-shrink: 1;
  text-align: right;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.smart-select-list-container
  .f7-list-item:not(.item-smart-select-value)
  .item-content
  .item-inner {
  color: hsl(var(--muted-foreground));
}

.smart-select-list-container
  .f7-list-item:not(.item-smart-select-value)
  .item-content
  .item-inner
  .item-after {
  display: none;
}

.smart-select-list-container:focus-within {
  border-color: hsl(var(--primary));
  box-shadow: 0 0 0 2px rgba(var(--primary-rgb), 0.2);
}

.smart-select-list-container:hover {
  border-color: hsl(var(--border-hover, var(--border)));
}
</style>
