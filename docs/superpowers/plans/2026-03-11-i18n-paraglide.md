# i18n Paraglide JS Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add full i18n (ru/kk/en) to the Mars 2.0 Vue 3 frontend using Paraglide JS, with locale persisted to localStorage and the existing Header language switcher wired to the new locale system.

**Architecture:** Paraglide Vite plugin compiles `messages/{locale}.json` → typed functions in `src/paraglide/`. A `localeStore` (Pinia + localStorage) tracks the active locale and syncs it with Paraglide's runtime. Message functions are imported directly per-file (`import { nav_home } from '@/paraglide/messages'`). The `useI18n` composable exposes only locale control, not messages. Reactivity: any component/composable that reads `localeStore.locale` will re-render on locale change.

**Tech Stack:** `@inlang/paraglide-js` (Vite plugin + runtime), Pinia (`localeStore`), `pinia-plugin-persistedstate` (localStorage), Vue 3 Composition API, Framework7-Vue

---

## File Map

| File | Action | Purpose |
|------|--------|---------|
| `package.json` | Modify | Add `@inlang/paraglide-js` dependency |
| `vite.config.js` | Modify | Add `paraglideVitePlugin` |
| `project.inlang/settings.json` | Create | Inlang project config |
| `messages/ru.json` | Create | Russian strings (base locale) |
| `messages/kk.json` | Create | Kazakh strings |
| `messages/en.json` | Create | English strings |
| `src/paraglide/` | Generated | Paraglide runtime + typed message functions (DO NOT EDIT) |
| `src/stores/localeStore.ts` | Create | Pinia locale store, persisted to localStorage |
| `src/composables/useI18n.ts` | Create | Thin composable: `{ locale, setLocale, availableLocales }` |
| `src/composables/useLanguage.ts` | Delete | Old stub, replaced by localeStore |
| `src/components/LanguageSelector.vue` | Modify | Rewire to useI18n instead of useLanguage |
| `src/composables/useRBAC.ts` | Modify | nav_* labels |
| `src/js/app.js` | Modify | Initialize Paraglide locale before mount |
| `src/app.vue` | Modify | F7 params use message functions |
| `src/constants/calendar.ts` | Modify | Add `getDatePickerParams()` + `getWeekDays()` |
| `src/pages/login.vue` | Modify | auth_* strings |
| `src/pages/register.vue` | Modify | auth_* strings |
| `src/pages/restore-password.vue` | Modify | auth_* strings |
| `src/pages/home.vue` | Modify | home_* strings |
| `src/pages/profile.vue` | Modify | profile_* strings |
| `src/pages/settings.vue` | Modify | settings_* strings |
| `src/pages/notifications.vue` | Modify | notifications_* strings |
| `src/pages/journals.vue` | Modify | journal_* strings |
| `src/pages/JournalDetails.vue` | Modify | journal_* strings |
| `src/pages/protocol.vue` | Modify | protocol_* strings |
| `src/pages/planning.vue` | Modify | planning_* strings |
| `src/pages/rup.vue` | Modify | rup_* strings |
| `src/pages/analytics.vue` | Modify | analytics_* strings |
| `src/pages/reports.vue` | Modify | reports_* strings |
| `src/pages/SpecialtyCatalog.vue` | Modify | catalog_* strings |
| `src/pages/DisciplineCatalog.vue` | Modify | catalog_* strings |
| `src/pages/EducationSchedule.vue` | Modify | edu_schedule_* strings |
| `src/pages/StudentCard.vue` | Modify | student_card_* strings |
| `src/pages/TeacherCard.vue` | Modify | teacher_card_* strings |

---

## Chunk 1: Installation & Infrastructure

### Task 1: Install Paraglide and configure Vite plugin

**Files:**
- Modify: `package.json`
- Modify: `vite.config.js`
- Create: `project.inlang/settings.json`

- [ ] **Step 1: Install the package**

```bash
cd /home/olge/SOFT/git/mars-2.0
npm install @inlang/paraglide-js
```

Expected: package appears in `node_modules/@inlang/paraglide-js`.

- [ ] **Step 2: Create `project.inlang/settings.json`**

Create the directory and file:

```bash
mkdir -p /home/olge/SOFT/git/mars-2.0/project.inlang
```

Write `/home/olge/SOFT/git/mars-2.0/project.inlang/settings.json`:

```json
{
  "$schema": "https://inlang.com/schema/project-settings",
  "baseLocale": "ru",
  "locales": ["ru", "kk", "en"],
  "modules": [
    "https://cdn.jsdelivr.net/npm/@inlang/plugin-message-format@4/dist/index.js",
    "https://cdn.jsdelivr.net/npm/@inlang/plugin-m-function-matcher@0/dist/index.js"
  ],
  "plugin.inlang.messageFormat": {
    "pathPattern": "./messages/{locale}.json"
  }
}
```

- [ ] **Step 3: Add Paraglide Vite plugin to `vite.config.js`**

Add the import at the top of `vite.config.js`:

```js
import { paraglideVitePlugin } from "@inlang/paraglide-js";
```

Inside the `plugins: [...]` array (add as the LAST plugin, after `Icons`):

```js
paraglideVitePlugin({
  project: "./project.inlang",
  outdir: "./src/paraglide",
}),
```

- [ ] **Step 4: Create placeholder message files so Vite can start**

Create `/home/olge/SOFT/git/mars-2.0/messages/ru.json`:

```json
{
  "common_save": "Сохранить"
}
```

Create `/home/olge/SOFT/git/mars-2.0/messages/kk.json`:

```json
{
  "common_save": "Сақтау"
}
```

Create `/home/olge/SOFT/git/mars-2.0/messages/en.json`:

```json
{
  "common_save": "Save"
}
```

- [ ] **Step 5: Verify dev server starts and `src/paraglide/` is generated**

```bash
cd /home/olge/SOFT/git/mars-2.0
npm run dev 2>&1 | head -30
```

Expected: Vite starts, and `src/paraglide/messages.js`, `src/paraglide/runtime.js` (and `.d.ts` files) are created.

If Paraglide reports module download errors, check network and retry. The modules in settings.json are CDN URLs fetched on first use.

- [ ] **Step 6: Commit**

```bash
git add project.inlang/settings.json messages/ru.json messages/kk.json messages/en.json vite.config.js package.json package-lock.json
git commit -m "feat(i18n): install Paraglide JS, add Vite plugin and inlang project config"
```

---

### Task 2: Create localeStore and useI18n composable

**Files:**
- Create: `src/stores/localeStore.ts`
- Create: `src/composables/useI18n.ts`
- Delete: `src/composables/useLanguage.ts`

- [ ] **Step 1: Create `src/stores/localeStore.ts`**

```ts
import { defineStore } from "pinia";
import { ref } from "vue";
import { setLocale as setParaglideLocale } from "@/paraglide/runtime";

export type LocaleCode = "ru" | "kk" | "en";

export interface AvailableLocale {
  code: LocaleCode;
  name: string;
}

export const AVAILABLE_LOCALES: AvailableLocale[] = [
  { code: "ru", name: "Русский" },
  { code: "kk", name: "Қазақша" },
  { code: "en", name: "English" },
];

export const useLocaleStore = defineStore(
  "locale",
  () => {
    const locale = ref<LocaleCode>("ru");

    function setLocale(code: LocaleCode) {
      locale.value = code;
      setParaglideLocale(code, { reload: false });
    }

    /**
     * Sync Paraglide's internal locale with the persisted value.
     * Must be called once after pinia hydration (before app mount).
     */
    function initialize() {
      setParaglideLocale(locale.value, { reload: false });
    }

    return {
      locale,
      setLocale,
      initialize,
      availableLocales: AVAILABLE_LOCALES,
    };
  },
  {
    persist: {
      storage: localStorage, // synchronous — locale available before first render
      key: "mars-locale",
    },
  }
);
```

- [ ] **Step 2: Create `src/composables/useI18n.ts`**

```ts
import { readonly } from "vue";
import { useLocaleStore } from "@/stores/localeStore";
import type { LocaleCode } from "@/stores/localeStore";

export function useI18n() {
  const store = useLocaleStore();

  return {
    locale: readonly(store.locale),
    setLocale: (code: LocaleCode) => store.setLocale(code),
    availableLocales: store.availableLocales,
  };
}
```

- [ ] **Step 3: Delete `src/composables/useLanguage.ts`**

```bash
rm /home/olge/SOFT/git/mars-2.0/src/composables/useLanguage.ts
```

- [ ] **Step 4: Type-check**

```bash
cd /home/olge/SOFT/git/mars-2.0
npx tsc --noEmit 2>&1 | grep -v "node_modules" | head -20
```

Expected: No errors (or only pre-existing errors unrelated to these files).

- [ ] **Step 5: Commit**

```bash
git add src/stores/localeStore.ts src/composables/useI18n.ts
git rm src/composables/useLanguage.ts
git commit -m "feat(i18n): add localeStore and useI18n composable, remove useLanguage stub"
```

---

### Task 3: Initialize locale in app.js before mount

**Files:**
- Modify: `src/js/app.js`

The pinia plugin uses `localforage` (async) globally. `localeStore` overrides to `localStorage` (sync), so it hydrates synchronously when first accessed. We call `initialize()` after `app.use(pinia)` but before `app.mount()`.

- [ ] **Step 1: Add locale initialization to `src/js/app.js`**

After the `app.use(pinia)` line (line ~45), add:

```js
import { useLocaleStore } from "../stores/localeStore";

// Initialize Paraglide locale from persisted preference before first render.
// localeStore uses localStorage (sync), so it's already hydrated here.
const localeStore = useLocaleStore();
localeStore.initialize();
```

**Important:** The import goes at the top of the file with other imports. The `useLocaleStore()` call must come after `app.use(pinia)`.

- [ ] **Step 2: Verify dev server still starts**

```bash
cd /home/olge/SOFT/git/mars-2.0
npm run dev 2>&1 | head -20
```

Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add src/js/app.js
git commit -m "feat(i18n): initialize Paraglide locale from localeStore before app mount"
```

---

## Chunk 2: Message Files + Shell Migration

### Task 4: Populate message files with nav_*, f7_*, and common_* keys

**Files:**
- Modify: `messages/ru.json`
- Modify: `messages/kk.json`
- Modify: `messages/en.json`

- [ ] **Step 1: Replace `messages/ru.json` with full initial key set**

```json
{
  "common_save": "Сохранить",
  "common_cancel": "Отмена",
  "common_delete": "Удалить",
  "common_edit": "Редактировать",
  "common_add": "Добавить",
  "common_search": "Поиск",
  "common_loading": "Загрузка...",
  "common_error": "Произошла ошибка",
  "common_empty": "Нет данных",
  "common_close": "Закрыть",
  "common_confirm": "Подтвердить",
  "common_back": "Назад",
  "common_yes": "Да",
  "common_no": "Нет",
  "common_all": "Все",
  "nav_home": "Главная",
  "nav_specialty_catalog": "Каталог специальностей",
  "nav_discipline_catalog": "Каталог дисциплин",
  "nav_schedule": "Планирование",
  "nav_protocol": "Протокол",
  "nav_journals": "Журналы",
  "nav_rup": "РУП",
  "nav_analytics": "Аналитика",
  "nav_reports": "Отчеты",
  "nav_education_schedule": "График образовательного процесса",
  "nav_student_card": "Картотека обучающихся",
  "nav_teacher_card": "Картотека преподавателей",
  "nav_profile": "Профиль",
  "nav_settings": "Настройки",
  "nav_logout": "Выйти",
  "f7_dialog_ok": "Хорошо",
  "f7_dialog_cancel": "Отмена",
  "f7_picker_done": "Готово",
  "f7_smart_select_close": "Назад",
  "f7_smart_select_search_placeholder": "Поиск",
  "f7_smart_select_search_cancel": "Отмена",
  "f7_month_jan": "Январь",
  "f7_month_feb": "Февраль",
  "f7_month_mar": "Март",
  "f7_month_apr": "Апрель",
  "f7_month_may": "Май",
  "f7_month_jun": "Июнь",
  "f7_month_jul": "Июль",
  "f7_month_aug": "Август",
  "f7_month_sep": "Сентябрь",
  "f7_month_oct": "Октябрь",
  "f7_month_nov": "Ноябрь",
  "f7_month_dec": "Декабрь",
  "f7_month_jan_short": "Янв",
  "f7_month_feb_short": "Фев",
  "f7_month_mar_short": "Мар",
  "f7_month_apr_short": "Апр",
  "f7_month_may_short": "Май",
  "f7_month_jun_short": "Июн",
  "f7_month_jul_short": "Июл",
  "f7_month_aug_short": "Авг",
  "f7_month_sep_short": "Сен",
  "f7_month_oct_short": "Окт",
  "f7_month_nov_short": "Ноя",
  "f7_month_dec_short": "Дек",
  "f7_day_sun": "Воскресенье",
  "f7_day_mon": "Понедельник",
  "f7_day_tue": "Вторник",
  "f7_day_wed": "Среда",
  "f7_day_thu": "Четверг",
  "f7_day_fri": "Пятница",
  "f7_day_sat": "Суббота",
  "f7_day_sun_short": "Вс",
  "f7_day_mon_short": "Пн",
  "f7_day_tue_short": "Вт",
  "f7_day_wed_short": "Ср",
  "f7_day_thu_short": "Чт",
  "f7_day_fri_short": "Пт",
  "f7_day_sat_short": "Сб",
  "f7_week_abbr_mon": "ПН",
  "f7_week_abbr_tue": "ВТ",
  "f7_week_abbr_wed": "СР",
  "f7_week_abbr_thu": "ЧТ",
  "f7_week_abbr_fri": "ПТ",
  "f7_week_abbr_sat": "СБ",
  "f7_week_abbr_sun": "ВС"
}
```

- [ ] **Step 2: Replace `messages/kk.json`**

```json
{
  "common_save": "Сақтау",
  "common_cancel": "Болдырмау",
  "common_delete": "Жою",
  "common_edit": "Өңдеу",
  "common_add": "Қосу",
  "common_search": "Іздеу",
  "common_loading": "Жүктелуде...",
  "common_error": "Қате орын алды",
  "common_empty": "Деректер жоқ",
  "common_close": "Жабу",
  "common_confirm": "Растау",
  "common_back": "Артқа",
  "common_yes": "Иә",
  "common_no": "Жоқ",
  "common_all": "Барлығы",
  "nav_home": "Басты бет",
  "nav_specialty_catalog": "Мамандықтар каталогы",
  "nav_discipline_catalog": "Пәндер каталогы",
  "nav_schedule": "Жоспарлау",
  "nav_protocol": "Хаттама",
  "nav_journals": "Журналдар",
  "nav_rup": "ОЖЖ",
  "nav_analytics": "Аналитика",
  "nav_reports": "Есептер",
  "nav_education_schedule": "Білім беру процесінің кестесі",
  "nav_student_card": "Оқушылар картотекасы",
  "nav_teacher_card": "Оқытушылар картотекасы",
  "nav_profile": "Профиль",
  "nav_settings": "Баптаулар",
  "nav_logout": "Шығу",
  "f7_dialog_ok": "Жарайды",
  "f7_dialog_cancel": "Болдырмау",
  "f7_picker_done": "Дайын",
  "f7_smart_select_close": "Артқа",
  "f7_smart_select_search_placeholder": "Іздеу",
  "f7_smart_select_search_cancel": "Болдырмау",
  "f7_month_jan": "Қаңтар",
  "f7_month_feb": "Ақпан",
  "f7_month_mar": "Наурыз",
  "f7_month_apr": "Сәуір",
  "f7_month_may": "Мамыр",
  "f7_month_jun": "Маусым",
  "f7_month_jul": "Шілде",
  "f7_month_aug": "Тамыз",
  "f7_month_sep": "Қыркүйек",
  "f7_month_oct": "Қазан",
  "f7_month_nov": "Қараша",
  "f7_month_dec": "Желтоқсан",
  "f7_month_jan_short": "Қаң",
  "f7_month_feb_short": "Ақп",
  "f7_month_mar_short": "Нау",
  "f7_month_apr_short": "Сәу",
  "f7_month_may_short": "Мам",
  "f7_month_jun_short": "Мау",
  "f7_month_jul_short": "Шіл",
  "f7_month_aug_short": "Там",
  "f7_month_sep_short": "Қыр",
  "f7_month_oct_short": "Қаз",
  "f7_month_nov_short": "Қар",
  "f7_month_dec_short": "Жел",
  "f7_day_sun": "Жексенбі",
  "f7_day_mon": "Дүйсенбі",
  "f7_day_tue": "Сейсенбі",
  "f7_day_wed": "Сәрсенбі",
  "f7_day_thu": "Бейсенбі",
  "f7_day_fri": "Жұма",
  "f7_day_sat": "Сенбі",
  "f7_day_sun_short": "Жс",
  "f7_day_mon_short": "Дс",
  "f7_day_tue_short": "Сс",
  "f7_day_wed_short": "Ср",
  "f7_day_thu_short": "Бс",
  "f7_day_fri_short": "Жм",
  "f7_day_sat_short": "Сб",
  "f7_week_abbr_mon": "ДС",
  "f7_week_abbr_tue": "СС",
  "f7_week_abbr_wed": "СР",
  "f7_week_abbr_thu": "БС",
  "f7_week_abbr_fri": "ЖМ",
  "f7_week_abbr_sat": "СБ",
  "f7_week_abbr_sun": "ЖС"
}
```

- [ ] **Step 3: Replace `messages/en.json`**

```json
{
  "common_save": "Save",
  "common_cancel": "Cancel",
  "common_delete": "Delete",
  "common_edit": "Edit",
  "common_add": "Add",
  "common_search": "Search",
  "common_loading": "Loading...",
  "common_error": "An error occurred",
  "common_empty": "No data",
  "common_close": "Close",
  "common_confirm": "Confirm",
  "common_back": "Back",
  "common_yes": "Yes",
  "common_no": "No",
  "common_all": "All",
  "nav_home": "Home",
  "nav_specialty_catalog": "Specialty Catalog",
  "nav_discipline_catalog": "Discipline Catalog",
  "nav_schedule": "Planning",
  "nav_protocol": "Protocol",
  "nav_journals": "Journals",
  "nav_rup": "RUP",
  "nav_analytics": "Analytics",
  "nav_reports": "Reports",
  "nav_education_schedule": "Education Schedule",
  "nav_student_card": "Student Records",
  "nav_teacher_card": "Teacher Records",
  "nav_profile": "Profile",
  "nav_settings": "Settings",
  "nav_logout": "Log out",
  "f7_dialog_ok": "OK",
  "f7_dialog_cancel": "Cancel",
  "f7_picker_done": "Done",
  "f7_smart_select_close": "Back",
  "f7_smart_select_search_placeholder": "Search",
  "f7_smart_select_search_cancel": "Cancel",
  "f7_month_jan": "January",
  "f7_month_feb": "February",
  "f7_month_mar": "March",
  "f7_month_apr": "April",
  "f7_month_may": "May",
  "f7_month_jun": "June",
  "f7_month_jul": "July",
  "f7_month_aug": "August",
  "f7_month_sep": "September",
  "f7_month_oct": "October",
  "f7_month_nov": "November",
  "f7_month_dec": "December",
  "f7_month_jan_short": "Jan",
  "f7_month_feb_short": "Feb",
  "f7_month_mar_short": "Mar",
  "f7_month_apr_short": "Apr",
  "f7_month_may_short": "May",
  "f7_month_jun_short": "Jun",
  "f7_month_jul_short": "Jul",
  "f7_month_aug_short": "Aug",
  "f7_month_sep_short": "Sep",
  "f7_month_oct_short": "Oct",
  "f7_month_nov_short": "Nov",
  "f7_month_dec_short": "Dec",
  "f7_day_sun": "Sunday",
  "f7_day_mon": "Monday",
  "f7_day_tue": "Tuesday",
  "f7_day_wed": "Wednesday",
  "f7_day_thu": "Thursday",
  "f7_day_fri": "Friday",
  "f7_day_sat": "Saturday",
  "f7_day_sun_short": "Su",
  "f7_day_mon_short": "Mo",
  "f7_day_tue_short": "Tu",
  "f7_day_wed_short": "We",
  "f7_day_thu_short": "Th",
  "f7_day_fri_short": "Fr",
  "f7_day_sat_short": "Sa",
  "f7_week_abbr_mon": "MO",
  "f7_week_abbr_tue": "TU",
  "f7_week_abbr_wed": "WE",
  "f7_week_abbr_thu": "TH",
  "f7_week_abbr_fri": "FR",
  "f7_week_abbr_sat": "SA",
  "f7_week_abbr_sun": "SU"
}
```

- [ ] **Step 4: Restart dev server to regenerate `src/paraglide/`**

```bash
cd /home/olge/SOFT/git/mars-2.0
npm run dev 2>&1 | head -20
```

Expected: Paraglide regenerates `src/paraglide/messages.js` with all new functions.

Verify:
```bash
grep "nav_home\|f7_dialog_ok\|common_save" /home/olge/SOFT/git/mars-2.0/src/paraglide/messages.js | head -5
```
Expected: Functions named `nav_home`, `f7_dialog_ok`, `common_save` are present.

- [ ] **Step 5: Commit**

```bash
git add messages/ru.json messages/kk.json messages/en.json
git commit -m "feat(i18n): populate message files with nav, f7, and common keys (ru/kk/en)"
```

---

### Task 5: Rewire LanguageSelector + migrate useRBAC nav labels

**Files:**
- Modify: `src/components/LanguageSelector.vue`
- Modify: `src/composables/useRBAC.ts`

- [ ] **Step 1: Rewrite `src/components/LanguageSelector.vue`**

Replace the entire file:

```vue
<template>
  <div class="flex p-0.5 rounded-full bg-muted">
    <button
      v-for="lang in availableLocales"
      :key="lang.code"
      class="px-3 py-1 rounded-full text-xs font-bold transition-all"
      :class="
        lang.code === locale
          ? 'bg-card text-foreground shadow-sm'
          : 'text-muted-foreground hover:text-foreground'
      "
      @click="setLocale(lang.code)"
    >
      {{ lang.code.toUpperCase() }}
    </button>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from "@/composables/useI18n";

const { locale, availableLocales, setLocale } = useI18n();
</script>
```

- [ ] **Step 2: Update `src/composables/useRBAC.ts`**

Add imports at the top (after existing imports):

```ts
import {
  nav_home,
  nav_specialty_catalog,
  nav_discipline_catalog,
  nav_schedule,
  nav_protocol,
  nav_journals,
  nav_rup,
  nav_analytics,
  nav_reports,
  nav_education_schedule,
  nav_student_card,
  nav_teacher_card,
  nav_profile,
  nav_settings,
  nav_logout,
} from "@/paraglide/messages";
import { useLocaleStore } from "@/stores/localeStore";
```

Inside `useRBAC()`, add after `const userStore = useUserStore()`:

```ts
const localeStore = useLocaleStore();
```

Replace the `getNavigationItems` computed body. In the `items` array, replace each hardcoded `label` string with the corresponding message function call. Also add `void localeStore.locale` at the very start of the computed body to establish Vue reactivity tracking:

```ts
const getNavigationItems = computed(() => {
  void localeStore.locale; // reactive dependency — re-runs when locale changes
  const items: NavigationItem[] = [
    {
      id: "home",
      label: nav_home(),
      icon: "house_fill",
      roles: [],
      route: "/home",
    },
    {
      id: "specialty-catalog",
      label: nav_specialty_catalog(),
      icon: "book_fill",
      roles: [Role.ADMIN],
      route: "/specialty-catalog/",
    },
    {
      id: "discipline-catalog",
      label: nav_discipline_catalog(),
      icon: "book_fill",
      roles: [Role.ADMIN],
      route: "/discipline-catalog/",
    },
    {
      id: "schedule",
      label: nav_schedule(),
      icon: "calendar_fill",
      roles: [Role.ADMIN, Role.TEACHER],
      route: "/planning",
    },
    {
      id: "protocol",
      label: nav_protocol(),
      icon: "list_bullet_fill",
      roles: [Role.ADMIN, Role.TEACHER],
      route: "/protocol",
    },
    {
      id: "journals",
      label: nav_journals(),
      icon: "doc_text_fill",
      roles: [Role.ADMIN, Role.TEACHER],
      route: "/journals/",
    },
    {
      id: "rup",
      label: nav_rup(),
      icon: "doc_fill",
      roles: [Role.ADMIN, Role.TEACHER],
      route: "/rup/",
    },
    {
      id: "analytics",
      label: nav_analytics(),
      icon: "chart_bar_fill",
      roles: [Role.ADMIN],
      route: "/analytics/",
    },
    {
      id: "reports",
      label: nav_reports(),
      icon: "doc_chart_fill",
      roles: [Role.ADMIN, Role.TEACHER],
      route: "/reports/",
    },
    {
      id: "education-schedule",
      label: nav_education_schedule(),
      icon: "calendar_fill",
      roles: [Role.ADMIN],
      route: "/education-schedule/",
    },
    {
      id: "student-card",
      label: nav_student_card(),
      icon: "book_fill",
      roles: [Role.ADMIN],
      route: "/student-card/",
    },
    {
      id: "teacher-card",
      label: nav_teacher_card(),
      icon: "book_fill",
      roles: [Role.ADMIN],
      route: "/teacher-card/",
    },
  ];
  return items.filter((item) => checkAccess(item.roles));
});
```

Update `getProfileMenuItems` the same way:

```ts
const getProfileMenuItems = computed(() => {
  void localeStore.locale;
  const items: NavigationItem[] = [
    {
      id: "profile",
      label: nav_profile(),
      icon: "person_fill",
      roles: [Role.ADMIN, Role.TEACHER, Role.STUDENT, Role.PARENT],
      route: "/profile/",
    },
    {
      id: "settings",
      label: nav_settings(),
      icon: "gear_fill",
      roles: [Role.ADMIN, Role.TEACHER, Role.STUDENT, Role.PARENT],
      route: "/settings/",
    },
    {
      id: "logout",
      label: nav_logout(),
      icon: "arrow_right_circle_fill",
      roles: [],
      route: "/login/",
    },
  ];
  return items.filter((item) => checkAccess(item.roles));
});
```

- [ ] **Step 3: Type-check**

```bash
npx tsc --noEmit 2>&1 | grep -E "LanguageSelector|useRBAC|localeStore|useI18n" | head -10
```

Expected: No errors for these files.

- [ ] **Step 4: Commit**

```bash
git add src/components/LanguageSelector.vue src/composables/useRBAC.ts
git commit -m "feat(i18n): rewire LanguageSelector to localeStore, migrate useRBAC nav labels"
```

---

### Task 6: Migrate app.vue F7 params + constants/calendar.ts

**Files:**
- Modify: `src/app.vue`
- Modify: `src/constants/calendar.ts`

**Note on reactivity:** F7 is initialized once at app startup with the params passed to `<f7-app>`. Since `localeStore` is hydrated before mount (Task 3), the message functions called here return the correct locale. F7 built-in strings will update on next page load after a locale switch — this is acceptable per the design spec.

- [ ] **Step 1: Update `src/app.vue` to import and use message functions for F7 params**

At the top of `<script setup>` in `src/app.vue`, add imports:

```ts
import {
  f7_dialog_ok,
  f7_dialog_cancel,
  f7_picker_done,
  f7_smart_select_close,
  f7_smart_select_search_placeholder,
  f7_smart_select_search_cancel,
  f7_month_jan, f7_month_feb, f7_month_mar, f7_month_apr,
  f7_month_may, f7_month_jun, f7_month_jul, f7_month_aug,
  f7_month_sep, f7_month_oct, f7_month_nov, f7_month_dec,
  f7_month_jan_short, f7_month_feb_short, f7_month_mar_short, f7_month_apr_short,
  f7_month_may_short, f7_month_jun_short, f7_month_jul_short, f7_month_aug_short,
  f7_month_sep_short, f7_month_oct_short, f7_month_nov_short, f7_month_dec_short,
  f7_day_sun, f7_day_mon, f7_day_tue, f7_day_wed,
  f7_day_thu, f7_day_fri, f7_day_sat,
  f7_day_sun_short, f7_day_mon_short, f7_day_tue_short, f7_day_wed_short,
  f7_day_thu_short, f7_day_fri_short, f7_day_sat_short,
} from "@/paraglide/messages";
```

Replace the hardcoded strings in the `f7params` object:

```ts
const f7params: Framework7Parameters = {
  name: "Mars",
  theme: "ios",
  store: store,
  routes: routes,

  dialog: {
    buttonOk: f7_dialog_ok(),
    buttonCancel: f7_dialog_cancel(),
  },

  picker: {
    toolbarCloseText: f7_picker_done(),
  },

  calendar: {
    monthNames: [
      f7_month_jan(), f7_month_feb(), f7_month_mar(), f7_month_apr(),
      f7_month_may(), f7_month_jun(), f7_month_jul(), f7_month_aug(),
      f7_month_sep(), f7_month_oct(), f7_month_nov(), f7_month_dec(),
    ],
    monthNamesShort: [
      f7_month_jan_short(), f7_month_feb_short(), f7_month_mar_short(), f7_month_apr_short(),
      f7_month_may_short(), f7_month_jun_short(), f7_month_jul_short(), f7_month_aug_short(),
      f7_month_sep_short(), f7_month_oct_short(), f7_month_nov_short(), f7_month_dec_short(),
    ],
    dayNames: [
      f7_day_sun(), f7_day_mon(), f7_day_tue(), f7_day_wed(),
      f7_day_thu(), f7_day_fri(), f7_day_sat(),
    ],
    dayNamesShort: [
      f7_day_sun_short(), f7_day_mon_short(), f7_day_tue_short(), f7_day_wed_short(),
      f7_day_thu_short(), f7_day_fri_short(), f7_day_sat_short(),
    ],
    firstDay: 1,
  },

  smartSelect: {
    popupCloseLinkText: f7_smart_select_close(),
    searchbarPlaceholder: f7_smart_select_search_placeholder(),
    searchbarDisableText: f7_smart_select_search_cancel(),
  },
  // ... rest of f7params unchanged
};
```

- [ ] **Step 2: Update `src/constants/calendar.ts`**

Add imports at the top:

```ts
import {
  f7_month_jan, f7_month_feb, f7_month_mar, f7_month_apr,
  f7_month_may, f7_month_jun, f7_month_jul, f7_month_aug,
  f7_month_sep, f7_month_oct, f7_month_nov, f7_month_dec,
  f7_month_jan_short, f7_month_feb_short, f7_month_mar_short, f7_month_apr_short,
  f7_month_may_short, f7_month_jun_short, f7_month_jul_short, f7_month_aug_short,
  f7_month_sep_short, f7_month_oct_short, f7_month_nov_short, f7_month_dec_short,
  f7_day_sun, f7_day_mon, f7_day_tue, f7_day_wed,
  f7_day_thu, f7_day_fri, f7_day_sat,
  f7_day_sun_short, f7_day_mon_short, f7_day_tue_short, f7_day_wed_short,
  f7_day_thu_short, f7_day_fri_short, f7_day_sat_short,
  f7_week_abbr_mon, f7_week_abbr_tue, f7_week_abbr_wed, f7_week_abbr_thu,
  f7_week_abbr_fri, f7_week_abbr_sat, f7_week_abbr_sun,
} from "@/paraglide/messages";
```

Keep the static non-string constants (`DATE_UI_FORMAT`, `DATE_STORAGE_FORMAT`, etc.) unchanged.

**Replace `WEEK_DAYS`** with a function `getWeekDays()`:

```ts
export function getWeekDays() {
  return [
    { weekId: 0, russianAbbreviation: f7_week_abbr_mon(), name: f7_day_mon() },
    { weekId: 1, russianAbbreviation: f7_week_abbr_tue(), name: f7_day_tue() },
    { weekId: 2, russianAbbreviation: f7_week_abbr_wed(), name: f7_day_wed() },
    { weekId: 3, russianAbbreviation: f7_week_abbr_thu(), name: f7_day_thu() },
    { weekId: 4, russianAbbreviation: f7_week_abbr_fri(), name: f7_day_fri() },
    { weekId: 5, russianAbbreviation: f7_week_abbr_sat(), name: f7_day_sat() },
    { weekId: 6, russianAbbreviation: f7_week_abbr_sun(), name: f7_day_sun() },
  ];
}
```

**Replace `DATE_PICKER_PARAMS`** with a function `getDatePickerParams()`:

```ts
const DATE_PICKER_PARAMS_BASE = {
  closeOnSelect: true,
  dateFormat: DATE_PICKER_VALUE_FORMAT,
  rangePicker: false,
  multiple: false,
  firstDay: 1,
};

export function getDatePickerParams() {
  return {
    ...DATE_PICKER_PARAMS_BASE,
    monthNames: [
      f7_month_jan(), f7_month_feb(), f7_month_mar(), f7_month_apr(),
      f7_month_may(), f7_month_jun(), f7_month_jul(), f7_month_aug(),
      f7_month_sep(), f7_month_oct(), f7_month_nov(), f7_month_dec(),
    ],
    monthNamesShort: [
      f7_month_jan_short(), f7_month_feb_short(), f7_month_mar_short(), f7_month_apr_short(),
      f7_month_may_short(), f7_month_jun_short(), f7_month_jul_short(), f7_month_aug_short(),
      f7_month_sep_short(), f7_month_oct_short(), f7_month_nov_short(), f7_month_dec_short(),
    ],
    dayNames: [
      f7_day_sun(), f7_day_mon(), f7_day_tue(), f7_day_wed(),
      f7_day_thu(), f7_day_fri(), f7_day_sat(),
    ],
    dayNamesShort: [
      f7_day_sun_short(), f7_day_mon_short(), f7_day_tue_short(), f7_day_wed_short(),
      f7_day_thu_short(), f7_day_fri_short(), f7_day_sat_short(),
    ],
  };
}
```

Delete the old `WEEK_DAYS` export and `DATE_PICKER_PARAMS` export entirely.

- [ ] **Step 3: Update all callers of `WEEK_DAYS` and `DATE_PICKER_PARAMS`**

Find all callers:

```bash
grep -rn "WEEK_DAYS\|DATE_PICKER_PARAMS" /home/olge/SOFT/git/mars-2.0/src/ --include="*.ts" --include="*.vue"
```

For each file found:
- Replace `import { WEEK_DAYS, ... }` with `import { getWeekDays, ... }`
- Replace `WEEK_DAYS` usages with `getWeekDays()`
- Replace `import { DATE_PICKER_PARAMS, ... }` with `import { getDatePickerParams, ... }`
- Replace `DATE_PICKER_PARAMS` usages with `getDatePickerParams()`

- [ ] **Step 4: Type-check**

```bash
npx tsc --noEmit 2>&1 | grep -v "node_modules" | head -20
```

Expected: No new errors.

- [ ] **Step 5: Commit**

```bash
git add src/app.vue src/constants/calendar.ts
git commit -m "feat(i18n): migrate F7 params and calendar constants to Paraglide message functions"
```

---

## Chunk 3: Auth Pages

### Task 7: Translate auth pages (login, register, restore-password)

**Files:**
- Modify: `messages/ru.json`, `messages/kk.json`, `messages/en.json` (add `auth_*` keys)
- Modify: `src/pages/login.vue`
- Modify: `src/pages/register.vue`
- Modify: `src/pages/restore-password.vue`

**Pattern for every page translation task (follow this exactly):**
1. Read the Vue file
2. Find every hardcoded Russian string (in templates and script)
3. Create a key `auth_<descriptive_name>` for each unique string
4. Add the key + Russian value to `messages/ru.json`
5. Add the key + Kazakh translation to `messages/kk.json`
6. Add the key + English translation to `messages/en.json`
7. In the Vue file's `<script setup>`, add:
   - `import { auth_foo, auth_bar } from '@/paraglide/messages'`
   - `import { useI18n } from '@/composables/useI18n'`
   - `const { locale } = useI18n()  // establishes reactive dependency`
8. Replace every hardcoded string in the template with the function call: `{{ auth_foo() }}`
9. For strings used in script (e.g., passed to `f7.dialog.alert('...')`), call the function inline: `f7.dialog.alert(auth_foo())`

- [ ] **Step 1: Read all three auth page files**

```bash
cat /home/olge/SOFT/git/mars-2.0/src/pages/login.vue
cat /home/olge/SOFT/git/mars-2.0/src/pages/register.vue
cat /home/olge/SOFT/git/mars-2.0/src/pages/restore-password.vue
```

Extract all hardcoded Russian strings. Typical auth strings include:
- Page titles ("Вход", "Регистрация", "Восстановление пароля")
- Field labels ("Логин", "Пароль", "Email")
- Button text ("Войти", "Зарегистрироваться", "Отправить")
- Validation messages ("Неверный логин или пароль", "Поле обязательно")
- Links ("Забыли пароль?", "Вернуться к входу")

- [ ] **Step 2: Add `auth_*` keys to all three message files**

In `messages/ru.json`, add the extracted Russian strings.
In `messages/kk.json`, add Kazakh translations.
In `messages/en.json`, add English translations.

Example entry format:
```json
"auth_page_title_login": "Вход"
```

- [ ] **Step 3: Apply the pattern to `login.vue`**

Follow the pattern described above. Add imports at the top of `<script setup>`:
```ts
import { auth_page_title_login, /* all keys used in this file */ } from '@/paraglide/messages'
import { useI18n } from '@/composables/useI18n'
const { locale } = useI18n()
```

Replace all hardcoded strings in template and script.

- [ ] **Step 4: Apply same pattern to `register.vue`**

- [ ] **Step 5: Apply same pattern to `restore-password.vue`**

- [ ] **Step 6: Type-check**

```bash
npx tsc --noEmit 2>&1 | grep -v "node_modules" | head -20
```

- [ ] **Step 7: Commit**

```bash
git add messages/ru.json messages/kk.json messages/en.json \
  src/pages/login.vue src/pages/register.vue src/pages/restore-password.vue
git commit -m "feat(i18n): translate auth pages (login, register, restore-password)"
```

---

## Chunk 4: Core Pages

### Task 8: Translate home.vue and profile.vue

**Files:**
- Modify: `messages/ru.json`, `messages/kk.json`, `messages/en.json` (add `home_*`, `profile_*` keys)
- Modify: `src/pages/home.vue`
- Modify: `src/pages/profile.vue`

Follow the exact same pattern as Task 7.

Key prefixes:
- `home.vue` → `home_*`
- `profile.vue` → `profile_*`

- [ ] **Step 1: Read both files**
- [ ] **Step 2: Extract strings, add to all 3 message files**
- [ ] **Step 3: Apply pattern to `home.vue`** (import messages + useI18n, replace strings)
- [ ] **Step 4: Apply pattern to `profile.vue`**
- [ ] **Step 5: Type-check** (`npx tsc --noEmit 2>&1 | grep -v node_modules | head -20`)
- [ ] **Step 6: Commit** (`feat(i18n): translate home and profile pages`)

---

### Task 9: Translate settings.vue and notifications.vue

**Files:**
- Modify: `messages/*.json` (add `settings_*`, `notifications_*` keys)
- Modify: `src/pages/settings.vue`
- Modify: `src/pages/notifications.vue`

Follow the same pattern as Task 7.

- [ ] **Step 1: Read both files**
- [ ] **Step 2: Extract strings, add to all 3 message files**
- [ ] **Step 3: Apply pattern to `settings.vue`**
- [ ] **Step 4: Apply pattern to `notifications.vue`**
- [ ] **Step 5: Type-check**
- [ ] **Step 6: Commit** (`feat(i18n): translate settings and notifications pages`)

---

## Chunk 5: Teacher Pages

### Task 10: Translate journals.vue and JournalDetails.vue

**Files:**
- Modify: `messages/*.json` (add `journal_*` keys)
- Modify: `src/pages/journals.vue`
- Modify: `src/pages/JournalDetails.vue`

`journals.vue` is the largest file in the project (2000+ lines). Work carefully:
- Read the file in sections if needed
- Extract ALL hardcoded strings (labels, placeholders, button text, error messages, modal titles, empty states)
- Journals-specific strings: academic year, semester, group, subject, grade, attendance labels

Follow the same pattern as Task 7.

- [ ] **Step 1: Read `journals.vue` in sections (offset 0, then 500, 1000, 1500 if needed)**
- [ ] **Step 2: Read `JournalDetails.vue`**
- [ ] **Step 3: Extract all strings, add `journal_*` keys to all 3 message files**
- [ ] **Step 4: Apply pattern to `journals.vue`**
- [ ] **Step 5: Apply pattern to `JournalDetails.vue`**
- [ ] **Step 6: Type-check**
- [ ] **Step 7: Commit** (`feat(i18n): translate journals and journal details pages`)

---

### Task 11: Translate protocol.vue and planning.vue

**Files:**
- Modify: `messages/*.json` (add `protocol_*`, `planning_*` keys)
- Modify: `src/pages/protocol.vue`
- Modify: `src/pages/planning.vue`

`protocol.vue` was recently redesigned — notable strings include substitution description template text, status labels (Ожидает, Принято, Отклонено, Завершено), modal text.

Follow the same pattern as Task 7.

- [ ] **Step 1: Read both files**
- [ ] **Step 2: Extract strings, add to all 3 message files**
- [ ] **Step 3: Apply pattern to `protocol.vue`**
- [ ] **Step 4: Apply pattern to `planning.vue`**
- [ ] **Step 5: Type-check**
- [ ] **Step 6: Commit** (`feat(i18n): translate protocol and planning pages`)

---

### Task 12: Translate rup.vue

**Files:**
- Modify: `messages/*.json` (add `rup_*` keys)
- Modify: `src/pages/rup.vue`

- [ ] **Step 1: Read `rup.vue`**
- [ ] **Step 2: Extract strings, add `rup_*` keys to all 3 message files**
- [ ] **Step 3: Apply pattern to `rup.vue`**
- [ ] **Step 4: Type-check**
- [ ] **Step 5: Commit** (`feat(i18n): translate RUP page`)

---

## Chunk 6: Admin Pages

### Task 13: Translate analytics.vue and reports.vue

**Files:**
- Modify: `messages/*.json` (add `analytics_*`, `reports_*` keys)
- Modify: `src/pages/analytics.vue`
- Modify: `src/pages/reports.vue`

Follow the same pattern as Task 7.

- [ ] **Step 1: Read both files**
- [ ] **Step 2: Extract strings, add to all 3 message files**
- [ ] **Step 3: Apply pattern to `analytics.vue`**
- [ ] **Step 4: Apply pattern to `reports.vue`**
- [ ] **Step 5: Type-check**
- [ ] **Step 6: Commit** (`feat(i18n): translate analytics and reports pages`)

---

### Task 14: Translate specialty and discipline catalogs + education schedule

**Files:**
- Modify: `messages/*.json` (add `catalog_*`, `edu_schedule_*` keys)
- Modify: `src/pages/SpecialtyCatalog.vue`
- Modify: `src/pages/DisciplineCatalog.vue`
- Modify: `src/pages/EducationSchedule.vue`

Follow the same pattern as Task 7.

- [ ] **Step 1: Read all three files**
- [ ] **Step 2: Extract strings, add to all 3 message files**
- [ ] **Step 3: Apply pattern to `SpecialtyCatalog.vue`**
- [ ] **Step 4: Apply pattern to `DisciplineCatalog.vue`**
- [ ] **Step 5: Apply pattern to `EducationSchedule.vue`**
- [ ] **Step 6: Type-check**
- [ ] **Step 7: Commit** (`feat(i18n): translate specialty/discipline catalogs and education schedule`)

---

### Task 15: Translate StudentCard.vue and TeacherCard.vue

**Files:**
- Modify: `messages/*.json` (add `student_card_*`, `teacher_card_*` keys)
- Modify: `src/pages/StudentCard.vue`
- Modify: `src/pages/TeacherCard.vue`

Follow the same pattern as Task 7.

- [ ] **Step 1: Read both files**
- [ ] **Step 2: Extract strings, add to all 3 message files**
- [ ] **Step 3: Apply pattern to `StudentCard.vue`**
- [ ] **Step 4: Apply pattern to `TeacherCard.vue`**
- [ ] **Step 5: Type-check**
- [ ] **Step 6: Commit** (`feat(i18n): translate student card and teacher card pages`)

---

## Verification After All Tasks

- [ ] **Full type-check passes:**
  ```bash
  npx tsc --noEmit 2>&1 | grep -v node_modules
  ```

- [ ] **No hardcoded Russian strings remain in pages:**
  ```bash
  grep -rn "[А-Я][а-яА-Я]" src/pages/ --include="*.vue" | grep -v "//\|/\*\|\.json" | head -20
  ```
  (Expected: only dynamic data bindings like `{{ entry.name }}`, no hardcoded string literals)

- [ ] **Dev server starts cleanly:**
  ```bash
  npm run dev 2>&1 | head -20
  ```

- [ ] **Switching locale in the browser updates nav labels, page strings, and the LanguageSelector pill immediately (no reload required for Vue template strings).**
