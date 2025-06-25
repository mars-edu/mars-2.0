<template>
  <div class="smart-select-wrapper space-y-1">
    <label v-if="label" :for="uniqueId" class="text-sm font-medium">
      {{ label }}
    </label>
    <f7-list
      class="smart-select-list-container no-margin no-hairlines"
      :class="{ 'opacity-50 pointer-events-none': disabled }"
    >
      <f7-list-item
        :title="listTitle"
        :after="selectedOptionText"
        smart-select
        :smart-select-params="{
          openIn: 'popover',
          closeOnSelect: true,
          setValueText: false,
          virtualList: options.length > 20,
        }"
        :id="uniqueId"
        :class="{ 'item-smart-select-value': !!modelValue }"
      >
        <select
          :name="name"
          :value="modelValue"
          @change="handleChange"
          :disabled="disabled"
        >
          <option
            v-if="showInternalPlaceholder"
            value=""
            disabled
            :selected="!modelValue"
          >
            {{ placeholder }}
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
  </div>
</template>

<script setup lang="ts">
import { f7List, f7ListItem } from "framework7-vue";
import { computed, getCurrentInstance } from "vue";

interface SelectOption {
  value: string | number;
  text: string;
}

const props = defineProps<{
  modelValue: string | number;
  options: Array<SelectOption>;
  label?: string;
  name?: string;
  placeholder?: string; // Text for the main display / f7-list-item title
  id?: string;
  // Determines if the <select> itself should have a disabled placeholder option
  // Useful if the list item's title is already serving as the main placeholder display
  showInternalPlaceholder?: boolean;
  disabled?: boolean;
}>();

const emit = defineEmits(["update:modelValue"]);

const instance = getCurrentInstance();
const uniqueId = computed(() => props.id || `smart-select-${instance?.uid}`);

const handleChange = (event: Event) => {
  const target = event.target as HTMLSelectElement;
  emit("update:modelValue", target.value);
};

const selectedOptionText = computed(() => {
  const selected = props.options.find(
    (option) => option.value == props.modelValue
  );
  return selected ? selected.text : "";
});

// The title for the f7-list-item. This is what's always visible.
// F7 will place the selected value in item-after.
const listTitle = computed(() => props.placeholder || " ");
</script>

<style lang="postcss">
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

/* Override default F7 list item bg and ensure it fills container */
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

/* This is the placeholder prop */
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

/* This is where F7 puts the selected value's text */
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

/* If modelValue is empty, the title should be more muted (placeholder style) */
.smart-select-list-container
  .f7-list-item:not(.item-smart-select-value)
  .item-content
  .item-inner {
  color: hsl(var(--muted-foreground));
}

/* If modelValue is empty, hide the item-after if it's empty or duplicative */
.smart-select-list-container
  .f7-list-item:not(.item-smart-select-value)
  .item-content
  .item-inner
  .item-after {
  display: none;
}

/* Focus state */
.smart-select-list-container:focus-within {
  border-color: hsl(var(--primary));
  box-shadow: 0 0 0 2px rgba(var(--primary-rgb), 0.2);
}

/* Hover state */
.smart-select-list-container:hover {
  border-color: hsl(var(--border-hover, var(--border)));
}
</style>
