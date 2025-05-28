<template>
  <div class="smart-select-wrapper space-y-1">
    <label
      v-if="label"
      :for="uniqueId"
      class="text-sm font-medium text-foreground"
    >
      {{ label }}
    </label>
    <f7-list class="smart-select-list-container no-margin no-hairlines">
      <f7-list-item
        :title="listTitle"
        smart-select
        :smart-select-params="{
          openIn: 'popover',
          closeOnSelect: true,
          setValueText: true,
          virtualList: options.length > 20,
        }"
        :id="uniqueId"
      >
        <select :name="name" :value="modelValue" @change="handleChange">
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
}>();

const emit = defineEmits(["update:modelValue"]);

const instance = getCurrentInstance();
const uniqueId = computed(() => props.id || `smart-select-${instance?.uid}`);

const handleChange = (event: Event) => {
  const target = event.target as HTMLSelectElement;
  emit("update:modelValue", target.value);
};

// The title for the f7-list-item. This is what's always visible.
// F7 will place the selected value in item-after.
const listTitle = computed(() => props.placeholder || " ");
</script>

<style scoped>
.smart-select-wrapper {
  /* Wrapper for label and select */
}

.smart-select-list-container {
  border: 1px solid hsl(var(--input));
  border-radius: 0.375rem; /* rounded-md */
  background-color: hsl(var(--card));
  --f7-list-item-padding-horizontal: 0px; /* Remove internal padding, control via item-inner */
  --f7-list-item-padding-vertical: 0px;
  --f7-list-item-min-height: auto; /* Let inner content dictate height */
}

/* Override default F7 list item bg and ensure it fills container */
.smart-select-list-container .f7-list-item {
  background-color: transparent;
}

.smart-select-list-container .f7-list-item .item-content {
  padding: 0; /* Remove padding from item-content if any */
  min-height: 36px; /* Desired clickable height, e.g., input height */
}

.smart-select-list-container .f7-list-item .item-content .item-inner {
  padding: 0.5rem 0.75rem; /* py-2 px-3 equivalent */
  padding-right: 28px; /* Space for F7's dropdown arrow */
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  min-height: inherit; /* Inherit from item-content */
}

/* This is the placeholder prop */
.smart-select-list-container
  .f7-list-item
  .item-content
  .item-inner
  .item-title {
  color: hsl(var(--foreground)); /* Default text color */
  font-size: 0.875rem; /* text-sm */
  line-height: 1.25rem; /* text-sm line height */
  white-space: nowrap;
  opacity: 1;
  flex-shrink: 0; /* Title (placeholder) should not shrink */
  margin-right: 0.5rem; /* Space between title and after */
}

/* This is where F7 puts the selected value's text */
.smart-select-list-container
  .f7-list-item
  .item-content
  .item-inner
  .item-after {
  color: hsl(var(--foreground)); /* Value text color */
  font-size: 0.875rem;
  line-height: 1.25rem;
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
  .item-inner
  .item-title {
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
</style>
