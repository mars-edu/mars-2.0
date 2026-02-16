<template>
  <div class="select-wrapper" :class="[attrs.class, { 'opacity-50 pointer-events-none': props.disabled }]">
    <div v-if="label" class="text-xs font-medium text-muted-foreground mb-1">
      {{ label }}
    </div>

    <!-- Normal smart select (non-searchable, non-multiple) -->
    <f7-list v-if="showSmartSelect && smartSelectReady" class="select-f7-list no-hairlines">
      <f7-list-item
        :title="' '"
        :after="selectedOptionText"
        smart-select
        :smart-select-params="smartSelectParams"
        :id="uniqueId"
        :class="['select-item', { 'select-placeholder': isShowingPlaceholder }]"
        @smartselect:open="onSmartSelectOpen"
        @smartselect:close="onSmartSelectClose"
      >
        <select :name="name" @change="handleChange" :disabled="disabled" :multiple="props.multiple">
          <option value="" disabled :selected="!modelValue && !modelValueIsInOptions">
            {{ placeholder }}
          </option>
          <option v-for="option in options" :key="option.value" :value="option.value" :selected="isOptionSelected(option)">
            {{ option.text }}
          </option>
        </select>
      </f7-list-item>
    </f7-list>

    <!-- Searchable / multiple, OR normal select before F7 view is ready -->
    <f7-list v-else-if="hasOptions" class="select-f7-list no-hairlines">
      <f7-list-item
        :title="' '"
        :after="selectedOptionText"
        :id="uniqueId"
        :class="['select-item', { 'select-placeholder': isShowingPlaceholder }]"
        @click="openSearchablePopup"
      >
        <template v-if="props.multiple && Array.isArray(modelValue)">
          <input v-for="val in modelValue" :key="val" type="hidden" :name="name" :value="val" />
        </template>
        <template v-else>
          <input type="hidden" :name="name" :value="modelValue" />
        </template>
      </f7-list-item>
    </f7-list>

    <!-- No data -->
    <f7-list v-else class="select-f7-list no-hairlines">
      <f7-list-item :title="' '" after="Нет данных" class="select-item select-placeholder" />
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
import { f7List, f7ListItem } from "framework7-vue";
import SearchableSelectPopup from "./SearchableSelectPopup.vue";
import { f7, f7ready } from "framework7-vue";
import { computed, getCurrentInstance, onMounted, ref, useAttrs } from "vue";

defineOptions({ inheritAttrs: false });

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

const emit = defineEmits(["update:modelValue", "before-open", "after-close"]);

const hasOptions = computed(() => props.options && props.options.length > 0);
const showSmartSelect = computed(() => !props.searchable && !props.multiple);

const instance = getCurrentInstance();
const uniqueId = computed(() => props.id || `smart-select-${instance?.uid}`);
const searchablePopupRef = ref<any>(null);
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
  ...(props.searchable && { searchbar: true }),
}));

const smartSelectReady = computed(
  () => showSmartSelect.value && hasOptions.value && smartSelectView.value
);

const modelValueIsInOptions = computed(() =>
  props.options.some((o) => o.value == props.modelValue)
);

const handleChange = (event: Event) => {
  const target = event.target as HTMLSelectElement;
  if (props.multiple) {
    emit("update:modelValue", Array.from(target.selectedOptions).map((o) => o.value));
  } else {
    emit("update:modelValue", target.value);
  }
};

const selectedOptionText = computed(() => {
  if (!hasOptions.value) return "Нет данных";
  if (props.multiple && Array.isArray(props.modelValue)) {
    const texts = props.options
      .filter((o) => (props.modelValue as Array<string | number>).includes(o.value))
      .map((o) => o.text);
    return texts.length === 0 ? props.placeholder || " " : texts.join(", ");
  }
  const selected = props.options.find((o) => o.value == props.modelValue);
  return selected ? selected.text : props.placeholder || " ";
});

const isShowingPlaceholder = computed(() => {
  if (!hasOptions.value) return false;
  if (props.multiple && Array.isArray(props.modelValue)) return props.modelValue.length === 0;
  return !props.options.find((o) => o.value == props.modelValue);
});

const onSmartSelectOpen = () => { if (props.searchable) emit("before-open"); };
const onSmartSelectClose = () => { if (props.searchable) emit("after-close"); };

const openSearchablePopup = () => {
  if (props.disabled || !hasOptions.value) return;
  emit("before-open");
  searchablePopupRef.value?.open(props.modelValue);
};

const onSelectOption = (value: string | number | Array<string | number>) => {
  emit("update:modelValue", value);
};

const onPopupClose = () => { emit("after-close"); };

const isOptionSelected = (option: SelectOption) => {
  return props.multiple
    ? Array.isArray(props.modelValue)
      ? props.modelValue.includes(option.value)
      : false
    : props.modelValue == option.value;
};
</script>

<style lang="postcss">
/* ── Select wrapper ─────────────────────────────────────────── */
.select-wrapper {
  display: flex;
  flex-direction: column;
}

/* ── The F7 list reset ──────────────────────────────────────── */
.select-f7-list {
  margin: 0 !important;
  background: transparent !important;
  --f7-list-item-padding-horizontal: 0px;
  --f7-list-item-padding-vertical: 0px;
  --f7-list-item-min-height: auto;
  border-radius: 0.75rem;
  overflow: hidden;
}

.select-f7-list li,
.select-f7-list ul {
  background: transparent !important;
}

/* ── The control surface ────────────────────────────────────── */
.select-item .item-content {
  background-color: hsl(var(--muted)) !important;
  border-radius: 0.75rem !important;
  min-height: 44px !important;
  padding: 0 !important;
  transition: background-color 0.15s ease;
  overflow: hidden !important;
}

.select-item .item-content:active,
.select-item .item-content:focus-within {
  background-color: hsl(var(--muted) / 0.8) !important;
}

.select-item .item-inner {
  padding: 0.625rem 0.875rem !important;
  border-bottom: none !important;
  display: flex !important;
  justify-content: space-between !important;
  align-items: center !important;
  gap: 0.5rem !important;
  position: relative !important;
  padding-right: 2.5rem !important;
  overflow: hidden !important;
}

/* hide the empty title */
.select-item .item-title {
  display: none !important;
}

/* value text */
.select-item .item-after {
  flex: 1 !important;
  min-width: 0 !important;
  text-align: left !important;
  white-space: nowrap !important;
  overflow: hidden !important;
  text-overflow: ellipsis !important;
  font-size: 0.9375rem !important;
  font-weight: 400 !important;
  line-height: 1.25rem !important;
  color: hsl(var(--foreground)) !important;
  margin-left: 0 !important;
}

/* placeholder state */
.select-placeholder .item-after {
  color: hsl(var(--muted-foreground)) !important;
}

/* chevron */
.select-item .item-inner::after {
  content: "" !important;
  position: absolute !important;
  right: 0.875rem !important;
  top: 50% !important;
  transform: translateY(-50%) !important;
  width: 1rem !important;
  height: 1rem !important;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%236b7280' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E") !important;
  background-repeat: no-repeat !important;
  background-position: center !important;
  background-size: contain !important;
  flex-shrink: 0 !important;
}

/* Framework7 smart-select chevron override */
.select-item.smart-select .item-inner::before,
.select-item .smart-select .item-inner::before,
.list .select-item .item-link .item-inner::before {
  right: 0.875rem !important;
}

/* popover dropdown list */
.popover .list {
  @apply mt-2 bg-card text-card-foreground;
  max-height: 400px;
  overflow-y: auto;
  overflow-x: hidden;
}
</style>
