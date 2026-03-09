# Sidebar Redesign — Design Document

**Date:** 2026-03-10
**Source inspiration:** `1-руп-и-каталог-дисциплин-fresh/components/Sidebar.tsx`
**Target:** `src/components/Sidebar/Sidebar.vue`

## Goal

Port the sidebar visual design from the fresh React prototype to the Vue 3 project, preserving the token-based theming system and RBAC nav structure while adopting the improved UX patterns.

## Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Collapse mechanism | Toggle button (not hover) | More intentional, better for keyboard/touch |
| Collapsed state | Icons only, w-16 (64px) | Familiar dashboard pattern |
| Expanded state | Icons + labels, w-64 (256px) | Enough room for text |
| Toggle button position | Floating on right edge of sidebar | Doesn't consume nav space |
| Section group labels | Removed (flat nav) | Cleaner, matches fresh design |
| Active item style | Full card (elevated, shadow) | Fresh design aesthetic |
| Icon library | unplugin-icons + lucide collection | Matches fresh prototype icons |
| Theming | Design tokens (CSS vars) | Maintains light/dark/lavanda support |

## Layout Structure

```
Sidebar (fixed, left-0, top-0, h-screen, z-40, transition-width)
├── Header (h-16, flex, items-center)
│   ├── Logo icon (always visible)
│   ├── "Mars" wordmark (visible only when expanded)
│   └── Toggle button (absolute, -right-3, circular, chevron icon)
├── Nav (flex-1, overflow-y-auto, py-4)
│   └── Nav items (flat list, no section separators)
│       ├── Icon (24px, lucide, always visible)
│       └── Label (ml-3, hidden when collapsed via w-0/opacity-0)
└── Bottom section (border-top, p-3)
    └── Profile, Settings, Logout items
```

## Visual Spec

**Dimensions:**
- Collapsed: `w-16` (64px)
- Expanded: `w-64` (256px)
- Transition: `transition-all duration-200 ease-in-out`

**Toggle button:**
- Position: `absolute -right-3 top-6` (relative to sidebar header)
- Style: `h-6 w-6 rounded-full bg-card border border-border shadow-sm`
- Icon: `ChevronLeft` / `ChevronRight` from lucide (rotates on state)

**Nav item (inactive):**
- `flex items-center px-3 py-2.5 mx-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-colors`
- Icon: 20px
- Label: `ml-3 text-sm font-medium whitespace-nowrap overflow-hidden transition-all`

**Nav item (active):**
- `bg-card shadow-sm ring-1 ring-border text-foreground`
- Same rounded-xl card, elevated appearance via shadow + ring

**Bottom items:** Same pattern as nav items, separated by `border-t border-border`

## State Management

- `useSidebar` composable: `const collapsed = useLocalStorage('sidebar-collapsed', false)`
- Exposed: `collapsed`, `toggle()`
- Used in Sidebar.vue and any layout that needs to offset main content

## Icon Mapping (f7-icons → lucide)

| Nav Item | f7-icon (old) | lucide (new) |
|----------|---------------|--------------|
| home | house_fill | House |
| specialty-catalog | book_fill | GraduationCap |
| discipline-catalog | text_book_closed_fill | BookOpen |
| schedule | calendar_fill | Calendar |
| protocol | doc_text_fill | FileText |
| journals | pencil_outline | ClipboardList |
| rup | doc_fill | LayoutList |
| analytics | chart_bar_fill | BarChart2 |
| reports | doc_chart_fill | FileBarChart |
| education-schedule | calendar_badge_plus | CalendarDays |
| student-card | person_fill | Users |
| teacher-card | person_badge_fill | UserCheck |
| settings | gear_fill | Settings |
| profile | person_circle_fill | CircleUser |
| logout | power | LogOut |

## Files to Create/Modify

1. **`src/composables/useSidebar.ts`** — new composable for collapse state
2. **`src/components/Sidebar/Sidebar.vue`** — full rewrite with new design
3. **`src/components/Sidebar/SidebarItem.vue`** — new sub-component for nav items
4. **`vite.config.ts`** — add unplugin-icons plugin
5. **`package.json`** — add `unplugin-icons` and `@iconify-json/lucide` deps
6. **Layout files** — add `pl-16`/`pl-64` transition on main content area

## Out of Scope

- Changing nav items / RBAC logic (use existing `useRBAC.ts` as-is)
- Changing theme tokens or CSS vars
- Mobile/responsive behavior (sidebar stays fixed for now)
