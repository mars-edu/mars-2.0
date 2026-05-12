import {
  unsaved_changes_title,
  unsaved_changes_message,
  unsaved_changes_confirm,
  unsaved_changes_cancel,
} from "@/paraglide/messages";

interface ConfirmDiscardOptions {
  title?: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
}

let resolveCurrent: ((value: boolean) => void) | null = null;
let isHandlingResult = false;
let currentContainer: HTMLElement | null = null;

function findParentPopup(): HTMLElement | null {
  const openPopups = document.querySelectorAll<HTMLElement>(".popup.modal-in");
  return openPopups.length > 0 ? openPopups[openPopups.length - 1] : null;
}

function createDialogDOM(options: {
  title: string;
  message: string;
  confirmText: string;
  cancelText: string;
  onConfirm: () => void;
  onCancel: () => void;
}): HTMLElement {
  const container = document.createElement("div");

  // Base backdrop style
  container.style.cssText =
    "position:fixed;inset:0;z-index:20000;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.2);backdrop-filter:blur(4px);-webkit-backdrop-filter:blur(4px);padding:1rem;";

  const parentPopup = findParentPopup();
  if (parentPopup) {
    container.style.position = "absolute";
  }

  container.setAttribute("role", "dialog");
  container.setAttribute("aria-modal", "true");

  container.addEventListener("click", (e) => {
    if (e.target === container) options.onCancel();
  });

  const card = document.createElement("div");
  card.style.cssText =
    "position:relative;background:#fff;border-radius:24px;padding:2rem;width:100%;max-width:20rem;text-align:center;box-shadow:0 25px 50px -12px rgba(0,0,0,0.25);";
  
  // Title
  const h3 = document.createElement("h3");
  h3.style.cssText =
    "margin:0 0 1rem;font-size:19px;font-weight:700;color:#111827;letter-spacing:-0.01em;";
  h3.textContent = options.title;
  card.appendChild(h3);

  // Message
  const p = document.createElement("p");
  p.style.cssText =
    "margin:0 0 1.5rem;font-size:15px;color:#6b7280;line-height:1.625;";
  p.textContent = options.message;
  card.appendChild(p);

  // Buttons row
  const btnRow = document.createElement("div");
  btnRow.style.cssText = "display:grid;grid-template-columns:repeat(2, minmax(0, 1fr));gap:0.75rem;padding-top:0.5rem;";

  const cancelBtn = document.createElement("button");
  cancelBtn.type = "button";
  cancelBtn.style.cssText =
    "padding:0.75rem 0;border-radius:0.75rem;border:0;background:#F2F2F7;color:#111827;font-size:15px;font-weight:600;cursor:pointer;transition:background 0.2s;";
  cancelBtn.textContent = options.cancelText;
  cancelBtn.addEventListener("click", options.onCancel);
  cancelBtn.addEventListener("mouseenter", () => cancelBtn.style.background = "#E5E5EA");
  cancelBtn.addEventListener("mouseleave", () => cancelBtn.style.background = "#F2F2F7");
  btnRow.appendChild(cancelBtn);

  const confirmBtn = document.createElement("button");
  confirmBtn.type = "button";
  confirmBtn.style.cssText =
    "padding:0.75rem 0;border-radius:0.75rem;border:0;background:#ef4444;color:#fff;font-size:15px;font-weight:600;cursor:pointer;transition:background 0.2s;";
  confirmBtn.textContent = options.confirmText;
  confirmBtn.addEventListener("click", options.onConfirm);
  confirmBtn.addEventListener("mouseenter", () => confirmBtn.style.background = "#dc2626");
  confirmBtn.addEventListener("mouseleave", () => confirmBtn.style.background = "#ef4444");
  btnRow.appendChild(confirmBtn);

  card.appendChild(btnRow);
  container.appendChild(card);

  // Add animation class if possible, otherwise simple fade in
  container.animate([
    { opacity: 0, transform: 'scale(0.95)' },
    { opacity: 1, transform: 'scale(1)' }
  ], {
    duration: 200,
    easing: 'ease-out'
  });

  return container;
}

function removeDialog() {
  if (currentContainer && currentContainer.parentNode) {
    currentContainer.parentNode.removeChild(currentContainer);
  }
  currentContainer = null;
}

export function useUnsavedChangesDialog() {
  const confirmDiscard = (options: ConfirmDiscardOptions = {}) => {
    if (resolveCurrent) {
      return Promise.resolve(false);
    }

    const title = options.title ?? unsaved_changes_title();
    const message = options.message ?? unsaved_changes_message();
    const confirmText = options.confirmText ?? unsaved_changes_confirm();
    const cancelText = options.cancelText ?? unsaved_changes_cancel();

    if (typeof window === "undefined") return Promise.resolve(false);

    return new Promise<boolean>((resolve) => {
      resolveCurrent = resolve;
      isHandlingResult = false;

      const finish = (value: boolean) => {
        if (!resolveCurrent || isHandlingResult) return;
        isHandlingResult = true;
        const resolver = resolveCurrent;
        resolveCurrent = null;
        removeDialog();
        resolver(value);
      };

      currentContainer = createDialogDOM({
        title,
        message,
        confirmText,
        cancelText,
        onConfirm: () => finish(true),
        onCancel: () => finish(false),
      });

      const parentPopup = findParentPopup();
      if (parentPopup) {
        const pos = getComputedStyle(parentPopup).position;
        if (pos === "static") {
          parentPopup.style.position = "relative";
        }
        parentPopup.appendChild(currentContainer);
      } else {
        document.body.appendChild(currentContainer);
      }
    });
  };

  return {
    confirmDiscard,
  };
}
