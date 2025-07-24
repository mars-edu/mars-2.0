import { ref, watch, onMounted, onUnmounted, readonly, computed } from "vue";
import type { Ref, ComputedRef } from "vue";

interface HashHistoryReturn {
  currentHash: Readonly<Ref<string>>;
  history: Readonly<Ref<readonly string[]>>;
  historyIndex: Readonly<Ref<number>>;
  canGoBack: ComputedRef<boolean>;
  canGoForward: ComputedRef<boolean>;
  pushHash: (hash: string) => void;
  replaceHash: (hash: string) => void;
  goBack: () => void;
  goForward: () => void;
}

export function useHashHistory(): HashHistoryReturn {
  const currentHash = ref<string>(window.location.hash || "#/");
  const history = ref<string[]>([]);
  const historyIndex = ref<number>(-1);
  const isNavigating = ref<boolean>(false);

  const initializeHistory = (): void => {
    const initialHash: string = window.location.hash || "#/";
    history.value = [initialHash];
    historyIndex.value = 0;
    currentHash.value = initialHash;
  };

  const handlePopState = (event: PopStateEvent): void => {
    if (isNavigating.value) return;

    const newHash: string = window.location.hash || "#/";

    const foundIndex: number = history.value.findIndex(
      (h: string) => h === newHash
    );

    if (foundIndex !== -1) {
      historyIndex.value = foundIndex;
      currentHash.value = newHash;
    } else {
      if (historyIndex.value < history.value.length - 1) {
        history.value = history.value.slice(0, historyIndex.value + 1);
      }
      history.value.push(newHash);
      historyIndex.value = history.value.length - 1;
      currentHash.value = newHash;
    }
  };

  const handleHashChange = (): void => {
    if (isNavigating.value) return;

    const newHash: string = window.location.hash || "#/";

    if (newHash !== currentHash.value) {
      const foundIndex: number = history.value.findIndex(
        (h: string) => h === newHash
      );

      if (
        foundIndex !== -1 &&
        Math.abs(foundIndex - historyIndex.value) === 1
      ) {
        historyIndex.value = foundIndex;
      } else {
        if (historyIndex.value < history.value.length - 1) {
          history.value = history.value.slice(0, historyIndex.value + 1);
        }
        history.value.push(newHash);
        historyIndex.value = history.value.length - 1;
      }

      currentHash.value = newHash;
    }
  };

  const pushHash = (hash: string): void => {
    isNavigating.value = true;

    const normalizedHash: string = hash.startsWith("#") ? hash : `#${hash}`;

    if (historyIndex.value < history.value.length - 1) {
      history.value = history.value.slice(0, historyIndex.value + 1);
    }

    history.value.push(normalizedHash);
    historyIndex.value = history.value.length - 1;
    currentHash.value = normalizedHash;

    window.location.hash = normalizedHash;

    setTimeout(() => {
      isNavigating.value = false;
    }, 50);
  };

  const replaceHash = (hash: string): void => {
    isNavigating.value = true;

    const normalizedHash: string = hash.startsWith("#") ? hash : `#${hash}`;

    history.value[historyIndex.value] = normalizedHash;
    currentHash.value = normalizedHash;

    window.history.replaceState(null, "", normalizedHash);

    setTimeout(() => {
      isNavigating.value = false;
    }, 50);
  };

  const goBack = (): void => {
    if (historyIndex.value > 0) {
      isNavigating.value = true;
      historyIndex.value--;
      const targetHash: string = history.value[historyIndex.value];
      currentHash.value = targetHash;
      window.history.back();

      setTimeout(() => {
        isNavigating.value = false;
      }, 50);
    }
  };

  const goForward = (): void => {
    if (historyIndex.value < history.value.length - 1) {
      isNavigating.value = true;
      historyIndex.value++;
      const targetHash: string = history.value[historyIndex.value];
      currentHash.value = targetHash;
      window.history.forward();

      setTimeout(() => {
        isNavigating.value = false;
      }, 50);
    }
  };

  watch(currentHash, (newHash: string, oldHash: string) => {
    if (newHash !== oldHash) {
      console.log(`Route changed from ${oldHash} to ${newHash}`);
      console.log("History:", history.value);
      console.log("Current index:", historyIndex.value);
    }
  });

  onMounted(() => {
    initializeHistory();

    window.addEventListener("popstate", handlePopState);

    window.addEventListener("hashchange", handleHashChange);

    const observer: MutationObserver = new MutationObserver(() => {
      const currentLocationHash: string = window.location.hash || "#/";
      if (currentLocationHash !== currentHash.value && !isNavigating.value) {
        handleHashChange();
      }
    });

    observer.observe(document, {
      subtree: true,
      childList: true,
      attributes: true,
    });

    onUnmounted(() => {
      observer.disconnect();
    });
  });

  onUnmounted(() => {
    window.removeEventListener("popstate", handlePopState);
    window.removeEventListener("hashchange", handleHashChange);
  });

  return {
    currentHash: readonly(currentHash),
    history: readonly(history),
    historyIndex: readonly(historyIndex),
    canGoBack: computed(() => historyIndex.value > 0),
    canGoForward: computed(() => historyIndex.value < history.value.length - 1),
    pushHash,
    replaceHash,
    goBack,
    goForward,
  };
}
