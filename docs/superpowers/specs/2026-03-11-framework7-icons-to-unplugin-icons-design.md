# Design: Migrate Framework7 Icons to unplugin-icons

**Date:** 2026-03-11
**Branch:** experental-convex-api
**Approach:** Option A — Direct per-file replacement

## Summary

Replace all Framework7 icon usages (`<f7-icon>`, `<i class="f7-icons">`) with unplugin-icons Vue components imported via `~icons/lucide/...`. Remove `framework7-icons` from `package.json` to guarantee it cannot be bundled.

## Scope

- **81 files** affected
- **183 icon usages** total
- **54 unique F7 icon names** (including dual ios/md variants)

## Approach

Each file gets direct `import IconName from "~icons/lucide/icon-name"` imports at the top of `<script setup>`. Every `<f7-icon>` and `<i class="f7-icons">` is replaced with the corresponding `<IconName />` component. No wrapper components, no registry — pure static imports for full tree-shaking.

## Icon Mapping (F7 → Lucide)

| F7 name(s) | Lucide icon |
|---|---|
| `plus`, `add` | `lucide/plus` |
| `trash`, `delete` | `lucide/trash-2` |
| `pencil`, `edit` | `lucide/pencil` |
| `xmark`, `close` | `lucide/x` |
| `xmark_circle`, `cancel` | `lucide/circle-x` |
| `xmark_circle_fill` | `lucide/circle-x` |
| `checkmark`, `checkmark_alt` | `lucide/check` |
| `checkmark_circle`, `check_circle` | `lucide/circle-check` |
| `checkmark_circle_fill` | `lucide/circle-check` |
| `chevron_left` | `lucide/chevron-left` |
| `chevron_right` | `lucide/chevron-right` |
| `chevron_down`, `expand_more` | `lucide/chevron-down` |
| `chevron_up`, `expand_less` | `lucide/chevron-up` |
| `arrow_down` | `lucide/arrow-down` |
| `arrow_up` | `lucide/arrow-up` |
| `arrow_down_to_line` | `lucide/arrow-down-to-line` |
| `arrow_up_to_line` | `lucide/arrow-up-to-line` |
| `arrow_down_doc`, `file_upload`, `download` | `lucide/file-down` |
| `arrow_up_doc`, `upload_file` | `lucide/file-up` |
| `arrow_2_squarepath` | `lucide/refresh-cw` |
| `arrow_clockwise` | `lucide/rotate-cw` |
| `square_arrow_down` | `lucide/square-arrow-down` |
| `square_arrow_up` | `lucide/square-arrow-up` |
| `doc_text`, `description` | `lucide/file-text` |
| `doc_on_doc`, `content_copy`, `square_on_square` | `lucide/copy` |
| `doc_chart_fill` | `lucide/file-bar-chart` |
| `clock` | `lucide/clock` |
| `calendar` | `lucide/calendar` |
| `calendar_badge_plus` | `lucide/calendar-plus` |
| `calendar_badge_exclamationmark` | `lucide/calendar-x` |
| `bell` | `lucide/bell` |
| `bell_slash` | `lucide/bell-off` |
| `gear`, `settings` | `lucide/settings-2` |
| `table`, `table_chart` | `lucide/table` |
| `info_circle`, `info_circle_fill` | `lucide/info` |
| `exclamationmark_triangle`, `exclamationmark_triangle_fill` | `lucide/triangle-alert` |
| `ellipsis_vertical` | `lucide/ellipsis-vertical` |
| `share` | `lucide/share-2` |
| `search` | `lucide/search` |
| `paperclip` | `lucide/paperclip` |
| `globe` | `lucide/globe` |
| `lock_open` | `lucide/lock-open` |
| `eye_slash` | `lucide/eye-off` |
| `line_horizontal_3` | `lucide/menu` |
| `sparkles`, `smart_toy` | `lucide/sparkles` |
| `person_circle_fill` | `lucide/circle-user` |
| `person_2_fill` | `lucide/users` |
| `chart_bar_fill` | `lucide/bar-chart-2` |
| `megaphone_fill` | `lucide/megaphone` |

## Sizing

F7 icons use a `size` prop (e.g. `size="16px"`). Lucide SVG components accept `width`/`height` or Tailwind size classes (`class="w-4 h-4"`). Size mapping:
- `size="14px"` → `class="w-3.5 h-3.5"`
- `size="16px"` → `class="w-4 h-4"`
- `size="18px"` → `class="w-[18px] h-[18px]"`
- `size="20px"` → `class="w-5 h-5"`
- No size attr → no size class (inherits `1em` default from unplugin-icons)

Existing color/spacing classes on the old element are preserved on the new component.

## Build Guarantee

Remove `framework7-icons` from `dependencies` in `package.json`. Update vite.config.js chunk group to remove `framework7-icons` from the `framework7` bundle group name regex.

## Files NOT changed

- `vite.config.js` Icons plugin config (already correct)
- `@iconify-json/lucide` (already installed)
- `unplugin-icons` (already installed)
- Files using `~icons/lucide/...` already (Sidebar.vue, CalendarEvent.vue) — already migrated
