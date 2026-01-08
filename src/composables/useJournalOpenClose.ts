import { f7 } from "framework7-vue";
import { useCalendarStore } from "@/stores/calendarStore";

export type JournalOpenCloseAction = "open" | "close";

export interface JournalOpenCloseOptions {
  context?: string;
  onNoop?: () => void;
  onSuccess?: (updatedJournalIds: string[]) => void;
}

function getUiCopy(action: JournalOpenCloseAction, count: number) {
  if (action === "close") {
    return {
      title: count > 1 ? "Закрыть журналы?" : "Закрыть журнал?",
      text: "После закрытия редактирование будет недоступно.",
      confirmText: "Закрыть",
      successToastText:
        count > 1 ? `Журналы закрыты (${count})` : "Журнал закрыт",
      errorAlertText:
        count > 1 ? "Не удалось закрыть журналы" : "Не удалось закрыть журнал",
    };
  }

  return {
    title: count > 1 ? "Открыть журналы?" : "Открыть журнал?",
    text: "После открытия редактирование будет доступно.",
    confirmText: "Открыть",
    successToastText: count > 1 ? `Журналы открыты (${count})` : "Журнал открыт",
    errorAlertText:
      count > 1 ? "Не удалось открыть журналы" : "Не удалось открыть журнал",
  };
}

export function useJournalOpenClose() {
  const calendarStore = useCalendarStore();

  const confirmJournalAction = (
    journalIds: Iterable<string>,
    action: JournalOpenCloseAction,
    options: JournalOpenCloseOptions = {}
  ) => {
    const ids: string[] = [];
    const seen = new Set<string>();
    for (const id of journalIds) {
      const normalized = `${id}`.trim();
      if (!normalized || seen.has(normalized)) continue;
      seen.add(normalized);
      ids.push(normalized);
    }

    const desiredClosed = action === "close";
    const idsToUpdate = ids.filter((id) => {
      const event = calendarStore.getEventById(id);

      if (desiredClosed) {
        // Match JournalDetails behavior: allow "close" when event is missing.
        return event?.isClosed !== true;
      }

      // Match JournalDetails behavior: "open" is only available when the event is known and closed.
      return event?.isClosed === true;
    });

    if (idsToUpdate.length === 0) {
      options.onNoop?.();
      return;
    }

    const copy = getUiCopy(action, idsToUpdate.length);
    const logPrefix = options.context ? `[${options.context}]` : "[JournalOpenClose]";

    f7.dialog
      .create({
        title: copy.title,
        text: copy.text,
        buttons: [
          { text: "Отмена", close: true },
          {
            text: copy.confirmText,
            strong: true,
            onClick: () => {
              void (async () => {
                try {
                  f7.preloader.show();

                  const updatedJournalIds: string[] = [];
                  for (const id of idsToUpdate) {
                    await calendarStore.updateEvent(id, { isClosed: desiredClosed });
                    updatedJournalIds.push(id);
                  }

                  f7.preloader.hide();
                  f7.toast
                    .create({
                      text: getUiCopy(action, updatedJournalIds.length).successToastText,
                      position: "center",
                      closeTimeout: 2000,
                    })
                    .open();
                  options.onSuccess?.(updatedJournalIds);
                } catch (error) {
                  f7.preloader.hide();
                  console.error(
                    `${logPrefix} Failed to ${action} journal(s):`,
                    error
                  );
                  f7.dialog.alert(copy.errorAlertText);
                }
              })();
            },
          },
        ],
        verticalButtons: false,
      })
      .open();
  };

  const confirmCloseJournal = (journalId: string, options?: JournalOpenCloseOptions) =>
    confirmJournalAction([journalId], "close", options);

  const confirmOpenJournal = (journalId: string, options?: JournalOpenCloseOptions) =>
    confirmJournalAction([journalId], "open", options);

  const confirmCloseJournals = (journalIds: Iterable<string>, options?: JournalOpenCloseOptions) =>
    confirmJournalAction(journalIds, "close", options);

  const confirmOpenJournals = (journalIds: Iterable<string>, options?: JournalOpenCloseOptions) =>
    confirmJournalAction(journalIds, "open", options);

  return {
    confirmCloseJournal,
    confirmOpenJournal,
    confirmCloseJournals,
    confirmOpenJournals,
  };
}
