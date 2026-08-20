import { f7 } from "framework7-vue";

let currentToast: any = null;

function showToast(text: string, iconHtml?: string, timeout = 2500, cssClass = "") {
  if (typeof window === "undefined" || !f7?.toast) return;

  if (currentToast) {
    try {
      currentToast.close();
    } catch {
      // Ignore
    }
  }

  currentToast = f7.toast.create({
    text: iconHtml ? `<div class="flex items-center gap-2">${iconHtml}<span>${text}</span></div>` : text,
    position: "center",
    closeTimeout: timeout,
    cssClass,
  });

  currentToast.open();
  return currentToast;
}

export const notify = {
  success(text: string, timeout = 2000) {
    return showToast(
      text,
      `<svg class="w-4 h-4 text-emerald-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>`,
      timeout
    );
  },

  error(text: string, timeout = 3000) {
    return showToast(
      text,
      `<svg class="w-4 h-4 text-rose-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>`,
      timeout
    );
  },

  info(text: string, timeout = 2000) {
    return showToast(text, undefined, timeout);
  },

  warn(text: string, timeout = 2500) {
    return showToast(
      text,
      `<svg class="w-4 h-4 text-amber-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>`,
      timeout
    );
  },
};
