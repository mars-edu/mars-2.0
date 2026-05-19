import { ref, watch, onUnmounted, type Ref } from "vue";

export type DropdownAlign = "left" | "right";

export interface AnchoredDropdownStyle {
  position: "fixed";
  top?: string;
  bottom?: string;
  left?: string;
  right?: string;
  width?: string;
  zIndex: string;
}

export function useAnchoredDropdown(
  anchorRef: Ref<HTMLElement | null>,
  isOpen: Ref<boolean>,
  options: { align?: DropdownAlign; offset?: number; maxHeight?: number; matchWidth?: boolean; zIndex?: number } = {}
) {
  const { align = "left", offset = 4, maxHeight = 300, matchWidth = false, zIndex = 9999 } = options;
  const dropdownStyle = ref<AnchoredDropdownStyle>({
    position: "fixed",
    zIndex: String(zIndex),
  });

  const compute = () => {
    const el = anchorRef.value;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const showAbove = spaceBelow < maxHeight + 8 && rect.top > maxHeight;

    const style: AnchoredDropdownStyle = {
      position: "fixed",
      zIndex: String(zIndex),
      ...(showAbove
        ? { bottom: `${window.innerHeight - rect.top + offset}px` }
        : { top: `${rect.bottom + offset}px` }),
    };

    if (align === "right") {
      style.right = `${window.innerWidth - rect.right}px`;
    } else {
      style.left = `${rect.left}px`;
    }

    if (matchWidth) {
      style.width = `${rect.width}px`;
    }

    dropdownStyle.value = style;
  };

  watch(isOpen, (open) => {
    if (open) {
      compute();
      window.addEventListener("resize", compute);
      window.addEventListener("scroll", compute, true);
    } else {
      window.removeEventListener("resize", compute);
      window.removeEventListener("scroll", compute, true);
    }
  });

  onUnmounted(() => {
    window.removeEventListener("resize", compute);
    window.removeEventListener("scroll", compute, true);
  });

  return { dropdownStyle };
}
