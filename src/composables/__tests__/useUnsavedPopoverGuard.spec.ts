const confirmDiscardMock = jest.fn();
const popoverCloseMock = jest.fn();
const popupCloseMock = jest.fn();
const onMock = jest.fn();
const offMock = jest.fn();

jest.mock("vue", () => {
  const actual = jest.requireActual("vue");
  return {
    ...actual,
    onMounted: jest.fn(),
    onBeforeUnmount: jest.fn(),
  };
});

jest.mock("framework7-vue", () => ({
  f7: {
    popover: {
      close: (...args: unknown[]) => popoverCloseMock(...args),
    },
    popup: {
      close: (...args: unknown[]) => popupCloseMock(...args),
    },
    on: (...args: unknown[]) => onMock(...args),
    off: (...args: unknown[]) => offMock(...args),
  },
}), { virtual: true });

jest.mock("@/composables/useUnsavedChangesDialog", () => ({
  useUnsavedChangesDialog: () => ({
    confirmDiscard: (...args: unknown[]) => confirmDiscardMock(...args),
  }),
}));

import { useUnsavedPopoverGuard } from "@/composables/useUnsavedPopoverGuard";

const flushPromises = () => new Promise((resolve) => setImmediate(resolve));

describe("useUnsavedPopoverGuard", () => {
  beforeEach(() => {
    confirmDiscardMock.mockReset();
    confirmDiscardMock.mockResolvedValue(false);
    popoverCloseMock.mockReset();
    popupCloseMock.mockReset();
    onMock.mockReset();
    offMock.mockReset();
  });

  it("allows close when form is clean", () => {
    const guard = useUnsavedPopoverGuard({
      popoverSelector: "#test-popover",
      isDirty: () => false,
    });

    expect(guard.beforeClose({ reason: "cancel" })).toBe(true);
    expect(confirmDiscardMock).not.toHaveBeenCalled();
    expect(popoverCloseMock).not.toHaveBeenCalled();
  });

  it("blocks dirty close and keeps popover open when user cancels discard", async () => {
    confirmDiscardMock.mockResolvedValue(false);

    const guard = useUnsavedPopoverGuard({
      popoverSelector: "#test-popover",
      isDirty: () => true,
    });

    expect(guard.beforeClose({ reason: "cancel" })).toBe(false);
    expect(confirmDiscardMock).toHaveBeenCalledTimes(1);

    await flushPromises();

    expect(popoverCloseMock).not.toHaveBeenCalled();
  });

  it("closes popover once after discard confirmation", async () => {
    confirmDiscardMock.mockResolvedValue(true);

    const guard = useUnsavedPopoverGuard({
      popoverSelector: "#test-popover",
      isDirty: () => true,
    });

    expect(guard.beforeClose({ reason: "escape" })).toBe(false);
    expect(confirmDiscardMock).toHaveBeenCalledTimes(1);

    await flushPromises();

    expect(popoverCloseMock).toHaveBeenCalledWith("#test-popover", true, "discard-confirmed");

    expect(guard.beforeClose({ reason: "cancel" })).toBe(true);
  });

  it("requestClose closes with cancel reason when clean", () => {
    const guard = useUnsavedPopoverGuard({
      popoverSelector: "#test-popover",
      isDirty: () => false,
    });

    guard.requestClose();
    expect(popoverCloseMock).toHaveBeenCalledWith("#test-popover", true, "cancel");
  });

  it("requestClose prompts discard and closes on confirm when dirty", async () => {
    confirmDiscardMock.mockResolvedValue(true);
    const guard = useUnsavedPopoverGuard({
      popoverSelector: "#test-popover",
      isDirty: () => true,
    });

    guard.requestClose();
    expect(confirmDiscardMock).toHaveBeenCalledTimes(1);
    await flushPromises();
    expect(popoverCloseMock).toHaveBeenCalledWith("#test-popover", true, "discard-confirmed");
  });

  it("allowNextClose bypasses guard once", () => {
    const guard = useUnsavedPopoverGuard({
      popoverSelector: "#test-popover",
      isDirty: () => true,
    });

    guard.allowNextClose();

    expect(guard.beforeClose({ reason: "cancel" })).toBe(true);
    expect(confirmDiscardMock).not.toHaveBeenCalled();
    expect(guard.beforeClose({ reason: "cancel" })).toBe(false);
  });
});
