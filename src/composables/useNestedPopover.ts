import { f7 } from "framework7-vue";

export interface NestedPopoverOptions {
  /**
   * The ID of the parent popover (e.g., "#my-popover")
   */
  parentPopoverId: string;
  /**
   * Optional target element selector for reopening the parent
   */
  parentTargetSelector?: string;
}

/**
 * Composable for managing nested popovers (opening a popover/popup from within another popover)
 *
 * @example
 * ```typescript
 * const { closeParent, openParent, withParentToggle } = useNestedPopover({
 *   parentPopoverId: "#edit-event-popover"
 * });
 *
 * // Manual control
 * function openChildPopup() {
 *   closeParent();
 *   childPopup.value?.open();
 * }
 *
 * function handleChildClose() {
 *   openParent();
 * }
 *
 * // Or use with Select components
 * <Select @before-open="closeParent" @after-close="openParent" />
 *
 * // Or wrap any function to auto-manage parent
 * const openChild = withParentToggle(() => {
 *   childPopup.value?.open();
 * });
 * ```
 */
export function useNestedPopover(options: NestedPopoverOptions) {
  const { parentPopoverId, parentTargetSelector } = options;

  /**
   * Close the parent popover
   */
  const closeParent = () => {
    f7.popover.close(parentPopoverId);
  };

  /**
   * Open the parent popover
   */
  const openParent = () => {
    if (parentTargetSelector) {
      f7.popover.open(parentPopoverId, parentTargetSelector);
    } else {
      f7.popover.open(parentPopoverId);
    }
  };

  /**
   * Wraps a function to automatically close parent before execution
   * Useful for opening child popovers/popups
   *
   * @param fn - The function to execute after closing parent
   * @returns A wrapped function that closes parent before executing
   */
  const withParentToggle = <T extends (...args: any[]) => any>(fn: T): T => {
    return ((...args: any[]) => {
      closeParent();
      return fn(...args);
    }) as T;
  };

  /**
   * Event handlers for Select components
   * Usage: v-bind="selectHandlers" or spread individual handlers
   */
  const selectHandlers = {
    onBeforeOpen: closeParent,
    onAfterClose: openParent,
  };

  /**
   * Opens a Framework7 dialog and manages parent popover state
   * Automatically reopens parent on cancel or error
   *
   * @param dialogFn - Function that returns a Framework7 dialog
   * @param onConfirm - Callback when dialog is confirmed (optional, parent stays closed)
   * @param onCancel - Callback when dialog is cancelled (optional, parent reopens)
   */
  const openDialogWithParent = (
    dialogFn: () => ReturnType<typeof f7.dialog.create>,
    onConfirm?: () => void | Promise<void>,
    onCancel?: () => void
  ) => {
    closeParent();
    const dialog = dialogFn();

    // Override button handlers to manage parent state
    if (dialog.params.buttons) {
      dialog.params.buttons = dialog.params.buttons.map((button: any) => {
        const originalOnClick = button.onClick;

        return {
          ...button,
          onClick: () => {
            if (originalOnClick) {
              const result = originalOnClick();

              // If this looks like a confirm button (has strong or specific text)
              if (button.strong || button.text?.toLowerCase().includes('да') ||
                  button.text?.toLowerCase().includes('удалить') ||
                  button.text?.toLowerCase().includes('сохранить')) {
                if (onConfirm) {
                  Promise.resolve(onConfirm()).catch(() => {
                    openParent(); // Reopen on error
                  });
                }
              } else {
                // Cancel button
                openParent();
                if (onCancel) onCancel();
              }

              return result;
            }
          }
        };
      });
    }

    dialog.open();
  };

  /**
   * Convenience method for confirmation dialogs
   */
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
          // Keep parent closed on success
        } catch (error) {
          openParent(); // Reopen on error
          throw error;
        }
      },
      () => {
        openParent(); // Reopen on cancel
        if (onCancel) onCancel();
      }
    );
  };

  return {
    closeParent,
    openParent,
    withParentToggle,
    selectHandlers,
    openDialogWithParent,
    confirmWithParent,
  };
}
