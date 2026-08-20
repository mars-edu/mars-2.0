import { f7 } from "framework7-vue";
import { common_cancel, common_delete, common_confirm } from "@/paraglide/messages";

export interface ConfirmDialogOptions {
  title: string;
  text: string;
  confirmText?: string;
  cancelText?: string;
  isDestructive?: boolean;
  onConfirm: () => void | Promise<void>;
  onCancel?: () => void;
}

export function confirmAction(opts: ConfirmDialogOptions) {
  if (typeof window === "undefined" || !f7?.dialog) return;

  const cancelLabel = opts.cancelText || common_cancel();
  const confirmLabel = opts.confirmText || (opts.isDestructive ? common_delete() : common_confirm());

  f7.dialog
    .create({
      title: opts.title,
      text: opts.text,
      buttons: [
        {
          text: cancelLabel,
          color: "gray",
          onClick: () => {
            opts.onCancel?.();
          },
        },
        {
          text: confirmLabel,
          color: opts.isDestructive ? "red" : "blue",
          onClick: async () => {
            try {
              await opts.onConfirm();
            } catch (err) {
              console.error("[confirmDialog] Error during action confirmation:", err);
            }
          },
        },
      ],
    })
    .open();
}

export function confirmDelete(title: string, text: string, onConfirm: () => void | Promise<void>) {
  return confirmAction({
    title,
    text,
    isDestructive: true,
    onConfirm,
  });
}
