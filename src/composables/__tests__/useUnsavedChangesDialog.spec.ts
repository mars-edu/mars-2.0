const createDialogMock = jest.fn();

jest.mock("framework7-vue", () => ({
  f7: {
    dialog: {
      create: (...args: unknown[]) => createDialogMock(...args),
    },
  },
}), { virtual: true });

import { useUnsavedChangesDialog } from "@/composables/useUnsavedChangesDialog";

describe("useUnsavedChangesDialog", () => {
  beforeEach(() => {
    createDialogMock.mockReset();
  });

  it("resolves true when user confirms discard", async () => {
    let config: any;
    const open = jest.fn();
    createDialogMock.mockImplementation((incomingConfig: any) => {
      config = incomingConfig;
      return { open };
    });

    const { confirmDiscard } = useUnsavedChangesDialog();
    const resultPromise = confirmDiscard();

    expect(open).toHaveBeenCalledTimes(1);
    expect(config.title).toBe("Закрыть форму?");
    expect(config.text).toContain("Все несохраненные данные будут потеряны");

    config.buttons[1].onClick();
    await expect(resultPromise).resolves.toBe(true);
  });

  it("resolves false when user continues editing", async () => {
    let config: any;
    createDialogMock.mockImplementation((incomingConfig: any) => {
      config = incomingConfig;
      return { open: jest.fn() };
    });

    const { confirmDiscard } = useUnsavedChangesDialog();
    const resultPromise = confirmDiscard();

    config.buttons[0].onClick();
    await expect(resultPromise).resolves.toBe(false);
  });

  it("resolves false when dialog closes without explicit action", async () => {
    let config: any;
    createDialogMock.mockImplementation((incomingConfig: any) => {
      config = incomingConfig;
      return { open: jest.fn() };
    });

    const { confirmDiscard } = useUnsavedChangesDialog();
    const resultPromise = confirmDiscard();

    config.on.closed();
    await expect(resultPromise).resolves.toBe(false);
  });

  it("does not stack dialogs while one is active", async () => {
    let config: any;
    createDialogMock.mockImplementation((incomingConfig: any) => {
      config = incomingConfig;
      return { open: jest.fn() };
    });

    const { confirmDiscard } = useUnsavedChangesDialog();
    const firstPromise = confirmDiscard();
    const secondResult = await confirmDiscard();

    expect(secondResult).toBe(false);
    expect(createDialogMock).toHaveBeenCalledTimes(1);

    config.buttons[1].onClick();
    await expect(firstPromise).resolves.toBe(true);
  });
});
