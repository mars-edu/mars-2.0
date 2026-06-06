<template>
  <component
    :is="componentName"
    v-bind="$attrs"
    :id="id"
    class="popover-center"
    :before-close="handleBeforeClose"
    :close-by-backdrop-click="resolvedCloseByBackdropClick"
    :close-on-escape="resolvedCloseOnEscape"
  >
    <slot
      :requestClose="requestClose"
      :allowNextClose="allowNextClose"
    />
  </component>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { f7Popover, f7Popup } from "framework7-vue";
import { useUnsavedPopoverGuard } from "@/composables/useUnsavedPopoverGuard";

type CloseReason =
  | "cancel"
  | "backdrop"
  | "outside"
  | "escape"
  | "programmatic"
  | "discard-confirmed";

interface BeforeCloseContext {
  reason?: CloseReason;
  event?: Event;
}

type ModalType = "popover" | "popup";

const props = withDefaults(
  defineProps<{
    id: string;
    kind?: ModalType;
    guardUnsaved?: boolean;
    isDirty?: () => boolean;
    onClosed?: () => void;
    beforeClose?: (ctx: BeforeCloseContext) => boolean | void;
    closeByBackdropClick?: boolean;
    closeOnEscape?: boolean;
  }>(),
  {
    kind: "popover",
    guardUnsaved: true,
  }
);

const componentName = computed(() =>
  props.kind === "popup" ? f7Popup : f7Popover
);


const resolvedCloseByBackdropClick = computed(() => {
  if (typeof props.closeByBackdropClick !== "undefined") {
    return props.closeByBackdropClick;
  }
  if (props.kind === "popup") {
    // Popup backdrop close is handled through useUnsavedPopoverGuard to preserve close reason consistently.
    return false;
  }
  return undefined;
});

const resolvedCloseOnEscape = computed(() => {
  if (typeof props.closeOnEscape !== "undefined") {
    return props.closeOnEscape;
  }
  if (props.kind === "popup") {
    return true;
  }
  return undefined;
});

const popoverSelector = computed(() =>
  props.id.startsWith("#") ? props.id : `#${props.id}`
);

const {
  beforeClose: beforeCloseGuard,
  requestClose,
  allowNextClose,
} = useUnsavedPopoverGuard({
  popoverSelector,
  modalType: props.kind,
  isDirty: props.isDirty,
  onClosed: props.onClosed,
});

const handleBeforeClose = (ctx: BeforeCloseContext) => {
  if (props.beforeClose?.(ctx) === false) return false;
  if (!props.guardUnsaved) return true;
  return beforeCloseGuard(ctx);
};

defineExpose({
  requestClose,
  allowNextClose,
});
</script>
