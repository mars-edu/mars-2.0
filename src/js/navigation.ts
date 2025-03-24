import { f7 } from "framework7-vue";

/**
 * Custom browser history navigation handler
 * Implements custom handling for browser back/forward navigation
 */
export function setupCustomNavigation() {
  let isNavigationHandlerActive = false;
  let currentHistoryPosition = window.history.state?.position || 0;
  let historyStack: Array<{ url: string; position: number }> = [];

  // Function to handle popstate events (browser back/forward buttons)
  const handlePopState = (event: PopStateEvent) => {
    // We can't prevent the default behavior of popstate
    // But we can detect the navigation and handle it our way

    // Get the current state from the popstate event
    const state = event.state || {};
    const newPosition = state.position || 0;

    console.log("[Navigation] Intercepted browser navigation event", {
      state,
      currentPosition: currentHistoryPosition,
      newPosition,
      location: window.location.href,
    });

    // If navigation handler isn't active, do nothing
    if (!isNavigationHandlerActive) return;

    // Prevent the default behavior by immediately pushing a new state
    // This effectively cancels out the browser's navigation
    window.history.pushState(
      { ...state, position: currentHistoryPosition },
      "",
      window.location.href
    );

    // Determine if this was a back or forward action
    if (newPosition < currentHistoryPosition) {
      console.log("[Navigation] Custom back navigation");
      // Custom back navigation logic
      (f7.views.main.router.back as any)({
        force: true,
        ignoreCache: true,
      });
    } else if (newPosition > currentHistoryPosition) {
      console.log("[Navigation] Custom forward navigation");
      // Find the corresponding entry in our history stack
      const targetEntry = historyStack.find(
        (entry) => entry.position === newPosition
      );
      if (targetEntry) {
        (f7.views.main.router.navigate as any)(targetEntry.url, {
          force: true,
          ignoreCache: true,
        });
      }
    }
  };

  // Intercept all clicks on links
  const handleLinkClick = (event: MouseEvent) => {
    const link = (event.target as HTMLElement).closest("a");
    if (!link || !link.href || link.target === "_blank") return;

    // Only intercept links to the same origin
    if (link.origin !== window.location.origin) return;

    // Prevent default navigation
    event.preventDefault();

    // Extract the pathname + search + hash
    const url = link.href.replace(link.origin, "");

    // Navigate using our custom method
    navigateTo(url);
  };

  // Store the current page in history stack
  const updateHistoryStack = (url: string) => {
    // Increment the position counter for the new entry
    currentHistoryPosition++;

    // Push a new state with our position tracker
    window.history.pushState({ position: currentHistoryPosition }, "", url);

    // Add to our history stack
    historyStack.push({
      url,
      position: currentHistoryPosition,
    });

    console.log("[Navigation] Updated history stack", {
      position: currentHistoryPosition,
      url,
      stackSize: historyStack.length,
    });
  };

  // Navigate to a new page with custom history handling
  const navigateTo = (url: string) => {
    // Update our history tracking
    updateHistoryStack(url);

    // Navigate using framework7
    (f7.views.main.router.navigate as any)(url, {
      history: false, // Don't let F7 manage history for this navigation
    });
  };

  // Go back with custom handling
  const goBack = () => {
    // Call Framework7's back navigation
    (f7.views.main.router.back as any)({
      force: true,
      ignoreCache: true,
    });

    // Also go back in browser history
    if (currentHistoryPosition > 0) {
      currentHistoryPosition--;

      // Update browser's history state to match our tracking
      window.history.pushState(
        { position: currentHistoryPosition },
        "",
        window.location.href
      );
    }
  };

  // Initialize the custom navigation
  const initialize = () => {
    if (isNavigationHandlerActive) return;

    // Add the event listener for popstate (browser back/forward)
    window.addEventListener("popstate", handlePopState);

    // Intercept all link clicks
    document.addEventListener("click", handleLinkClick);

    // Set the initial history state
    window.history.replaceState(
      { position: currentHistoryPosition },
      "",
      window.location.href
    );

    // Add the current page to our history stack
    historyStack.push({
      url:
        window.location.pathname +
        window.location.search +
        window.location.hash,
      position: currentHistoryPosition,
    });

    isNavigationHandlerActive = true;
    console.log("[Navigation] Custom navigation handler initialized", {
      currentUrl: window.location.href,
      historyPosition: currentHistoryPosition,
    });
  };

  // Clean up when no longer needed
  const destroy = () => {
    if (!isNavigationHandlerActive) return;

    window.removeEventListener("popstate", handlePopState);
    document.removeEventListener("click", handleLinkClick);

    isNavigationHandlerActive = false;
    console.log("[Navigation] Custom navigation handler destroyed");
  };

  return {
    initialize,
    destroy,
    navigateTo,
    goBack,
  };
}
