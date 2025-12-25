<template>
  <div class="smart-select-wrapper">
    <label v-if="label" :for="uniqueId" class="text-sm font-normal">
      {{ label }}
    </label>
    <f7-list v-if="showSmartSelect && smartSelectReady" :class="f7ListClasses">
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
          @change="handleChange"
          :disabled="disabled"
          :multiple="props.multiple"
        >
          <option
            value=""
            disabled
            :selected="!modelValue && !modelValueIsInOptions"
          >
            {{ placeholder }}
          </option>
          <option
            v-for="option in options"
            :key="option.value"
            :value="option.value"
            :selected="isOptionSelected(option)"
          >
            {{ option.text }}
          </option>
        </select>
      </f7-list-item>
    </f7-list>
    <f7-list
      v-else-if="(props.searchable || props.multiple) && hasOptions"
      :class="f7ListSearchableClasses"
    >
      <f7-list-item
        :title="listTitle"
        :after="selectedOptionText"
        :id="uniqueId"
        :class="{ 'item-smart-select-value': !!modelValue }"
        @click="openSearchablePopup"
      >
        <template v-if="props.multiple && Array.isArray(modelValue)">
          <input
            v-for="val in modelValue"
            :key="val"
            type="hidden"
            :name="name"
            :value="val"
          />
        </template>
        <template v-else>
          <input type="hidden" :name="name" :value="modelValue" />
        </template>
      </f7-list-item>
    </f7-list>
    <f7-list v-else :class="f7ListClasses">
      <f7-list-item :title="placeholder || ' '" after="Нет данных" />
    </f7-list>
    <SearchableSelectPopup
      v-if="props.searchable || props.multiple"
      ref="searchablePopupRef"
      :options="options"
      :title="label || placeholder || 'Выберите'"
      :multiple="props.multiple"
      :search-placeholder="searchPlaceholder"
      @select="onSelectOption"
      @close="onPopupClose"
    />
  </div>
</template>

<script setup lang="ts">
import { f7List, f7ListItem, f7Input } from "framework7-vue";
import SearchableSelectPopup from "./SearchableSelectPopup.vue";
import { f7, f7ready } from "framework7-vue";
import { computed, getCurrentInstance, onMounted, ref, useAttrs } from "vue";

defineOptions({
  inheritAttrs: false,
});

const attrs = useAttrs();

interface SelectOption {
  value: string | number;
  text: string;
}

const props = defineProps<{
  modelValue: string | number | Array<string | number>;
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
  multiple?: boolean;
}>();

const f7ListClasses = computed(() => [
  "smart-select-list-container",
  "no-hairlines",
  {
    "opacity-50": props.disabled,
    "pointer-events-none": props.disabled || !hasOptions.value,
  },
  attrs.class,
]);

const f7ListSearchableClasses = computed(() => [
  "smart-select-list-container",
  "no-margin",
  "no-hairlines",
  {
    "opacity-50": props.disabled,
    "pointer-events-none": props.disabled,
  },
  attrs.class,
]);

const showSmartSelect = computed(() => !props.searchable && !props.multiple);

const searchablePopupRef = ref<any>(null);

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

const modelValueIsInOptions = computed(() => {
  return props.options.some((option) => option.value == props.modelValue);
});

const handleChange = (event: Event) => {
  const target = event.target as HTMLSelectElement;
  if (props.multiple) {
    const values = Array.from(target.selectedOptions).map((o) => o.value);
    emit("update:modelValue", values);
  } else {
    emit("update:modelValue", target.value);
  }
};

const selectedOptionText = computed(() => {
  if (!hasOptions.value) return "Нет данных";
  if (props.multiple && Array.isArray(props.modelValue)) {
    const selectedTexts = props.options
      .filter((o) =>
        (props.modelValue as Array<string | number>).includes(o.value)
      )
      .map((o) => o.text);
    return selectedTexts.join(", ");
  }
  const selected = props.options.find(
    (option) => option.value == props.modelValue
  );
  return selected ? selected.text : "";
});

const listTitle = computed(() => {
  if (!hasOptions.value) return " ";
  // if (props.multiple && Array.isArray(props.modelValue)) {
  //   return (props.modelValue as Array<string | number>).length
  //     ? ""
  //     : props.placeholder || " ";
  // }
  // const selected = props.options.find(
  //   (option) => option.value == props.modelValue
  // );
  // return selected ? "" : props.placeholder || " ";
  return props.placeholder || " ";
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
  virtualList: false,
  view: smartSelectView.value,
  ...(props.searchable && {
    searchbar: true,
  }),
}));

const smartSelectReady = computed(() => {
  return showSmartSelect.value && hasOptions.value && smartSelectView.value;
});

const openSearchablePopup = () => {
  if (props.disabled || !hasOptions.value) return;
  emit("before-open");
  searchablePopupRef.value?.open(props.modelValue);
};

const onSelectOption = (value: string | number | Array<string | number>) => {
  emit("update:modelValue", value);
  emit("after-close");
};

const onPopupClose = () => {
  emit("after-close");
};

const isOptionSelected = (option: SelectOption) => {
  return props.multiple
    ? Array.isArray(props.modelValue)
      ? props.modelValue.includes(option.value)
      : false
    : props.modelValue == option.value;
};
</script>

<style lang="postcss">
/* Remove mode-specific styles */
/* .smart-select .item-content {
  @apply !p-2;
}
.smart-select .item-content .item-inner .item-title {
  @apply !text-muted-foreground !text-sm;
} */

/* Generalize styles */
.smart-select-list-container .item-content {
  overflow: auto;
  height: 38px;
  min-height: 38px;
  padding: 0 !important;
}

.smart-select-list-container .item-content .item-inner .item-title {
  @apply text-muted-foreground text-sm;
}

.smart-select-list-container {
  border-radius: 0.5rem;
  border: 1px solid transparent;
  background-color: hsl(var(--card));
  color: hsl(var(--card-foreground));
  padding-right: 0.75rem;
  --f7-list-item-padding-horizontal: 0px;
  --f7-list-item-padding-vertical: 0px;
  --f7-list-item-min-height: auto;
  transition: all 0.2s ease;
}

.smart-select-list-container:hover {
  border: 1px solid hsl(var(--border));
  background-color: hsl(var(--card));
}

.smart-select-list-container li {
  background-color: transparent;
}

.smart-select-list-container .item-content .item-inner {
  padding: 0.625rem 0.75rem;
  padding-right: 2rem;
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.5rem;
  border-bottom: none;
  position: relative;
  color: hsl(var(--card-foreground));
}

.smart-select-list-container .item-content .item-inner::after {
  content: "";
  position: absolute;
  right: 0.75rem;
  top: 50%;
  transform: translateY(-50%);
  width: 0.625rem;
  height: 0.625rem;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: center;
  opacity: 0.5;
}

.smart-select-list-container .item-title {
  white-space: nowrap;
  opacity: 1;
  flex-shrink: 0;
  font-size: 0.875rem;
  font-weight: 500;
  line-height: 1.25rem;
  color: hsl(var(--muted-foreground));
}

.smart-select-list-container .item-after {
  flex-grow: 1;
  flex-shrink: 1;
  text-align: right;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 0.875rem;
  font-weight: 400;
  line-height: 1.25rem;
  color: hsl(var(--card-foreground));
}

.smart-select-list-container:focus-within {
  border-color: hsl(var(--primary));
  box-shadow: 0 0 0 2px rgba(var(--primary-rgb), 0.2);
}

.smart-select-list-container:hover {
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.popover .list {
  @apply mt-2 bg-card text-card-foreground;
  max-height: 400px;
  overflow-y: auto;
  overflow-x: hidden;
}
</style>
