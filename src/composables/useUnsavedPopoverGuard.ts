import { computed, onBeforeUnmount, onMounted, toValue } from "vue";
import { f7 } from "framework7-vue";
import type { MaybeRefOrGetter } from "vue";
import { useUnsavedChangesDialog } from "@/composables/useUnsavedChangesDialog";

type ModalType = "popover" | "popup";

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

interface UseUnsavedPopoverGuardOptions {
  popoverSelector: MaybeRefOrGetter<string>;
  modalType?: ModalType;
  isDirty?: () => boolean;
  onClosed?: () => void;
}

function serializeForm(el: HTMLElement): string {
  const controls = el.querySelectorAll<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>(
    "input, textarea, select"
  );

  const entries: string[] = [];

  controls.forEach((control) => {
    if (control.disabled) return;

    const inputType = (control as HTMLInputElement).type;
    if (inputType === "hidden" || inputType === "button" || inputType === "submit") return;

    const key = control.id || control.name || control.className || control.tagName;

    if (control instanceof HTMLInputElement && (control.type === "checkbox" || control.type === "radio")) {
      entries.push(`${key}:checked=${control.checked ? "1" : "0"}`);
      return;
    }

    if (control instanceof HTMLSelectElement && control.multiple) {
      const selected = Array.from(control.selectedOptions).map((item) => item.value).join(",");
      entries.push(`${key}:value=${selected}`);
      return;
    }

    entries.push(`${key}:value=${control.value}`);
  });

  return entries.join("|");
}

export function useUnsavedPopoverGuard(options: UseUnsavedPopoverGuardOptions) {
  const { confirmDiscard } = useUnsavedChangesDialog();

  const selector = computed(() => toValue(options.popoverSelector));
  const modalType = computed<ModalType>(() => options.modalType ?? "popover");

  let baseline = "";
  let confirmInProgress = false;
  let allowNextClose = false;

  const resolvePopoverEl = () => {
    if (typeof document === "undefined") return null;
    const selectorValue = selector.value;
    if (!selectorValue) return null;
    return document.querySelector(selectorValue) as HTMLElement | null;
  };

  const closeModal = (reason: CloseReason) => {
    if (!selector.value) return;
    if (modalType.value === "popup") {
      (f7.popup.close as any)(selector.value, true, reason);
      return;
    }
    (f7.popover.close as any)(selector.value, true, reason);
  };

  const checkDirty = () => {
    if (options.isDirty) return options.isDirty();
    const popoverEl = resolvePopoverEl();
    if (!popoverEl) return false;
    return serializeForm(popoverEl) !== baseline;
  };

  const isTopmostPopup = () => {
    const popoverEl = resolvePopoverEl();
    if (!popoverEl) return false;
    const openedPopups = Array.from(
      document.querySelectorAll<HTMLElement>(".popup.modal-in")
    );
    if (openedPopups.length === 0) return false;
    return openedPopups[openedPopups.length - 1] === popoverEl;
  };

  const onDocumentClickCapture = (event: Event) => {
    if (modalType.value !== "popup") return;

    const popoverEl = resolvePopoverEl();
    const popupInstance = (popoverEl as any)?.f7Modal;
    if (!popoverEl || !popoverEl.classList.contains("modal-in") || !popupInstance) {
      return;
    }

    const target = event.target as HTMLElement | null;
    if (!target || target !== popupInstance.backdropEl) return;
    if (!isTopmostPopup()) return;

    event.preventDefault();
    event.stopPropagation();
    closeModal("backdrop");
  };

  const onPopoverOpened = (popover: any) => {
    const popoverEl = resolvePopoverEl();
    if (!popoverEl || popover?.el !== popoverEl) return;
    baseline = serializeForm(popoverEl);
  };

  const onPopoverClosed = (popover: any) => {
    const popoverEl = resolvePopoverEl();
    if (!popoverEl || popover?.el !== popoverEl) return;
    baseline = "";
    allowNextClose = false;
    if (options.onClosed) options.onClosed();
  };

  const requestClose = () => {
    closeModal("cancel");
  };

  const markCleanSnapshot = () => {
    const popoverEl = resolvePopoverEl();
    if (!popoverEl) return;
    baseline = serializeForm(popoverEl);
  };

  const beforeClose = (ctx: BeforeCloseContext = {}) => {
    if (allowNextClose) {
      allowNextClose = false;
      return true;
    }

    // If click landed on a teleported UI element (e.g. Select dropdown outside the popover DOM),
    // block the close entirely — it's not a real "dismiss" interaction.
    if (ctx.event) {
      const target = ctx.event.target as HTMLElement | null;
      if (target?.closest("[data-popover-ignore]")) return false;
    }

    const reason = ctx.reason || "programmatic";
    const shouldGuardReason =
      reason === "cancel" || reason === "backdrop" || reason === "outside" || reason === "escape";

    if (!shouldGuardReason) return true;

    if (!checkDirty()) return true;

    if (confirmInProgress) return false;

    confirmInProgress = true;

    void confirmDiscard().then((confirmed) => {
      confirmInProgress = false;
      if (!confirmed) return;

      allowNextClose = true;
      closeModal("discard-confirmed");
    });

    return false;
  };

  onMounted(() => {
    const openedEvent = modalType.value === "popup" ? "popupOpened" : "popoverOpened";
    const closedEvent = modalType.value === "popup" ? "popupClosed" : "popoverClosed";
    f7.on(openedEvent, onPopoverOpened);
    f7.on(closedEvent, onPopoverClosed);
    if (typeof document !== "undefined" && modalType.value === "popup") {
      document.addEventListener("click", onDocumentClickCapture, true);
    }
  });

  onBeforeUnmount(() => {
    const openedEvent = modalType.value === "popup" ? "popupOpened" : "popoverOpened";
    const closedEvent = modalType.value === "popup" ? "popupClosed" : "popoverClosed";
    f7.off(openedEvent, onPopoverOpened);
    f7.off(closedEvent, onPopoverClosed);
    if (typeof document !== "undefined" && modalType.value === "popup") {
      document.removeEventListener("click", onDocumentClickCapture, true);
    }
  });

  return {
    beforeClose,
    requestClose,
    allowNextClose: () => {
      allowNextClose = true;
    },
    markCleanSnapshot,
  };
}
