export const WEEK_DAYS = [
  { weekId: 0, russianAbbreviation: "ПН", name: "Понедельник" },
  { weekId: 1, russianAbbreviation: "ВТ", name: "Вторник" },
  { weekId: 2, russianAbbreviation: "СР", name: "Среда" },
  { weekId: 3, russianAbbreviation: "ЧТ", name: "Четверг" },
  { weekId: 4, russianAbbreviation: "ПТ", name: "Пятница" },
  { weekId: 5, russianAbbreviation: "СБ", name: "Суббота" },
  { weekId: 6, russianAbbreviation: "ВС", name: "Воскресенье" },
];

export const DATE_UI_FORMAT = "DD/MM/YYYY"; // visible to users
export const DATE_STORAGE_FORMAT = "YYYY-MM-DD"; // persisted/ISO-like
export const DATE_DAY_MONTH_FORMAT = "DD.MM"; // for compact table labels
export const DATE_YEAR_FORMAT = "YYYY"; // for compact table labels
export const DATE_PICKER_VALUE_FORMAT = "dd/mm/yyyy"; // Framework7 calendar format (numeric month)

export const DATE_PICKER_PARAMS = {
  closeOnSelect: true,
  dateFormat: DATE_PICKER_VALUE_FORMAT,
  // locale: "ru",
  monthNames: [
    "Январь",
    "Февраль",
    "Март",
    "Апрель",
    "Май",
    "Июнь",
    "Июль",
    "Август",
    "Сентябрь",
    "Октябрь",
    "Ноябрь",
    "Декабрь",
  ],
  monthNamesShort: [
    "Янв",
    "Фев",
    "Мар",
    "Апр",
    "Май",
    "Июн",
    "Июл",
    "Авг",
    "Сен",
    "Окт",
    "Ноя",
    "Дек",
  ],
  dayNames: [
    "Воскресенье",
    "Понедельник",
    "Вторник",
    "Среда",
    "Четверг",
    "Пятница",
    "Суббота",
  ],
  rangePicker: false,
  multiple: false,
  dayNamesShort: ["Вс", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"],
  firstDay: 1,
};
