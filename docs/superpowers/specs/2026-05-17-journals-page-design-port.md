# Журналы Page Design Port

**Date:** 2026-05-17  
**Source:** `concept/components/JournalListView.tsx`  
**Target:** `mars-2.0/src/pages/journals.vue` + `mars-2.0/src/components/Cards/JournalGridCard.vue`

---

## Goal

Port the visual design of the Журналы (Journals) page from the concept prototype to mars-2.0, matching the concept's typography, layout, card design, and interaction patterns while preserving all existing functional behavior (Convex data, stores, selection mode, bulk actions).

---

## Page Layout

- Remove the `bg-card rounded-xl shadow-md` wrapper that currently encloses the filter selects, action buttons, filter tabs, and journal grid.
- Content area background changes from `bg-background` to `bg-muted/40` to approximate the concept's `bg-gray-100` while staying theme-compatible.
- Padding: `p-6 md:p-8` (up from current `p-3 md:p-4`).
- The 5 filter selects (discipline, term, status, group, role) move into a compact `flex flex-wrap gap-3` row directly below the header, no card wrapper.
- Filter tabs and journal grid sit below with no container card.

---

## Header

### Title
```
text-4xl font-bold tracking-tight
```
Text: `journal_title()` (already i18n).

### Subtitle row
Below the title, a single line:

```
"Выберите журнал для работы"  •  [Year pill]  •  [Semester pill]  •  [Teacher pill (admin only)]
```

Each pill is a `<button>` styled as:
```
px-3 py-1.5 bg-card border border-border rounded-xl text-sm font-bold
flex items-center gap-2
hover:border-primary hover:text-primary transition-all shadow-sm
```
With a `ChevronDown` icon that rotates when open. Clicking opens a small popover dropdown below the pill listing the options (year list, semester list, teacher list). Uses existing store values (`selectedItemsStore`, `calendarStore`) — no new state.

The teacher pill is only shown when `userStore.isAdmin` is true.

The existing top-row `<Select>` components for year, semester, and teacher are removed and replaced by these pills.

### Action button area (top-right)
Replace the row of 7 individual action buttons (settings, open, close, download, replace, upload, share) with a single `MoreVertical` icon button:
```
p-2.5 bg-card rounded-xl shadow-sm border border-border
hover:border-primary hover:text-primary transition-all
```
Opening a dropdown menu with the same 7 actions listed vertically. Each menu item: `px-4 py-2.5 text-sm font-bold text-foreground hover:bg-primary/10 hover:text-primary`. Destructive actions (close/block) use `hover:bg-destructive/10 hover:text-destructive`.

Selection mode banner (select all / deselect all / cancel / confirm) replaces the filter row, same as current behavior.

---

## Filter Row (5 Selects)

The existing `<Select>` components for discipline, term, status, group, role are kept as-is functionally, but rendered in a `flex flex-wrap gap-3` row without a card container. Each select keeps its current `min-w-[150px]` sizing.

---

## Filter Tabs

Unchanged functionally. Already matches concept pill tab style:
```
bg-black/5 p-1 rounded-xl overflow-x-auto
```
Active tab: `bg-card text-foreground shadow-sm`. No changes needed.

---

## Journal Cards (`JournalGridCard.vue`)

### Card container
```
p-4 rounded-[20px] bg-card border border-transparent shadow-sm
hover:border-yellow-400 hover:shadow-[0_12px_32px_rgba(250,204,21,0.12)] hover:-translate-y-1
transition-all duration-200 cursor-pointer select-none flex flex-col gap-3
```

### Top row
Left: icon block  
```
w-12 h-12 rounded-xl flex items-center justify-center
text-xl font-extrabold flex-shrink-0
```
Styled with `accentColor.bg` background and `accentColor.text` text (existing prop). Shows `titleInitial`.

Right: `MoreVertical` button (for per-card download action), visible only on hover (`opacity-0 group-hover:opacity-100`). In selection mode this is replaced by the circular checkbox.

### Title
```
text-[22px] font-bold text-foreground leading-tight line-clamp-4
group-hover:text-primary transition-colors
```

### Subtitle
```
text-sm text-muted-foreground leading-relaxed line-clamp-1
```

### Bottom badges row
```
flex flex-wrap items-center gap-2 mt-auto pt-2
```
- Course badge: `bg-primary/10 text-primary text-[13px] font-bold uppercase tracking-wide px-3 py-1.5 rounded-md` — only shown when `courseNumber` is defined
- Student count badge: `bg-muted text-muted-foreground text-[13px] font-bold px-3 py-1.5 rounded-md` — always shown

### Selection mode
Top-right circular checkbox (replacing MoreVertical):
```
w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all
```
Selected: `bg-primary border-primary text-white`. Unselected: `bg-card border-border`.

### Per-card actions dropdown
The `MoreVertical` button opens a small dropdown with "Скачать журнал" as the only action (maps to the existing download flow). Emits a new `download` event. The journals.vue page wires this to the existing download handler.

---

## Props changes to `JournalGridCard.vue`

No new required props. Add optional emit: `download: []`.

The `journals.vue` page passes the same props as today. It also listens to `@download` on each card and routes to the existing download logic.

---

## What is NOT changed

- All Convex store logic, data fetching, selection mode state
- i18n message keys
- Routing (`goToJournalDetails`)
- The `IndividualJournalPopup` and `ReplaceJournalPopover` components
- Mobile bottom nav behavior
- The 5 functional filter selects (discipline, term, status, group, role) — only unstyled from card container
