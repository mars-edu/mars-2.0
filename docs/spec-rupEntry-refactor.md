# Спека: рефакторинг `RupEntryPopup.vue` (god-компонент → server + декомпозиция)

Статус: **предложение/дизайн, код не менялся.** Дата: 2026-07-24.
Файл: `src/components/RupEntryPopup.vue` — **1675 строк** (template 1-509, script 511-1343).

---

## 1. Диагноз (по коду)

`submit()` (L1081-1165) — сердце проблем. Сохранение РУП-записи:

```js
// EDIT: цикл по языкам — на каждый вариант ОТДЕЛЬНАЯ мутация
for (lang of selectedLanguages) {
  if (variantId) await rupEntryStore.updateRupEntry(variantId, {...entryData, texts})  // N мутаций
  else           await rupEntryStore.addRupEntry(...)                                  // + create
}
for (removed) await rupEntryStore.deleteRupEntry(variantId)                            // + M мутаций
// каждый addRupEntry/updateRupEntry внутри ещё вставляет/шлёт ВСЕ distributionEntries
```

### Три системных корня аудита живут прямо здесь
1. **Неатомарность (аудит-корень #3):** save = N×M последовательных мутаций (варианты × распределения). Сбой на середине → часть записана, часть нет, **без отката** → битая группа.
2. **Валидация только клиент (#2):** `isFormValid` (L1054) = zod на клиенте; сервер (`create`/`update`) глотает что угодно (`'abc'` проходит `v.string()`, нет кросс-поле проверок).
3. **Дублирование данных:** каждый языковой вариант = отдельный `rupEntry`-ряд со **своей копией** часов/распределений. Отсюда весь класс variant-divergence багов:
   - edit-prefill берёт часы из `variants[0]`, не из кликнутого (L836);
   - валидация проверяет только активную вкладку языка;
   - `copyFromSource` (L694) перетирает `selectedLanguages`.
4. **Мёртвый атомарный путь:** `createMultiLanguage` (`convex/rupEntries/mutations.ts:300`) / `addRupEntryMultiLanguage` (store) — единая атомарная мутация группы — **существует, но не вызывается**. Правильное сохранение было наполовину построено и брошено ради клиент-цикла.

### Прочая логика, набитая в SFC (832 строки script)
Форм-стейт, 3-языковые варианты, distribution-таблица, hours-математика
(`distributeHoursFromField` L1200, `distributionSummary` L623), zod-валидация,
cross-year integration/connect (`copyFromSource`, `handleIntegration` L731 /
`handleConnect` L738 — почти дубли), dirty-tracking, delete-confirm.

---

## 2. План рефактора (по приоритету)

### P1 — Move to server: ОДНА атомарная `saveRupEntryGroup` мутация ⭐ (чинит #2, #3)
Заменить весь клиент-цикл `submit()` одной серверной мутацией.

**Форма мутации** (`convex/rupEntries/mutations.ts`):
```ts
export const saveRupEntryGroup = mutation({
  args: {
    id: v.optional(v.id("rupEntries")),        // любой вариант группы (edit) или пусто (create)
    groupId: v.optional(v.string()),
    academicYearId: v.string(),
    specialtyIds: v.array(v.string()),
    baseClass: v.array(v.number()),
    // общие hours-поля (totalHours, groupHours, theoretical…, srs/srsp, individual…)
    shared: v.object({ /* hour fields */ }),
    distributionEntries: v.array(distributionEntryValidator),
    variants: v.array(v.object({
      id: v.optional(v.id("rupEntries")),      // есть → update, нет → insert
      language: v.string(),
      moduleIndex: v.string(),
      moduleName: v.string(),
      learningOutcome: v.string(),
    })),
    removedVariantIds: v.optional(v.array(v.id("rupEntries"))),
  },
  handler: async (ctx, args) => {
    // 0. Кросс-поле валидация (throw ConvexError при нарушении) — целостность на сервере.
    // 1. groupId := args.groupId ?? crypto.randomUUID()
    // 2. для каждого variant: patch (если id) или insert (иначе) со shared+texts+distributions
    // 3. удалить removedVariantIds (+ их distributionEntries каскадом)
    // ВСЁ в одной транзакции мутации → атомарно.
  },
});
```
- Переиспользовать/расширить мёртвый `createMultiLanguage` (create-половина есть; добавить upsert/update-ветку).
- **Валидация на сервере** (кросс-поле: `sum(distribution.hours) + individual == totalHours` по канону; числа ≥0) — enforceable независимо от клиента, чинит корень #2.
- `submit()` сжимается с ~85 строк до ~15: собрать payload → `await convex.mutation(api.rupEntries.mutations.saveRupEntryGroup, payload)` → `emit("submit")`.
- **Выгода:** атомарность (нет частичного состояния), 1 round-trip вместо N×M, серверная целостность, тестируемая логика.

### P2 — Извлечь чистую hours-логику (как `src/lib/workloadHours.ts`)
`src/lib/rupHours.ts`: `distributeHoursFromField`, `distributionSummary`/targets,
`computeGroupTarget`. Чистые функции → юнит-тесты (jest):
- баг `toFixed(2)` без коррекции остатка (сумма никогда не == totalHours);
- `targetGroup` с обоими индив-полями (`individualHours` + `individualAdditionalHours`).
Валидатор **шарить с сервером** (P1) — один источник, обе стороны.

### P3 — Декомпозиция god-компонента
`RupEntryForm.vue` (оркестратор) + под-компоненты:
`RupHourFields.vue`, `RupDistributionTable.vue`, `RupLanguageTabs.vue`,
`RupSpecialtyPicker.vue`, `RupIntegrationPanel.vue`.
Композаблы: `useRupEntryForm` (стейт + save через P1), `useRupHourDistribution`
(P2), `useLanguageVariants`. 832 строки script → фокусные юниты.

### P4 — Попутно закрыть отложенные баги
- edit-prefill из `variants[0]` (L836) → кликнутый вариант;
- валидация всех языковых вкладок, не только активной;
- `copyFromSource` не перетирать `selectedLanguages`;
- унифицировать `handleIntegration` (L731) / `handleConnect` (L738) — 2 почти-дубля.

### P5 — Идеал (отдельная schema-миграция, как workload-массив)
**Модель группы:** ОДИН `rupEntry` с общими часами/распределением + встроенный
`variants: v.array({language, moduleIndex, moduleName, learningOutcome})` (только
переводы), вместо N строк-дублей. Убивает **весь класс** variant-divergence багов
(#3-дублирование, edit-prefill, per-tab валидация). Но это миграция данных
(union-мост по `docs/migration-playbook.md`) → отдельная задача.

---

## 3. Что на сервер, что на клиенте

| Сервер (Convex мутация) | Клиент (Vue) |
|-------------------------|--------------|
| Атомарный save: upsert группы + распределения + варианты, удаление отсутствующих | UX распределения (кнопки distribute, live-summary) |
| Кросс-поле валидация (целостность, числа, канон плановых часов) | dirty-tracking, отображение, навигация вкладок |

**Move to server = ДА** для save + validation (атомарность + целостность). Форм-UX
остаётся на клиенте, но **результат валидируется сервером**.

---

## 4. Рекомендация / порядок

1. **P1 (атомарный `saveRupEntryGroup`)** — максимальная ценность (чинит 2 из 3
   системных корней аудита), опирается на уже-существующий мёртвый
   `createMultiLanguage`, делает `submit()` тривиальным. Тестируемо.
2. **P2 (извлечь+тесты hours)** — рядом с P1, шарит валидатор.
3. **P3 (декомпозиция)** — после P1/P2, когда логика вынесена.
4. **P4** — попутно в P3.
5. **P5** — отдельная schema-миграция, когда дойдут руки (ссылка на playbook).

Начинать с **P1** — один атомарный upsert закрывает неатомарность + серверную
валидацию, а `submit()` из 85 строк цикла становится 15 строками вызова.

---

## 5. Связанные документы
- Аудит-корни #2/#3 → `AUDIT-workload-rup-ru.md` §«Три системных корня».
- Паттерн миграции для P5 → `docs/migration-playbook.md` (union expand-contract).
- Прецедент извлечения чистой логики (P2) → `src/lib/workloadHours.ts` (workload Фаза 0).
