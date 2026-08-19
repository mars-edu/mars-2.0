# Migration Plan v4: `workloads.items[]` плоские поля → `semesters[]` (массив, ключ = `semesterId`)

Статус: **execution-ready анализ** — код этим документом не менялся.
Дата ревизии: 2026-08-17. Ветка: `dev`. Репо: `mars-2.0` (Vue 3 + Pinia + Convex).
Предшественники: `MIGRATION-workload-array-plan.md` (v3), `AUDIT-workload-rup-ru.md`.

Целевая модель (решение зафиксировано, подтверждено против текущего кода):

```ts
semesters: { semesterId: Id<"academicYearSemesters">; weeks: number; hours: number; groupCount: number }[]
```

- ключ элемента = `academicYearSemesters._id` (как ВСЕ `*.semesterId` в схеме);
- канон порядка/резолва = `semesterDefinition.number` через джойн
  `semesterDefinitionId` (прямой матч, НЕ сортировка по `startDate`);
- `hoursPerGroup` не хранится — деривируется `weeks * hours`;
- миграции — официальный `@convex-dev/migrations` (`convex/migrations/index.ts`);
- деплой — expand-contract (Pattern A), шаблон =
  `convex/migrations/educationTechnologyBackfill.ts` (хедер-ранбук, прецедент
  прошёл прод: коммиты `00b9cc6` → `1041265` → `b36d6a2`).

---

## §0. Что изменилось с v3 — сверка с текущим кодом (текущий код ПОБЕЖДАЕТ)

Проверено grep'ом + чтением файлов 2026-08-17. Все строчные ссылки ниже —
актуальные.

| # | Утверждение v3 | Реальность сейчас |
|---|---|---|
| 1 | Логика в `WorkloadManagement.vue` L981-1264 | **УСТАРЕЛО.** Извлечена: чистая арифметика → `src/lib/workloadHours.ts` (`recalcWorkloadItem`, `seedWorkloadItemsFromRup`, `computeWorkloadTotal`, `formatHours`, `hasIndividual`); CSV → `src/lib/workloadCsv.ts`. `.vue` делегирует (см. §1.7). Рефактор Фазы 3 идёт в ЭТИХ модулях под тестами. |
| 2 | Гэп C2: `addDistribution:128` льёт невалидные id через `as any` | **УЖЕ ПОЧИНЕНО.** `convex/rupEntries/mutations.ts:240` — `semesterId: v.id("academicYearSemesters")`; все `semesterId`-аргументы rup-мутаций сужены до `v.id` (строки 240, 269, 337, 460, 569), кастов `as any` на semesterId нет. От C2 остаётся только data-аудит перед сужением нового поля (см. §4, Фаза 1). |
| 3 | `semesterId` в массиве — транзиторно `v.string()` (легаси числовые id) | **ПЕРЕСМОТРЕНО → сразу `v.id("academicYearSemesters")`.** Основание: (а) `distributionEntries.semesterId` уже `v.id` в схеме (`convex/schema/rup.ts:42`) — легаси числовые id не могут существовать в источнике сидинга; (б) прод-аудит нашёл данные чистыми; (в) бэкфилл сам пишет только реальные `_id`. Транзиторный `string` создавал бы ту работу по сужению (гэп C2), которой можно вообще избежать. Требует подтверждения — см. §7 п.6. |
| 4 | `item.totalHours: string` во фронт-типе | **УСТАРЕЛО.** `src/types/workload.ts:31` — `totalHours: number`; index-сигнатура теперь `string \| string[] \| number \| undefined` (`:37`). Схема — транзиторный union (`convex/schema/workloadItem.ts:67`), прод-items уже числовые. |
| 5 | Счётчики тестов: workloadHours 23, workloadCsv 20 | **УСТАРЕЛО.** Сейчас: `workloadHours.spec.ts` — 25 `it()`, `workloadCsv.spec.ts` — 26, `lib.spec.ts` — 16. Точный список флипающихся — §6. |
| 6 | Ссылки на `docs/migration-playbook.md` в комментариях схемы | **ВИСЯЧИЕ.** Папка `docs/` удалена (коммит `7792e4f` "chore: clear docs folder"). Живой шаблон ранбука = хедер `convex/migrations/educationTechnologyBackfill.ts`. При реализации — поправить комментарии в `convex/schema/workloadItem.ts:63-66`, `convex/schema/workloads.ts:14-15`, `convex/migrations/workloads.ts`. |
| 7 | `convex/schema.ts` — монолит | Разбит: `convex/schema.ts` — агрегатор, домены в `convex/schema/*.ts`. Затрагиваются `workloadItem.ts` + `workloads.ts`. |
| 8 | mutations.ts:91 — startDate-сортировка | Сдвинулось: теперь `convex/workloads/mutations.ts:100-108` (sort по `startDate` + `semesters[args.semester - 1]`). Смысл тот же — чинится в Фазе 3 (D1). |
| 9 | Инвентарь §1 v3 не знал сайт | **НОВЫЙ САЙТ:** `src/pages/WorkloadManagement.vue:540` — попап просмотра нагрузки хардкодит `{{ item.groupCount1 }}/{{ item.groupCount2 }}` (в аудите — «Низкая»). Включён в Фазу 3. |
| 10 | — | **Ложное срабатывание грепа:** `src/pages/journals.vue:653` `const semesterValue = ...` — локальная переменная про calendar-event, к `convex/workloads/lib.ts#semesterValue` отношения не имеет. НЕ сайт. |
| 11 | `WorkloadItemLike.totalHours: string` | Уже `number` (`convex/workloads/lib.ts:28`). |
| 12 | Миграция item.totalHours покрывает всё | **ДЫРА:** `migrations/workloads:totalHoursToNumber` патчит только `items[].totalHours`. **Верхнеуровневый** `workloads.totalHours` (тоже union, `convex/schema/workloads.ts:16`) старые строки мог не тронуть. Перед сужением union — проверить/домигрировать (Фаза 1, шаг 1c). |

---

## §1. Инвентарь read/write-сайтов плоских полей — как есть СЕГОДНЯ

Греп-паттерны: `` weeks${ ``, `` hours${ ``, `` hoursPerGroup${ ``, `` groupCount${ ``,
литералы `weeks1..6` и т.д., `semesterValue`. Полный проход 2026-08-17.

### 1.1 Схема (Convex)

| Файл:строки | Роль |
|---|---|
| `convex/schema/workloadItem.ts:28-73` | `workloadItemValidator` — 24 плоских поля (`:35-61`), `totalHours: v.union(v.string(), v.number())` (`:67`), `MAX_WORKLOAD_SEMESTERS = 6` (`:20`). Комментарий `:15-18` сам называет плоскую форму «known limitation — the proper model is a per-semester array». |
| `convex/schema/workloads.ts:10-27` | таблица `workloads`: `items: v.array(workloadItemValidator)` (`:17`), `academicYearId: v.string()` — **всё ещё легаси-string, не `v.id`** (`:13`) → гэп A3 актуален как pre-flight аудит; `totalHours` union (`:16`); `journalsCreatedSemesters: v.optional(v.array(v.number()))` (`:21`) → гэп D1. |

### 1.2 Мутации/квери (Convex)

| Файл:строки | Роль |
|---|---|
| `convex/workloads/mutations.ts:10-35` | `save` — принимает `items: v.array(workloadItemValidator)`, `totalHours: v.number()` (top-level уже сужен на аргументах), пишет как есть. Меняется только формой валидатора. |
| `convex/workloads/mutations.ts:77-199` | `createJournalsFromWorkloadGroups` — `semester: v.number()` (ординал, `:80`); резолв семестра **сортировкой по startDate + позицией** (`:100-108`) — целевой фикс D1; идемпотентный wipe по `semesterRecord._id` (`:114-148`); трекинг `journalsCreatedSemesters` ординалами (`:184-195`). Плоские поля item НЕ читает — payload формирует wizard. |
| `convex/workloads/queries.ts` | не читает плоских полей — возвращает документы целиком. Правок не требует. |

### 1.3 Чистые хелперы (Convex)

| Файл:строки | Роль |
|---|---|
| `convex/workloads/lib.ts:10-32` | `WorkloadItemLike` — плоская форма семестров 1-3 (уже расходится с полным item: нет 4-6), `totalHours: number`. |
| `convex/workloads/lib.ts:34-45` | `SemesterNumber = 1\|2\|3`, `semesterValue(item, semester, base)` — единственное типизированное динамическое чтение `` `${base}${semester}` ``. |
| `convex/workloads/lib.ts:51-61` | `itemsNeedingJournals(items, semester)` — фильтр `hoursPerGroup>0 \|\| groupCount>0`, исключает `_ind`. |
| `convex/workloads/lib.ts:64-71, 86-99` | `splitIntoGroups`, `filterEligibleStudents` — плоских полей не касаются, не трогать. |

### 1.4 Фронт-типы

| Файл:строки | Роль |
|---|---|
| `src/types/workload.ts:1-38` | `WorkloadItem` — 24 плоских поля (`:7-30`), `totalHours: number` (`:31`), index-сигнатура `[key: string]: string \| string[] \| number \| undefined` (`:37`) — маскирует все динамические доступы; снять в Фазе 4 = компиляторный gate. |
| `src/types/workload.ts:40-52` | `SavedWorkload` — меняется только транзитивно; `journalsCreatedSemesters?: number[]` (`:48`). |

### 1.5 `src/lib/workloadHours.ts` — ГЛАВНЫЙ модуль логики (сюда переехала суть)

| Строки | Роль |
|---|---|
| `:16-19` | `formatHours` — display-хелпер, от формы хранения не зависит, остаётся. |
| `:26-40` | `recalcWorkloadItem(item, semesterCount)` — цикл `1..semesterCount`: читает `` item[`weeks${i}`] ``/`` hours${i} ``/`` groupCount${i} `` через `parseFloat(...\|\|"0")`, пишет `` item[`hoursPerGroup${i}`] `` = `weeks*hours`, `totalHours = Math.round(total)` — **rounding fix живёт здесь** (`:38`): округляется СУММА, не промежуточные. Самое регресс-чувствительное место (payroll-adjacent). |
| `:45-49` | `computeWorkloadTotal(items)` — сумма `Number(item.totalHours)`; плоских полей не читает, остаётся. |
| `:55-72` | `hasIndividual`/`individualTotal` — читают только rup, остаются. |
| `:91-200` | `seedWorkloadItemsFromRup(rup, opts)` — сеятель. Литерал только с полями 1-2 (`:103-110`, `:138-145`); **позиционная привязка** `rup.distributionEntries.forEach((entry, idx) => semNum = idx+1)` (`:118-125`) — defect #2, `entry.semesterId` ИГНОРИРУЕТСЯ, year-фильтра НЕТ (гэп B1); `_ind`-ветка: filledFromDist (`:153-164`), fallback-распределение (`:168-190`), ручная сумма `_ind` (`:191-195`). Defect #1 (`weeks3+`/`groupCount3+` не инициализируются → семестр 3+ зануляется `recalcWorkloadItem`-ом на `:128`) — жив, запинен тестом. |

### 1.6 `src/lib/workloadCsv.ts` — CSV (уходит целиком в Фазе 3 → XLSX)

| Строки | Роль |
|---|---|
| `:21-27` | `escapeCsvCell` — анти-инъекция апострофом (портит числа — одна из причин ухода на XLSX). |
| `:38-60` | `buildWorkloadCsvContent` — заголовки и чтение **жёстко семестры 1-2** (`:39`, `:45-52`). |
| `:71-104` | `buildAllWorkloadsCsvContent` — тот же хардкод (`:75`, `:87-94`). |

### 1.7 `src/pages/WorkloadManagement.vue` — шаблон + тонкие делегаты

Шаблон (сетка):
- `:67-70` — `:colspan="semesterCount"` × 4 группы колонок; `:75-87` — подколонки `v-for="i in semesterCount"` (декоративные).
- `:157,162,167` — **Недели**: `` adjustValue(item.id, `weeks${i}`, ∓1) ``, `` v-model="item[`weeks${i}`]" ``.
- `:179,185,186,190` — **Часы**: `` :value="formatHours(item[`hours${i}`])" `` + `@change` пишет сырое значение (фикс 3б: `@change`, не `@input` — НЕ регрессировать) + `adjustValue`.
- `:200` — **На группу** (read-only): `` formatHours(item[`hoursPerGroup${i}`]) ``.
- `:209,214,219` — **Группы**: `v-model` + `adjustValue`.
- `:244` — colspan `6 + semesterCount * 4` (empty state); `:257` — `4 + semesterCount * 4` (футер).
- `:540` — **попап просмотра**: `группы {{ item.groupCount1 }}/{{ item.groupCount2 }}` — хардкод 1/2, НЕ был в инвентаре v3.
- `:331-332, :399` — бейдж/кнопка `journalsCreatedSemesters` (ординалы «1, 2 сем») — касается D1.

Скрипт:
- `:706` — `import { MAX_WORKLOAD_SEMESTERS }`; `:707-708` — импорты hours/csv-модулей.
- `:778-782` — `semesterCount` computed = `getAcademicYearSemestersByAcademicYear(...).length || 2`.
- `:981-994` — `addSubjectFromRup` → делегат `seedWorkloadItemsFromRup` (передаёт `semesterCount`; после Фазы 3 будет передавать список семестров года).
- `:1000-1004` — `recalculateItem` → делегат `recalcWorkloadItem`.
- `:1006-1012` — `adjustValue(id, field, delta)` — динамическое строковое имя поля, `parseFloat`+`toString`.
- `:1030-1042` — guard `semesterCount > MAX_WORKLOAD_SEMESTERS` в `handleSaveWorkload` (умирает в Фазе 5).
- `:1092-1103, :1105-1113` — `downloadWorkload`/`downloadAllWorkloads` → делегаты CSV-билдеров + DOM-механика (Blob/anchor). В Фазе 3 → XLSX.

### 1.8 Wizard

| Файл:строки | Роль |
|---|---|
| `WorkloadJournalWizard.vue:23,30` | **хардкод-кнопки** `selectSemester(1)` / `selectSemester(2)` — семестр 3+ недостижим (гэп D2). |
| `:276` | `import { itemsNeedingJournals, semesterValue } from "@convex/workloads/lib"`. |
| `:378-404` | `selectSemester(sem)` — `itemsNeedingJournals(wl.items as any, sem as any)`; `groupCount` = `semesterValue(..., "groupCount")` (`:395`); `plannedHours` = `parseFloat(semesterValue(..., "hoursPerGroup"))` (`:399`, дробность сохранена — фикс #11 аудита, не регрессировать). `plannedHours` — источник истины клиентской валидации «расписание == план». |

### 1.9 Store

`src/stores/workloadStore.ts` — плоских полей не читает, прокидывает
`items` целиком (`:34`, `:52`). Только транзитивные типы.
`src/stores/academicYearSemesterStore.ts:31-42` — маппинг
`semesterNumber: s.semesterDefinition?.number || 1` — фронтовый резолв номера
уже канонический (через definition, не startDate); `getAcademicYearSemestersByAcademicYear`
(`:54-59`) — фильтр без сортировки (используется только `.length`).

### 1.10 Тесты (текущие)

- `src/lib/__tests__/workloadHours.spec.ts` — 25 тестов (фикстуры плоские `:20-38`).
- `src/lib/__tests__/workloadCsv.spec.ts` — 26 тестов.
- `convex/workloads/__tests__/lib.spec.ts` — 16 тестов.
Раннер — **jest** (`package.json:22`, `jest --runInBand`).

### 1.11 Проверено и исключено

- `src/services/teacher-workload-calculator.ts` — фактические часы по журналам, другая модель. Не трогать.
- `src/lib/excel/workloadExport.types.ts`, `convex/excel/lib/workloadExport.ts` — отчёты Форм 1-3, плоских полей нагрузки не читают; но `convex/excel/lib/workloadExport.ts` — **готовый exceljs-прецедент** для Фазы 3 XLSX.
- `src/pages/journals.vue:653` — ложное совпадение грепа (см. §0 п.10).

---

## §2. Целевая модель (уточнение v4)

```ts
// convex/schema/workloadItem.ts (Фаза 1 — optional; Фаза 5 — required)
export const workloadSemesterEntryValidator = v.object({
  semesterId: v.id("academicYearSemesters"), // v4: сразу v.id, НЕ v.string() — см. §0 п.3
  weeks: v.number(),
  hours: v.number(),      // часов в неделю
  groupCount: v.number(),
  // hoursPerGroup НЕ хранится: derive = weeks * hours (единый хелпер, см. Фазу 3)
});
```

```ts
// src/types/workload.ts (Фаза 3+)
export interface WorkloadSemesterEntry {
  semesterId: string; // Id<"academicYearSemesters"> на фронте — string
  weeks: number;
  hours: number;
  groupCount: number;
}
```

Порядок в массиве НЕ значим; отображение сортируется по
`semesterDefinition.number` (у фронта уже есть `semesterNumber` в
academicYearSemesterStore). Единственный derive-хелпер:

```ts
export const hoursPerGroup = (e: WorkloadSemesterEntry) => e.weeks * e.hours;
```

— им обязаны пользоваться И `recalc`, И wizard `plannedHours`, И XLSX-экспорт
(риск расхождения округления из v3 §6 снимается единственностью формулы).

---

## §3. Прод-реальность и триаж 9 гэпов

Прод (festive-cormorant-785, аудит 2026-07-23, объёмы с тех пор — единицы
записей): **~5 `workloads`**, 1 активный год «2025-2026» с 2 семестрами
(`semesterDefinitions.number` = 1, 2, порядок дат совпадает с номерами), ~42
`rupEntries`, ноль запятых-десятичных, все `workloads.academicYearId`
резолвятся, `items[].totalHours` уже number. `union`-бэкенд и компонент
миграций на проде. Данные ЧИСТЫЕ — все защиты ниже пишутся против латентных
сценариев и будущих годов (3+ семестра), а не против существующей порчи.

| Гэп | Sev | Триггерится на проде СЕЙЧАС? | Куда вплетён |
|---|---|---|---|
| **A2** пустой массив отравляет идемпотентность | High | Нет (данные резолвятся), но это свойство КОДА бэкфилла — обязателен by construction | Фаза 2, код |
| **A1** дубли `semesterDefinition.number` | High | Нет (2 дефиниции: 1, 2) — латентный | Фаза 2, hard-abort |
| **A3** легаси `academicYearId` (`v.string()`, не резолвится) | High | Нет (все резолвятся) — латентный | Фаза 2, pre-flight аудит + `normalizeId` в migrateOne |
| **B1** сидинг без year-фильтра (межгодовые distributionEntries) | High | Латентен, пока RUP-записи не шарятся между годами; структурно — да, при каждом посеве | Фаза 3, сидинг по `entry.semesterId` |
| **C1** политика orphan-`semesterId` | High | Нет orphan'ов сейчас; станет возможен после миграции (удаление семестра года) | Фаза 3, политика + тест; **нужно решение** (§7 п.2) |
| **C2** сужение string→v.id без гейта; `addDistribution` | High | **Наполовину уже закрыт кодом**: `addDistribution` валидирует `v.id` (`rupEntries/mutations.ts:240`). Остаток: `workloads.academicYearId` всё ещё `v.string()` — вне скоупа этой миграции, но аудит A3 покрывает | Фаза 1 (выбор v.id сразу) + Фаза 2 pre-flight |
| **D1** `journalsCreatedSemesters` — ординал по startDate-сортировке | High | На проде startDate-порядок == number-порядок → значения не меняются; латентный. Но правка `mutations.ts:100-108` обязана пройти вместе с верификацией | Фаза 3, мутация + верификация; рекей НЕ нужен на текущих данных |
| **D2** wizard-табы хардкод 1/2 | Med | Да как продукт-ограничение (год с 3 семестрами не обслуживается), на текущем 2-семестровом годе — нет | Фаза 3, динамические табы |
| **D3** `totalHours` string/number устарел | Low | items — сделано; **top-level `workloads.totalHours` — проверить** (§0 п.12) | Фаза 1, шаг 1c |

Минорные: **A4** (висячий `semesterDefinitionId`) и **A5** (дыры нумерации) —
покрыты кодом Фазы 2 (лог + abort-политика); **E1** (full-scan
`semesterDefinitions` на нагрузку) — принят: 5 строк × 2 дефиниции, не перф-фактор;
**E2** (запятая-локаль) — дешёвый guard `.replace(",", ".")` в `num()` всё равно ставим.

---

## §4. Фазовый план (каждая фаза — самостоятельный деплой)

### Фаза 0 — Характеризационные тесты. ✅ СДЕЛАНО
67 тестов (25 + 26 + 16), jest. Пинят текущее поведение, включая defect #1 и
CSV-хардкод. Флип-план — §6.

### Фаза 1 — Expand: схема + подготовка сужений

**1a.** `convex/schema/workloadItem.ts`: добавить
`semesters: v.optional(v.array(workloadSemesterEntryValidator))` (валидатор из §2,
`semesterId: v.id("academicYearSemesters")`). Плоские 24 поля НЕ трогать.
`save`-мутация меняется автоматически (шарит валидатор). Старый UI не шлёт
`semesters` — optional это позволяет.

**1b.** Обновить висячие комментарии `docs/migration-playbook.md` (см. §0 п.6) —
гигиена, чтобы ранбук не ссылался на удалённый файл.

**1c.** Проверка top-level `workloads.totalHours` на проде:
```sh
npx convex data workloads --limit 100 --prod   # глазами: totalHours у всех number?
```
Если есть строки — микро-миграция (зеркало `totalHoursToNumber`, но для
`wl.totalHours`), добавить в `convex/migrations/workloads.ts`. Сужение обоих
union → `v.number()` — отдельный шаг Фазы 5 (или раньше, после деплоя фронта —
он уже пишет числа: `handleSaveWorkload` передаёт `totalCurrentWorkloadHours`
number, сидер пишет `totalHours: 0`/`Math.round(...)`).

Rollback: чистый revert PR — поле optional, данных нет.

### Фаза 2 — Backfill `semesters[]` (гэпы A1, A2, A3, A4, A5, E2 — в коде)

Файл: `convex/migrations/workloadSemesters.ts`. Ключевые решения кода:

- **A2:** идемпотентность НЕ через truthy `item.semesters` (пустой `[]` —
  truthy → отравление). Готовность = `Array.isArray(item.semesters)` **И**
  инвариант «массив консистентен с плоскими» (ниже abort-политика делает
  пустой-при-данных невозможным by construction).
- **A1:** дубль `number` среди семестров ОДНОГО года → `throw ConvexError` —
  миграция останавливается, ручной разбор. Молчаливый last-write-wins запрещён.
- **A3:** `ctx.db.normalizeId("academicYears", wl.academicYearId)` — канонический
  API; `null` → `throw` (не тихий скип: тихий скип + A2 = вечная дыра).
- **A5/A4:** колонка с ненулевыми данными без резолвимого семестра → `throw`;
  колонка со сплошными нулями без семестра → скип с warn (не искажает часы).
- **E2:** `num()` понимает запятую.
- Скан колонок 1..6 без раннего `break` (дыры в заполнении не режут хвост).
- **Верификация деривации:** `weeks*hours` обязан восстанавливать сохранённый
  `hoursPerGroup{N}` (для `_ind`-строк направление деривации исторически
  обратное: хранился точный бюджет, `hours = бюджет/weeks`). Расхождение
  > 0.01 — warn с id (кандидат ручной сверки), > 0.5 — throw. Это защита
  payroll-чисел: после миграции wizard `plannedHours` = `weeks*hours`.

```ts
// convex/migrations/workloadSemesters.ts
import { ConvexError } from "convex/values";
import { migrations } from "./index";

const MAX_LEGACY = 6;
const num = (raw: unknown): number => {
  if (typeof raw === "number") return Number.isFinite(raw) ? raw : 0;
  const s = String(raw ?? "").trim().replace(",", "."); // E2: KZ-локаль
  const n = parseFloat(s);
  return Number.isFinite(n) ? n : 0; // ''/undefined/'abc' → 0 (warn ниже)
};

export const backfillWorkloadSemesters = migrations.define({
  table: "workloads",
  migrateOne: async (ctx, wl) => {
    // A3: канонический резолв легаси-string academicYearId.
    const yearId = ctx.db.normalizeId("academicYears", wl.academicYearId);
    if (!yearId || !(await ctx.db.get(yearId))) {
      throw new ConvexError({
        code: "DANGLING_ACADEMIC_YEAR",
        workloadId: wl._id, academicYearId: wl.academicYearId,
      });
    }

    // Канон: number живёт в semesterDefinitions (НЕ в academicYearSemesters!)
    // — джойн через semesterDefinitionId. E1: full-scan принят (2 дефиниции).
    const defs = await ctx.db.query("semesterDefinitions").collect();
    const numberByDef = new Map(defs.map((d) => [d._id, d.number]));

    const yearSems = await ctx.db
      .query("academicYearSemesters")
      .withIndex("by_academicYear", (q) => q.eq("academicYearId", yearId))
      .collect();

    const semIdByNumber = new Map<number, typeof yearSems[number]["_id"]>();
    for (const s of yearSems) {
      const n = numberByDef.get(s.semesterDefinitionId);
      if (n === undefined) {
        // A4: висячая дефиниция — не тихо: этот семестр нерезолвим.
        console.warn(`[mig] year ${yearId}: semester ${s._id} has dangling semesterDefinitionId`);
        continue;
      }
      if (semIdByNumber.has(n)) {
        // A1: дубль номера — hard abort, никакого last-write-wins.
        throw new ConvexError({ code: "DUPLICATE_SEMESTER_NUMBER", yearId, number: n });
      }
      semIdByNumber.set(n, s._id);
    }

    let changed = false;
    const items = wl.items.map((item: any) => {
      // A2: пустой массив НЕ считается «готово» — но ниже он и невозможен
      // при непустых данных (abort-политика). Непустой массив = сделано.
      if (Array.isArray(item.semesters) && item.semesters.length > 0) return item;

      const semesters: Array<{ semesterId: string; weeks: number; hours: number; groupCount: number }> = [];
      for (let i = 1; i <= MAX_LEGACY; i++) {
        const rawW = item[`weeks${i}`], rawH = item[`hours${i}`], rawG = item[`groupCount${i}`];
        if (rawW === undefined && rawH === undefined && rawG === undefined) continue; // A5: дыры не режут хвост
        const w = num(rawW), h = num(rawH), g = num(rawG);
        for (const [raw, parsed] of [[rawW, w], [rawH, h], [rawG, g]] as const) {
          if (raw !== undefined && String(raw).trim() !== "" && parsed === 0 && num(raw) !== 0) {
            console.warn(`[mig] wl ${wl._id} item ${item.id} col ${i}: non-numeric '${raw}' → 0`);
          }
        }
        const semId = semIdByNumber.get(i);
        if (!semId) {
          if (w === 0 && h === 0 && g === 0) {
            console.warn(`[mig] wl ${wl._id} item ${item.id}: пустая колонка ${i} без семестра — скип`);
            continue; // нули не искажают часы
          }
          // A5/A2: данные есть, семестра нет — СТОП, а не тихий скип.
          throw new ConvexError({
            code: "UNRESOLVED_SEMESTER_COLUMN",
            workloadId: wl._id, itemId: item.id, column: i,
          });
        }
        // Верификация деривации (payroll-защита): weeks*hours ≈ хранимый hoursPerGroup.
        const stored = num(item[`hoursPerGroup${i}`]);
        const derived = w * h;
        if (Math.abs(derived - stored) > 0.5) {
          throw new ConvexError({
            code: "HOURS_DERIVATION_DRIFT",
            workloadId: wl._id, itemId: item.id, column: i, stored, derived,
          });
        } else if (Math.abs(derived - stored) > 0.01) {
          console.warn(`[mig] wl ${wl._id} item ${item.id} col ${i}: drift ${stored}→${derived}`);
        }
        semesters.push({ semesterId: semId, weeks: w, hours: h, groupCount: g });
      }
      changed = true;
      return { ...item, semesters }; // плоские поля НЕ трогаем (dual state)
    });

    return changed ? { items } : undefined;
  },
});
```

Аддитивно, идемпотентно, ре-запускаемо. `hoursPerGroup{N}` в массив не
переносится (производный). Ранбук — §5.

Rollback: массив — паразитное optional-поле, старый код его игнорирует;
крайняя мера — обратная миграция `semesters: undefined` (patch).

### Фаза 3 — Читатели/писатели на `semesters[]`, dual-write (гэпы B1, C1, D1, D2)

Единый порядок деплоя фазы: один PR фронт+lib+wizard+mutation (Convex деплоит
бэк и фронт-бандл вместе; wizard импортирует `@convex/workloads/lib` напрямую,
рассинхрон невозможен внутри одного деплоя).

**3.1 Типы** (`src/types/workload.ts`): `+ semesters?: WorkloadSemesterEntry[]`,
плоские поля все → optional, index-сигнатуру ПОКА оставить.

**3.2 `src/lib/workloadHours.ts` — новая логика (под флип тестов §6):**

```ts
export interface YearSemesterRef { semesterId: string; number: number }

export const findSemesterEntry = (item: WorkloadItem, semesterId: string) =>
  item.semesters?.find((s) => s.semesterId === semesterId);

export const hoursPerGroup = (e: WorkloadSemesterEntry) => e.weeks * e.hours;

// recalc: источник истины = semesters[]; totalHours = Math.round(СУММЫ) — порядок
// округления сохранить (rounding lock §6). Плоские поля синхронизируются одним
// местом (dual-write, умирает в Фазе 5):
export function syncFlatFieldsFromSemesters(item: WorkloadItem, refs: YearSemesterRef[]) {
  for (const ref of refs) {
    const e = findSemesterEntry(item, ref.semesterId);
    item[`weeks${ref.number}`] = String(e?.weeks ?? 0);
    item[`hours${ref.number}`] = String(e?.hours ?? 0);
    item[`hoursPerGroup${ref.number}`] = String(e ? hoursPerGroup(e) : 0);
    item[`groupCount${ref.number}`] = String(e?.groupCount ?? 0);
  }
}
```

**Сеятель (`seedWorkloadItemsFromRup`) — киллер defect #1/#2 и B1:**
сигнатура меняется: вместо `semesterCount: number` принимает
`yearSemesters: YearSemesterRef[]` (семестры ВЫБРАННОГО года, отсортированные по
`number`; у caller-а всё есть — `academicYearSemesterStore`). Правила:
- массив инициализируется на ВСЕ семестры года явными записями
  `{semesterId, weeks: defaultWeeksFor(number), hours: 0, groupCount: 1}` —
  «weeks3 не инициализирован» структурно невозможен (defect #1 мёртв);
- распределение цепляется **по `entry.semesterId`**, а не по индексу:
  `const target = byId.get(entry.semesterId)` — entries чужих лет просто не
  находят таргет (B1 закрыт тем же ходом; позиционный defect #2 мёртв);
  дополнительный явный фильтр по `yearSemesters`-множеству + warn на отброшенные;
- `defaultWeeksFor(number)`: 1→18, 2→20, 3+→**вопрос продукту** (§7 п.1);
- `_ind`-ветки — тот же паттерн (`filledFromDist` по `entry.semesterId`,
  fallback-распределение по активным записям массива).

**3.3 `convex/workloads/lib.ts`:** новые сигнатуры, ключ — `semesterId`:

```ts
export function semesterEntry(item: WorkloadItemLike, semesterId: string) { ... }
export function itemsNeedingJournals(items: WorkloadItemLike[], semesterId: string) {
  // фильтр: hoursPerGroup(entry) > 0 || entry.groupCount > 0; _ind исключается;
  // legacy-fallback на плоские поля держим до Фазы 5 (dual-read), под parity-тестами.
}
```

**3.4 C1 — политика orphan-`semesterId`** (запись массива ссылается на
удалённый/чужой семестр): предложение (нужно утверждение, §7 п.2) —
**fail-visible**: orphan-записи НЕ выкидываются из `totalHours` (тихий дрейф
payroll-суммы вниз запрещён), UI показывает их отдельной пометкой
«семестр не найден» read-only, сохранение не блокируется. + юнит-тест: item с
orphan-записью сохраняет свой вклад в total.

**3.5 D2 — wizard:** табы из `academicYearSemesterStore` по году нагрузки
(map по `semesterNumber`), количество = реальное; `selectSemester(semesterId)`
вместо ординала (`WorkloadJournalWizard.vue:23,30,378`); `plannedHours` =
`hoursPerGroup(entry)` через ЕДИНЫЙ хелпер (сохранить дробность — фикс #11).

**3.6 D1 — `createJournalsFromWorkloadGroups`:** аргумент
`semester: v.number()` → `semesterId: v.id("academicYearSemesters")` (wizard
теперь его знает). Уходит startDate-сортировка (`mutations.ts:100-108`) —
резолв не нужен вовсе, `ctx.db.get(semesterId)`. Трекинг
`journalsCreatedSemesters`: остаётся `number[]`, но номер берётся каноном —
джойн `semesterDefinitionId → number`. На проде значения (1,2) идентичны при
обоих способах → **рекей данных не нужен**; верификация в ранбуке (§5). Бейджи
UI (`WorkloadManagement.vue:331-332`) не меняются.

**3.7 Экспорт → XLSX (exceljs, решение v3 подтверждено):**
`src/lib/workloadCsv.ts` умирает; новый `src/lib/workloadXlsx.ts` — билдер
**матрицы** (заголовки динамически по семестрам года: `Недели {n}`… для каждого
`number`), тонкая обёртка exceljs в `.vue`. Прецедент API — `convex/excel/lib/workloadExport.ts`.
Судьба `_ind`-строки в выгрузке — продукт-вопрос (§7 п.3).
Тесты — на матрицу, не на Blob.

**3.8 Шаблон `.vue`:** цикл колонок — по отсортированным семестрам года
(`v-for="ref in yearSemesterRefs"`), биндинги:
`v-model.number="entryFor(item, ref.semesterId).weeks"` (или `@change` с
`Number(...)` — для часов сохранить `@change`-семантику фикса 3б!), «На группу» —
`{{ formatHours(hoursPerGroup(entryFor(item, ref.semesterId))) }}`. `adjustValue`
→ `adjustSemesterValue(id, semesterId, field: "weeks"|"hours"|"groupCount", delta)`.
Попап `:540` → перечисление `item.semesters` по number. Colspan-формулы
(`:244`, `:257`) не меняются (semesterCount тот же).
Reactivity: мутировать свойства существующих entry-объектов
(`entry.weeks = x`), не пересоздавать массив на каждый инпут; `:key` схему
(`item.id + i`) сохранить с заменой `i` → `ref.semesterId`.

**3.9 Dual-write:** `recalculateItem` после пересчёта массива зовёт
`syncFlatFieldsFromSemesters` — плоские поля остаются валидными для (а) ещё не
задеплоенных читателей, (б) отката Фазы 3 (старый фронт прочитает плоские и
увидит те же числа). `save` шлёт оба представления.

Rollback Фазы 3: revert PR — плоские поля актуальны благодаря dual-write;
массив у новых записей корректен (бэкфилл идемпотентен — не перетирает).
Единственный необратимый компонент — `createJournalsFromWorkloadGroups` меняет
сигнатуру: старый фронт после revert должен вернуть и старую мутацию (Convex
деплоит их вместе — revert атомарен).

**QA-сценарий фазы (из v3 §6, обязателен):** сгенерировать журналы для
конкретной нагрузки ДО и ПОСЛЕ деплоя фазы, сравнить `plannedHours`/составы —
идемпотентный wipe+recreate не должен изменить числа.

### Фаза 4 — Компиляторный gate

Убрать index-сигнатуру из `WorkloadItem` (`src/types/workload.ts:37`) и всё,
что покраснеет, добить. Отдельно грепнуть `as any` вокруг wizard-вызовов
(`WorkloadJournalWizard.vue:382,395,399` — `item as any`, `sem as any` должны
исчезнуть вместе с новыми сигнатурами lib). Поведение не меняется. Rollback —
revert.

### Фаза 5 — Contract (необратимая; только после ≥1 стабильного релизного цикла Фаз 3-4)

Порядок жёсткий — Convex-валидатор отвергнет документы с лишними полями,
поэтому чистка данных идёт ДО сужения схемы:

- **5a.** Схема: 24 плоских поля → все `v.optional(...)`; фронт уже не пишет их
  (снять `syncFlatFieldsFromSemesters`, guard `MAX_WORKLOAD_SEMESTERS`
  (`WorkloadManagement.vue:1030-1042`), legacy-ветки `lib.ts`). Deploy.
- **5b.** Миграция `dropFlatSemesterFields` (вторая `migrations.define` в том же
  файле): `{...item, weeks1: undefined, ..., groupCount6: undefined}` (patch с
  явными `undefined` удаляет ключи). Плюс сужения заодно:
  `totalHours` union → `v.number()` (items + top-level; данные проверены в 1c).
- **5c.** Схема: плоские поля удалить совсем, `semesters` → required
  (`v.array(...)` без optional); `MAX_WORKLOAD_SEMESTERS` удалить; удалить
  `WorkloadItemLike`-плоскую форму и `semesterValue`-legacy. Deploy.

Rollback: 5a/5c — редеплой предыдущей схемы (данные ещё совместимы до 5b);
после 5b плоские поля утеряны — восстановление только регенерацией из
`semesters[]` (обратная миграция пишется при необходимости за час, формулы
детерминированы). Поэтому 5b — точка невозврата, гейт — §7 п.7.

---

## §5. Ранбук по фазам (шаблон = хедер `educationTechnologyBackfill.ts`)

### Фаза 1
```sh
npx convex codegen && npx tsc --noEmit && npm test      # локально зелено
npx convex deploy                                       # widen (optional-поле)
npx convex data workloads --limit 100 --prod            # totalHours top-level: все number? (шаг 1c)
```
Верификация: сохранить нагрузку старым UI — проходит (semesters отсутствует, optional).
Rollback: revert PR + deploy.

### Фаза 2
```sh
# 1. Превью (ничего не пишет):
npx convex run migrations/workloadSemesters:backfillWorkloadSemesters '{"dryRun":true}' --prod
# 2. Прогон:
npx convex run migrations/workloadSemesters:backfillWorkloadSemesters --prod
# 3. Прогресс/статус компонента:
npx convex run --component migrations lib:getStatus --watch --prod
# 4. Верификация глазами (5 записей — тривиально):
npx convex data workloads --limit 100 --prod
#    у каждого items[]: semesters.length == числу заполненных колонок,
#    weeks/hours/groupCount совпадают с weeks{N}/hours{N}/groupCount{N},
#    weeks*hours ≈ hoursPerGroup{N} (drift-warn'ов в логах нет).
# 5. Логи warn'ов:
npx convex logs --prod | grep '\[mig\]'
```
Abort-коды (`DANGLING_ACADEMIC_YEAR`, `DUPLICATE_SEMESTER_NUMBER`,
`UNRESOLVED_SEMESTER_COLUMN`, `HOURS_DERIVATION_DRIFT`) — миграция
останавливается, данные чинятся руками, перезапуск безопасен (идемпотентно).
Rollback: not needed (аддитив); крайний случай — patch `semesters: undefined`.

### Фаза 3
```sh
npm test                                # флипы §6 применены осознанно
npx tsc --noEmit && npx convex codegen
npx convex deploy                       # фронт+бэк атомарно
```
Верификация на проде:
1. Открыть нагрузку, поменять часы, сохранить → `npx convex data workloads` —
   массив И плоские поля синхронны, `totalHours` не изменился от ре-сейва
   нетронутых строк (C1-инвариант).
2. Wizard: `plannedHours` для каждой дисциплины == прежним значениям
   (сравнить с зафиксированным до деплоя дампом).
3. Журналы: перегенерировать один семестр → `journalsCreatedSemesters` не
   изменил прежних значений (D1-верификация), журналы других семестров целы.
4. XLSX скачивается, колонки == семестрам года, суммы сходятся с экраном.
Rollback: revert PR + `npx convex deploy` (dual-write делает откат безопасным).

### Фаза 4
```sh
npx tsc --noEmit && npm test && npx convex deploy
```
Rollback: revert.

### Фаза 5
```sh
# 5a
npx convex deploy                       # плоские поля optional, фронт их не пишет
# смоук: сохранение/журналы/XLSX работают
# 5b — точка невозврата
npx convex run migrations/workloadSemesters:dropFlatSemesterFields '{"dryRun":true}' --prod
npx convex run migrations/workloadSemesters:dropFlatSemesterFields --prod
npx convex run migrations/workloads:totalHoursNarrow --prod    # если 1c нашёл строки
npx convex data workloads --limit 100 --prod   # плоских ключей нет, semesters у всех
# 5c
npx convex deploy                       # required semesters, полей нет
```
Rollback до 5b — редеплой прежней схемы; после 5b — обратная генерация плоских
полей из массива (писать только при инциденте).

---

## §6. Тест-план: что флипается, что добавляется, на какой фазе

### Флипы существующих (все — Фаза 3, осознанно, в том же PR)

`src/lib/__tests__/workloadHours.spec.ts` (25):
- **`:216` «known bug #1 (characterize, don't fix)»** — ГЛАВНЫЙ намеренный флип:
  3-семестровый посев теперь даёт `hoursPerGroup(sem3) = 20` и
  `totalHours = 96` (36+40+20), не 76. Переименовать в «defect #1 fixed:…».
- `:132` «missing (undefined) semester fields → 0» — теряет смысл (записи массива
  всегда явные) → заменить на «семестр без записи в массиве = вклад 0».
- `:124` «'abc' → NaN poisons total» — с number-типами непредставимо через UI;
  тест переносится на границу (input-хендлер коэрсит в число), из recalc-спеки
  удаляется с комментарием.
- `:80,88,102,109` — **rounding-lock инварианты (36 / 102 / 48 / 144) ОБЯЗАНЫ
  выжить без изменения ожидаемых чисел** — только фикстуры перекладываются на
  `semesters[]`. Это контракт payroll-точности.
- `:349` shape-тест: `expectedKeys` в Фазе 3 = плоские + `semesters`
  (dual-write); в Фазе 5 — только массив.
- `:192,238,264,285` (посев, `_ind`-ветки) — фикстуры получают `yearSemesters`
  + `entry.semesterId`; ожидаемые ЧИСЛА не меняются (10/12/по-10 и т.д.).

`src/lib/__tests__/workloadCsv.spec.ts` (26): модуль умирает вместе с
`workloadCsv.ts` → спека заменяется `workloadXlsx.spec.ts`:
- `:114` «2-semester hardcode» — флип по построению: семестр-3 колонки ЕСТЬ
  (тест инвертируется: `toContain("16")`).
- `:133` «_ind inclusion» — судьба зависит от решения §7 п.3.
- `:94,154` «header 13/15 columns» — колонки динамические: `фикс + 4×N`.
- escapeCsvCell-блок (`:48-91`) — удаляется (типизированные ячейки exceljs).

`convex/workloads/__tests__/lib.spec.ts` (16):
- `semesterValue`-блок (`:27-36`) → `semesterEntry(item, semesterId)`;
  «missing third semester → '0'» → «unknown semesterId → undefined/0 + политика C1».
- `itemsNeedingJournals` 4 кейса — те же исходы, ключ = semesterId; на время
  dual-read добавить parity-кейсы (плоские vs массив дают идентичный фильтр).
- `splitIntoGroups`/`filterEligibleStudents` — не трогаются.

### Новые тесты

| Фаза | Тест |
|---|---|
| 2 | Юнит на извлечённый резолвер колонка→semesterId (чистая функция: дубль number → throw; колонка с данными без семестра → throw; нулевая колонка → скип; запятая-десятичная; drift-детект `weeks*hours` vs `hoursPerGroup`). Логику `migrateOne` вынести в чистый модуль, чтобы тестировалось без Convex-харнесса |
| 3 | Сидинг: `distributionEntries` чужого года/семестра ИГНОРИРУЮТСЯ (B1); entries не по порядку цепляются к правильным семестрам (могила defect #2) |
| 3 | Orphan-политика C1: item с записью на несуществующий semesterId — `totalHours` НЕ уменьшается при ре-сейве |
| 3 | Единственность формулы: wizard `plannedHours` === `hoursPerGroup(entry)` === значение в XLSX для одной фикстуры |
| 3 | `syncFlatFieldsFromSemesters`: плоская проекция == массиву (parity, до Фазы 5) |
| 3 | Wizard: количество/значения табов из семестров года; год с 3 семестрами даёт 3 таба (D2) |
| 5 | Удалить parity/legacy-тесты вместе с dual-write |

---

## §7. Go/No-Go — что требует решения человека ДО Фазы 2/3

1. **[Фаза 3, продукт] Дефолтные недели для семестров 3+.** Сидер хардкодит
   18/20 для семестров 1/2. Чем наполнять `weeks` для number ≥ 3?
   (Варианты: 18 для нечётных / 20 для чётных; 0 — заставить заполнить руками;
   вычислять из дат семестра.) Без решения нельзя финализировать
   `defaultWeeksFor()`.
2. **[Фаза 3, продукт+код] Политика orphan-`semesterId` (C1).** Рекомендация в
   §4.3.4 — fail-visible (держать в сумме + пометка в UI). Альтернативы: purge
   с предупреждением; блокировка сохранения. Нужен выбор.
3. **[Фаза 3, продукт] `_ind`-строка в XLSX-выгрузке** — включать отдельной
   строкой или исключать (сейчас в CSV попадает; баг или фича — не решено с v3 §8 Q3).
4. **[Фаза 3, продукт] Смена формата выгрузки `.csv` → `.xlsx`** + динамические
   колонки — согласовать с пользователями (поведенческое изменение).
5. **[Фаза 3, техника] `journalsCreatedSemesters` остаётся `number[]`**
   (номера = `semesterDefinition.number`), рекея на проде нет — подтвердить,
   что храним номера, а не semesterId (обоснование в §4.3.6).
6. **[Фаза 1, техника] `semesters[].semesterId = v.id("academicYearSemesters")`
   СРАЗУ**, без транзиторного `v.string()` — отход от v3 (обоснование §0 п.3).
   Подтвердить.
7. **[Фаза 5, процесс] Гейт точки невозврата (5b):** Фазы 3-4 стабильны в проде
   ≥ 1 релизный цикл, верификации §5-Фаза-3 пройдены, ни одного
   `[mig]`-warn'а не осталось неразобранным. Явное «go» владельца данных.

---

## §8. Открытые технические остатки (не блокируют, зафиксировать)

- `workloads.academicYearId` остаётся `v.string()` — сужение до
  `v.id("academicYears")` вне скоупа (данные чистые, `normalizeId`-гейт в
  бэкфилле); кандидат отдельного микро-PR после Фазы 5.
- `convex/workloads/lib.ts` `WorkloadItemLike` семестров 1-3 vs полный item —
  расхождение умирает вместе с плоской формой в Фазе 5.
- Комментарии на удалённый `docs/migration-playbook.md` — чинятся в Фазе 1b.
- Аудит-дефект #5 (`recalculateItem` затирает точный `_ind`-бюджет при ручном
  редактировании) миграцией НЕ чинится (поведение эквивалентно: пересчёт от
  weeks×hours) — отдельная продуктовая задача, зафиксировать, чтобы не ждали
  от миграции.
