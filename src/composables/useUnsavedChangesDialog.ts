interface ConfirmDiscardOptions {
  title?: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
}

const DEFAULT_TITLE = "Закрыть форму?";
const DEFAULT_MESSAGE =
  "Все несохраненные данные будут потеряны. Вы действительно хотите закрыть окно?";
const DEFAULT_CONFIRM_TEXT = "Закрыть";
const DEFAULT_CANCEL_TEXT = "Продолжить редактирование";

let resolveCurrent: ((value: boolean) => void) | null = null;
let isHandlingResult = false;
let currentContainer: HTMLElement | null = null;

function findParentPopup(): HTMLElement | null {
  // Find the topmost open Framework7 popup to overlay the dialog on top of it
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

  const parentPopup = findParentPopup();
  if (parentPopup) {
    // Position inside the popup: white frosted overlay centered within the popup
    container.style.cssText =
      "position:absolute;inset:0;z-index:20000;display:flex;align-items:center;justify-content:center;background:rgba(255,255,255,0.65);backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px);padding:1rem;";
  } else {
    // Fallback: viewport-level overlay
    container.style.cssText =
      "position:fixed;inset:0;z-index:20000;display:flex;align-items:center;justify-content:center;background:rgba(255,255,255,0.65);backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px);padding:1rem;";
  }

  container.setAttribute("role", "dialog");
  container.setAttribute("aria-modal", "true");

  // Click on backdrop → cancel
  container.addEventListener("click", (e) => {
    if (e.target === container) options.onCancel();
  });

  const card = document.createElement("div");
  card.style.cssText =
    "width:100%;max-width:352px;border-radius:14px;border:1px solid #e7e7eb;background:#f2f2f4;padding:18px 16px 16px;text-align:center;box-shadow:0 14px 40px rgba(0,0,0,0.18);";

  // Warning icon circle
  const iconWrap = document.createElement("div");
  iconWrap.style.cssText =
    "margin:0 auto 10px;display:flex;width:44px;height:44px;align-items:center;justify-content:center;border-radius:9999px;background:#f8dfe1;color:#ef4444;";

  // SVG warning triangle
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("width", "20");
  svg.setAttribute("height", "20");
  svg.setAttribute("viewBox", "0 0 24 24");
  svg.setAttribute("fill", "currentColor");
  const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
  path.setAttribute(
    "d",
    "M12 2L1 21h22L12 2zm0 3.99L19.53 19H4.47L12 5.99zM11 16h2v2h-2zm0-6h2v5h-2z"
  );
  svg.appendChild(path);
  iconWrap.appendChild(svg);
  card.appendChild(iconWrap);

  // Title
  const h3 = document.createElement("h3");
  h3.style.cssText =
    "margin:0;font-size:30px;font-weight:700;line-height:1.2;color:#1f2937;";
  h3.textContent = options.title;
  card.appendChild(h3);

  // Message
  const p = document.createElement("p");
  p.style.cssText =
    "margin:10px 0 16px;font-size:14px;line-height:1.45;color:#6b7280;";
  p.textContent = options.message;
  card.appendChild(p);

  // Buttons row
  const btnRow = document.createElement("div");
  btnRow.style.cssText = "display:flex;gap:10px;";

  const cancelBtn = document.createElement("button");
  cancelBtn.type = "button";
  cancelBtn.style.cssText =
    "flex:1;min-height:48px;border-radius:8px;border:0;background:#e5e7eb;padding:12px 10px;font-size:16px;font-weight:500;line-height:1.25;color:#374151;cursor:pointer;";
  cancelBtn.textContent = options.cancelText;
  cancelBtn.addEventListener("click", options.onCancel);
  btnRow.appendChild(cancelBtn);

  const confirmBtn = document.createElement("button");
  confirmBtn.type = "button";
  confirmBtn.style.cssText =
    "width:110px;min-height:48px;border-radius:8px;border:0;background:#ef4444;padding:12px 10px;font-size:16px;font-weight:500;line-height:1.25;color:#fff;cursor:pointer;";
  confirmBtn.textContent = options.confirmText;
  confirmBtn.addEventListener("click", options.onConfirm);
  btnRow.appendChild(confirmBtn);

  card.appendChild(btnRow);
  container.appendChild(card);

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
      // Keep behavior deterministic; do not stack multiple unsaved dialogs.
      return Promise.resolve(false);
    }

    const title = options.title ?? DEFAULT_TITLE;
    const message = options.message ?? DEFAULT_MESSAGE;
    const confirmText = options.confirmText ?? DEFAULT_CONFIRM_TEXT;
    const cancelText = options.cancelText ?? DEFAULT_CANCEL_TEXT;

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

      // Append inside the parent popup so the dialog is centered within it,
      // falling back to document.body if no popup is open.
      const parentPopup = findParentPopup();
      if (parentPopup) {
        // Ensure the popup can serve as a containing block for position:absolute
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
