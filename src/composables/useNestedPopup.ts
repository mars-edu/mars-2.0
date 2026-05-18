import { f7 } from "framework7-vue";
import { type MaybeRefOrGetter, toValue } from "vue";

export interface NestedPopupOptions {
  /**
   * The ID of the parent popup (e.g., "#my-popup")
   * Can be a string, ref, or computed value
   */
  parentPopupId: MaybeRefOrGetter<string>;
}

/**
 * Composable for managing nested popups (opening a popup from within another popup)
 */
export function useNestedPopup(options: NestedPopupOptions) {
  const { parentPopupId } = options;

  const resolveParentId = () => toValue(parentPopupId);

  const parentExists = (parentId: string) => {
    if (typeof document === "undefined") return true;
    if (!parentId) return false;
    return !!document.querySelector(parentId);
  };

  const closeParent = () => {
    const parentId = resolveParentId();
    if (!parentExists(parentId)) return;
    f7.popup.close(parentId);
  };

  const openParent = () => {
    const parentId = resolveParentId();
    if (!parentExists(parentId)) return;
    f7.popup.open(parentId);
  };

  const withParentToggle = <T extends (...args: any[]) => any>(fn: T): T => {
    return ((...args: any[]) => {
      closeParent();
      return fn(...args);
    }) as T;
  };

  const openDialogWithParent = (
    dialogFn: () => ReturnType<typeof f7.dialog.create>,
    buttonKinds: Array<"confirm" | "cancel">,
    onConfirm?: () => void | Promise<void>,
    onCancel?: () => void
  ) => {
    closeParent();
    const dialog = dialogFn();

    if (dialog.params.buttons) {
      dialog.params.buttons = dialog.params.buttons.map((button: any, index: number) => {
        const originalOnClick = button.onClick;
        const kind = buttonKinds[index] ?? "cancel";

        return {
          ...button,
          onClick: () => {
            if (originalOnClick) {
              const result = originalOnClick();

              if (kind === "confirm") {
                if (onConfirm) {
                  Promise.resolve(onConfirm()).catch(() => {
                    openParent();
                  });
                }
              } else {
                openParent();
                if (onCancel) onCancel();
              }

              return result;
            }
          },
        };
      });
    }

    dialog.open();
  };

  const confirmWithParent = (
    title: string,
    text: string,
    onConfirm: () => void | Promise<void>,
    onCancel?: () => void
  ) => {
    closeParent();
    f7.dialog.confirm(
      text,
      title,
      async () => {
        try {
          await Promise.resolve(onConfirm());
        } catch (error) {
          openParent();
          throw error;
        }
      },
      () => {
        openParent();
        if (onCancel) onCancel();
      }
    );
  };

  return {
    closeParent,
    openParent,
    withParentToggle,
    openDialogWithParent,
    confirmWithParent,
  };
}
