import { useVisibilityStore } from "@/stores/visibilityStore";

let isInitialized = false;

export function initVisibilityDetector() {
  if (isInitialized || typeof document === 'undefined') {
    return;
  }

  const visibilityStore = useVisibilityStore();

  const handleVisibilityChange = () => {
    visibilityStore.setTabActive(!document.hidden);
  };

  document.addEventListener("visibilitychange", handleVisibilityChange);

  // Set initial state
  handleVisibilityChange();

  isInitialized = true;
}
