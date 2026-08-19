/**
 * Test useUnsavedChangesDialog in node/SSR and mock-DOM environment
 */

// Mock minimal DOM if in node environment
const mockDOM = () => {
  const elements: any[] = [];
  const listeners: Record<string, Function[]> = {};

  const fakeElement: any = {
    className: "",
    setAttribute: jest.fn(),
    appendChild: jest.fn((child) => {
      elements.push(child);
      return child;
    }),
    removeChild: jest.fn((child) => {
      const idx = elements.indexOf(child);
      if (idx !== -1) elements.splice(idx, 1);
      return child;
    }),
    addEventListener: jest.fn((event, handler) => {
      listeners[event] = listeners[event] || [];
      listeners[event].push(handler);
    }),
    querySelector: jest.fn((selector) => {
      if (selector === ".ucd-title") return { textContent: "Закрыть форму?" };
      if (selector === ".ucd-message") return { textContent: "Все несохраненные данные будут потеряны" };
      if (selector === ".ucd-btn-confirm") return { click: () => listeners["confirm"]?.() };
      if (selector === ".ucd-btn-cancel") return { click: () => listeners["cancel"]?.() };
      return null;
    }),
    querySelectorAll: jest.fn(() => elements),
    animate: jest.fn(() => ({})),
    parentNode: {
      removeChild: jest.fn(),
    },
  };

  return {
    createElement: jest.fn(() => ({ ...fakeElement })),
    getElementById: jest.fn(() => null),
    head: { appendChild: jest.fn() },
    body: {
      appendChild: jest.fn((child) => elements.push(child)),
      removeChild: jest.fn((child) => {
        const idx = elements.indexOf(child);
        if (idx !== -1) elements.splice(idx, 1);
      }),
    },
  };
};

if (typeof document === "undefined") {
  (global as any).document = mockDOM();
  (global as any).window = global;
}

import { useUnsavedChangesDialog } from "@/composables/useUnsavedChangesDialog";

describe("useUnsavedChangesDialog", () => {
  it("creates and opens confirmation dialog", async () => {
    const { confirmDiscard } = useUnsavedChangesDialog();
    const resultPromise = confirmDiscard({
      title: "Закрыть форму?",
      message: "Все несохраненные данные будут потеряны",
    });

    expect(typeof resultPromise.then).toBe("function");
  });

  it("handles concurrent calls without stacking", async () => {
    const { confirmDiscard } = useUnsavedChangesDialog();
    const firstPromise = confirmDiscard();
    const secondResult = await confirmDiscard();

    expect(secondResult).toBe(false);
  });
});
