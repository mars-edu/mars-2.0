# i18n with Paraglide JS — Design Spec

**Date:** 2026-03-11
**Status:** Approved

---

## Goal

Add full internationalization (i18n) to the Mars 2.0 frontend using Paraglide JS. Support three locales: Russian (`ru`, base), Kazakh (`kk`), English (`en`). Locale preference persisted in localStorage. Language switcher wired to the existing Header component.

---

## Approach: Paraglide at Project Root + localeStore

Paraglide is compiler-based, fully type-safe, tree-shakable. Message functions are imported directly per-file from the generated `src/paraglide/messages` module — no global `$t` wrapper, no composable accessor for messages. The `useI18n` composable is locale-control only.

The backend already has its own `backend/project.inlang/` — the frontend gets a **separate** `project.inlang/` at the repo root, independent from the backend's.

---

## Architecture

### Paraglide Config

**`project.inlang/settings.json`** (repo root):
```json
{
  "baseLocale": "ru",
  "locales": ["ru", "kk", "en"],
  "modules": [
    "@inlang/plugin-message-format",
    "@inlang/plugin-m-function-matcher"
  ],
  "pathPattern": "./messages/{locale}.json"
}
```

Base locale is `ru` — all existing strings are Russian, making Russian the source of truth.

### Message Files

- `messages/ru.json` — base locale, all strings extracted from existing code
- `messages/kk.json` — Kazakh translations (partially borrowable from `backend/messages/kk.json`)
- `messages/en.json` — English translations

### Vite Plugin

Added to `vite.config.js`:
```ts
import { paraglideVitePlugin } from '@inlang/paraglide-js'

paraglideVitePlugin({
  project: './project.inlang',
  outdir: './src/paraglide',
})
```

Generates `src/paraglide/` (runtime + typed message functions) — auto-regenerated on message file changes.

### Locale Store

**`src/stores/localeStore.ts`** — Pinia store, persisted via `pinia-plugin-persistedstate`:
```ts
{
  locale: ref('ru'),                    // persisted to localStorage
  availableLocales: [
    { code: 'ru', name: 'Русский' },
    { code: 'kk', name: 'Қазақша' },
    { code: 'en', name: 'English' },
  ],
  setLocale(code: string): void         // calls Paraglide setLocale(code, { reload: false }) + updates ref
}
```

Replaces `src/composables/useLanguage.ts` (stub — deleted after store is in place).

`src/stores/languageStore.ts` is **not touched** — it is the admin CRUD store for the languages DB table, a different concern.

### useI18n Composable

**`src/composables/useI18n.ts`** — locale control only, no message accessor:
```ts
export function useI18n() {
  const store = useLocaleStore()
  return {
    locale: readonly(store.locale),
    setLocale: store.setLocale,
    availableLocales: store.availableLocales,
  }
}
```

### Message Usage Pattern

Components import message functions **directly** from the generated module:
```ts
import { nav_home, nav_journals } from '@/paraglide/messages'
// used as: nav_home(), nav_journals()
```

No global `m` object. Tree-shaking removes unused messages from bundles automatically.

### Framework7 Built-in Strings

`app.vue` reads locale from `localeStore` at F7 initialization time. Since locale is persisted to localStorage, the correct locale is always available on page load. F7 built-in strings (dialog buttons, calendar months, smartSelect labels) update on the next page load after a locale switch. Mid-session locale switches update all Vue template strings immediately via Paraglide's reactive signal.

### Language Switcher

The **existing** language switcher in `src/components/Header/Header.vue` is rewired to call `useI18n().setLocale()` instead of the old stub implementation.

---

## Message Key Convention

| Prefix | Covers |
|--------|--------|
| `common_` | Shared: save, cancel, delete, error, loading, empty states |
| `nav_` | Sidebar/header navigation labels |
| `f7_` | Framework7 built-in strings (dialogs, calendar, smartSelect) |
| `auth_` | Login, register, restore-password |
| `home_` | Home page |
| `journal_` | Journals + journal details |
| `protocol_` | Protocol page |
| `planning_` | Planning page |
| `rup_` | RUP page |
| `settings_` | Settings page |
| `profile_` | Profile page |
| `notifications_` | Notifications page |
| `analytics_` | Analytics page |
| `reports_` | Reports page |
| `catalog_` | Specialty + discipline catalogs |
| `edu_schedule_` | Education schedule |
| `student_card_` | Student card |
| `teacher_card_` | Teacher card |

---

## Migration Scope

Files modified in implementation order:

### Infrastructure (Phase 1)
1. `package.json` + `vite.config.js` — install Paraglide, add Vite plugin
2. `project.inlang/settings.json` — inlang config
3. `messages/ru.json`, `messages/kk.json`, `messages/en.json` — message files
4. `src/stores/localeStore.ts` — new locale store
5. `src/composables/useI18n.ts` — locale composable
6. `src/composables/useLanguage.ts` — **deleted**

### Shell (Phase 2 — everything depends on these)
7. `src/composables/useRBAC.ts` — all `nav_*` labels
8. `src/app.vue` — all `f7_*` strings, Framework7 init params
9. `src/constants/calendar.ts` — month/weekday names
10. `src/components/Header/Header.vue` — rewire existing language switcher

### Auth Pages (Phase 3)
11. `src/pages/login.vue`
12. `src/pages/register.vue`
13. `src/pages/restore-password.vue`

### Core Pages (Phase 4)
14. `src/pages/home.vue`
15. `src/pages/profile.vue`
16. `src/pages/settings.vue`
17. `src/pages/notifications.vue`

### Teacher Pages (Phase 5)
18. `src/pages/journals.vue` + `src/pages/JournalDetails.vue`
19. `src/pages/protocol.vue`
20. `src/pages/planning.vue`
21. `src/pages/rup.vue`

### Admin Pages (Phase 6)
22. `src/pages/analytics.vue`
23. `src/pages/reports.vue`
24. `src/pages/SpecialtyCatalog.vue`
25. `src/pages/DisciplineCatalog.vue`
26. `src/pages/EducationSchedule.vue`
27. `src/pages/StudentCard.vue`
28. `src/pages/TeacherCard.vue`

---

## What Is NOT in Scope

- URL-based locale routing (Framework7 router doesn't support Vue Router conventions)
- Server-side rendering locale support
- `src/stores/languageStore.ts` (admin DB CRUD — separate concern, untouched)
- Backend message files (already complete in `backend/messages/`)
- Machine translation tooling (translations written manually or via inlang VS Code extension)
