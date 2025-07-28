<template>
  <div class="smart-select-wrapper">
    <label v-if="label" :for="uniqueId" class="text-sm font-normal">
      {{ label }}
    </label>
    <f7-list
      class="smart-select-list-container no-margin no-hairlines"
      v-if="showSmartSelect && smartSelectReady"
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
          :multiple="props.multiple"
        >
          <option
            value=""
            disabled
            :selected="!modelValue && !modelValueIsInOptions"
          >
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
    <f7-list
      v-else-if="props.searchable && hasOptions"
      class="smart-select-list-container no-margin no-hairlines"
      :class="{
        'opacity-50': disabled,
        'pointer-events-none': disabled,
      }"
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
    <f7-input
      v-else
      type="text"
      outline
      disabled
      :placeholder="!hasOptions ? 'Нет данных' : placeholder || ' '"
    />
    <SearchableSelectPopup
      v-if="props.searchable"
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
import { computed, getCurrentInstance, onMounted, ref } from "vue";

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

const showSmartSelect = computed(() => !props.searchable);

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
  if (props.multiple && Array.isArray(props.modelValue)) {
    return (props.modelValue as Array<string | number>).length
      ? ""
      : props.placeholder || " ";
  }
  const selected = props.options.find(
    (option) => option.value == props.modelValue
  );
  return selected ? "" : props.placeholder || " ";
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
  @apply p-2;
}

.smart-select-list-container .item-content .item-inner .item-title {
  @apply text-muted-foreground text-sm;
}

.smart-select-list-container {
  border-radius: 0.5rem;
  border: 1px solid transparent;
  background-color: hsl(var(--background));
  --f7-list-item-padding-horizontal: 0px;
  --f7-list-item-padding-vertical: 0px;
  --f7-list-item-min-height: auto;
  transition: all 0.2s ease;
}

.smart-select-list-container:hover {
  border: 1px solid hsl(var(--border));
}

.smart-select-list-container .f7-list-item {
  background-color: transparent;
}

/* Adjust min-height for consistency */
.smart-select-list-container .f7-list-item .item-content {
  /* padding: 0; */ /* Removed to allow generalized p-2 */
  min-height: 44px;
}

.smart-select-list-container .f7-list-item .item-content .item-inner {
  padding: 0.625rem 0.875rem;
  padding-right: 32px;
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: none;
  position: relative;
}

.smart-select-list-container .f7-list-item .item-content .item-inner::after {
  content: "";
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  width: 10px;
  height: 10px;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: center;
  opacity: 0.6;
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
  font-weight: 500;
}

.smart-select-list-container
  .f7-list-item
  .item-content
  .item-inner
  .item-after {
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
  .item-inner
  .item-after {
  display: none;
}

.smart-select-list-container:focus-within {
  border-color: hsl(var(--primary));
  box-shadow: 0 0 0 2px rgba(var(--primary-rgb), 0.2);
}

.smart-select-list-container:hover {
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.list .item-after {
  margin-left: 0 !important;
  @apply text-sm;
  @apply py-[0.1rem];
}

.list .item-after {
  @apply text-foreground;
}
</style>
