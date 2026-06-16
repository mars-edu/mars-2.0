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

// ---------------------------------------------------------------------------
// Stylesheet injection — injected once, responds to the `.dark` class on <html>
// ---------------------------------------------------------------------------
const STYLE_ID = "unsaved-changes-dialog-styles";

function ensureStyles() {
  if (document.getElementById(STYLE_ID)) return;

  const style = document.createElement("style");
  style.id = STYLE_ID;
  style.textContent = /* css */ `
    /* ── Unsaved-changes confirmation dialog ────────────────────────────── */

    .ucd-backdrop {
      position: fixed;
      inset: 0;
      z-index: 20000;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 1rem;
      background: rgba(0, 0, 0, 0.55);
      backdrop-filter: blur(8px);
      -webkit-backdrop-filter: blur(8px);
    }

    .ucd-card {
      position: relative;
      width: 100%;
      max-width: 20rem;
      padding: 2rem;
      border-radius: 24px;
      text-align: center;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.35);
      /* light-mode defaults */
      background: #ffffff;
    }

    .ucd-title {
      margin: 0 0 1rem;
      font-size: 19px;
      font-weight: 700;
      letter-spacing: -0.01em;
      color: #111827;
    }

    .ucd-message {
      margin: 0 0 1.5rem;
      font-size: 15px;
      line-height: 1.625;
      color: #6b7280;
    }

    .ucd-btn-row {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 0.75rem;
      padding-top: 0.5rem;
    }

    .ucd-btn-cancel {
      padding: 0.75rem 0;
      border-radius: 0.75rem;
      border: 0;
      font-size: 15px;
      font-weight: 600;
      cursor: pointer;
      transition: background 0.2s, color 0.2s;
      /* light */
      background: #F2F2F7;
      color: #111827;
    }
    .ucd-btn-cancel:hover {
      background: #E5E5EA;
    }

    .ucd-btn-confirm {
      padding: 0.75rem 0;
      border-radius: 0.75rem;
      border: 0;
      font-size: 15px;
      font-weight: 600;
      cursor: pointer;
      transition: background 0.2s;
      /* always destructive red */
      background: #ef4444;
      color: #ffffff;
    }
    .ucd-btn-confirm:hover {
      background: #dc2626;
    }

    /* ── Dark-mode overrides ──────────────────────────────────────────── */
    :root.dark .ucd-card {
      background: #1c1c1e;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.65);
    }

    :root.dark .ucd-title {
      color: #f2f2f7;
    }

    :root.dark .ucd-message {
      color: #aeaeb2;
    }

    :root.dark .ucd-btn-cancel {
      background: #2c2c2e;
      color: #f2f2f7;
    }
    :root.dark .ucd-btn-cancel:hover {
      background: #3a3a3c;
    }

    /* confirm button stays red in dark mode — no change needed */
  `;

  document.head.appendChild(style);
}

// ---------------------------------------------------------------------------

function createDialogDOM(options: {
  title: string;
  message: string;
  confirmText: string;
  cancelText: string;
  onConfirm: () => void;
  onCancel: () => void;
}): HTMLElement {
  ensureStyles();

  const container = document.createElement("div");
  container.className = "ucd-backdrop";
  container.setAttribute("role", "dialog");
  container.setAttribute("aria-modal", "true");

  container.addEventListener("click", (e) => {
    if (e.target === container) options.onCancel();
  });

  const card = document.createElement("div");
  card.className = "ucd-card";

  // Title
  const h3 = document.createElement("h3");
  h3.className = "ucd-title";
  h3.textContent = options.title;
  card.appendChild(h3);

  // Message
  const p = document.createElement("p");
  p.className = "ucd-message";
  p.textContent = options.message;
  card.appendChild(p);

  // Buttons row
  const btnRow = document.createElement("div");
  btnRow.className = "ucd-btn-row";

  const cancelBtn = document.createElement("button");
  cancelBtn.type = "button";
  cancelBtn.className = "ucd-btn-cancel";
  cancelBtn.textContent = options.cancelText;
  cancelBtn.addEventListener("click", options.onCancel);
  btnRow.appendChild(cancelBtn);

  const confirmBtn = document.createElement("button");
  confirmBtn.type = "button";
  confirmBtn.className = "ucd-btn-confirm";
  confirmBtn.textContent = options.confirmText;
  confirmBtn.addEventListener("click", options.onConfirm);
  btnRow.appendChild(confirmBtn);

  card.appendChild(btnRow);
  container.appendChild(card);

  // Entrance animation
  container.animate(
    [
      { opacity: 0, transform: "scale(0.95)" },
      { opacity: 1, transform: "scale(1)" },
    ],
    { duration: 200, easing: "ease-out" }
  );

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

      document.body.appendChild(currentContainer);
    });
  };

  return {
    confirmDiscard,
  };
}
