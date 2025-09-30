import { useTabManagerStore } from "@/stores/tabManagerStore";

const STORAGE_KEY = "mars-active-tabs";
let tabId: string;

function getActiveTabs(): string[] {
  try {
    const item = localStorage.getItem(STORAGE_KEY);
    return item ? JSON.parse(item) : [];
  } catch (e) {
    console.error("Error reading active tabs from localStorage", e);
    return [];
  }
}

function setActiveTabs(tabs: string[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tabs));
  } catch (e) {
    console.error("Error writing active tabs to localStorage", e);
  }
}

export function initTabManager() {
  if (typeof window === 'undefined' || (window as any).__tabManagerInitialized) {
    return;
  }
  (window as any).__tabManagerInitialized = true;

  const tabManagerStore = useTabManagerStore();
  tabId = `${Date.now()}-${Math.random()}`;

  function updatePrimaryStatus() {
    const tabs = getActiveTabs();
    const isPrimary = tabs.length > 0 && tabs[0] === tabId;
    if (tabManagerStore.isPrimaryTab !== isPrimary) {
        tabManagerStore.setPrimaryTab(isPrimary);
    }
  }

  // Add self to the list of active tabs
  const tabs = getActiveTabs();
  if (!tabs.includes(tabId)) {
    tabs.push(tabId);
    setActiveTabs(tabs);
  }
  updatePrimaryStatus();

  // Listen for changes from other tabs
  window.addEventListener("storage", (event) => {
    if (event.key === STORAGE_KEY) {
      updatePrimaryStatus();
    }
  });

  // Remove self from the list when the tab is closed
  window.addEventListener("beforeunload", () => {
    const currentTabs = getActiveTabs();
    const updatedTabs = currentTabs.filter((id) => id !== tabId);
    setActiveTabs(updatedTabs);
  });

  // Initial check
  updatePrimaryStatus();
}
