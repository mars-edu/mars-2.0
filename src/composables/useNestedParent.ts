import { f7 } from "framework7-vue";
import { type MaybeRefOrGetter, toValue } from "vue";

export interface NestedParentOptions {
  /**
   * The ID of the parent popover/popup (e.g., "#my-popover")
   * Can be a string, ref, or computed value
   */
  parentId: MaybeRefOrGetter<string>;
  /**
   * Which Framework7 component the parent is. Defaults to "popover".
   * Can be reactive for components rendered in either container.
   */
  kind?: MaybeRefOrGetter<"popover" | "popup">;
  /**
   * Optional target element selector for reopening the parent (popover only)
   */
  parentTargetSelector?: MaybeRefOrGetter<string>;
}

/**
 * Composable for managing a nested popover/popup (opening a child overlay
 * or dialog from within a parent popover/popup).
 *
 * @example
 * ```typescript
 * const { closeParent, openParent, withParentToggle } = useNestedParent({
 *   parentId: "#edit-event-popover",
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
 * // Or wrap any function to auto-manage parent
 * const openChild = withParentToggle(() => {
 *   childPopup.value?.open();
 * });
 * ```
 */
export function useNestedParent(options: NestedParentOptions) {
  const { parentId, kind = "popover", parentTargetSelector } = options;

  const resolveParentId = () => toValue(parentId);
  const resolveApi = () => (toValue(kind) === "popup" ? f7.popup : f7.popover);

  const parentExists = (id: string) => {
    if (typeof document === "undefined") return true;
    if (!id) return false;
    return !!document.querySelector(id);
  };

  /**
   * Close the parent popover/popup
   */
  const closeParent = () => {
    const id = resolveParentId();
    if (!parentExists(id)) return;
    resolveApi().close(id);
  };

  /**
   * Open the parent popover/popup
   */
  const openParent = () => {
    const id = resolveParentId();
    if (!parentExists(id)) return;

    const targetSelector = toValue(parentTargetSelector);
    if (toValue(kind) === "popover" && targetSelector) {
      f7.popover.open(id, targetSelector);
      return;
    }
    resolveApi().open(id);
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
    confirmWithParent,
  };
}
