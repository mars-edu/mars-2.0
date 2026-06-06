import { f7 } from "framework7-vue";

/**
 * Shows a confirmation dialog before changing an existing mark.
 * @param currentMark The existing mark value
 * @param onConfirm Callback function executed if the user clicks 'Yes'
 */
export const confirmMarkEdit = (currentMark: string | number, onConfirm: () => void) => {
  f7.dialog.create({
    title: 'Изменить оценку?',
    text: `Текущая оценка: ${currentMark}. Вы действительно хотите изменить её?`,
    buttons: [
      {
        text: 'Нет',
        close: true,
      },
      {
        text: 'Да',
        strong: true,
        onClick: onConfirm
      }
    ],
    verticalButtons: false,
  }).open();
};
