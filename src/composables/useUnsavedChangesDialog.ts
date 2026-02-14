import { f7 } from "framework7-vue";

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

    if (!f7?.dialog) {
      if (typeof window === "undefined") return Promise.resolve(false);
      return Promise.resolve(window.confirm(`${title}\n\n${message}`));
    }

    return new Promise<boolean>((resolve) => {
      resolveCurrent = resolve;
      isHandlingResult = false;

      const finish = (value: boolean) => {
        if (!resolveCurrent || isHandlingResult) return;
        isHandlingResult = true;
        const resolver = resolveCurrent;
        resolveCurrent = null;
        resolver(value);
      };

      const dialog = f7.dialog.create({
        cssClass: "unsaved-changes-dialog",
        title,
        text: message,
        closeByBackdropClick: true,
        buttons: [
          {
            text: cancelText,
            onClick: () => finish(false),
          },
          {
            text: confirmText,
            color: "red",
            bold: true,
            onClick: () => finish(true),
          },
        ],
        on: {
          closed: () => finish(false),
        },
      });

      dialog.open();
    });
  };

  return {
    confirmDiscard,
  };
}
