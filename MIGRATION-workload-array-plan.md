# Migration Plan: `workloads.items[].{weeks,hours,hoursPerGroup,groupCount}N` (flat) → `semesters: [{weeks, hours, groupCount}]` (array)

Status: **planning only** — no code changed by this document.
Repo: `mars-2.0` (Vue 3 + Pinia + Convex).

---

## 0. TL;DR

- Тип: `WorkloadItem` хранит семестровые данные как 24 плоских необязательных
  поля (`weeks1..6`, `hours1..6`, `hoursPerGroup1..6`, `groupCount1..6`),
  все строки. Целевая модель — один массив `semesters: {weeks:number,
  hours:number, groupCount:number}[]`, `hoursPerGroup` больше не хранится
  (вычисляется на лету = `weeks*hours`).
- Затронуто 8 файлов кода + 1 тестовый файл, ключевая логика
  сосредоточена в **одном** компоненте — `src/pages/WorkloadManagement.vue`
  (~45 сайтов чтения/записи).
- Рекомендуемая стратегия: **дуал-write / strangler**, НЕ big-bang
  (см. §3 «Почему»).
- Бэкенд migration idiom этого репо: `convex/migration/actions.ts`
  (internalMutation + public action wrapper) + файл-указатель в
  `convex/migrations/YYYYMMDD_HHMMSS_name.txt`, исполняемый
  `scripts/run-migrations.sh` (см. `docs/MIGRATIONS.md`).
- Характеризационных тестов на сегодня **ноль** для
  `WorkloadManagement.vue` (только `convex/workloads/__tests__/lib.spec.ts`
  покрывает `lib.ts`). Их нужно написать до рефакторинга.

---

## 1. Инвентарь (файл : строки — роль)

### 1.1 Schema / Validator (Convex)

| File:Line | Role |
|---|---|
| `convex/schema/workloadItem.ts:1-72` | `workloadItemValidator` — источник истины формы `WorkloadItem` на бэкенде. Определяет 24 плоских поля + `MAX_WORKLOAD_SEMESTERS = 6` (комментарий в файле уже явно называет текущую форму "known limitation — the proper model is a per-semester array", т.е. миграция была предвидена). |
| `convex/schema.ts:998-1013` | `workloads: defineTable({..., items: v.array(workloadItemValidator), ...})` — таблица, использующая тот же валидатор. |

### 1.2 Mutation (Convex)

| File:Line | Role |
|---|---|
| `convex/workloads/mutations.ts:10-37` | `save` — принимает `items: v.array(workloadItemValidator)`, пишет как есть (insert/patch), никакой трансформации полей внутри. Только форма валидатора требует правки. |
| `convex/workloads/mutations.ts:61-190+` | `createJournalsFromWorkloadGroups` — сам НЕ читает weeks/hours/groupCount напрямую с item (работает с `workload`, `semesterRecord`, `args.groups`), но **вызывающий код** (`itemsNeedingJournals`/`semesterValue`, см. §1.3) формирует `groups` payload на основе плоских полей до вызова этой мутации. |

### 1.3 Pure helpers (Convex, testable без харнеса)

| File:Line | Role |
|---|---|
| `convex/workloads/lib.ts:10-31` | `WorkloadItemLike` — облегчённый дубликат формы (только семестры 1-3!) для helpers. Уже расходится с полным `WorkloadItem` (нет 4-6). |
| `convex/workloads/lib.ts:33-45` | `SemesterField` type + `semesterValue(item, semester, base)` — читает `` `${base}${semester}` `` через приведение к `keyof WorkloadItemLike`. Это единственное официально типизированное "динамическое" чтение плоских полей в кодовой базе (в отличие от Vue-шаблона, который просто полагается на index signature). |
| `convex/workloads/lib.ts:51-62` | `itemsNeedingJournals(items, semester)` — фильтрует диспциплины, у которых `hoursPerGroup{sem}>0 \|\| groupCount{sem}>0`; исключает `_ind` строки. |
| `convex/workloads/lib.ts:64-71` | `splitIntoGroups` — не завязан на плоские поля, не трогать. |
| `convex/workloads/__tests__/lib.spec.ts` | Единственные существующие тесты, бьющие по плоским полям (`semesterValue`, `itemsNeedingJournals`). Их фикстуры (`item()`) должны быть обновлены/задублированы при миграции `lib.ts` на массив. |

### 1.4 Frontend types

| File:Line | Role |
|---|---|
| `src/types/workload.ts:1-38` | `WorkloadItem` interface — 24 плоских поля + `[key: string]: string \| string[] \| undefined` индекс-сигнатура. **Эта сигнатура — то, что сейчас маскирует все динамические обращения `item[\`weeks${i}\`]` от TypeScript.** Если убрать плоские поля и превратить `semesters` в массив, эта сигнатура должна исчезнуть — и именно тогда все несовместимые сайты подсветятся компилятором (это наш «список работ» для §1.5). |
| `src/types/workload.ts:40-52` | `SavedWorkload` — обёртка, `items: WorkloadItem[]`, не содержит плоских полей сама, не требует изменений кроме типа `items`. |

### 1.5 Главная страница (наибольшая концентрация сайтов)

`src/pages/WorkloadManagement.vue` (1323 строки). Все находки:

**Шапка таблицы / рендер сетки (шаблон), строки 67-224:**
- L67-70: `:colspan="semesterCount"` × 4 заголовка колонок (Недели/Часы/НаГруппу/Группы).
- L75,78,81,84: `v-for="i in semesterCount"` для номеров подколонок (только для :key, декоративные — не читают item).
- L153-172: **Недели** — `v-model="item[\`weeks${i}\`]"`, кнопки `-`/`+` через `adjustValue(item.id, \`weeks${i}\`, ±1)`, `@input="recalculateItem(item.id)"`.
- L175-195: **Часы** — `:value="formatHours(item[\`hours${i}\`])"`, `@input="item[\`hours${i}\`] = ...; recalculateItem(item.id)"`, кнопки `-`/`+`.
- L198-202: **Часы на группу** (read-only, computed) — `{{ formatHours(item[\`hoursPerGroup${i}\`]) }}`.
- L205-224: **Количество групп** — `v-model="item[\`groupCount${i}\`]"`, кнопки `-`/`+`.
- L244: `:colspan="6 + semesterCount * 4"` (empty-state row span, зависит от кол-ва плоских колонок на семестр).
- L257: `:colspan="4 + semesterCount * 4"` (footer row span, тот же паттерн).

**Скрипт — состояние/вычисления:**
- L706: `import { MAX_WORKLOAD_SEMESTERS } from "@convex/schema/workloadItem";`
- L776-779: `semesterCount` computed — количество семестров активного учебного года (НЕ завязан на плоские поля, останется как есть, но перестанет требовать guard на MAX, см. §5).
- L981-1090: `addSubjectFromRup(rup, opts)` — **сеятель.** Строит `newItem` литералом с явными `weeks1/weeks2/hours1/hours2/hoursPerGroup1/2/groupCount1/2`; затем `rup.distributionEntries.forEach` пишет `newItem[\`hoursPerGroup${semNum}\`]` и `newItem[\`hours${semNum}\`]` для semNum ≤ semesterCount (L1008-1015). Аналогичный паттерн повторяется для парной строки `_ind` (individual hours), L1022-1089, включая **fallback**-ветку (нет per-semester individualHours → равномерно распределить `individualAdditionalHours`/`individualHours` по активным семестрам). **Известный баг здесь:** `weeks3..6/hoursN../groupCountN..` для N≥3 никогда явно инициализируются литералом (только 1 и 2 заданы), из-за чего семестр 3+ обнуляется, если `distributionEntries` их не заполняет — см. §6 defect #1.
- L1096-1112: `recalculateItem(id)` — цикл `for (let i=1; i<=semesterCount; i++)`, читает `item[\`weeks${i}\`]`, `item[\`hours${i}\`]`, `item[\`groupCount${i}\`]`, считает `hoursPerGroup = weeks*hours`, пишет `item[\`hoursPerGroup${i}\`]`, суммирует `total += hoursPerGroup*groupCount`, пишет `item.totalHours = Math.round(total).toString()`. **Это единственное место, где рассчитывается погрупповая и суммарная нагрузка — самое чувствительное к регрессии место (недавний rounding fix живёт именно тут: `Math.round(total)` на суммарном total, а не на промежуточных hoursPerGroup — сохранить порядок округления).**
- L1114-1120: `adjustValue(id, field, delta)` — принимает произвольное строковое имя поля (`` `weeks${i}` ``/`` `hours${i}` ``/`` `groupCount${i}` ``), инкрементирует/декрементирует через `parseFloat`, затем `recalculateItem`.
- L1122-1128: `deleteItem(id)` — каскадно удаляет парную `_ind`-строку по `id + "_ind"` (не завязано на плоские поля, не трогать).
- L1157-1163: `handleSaveWorkload` формирует `SavedWorkload.items = currentWorkloadItems.value` как есть — сериализуется весь плоский объект в mutation `save`.
- L1150-1155: **Guard**: если `semesterCount.value > MAX_WORKLOAD_SEMESTERS`, алерт и отказ от сохранения — это костыль под лимит плоских полей, при переходе на массив становится не нужен (массив не имеет фиксированного потолка длины).
- L1206-1236: `downloadWorkload(workload)` — экспорт одной нагрузки в CSV. Заголовки жёстко: `['Недели 1','Недели 2','Часы 1','Часы 2','На группу 1','На группу 2','Группы 1','Группы 2', ...]`; строки читают `item.weeks1, item.weeks2, item.hours1, item.hours2, item.hoursPerGroup1, item.hoursPerGroup2, item.groupCount1, item.groupCount2`. **Жёстко ограничено семестрами 1-2** (уже баг — семестр 3+ не попадает в CSV вообще). ⚠️ Согласно заданию, в этой зоне сейчас идёт параллельная правка — якориться на имени функции `downloadWorkload`, а не на номерах строк.
- L1241-1264: `downloadAllWorkloads()` — тот же паттерн для сводного CSV по всем сохранённым нагрузкам (`filteredWorkloads`). Тоже семестры 1-2 захардкожены. ⚠️ Аналогично — якориться на имени функции `downloadAllWorkloads`.

### 1.6 Wizard (генерация журналов из нагрузки)

| File:Line | Role |
|---|---|
| `src/components/Workload/WorkloadJournalWizard.vue:276` | `import { itemsNeedingJournals, semesterValue } from "@convex/workloads/lib";` |
| `src/components/Workload/WorkloadJournalWizard.vue:359-383` | `selectSemester(sem)` — строит `disciplines.value` через `itemsNeedingJournals(wl.items, sem)`, затем на каждый item читает `semesterValue(item, sem, "groupCount")` и `semesterValue(item, sem, "hoursPerGroup")` → `groupCount`, `plannedHours`. `plannedHours` **затем используется как источник истины** для клиентской валидации "запланированные часы вписываются в расписание группы" (комментарий в mutations.ts L53-54 подтверждает: "validated client-side: scheduled hours == planned hoursPerGroup"). Это делает wizard зависимым и от формы данных, и от смысла `hoursPerGroup` (после миграции — производная величина `weeks*hours`, а не хранимое поле; логика валидации должна получать то же число, просто из другого источника). |

### 1.7 Store (Pinia)

| File:Line | Role |
|---|---|
| `src/stores/workloadStore.ts:1-146` | Не читает отдельные плоские поля напрямую — прокидывает `SavedWorkload`/`WorkloadItem` целиком в/из Convex (`saveWorkload`, `allWorkloads` computed маппинг, `generateJournalGroups`). Требует только обновления типов (транзитивно через `WorkloadItem`), логики внутри менять не нужно. |

### 1.8 Не затронуто (проверено и исключено)

- `src/services/teacher-workload-calculator.ts` — использует слово "hours", но это про фактически отработанные часы по журналам/меткам (другая доменная модель, календарные события), не про плоские `weeks{N}` поля нагрузки. **Не трогать.**
- `src/lib/excel/workloadExport.types.ts` — нет обращений к `weeks/hours/groupCount`. **Не трогать.**
- `src/pages/suspense/WorkloadManagementPage.vue` — обёртка/route-guard, не проверялась на прямые обращения (грep не дал совпадений по паттернам полей) — считать нетронутым, перепроверить при реализации если появится редактирование item.

---

## 2. Тип-слой: что ломается при переходе на массив

Текущее:
```ts
export interface WorkloadItem {
  ...
  weeks1: string; weeks2: string; weeks3?: string; ... weeks6?: string;
  hours1: string; ... hours6?: string;
  hoursPerGroup1: string; ... hoursPerGroup6?: string;
  groupCount1: string; ... groupCount6?: string;
  totalHours: string;
  ...
  [key: string]: string | string[] | undefined;   // ← маскирует ВСЁ
}
```

Целевое (пример):
```ts
export interface WorkloadSemesterEntry {
  weeks: number;
  hours: number;
  groupCount: number;
}

export interface WorkloadItem {
  id: string;
  subjectId: string;
  department: string;
  course: string;
  studentCount: string;
  semesters: WorkloadSemesterEntry[];   // index 0 = семестр 1
  totalHours: string;                   // остаётся string (совместимость с остальным UI) либо тоже number — решить в фазе типов
  teacherName?: string;
  index?: string;
  description?: string;
  language?: string;
  specialtyIds?: string[];
  // NO index signature — намеренно, чтобы компилятор подсветил все динамические доступы
}
```

Убирание `[key: string]: ...` — это диагностический инструмент: как только его снять
(после того как схема поменяется на массив), `tsc` покажет каждое место
`item[\`weeks${i}\`]`, `item[\`hours${i}\`]`, `item[\`hoursPerGroup${i}\`]`,
`item[\`groupCount${i}\`]`, `newItem[...]`, `indItem[...]`, `item[field]` (в
`adjustValue`) как ошибку компиляции — это самый надёжный способ не
пропустить сайт вручную, надёжнее grep. **План (§3) должен явно включать
шаг «снять index signature и починить всё, что покраснело» как gate перед
мержем.**

`hoursPerGroup` перестаёт быть полем — везде, где сейчас читается
`item[\`hoursPerGroup${i}\`]` (шаблон L200, `itemsNeedingJournals`/
`semesterValue` в `lib.ts`, wizard L377, CSV-экспорт), нужно заменить на
вычисление `weeks*hours` на лету (helper `hoursPerGroup(entry)` или
`entry.weeks * entry.hours`).

`weeks`/`hours`/`groupCount` меняют тип с `string` на `number` — все места
с `parseFloat(item[...])`/`.toString()` упрощаются, но `v-model.number` или
явный `Number(...)` нужен в input-биндингах, иначе Vue положит строку в
number-поле.

---

## 3. Фазовый план

### Рекомендация: дуал-write / strangler-fig, НЕ big-bang

**Почему не big-bang:** таблица `workloads` — живые пользовательские данные
(нагрузки преподавателей на текущий учебный год), а `WorkloadManagement.vue`
— единственный UI поверх них, без feature-flag и без staging-окружения,
упомянутого в репо. Big-bang требует одновременно: (a) сменить схему, (b)
смигрировать все существующие записи, (c) переписать ~10 сайтов во view, (d)
переписать `lib.ts` + wizard — всё за один недеплоящийся шаг. Если
где-то (например, в CSV-экспорте, который прямо сейчас параллельно
правится другим PR) останется забытая ссылка на `item.weeks1`, TS всё
поймает ТОЛЬКО если убрать index signature ПЕРЕД рефакторингом реализации
— иначе рантайм ошибка `undefined` тихо всплывёт в проде без компилятора,
предупредившего заранее. Поэтапный dual-write даёт откат на каждом шаге и
позволяет проверить `recalculateItem`/`itemsNeedingJournals` на реальных
данных до необратимого drop.

**Фазы (каждая — отдельный самодостаточный деплой):**

**Фаза 0 — Characterization tests (см. §5).**
Зафиксировать текущее поведение `recalculateItem`, seeding в
`addSubjectFromRup` (включая `_ind` fallback), `itemsNeedingJournals`,
CSV-экспорт shape, save payload shape. Без реализации — только тесты,
которые сейчас проходят. Это gate перед любым кодом ниже.

**Фаза 1 — Schema: добавить `semesters` рядом с плоскими полями (аддитивно).**
- `convex/schema/workloadItem.ts`: добавить
  `semesters: v.optional(v.array(v.object({ weeks: v.number(), hours: v.number(), groupCount: v.number() })))`
  как optional-поле, плоские поля временно остаются как есть (не трогать
  валидатор для существующих 24 полей).
- `convex/workloads/mutations.ts` `save`: без изменений логики (уже
  принимает произвольную форму validator'а).
- Independently shippable: да — новое поле optional, старые записи и старый
  UI продолжают работать нетронутыми.

**Фаза 2 — Backfill migration (см. §4 за скриптом).**
- Написать `convex/migration/actions.ts` функцию, которая для каждой
  `workloads` записи проходит по `items[]`, строит `semesters[]` из
  `weeks{N}/hours{N}/groupCount{N}` (без `hoursPerGroup` — не переносится,
  он производный), останавливаясь на последнем присутствующем номере
  семестра, парсит `string→number` с явной обработкой `''`/`undefined`/
  нечисловых значений → `0` + `console.warn` для аудита. Патчит запись,
  добавляя `semesters` к каждому item, **оставляя плоские поля нетронутыми**
  (dual state).
- Зарегистрировать в `convex/migrations/YYYYMMDD_HHMMSS_backfill_workload_semesters.txt`.
- Independently shippable: да, аддитивный патч, идемпотентен (пропускать
  items, где `semesters` уже есть).

**Фаза 3 — Мигрировать читателей на `semesters[]`, писать в оба места (dual-write).**
- `src/types/workload.ts`: добавить `semesters: WorkloadSemesterEntry[]` в
  `WorkloadItem`, плоские поля оставить `optional` (уже описаны как
  required/optional — сделать все `optional`, чтобы не блокировать TS при
  постепенном переходе), **пока не убирать index signature**.
- `src/pages/WorkloadManagement.vue`:
  - `recalculateItem`, `addSubjectFromRup`, `adjustValue`, шаблон
    (weeks/hours/groupCount колонки) — переключить на `item.semesters[i-1]`,
    но при записи **также** синхронно писать плоские поля (`item[\`weeks${i}\`] = ...`)
    ради обратной совместимости с ещё не переписанными потребителями
    (CSV-экспорт, wizard) в течение переходного периода.
  - Проще и безопаснее: сделать `recalculateItem` источником истины,
    вычисляющим `semesters[]`, и одной функцией `syncFlatFieldsFromSemesters(item)`
    генерировать плоские поля из массива для legacy-читателей — так логика
    расчёта не дублируется в двух представлениях.
- `convex/workloads/lib.ts`: добавить новые версии `semesterValue`/
  `itemsNeedingJournals`, принимающие `semesters[]`-форму (или
  перегрузить/сделать полиморфными: если `item.semesters` есть — читать
  оттуда, иначе fallback на плоские поля). Обновить
  `convex/workloads/__tests__/lib.spec.ts` добавив параллельные кейсы под
  массив (не удаляя старые, пока dual-write жив).
- `WorkloadJournalWizard.vue`: переключить `selectSemester` на новую
  сигнатуру `lib.ts`.
- CSV-экспорт (`downloadWorkload`, `downloadAllWorkloads`): переписать цикл
  по семестрам динамически (`item.semesters.length` вместо хардкода 1-2) —
  это заодно чинит существующий баг «семестр 3+ не экспортируется» (см.
  §6). ⚠️ Синхронизировать с параллельным PR, трогающим эту зону — сделать
  как отдельный маленький коммит поверх актуального `main`, ре-базируясь
  перед мержем.
- Independently shippable: да — старые записи, у которых `semesters`
  бэкфиллены в Фазе 2, читаются корректно; новые записи получают оба
  представления.

**Фаза 4 — Снять index signature, включить компилятор как gate.**
- Убрать `[key: string]: string | string[] | undefined` из `WorkloadItem`.
- Исправить всё, что покраснеет (должно быть немного, если Фаза 3 сделана
  полно) — финальная проверка полноты миграции чтения.
- Independently shippable: да, чисто типовое изменение + правки компиляции,
  поведение не меняется (плоские поля ещё реально пишутся).

**Фаза 5 — Drop плоских полей.**
- `convex/schema/workloadItem.ts`: удалить 24 плоских поля из
  `workloadItemValidator`, оставить `semesters` required.
  Убрать/пересчитать `MAX_WORKLOAD_SEMESTERS` (константа теряет смысл —
  массив не ограничен; можно оставить как soft-limit для UI-предупреждений
  если нужно, но убрать hard guard).
- `src/pages/WorkloadManagement.vue`: убрать `syncFlatFieldsFromSemesters`,
  убрать guard `semesterCount > MAX_WORKLOAD_SEMESTERS` (L1150-1155) —
  массив снимает ограничение по построению.
- `convex/workloads/lib.ts`: удалить legacy-ветки/`WorkloadItemLike`
  плоскую форму, оставить только `semesters[]`-путь.
- Написать **вторую** миграцию, которая **убирает** плоские поля из
  существующих записей БД (`ctx.db.patch(id, {weeks1: undefined, ...})` —
  Convex позволяет явно `undefined` для optional полей чтобы удалить ключ;
  если поля станут required→removed в схеме, Convex потребует, чтобы
  данные уже не содержали лишних необязательных ключей только если валидатор
  `v.object` строгий — на практике Convex validator не отклоняет лишние
  поля в документе автоматически при patch/insert без явного strict-режима,
  но чище явно вычистить старые ключи, чтобы не копить мёртвые данные).
- Independently shippable: да, но это **последний**, необратимый шаг — делать
  только после подтверждения, что все читатели (Фаза 3-4) в проде стабильны
  минимум один релизный цикл.

---

## 4. Скетч скрипта миграции данных (репо-идиома)

Идиома репозитория (см. `docs/MIGRATIONS.md`, `convex/migration/actions.ts`,
`convex/migration/backfillSemesterId.ts` как образец backfill-паттерна):
внутренняя мутация делает работу + публичный `action`-обёртка для CLI +
файл-указатель в `convex/migrations/*.txt`.

```ts
// convex/migration/actions.ts (добавить)

const MAX_LEGACY_SEMESTERS = 6; // соответствует текущему MAX_WORKLOAD_SEMESTERS

function parseNumberField(raw: string | undefined): number {
  if (raw === undefined || raw === "") return 0;
  const n = parseFloat(raw);
  return Number.isFinite(n) ? n : 0; // 'abc' → NaN → 0, с логом ниже
}

export const backfillWorkloadSemestersInternal = internalMutation({
  args: {},
  handler: async (ctx) => {
    const workloads = await ctx.db.query("workloads").collect();
    let updatedWorkloads = 0;
    let updatedItems = 0;
    let warnings = 0;

    for (const wl of workloads) {
      let changed = false;
      const newItems = wl.items.map((item: any) => {
        if (item.semesters) return item; // идемпотентность

        const semesters: { weeks: number; hours: number; groupCount: number }[] = [];
        for (let i = 1; i <= MAX_LEGACY_SEMESTERS; i++) {
          const weeksRaw = item[`weeks${i}`];
          const hoursRaw = item[`hours${i}`];
          const groupCountRaw = item[`groupCount${i}`];
          // Семестры 1-2 required в старой схеме — если оба undefined,
          // это конец реально заполненных семестров у этого item.
          if (weeksRaw === undefined && hoursRaw === undefined && groupCountRaw === undefined) {
            break; // остановиться на последнем присутствующем семестре
          }
          if (isNaN(parseFloat(weeksRaw ?? "")) && weeksRaw !== undefined) warnings++;
          semesters.push({
            weeks: parseNumberField(weeksRaw),
            hours: parseNumberField(hoursRaw),
            groupCount: parseNumberField(groupCountRaw),
          });
        }
        changed = true;
        updatedItems++;
        return { ...item, semesters };
      });

      if (changed) {
        await ctx.db.patch(wl._id, { items: newItems });
        updatedWorkloads++;
      }
    }

    console.log(
      `[Migration] backfillWorkloadSemesters: ${updatedWorkloads} workloads, ${updatedItems} items, ${warnings} unparsable numeric fields defaulted to 0`
    );
    return { updatedWorkloads, updatedItems, warnings };
  },
});

export const backfillWorkloadSemesters = action({
  args: {},
  handler: async (ctx) => {
    const result = await ctx.runMutation(
      internal.migration.actions.backfillWorkloadSemestersInternal,
      {}
    );
    console.log(`[Migration] backfillWorkloadSemesters done: ${JSON.stringify(result)}`);
    return result;
  },
});
```

```bash
echo "migration/actions:backfillWorkloadSemesters" > \
  convex/migrations/20260722_120000_backfill_workload_semesters.txt
```

Для Фазы 5 (drop) — зеркальный скрипт `dropLegacyWorkloadFields`, который
`ctx.db.patch(item.., {weeks1: undefined, ..., groupCount6: undefined})`
на каждом item (или полностью пересобирает `items` без этих ключей) —
регистрируется вторым `.txt` файлом с более поздним таймстампом.

**Замечание по объёму данных:** количество существующих `workloads` записей
не определено этим READ-ONLY исследованием (нужен реальный доступ к
Convex dev/prod dashboard или `npx convex data workloads` чтобы посчитать
точно) — миграция написана как full-table scan (`ctx.db.query("workloads").collect()`),
что нормально при объёме таблицы в разумных пределах (десятки-сотни
записей, судя по природе фичи — по одной записи на преподавателя на
учебный год); если таблица окажется на порядки больше, потребуется
курсорная пагинация (`.paginate`) — проверить перед запуском в проде.

---

## 5. Характеризационные тесты (написать ПЕРВЫМИ, Фаза 0)

Сейчас тестов на `WorkloadManagement.vue` нет вообще. Предлагаемый набор
(Vitest + `@vue/test-utils`, либо чистые unit-тесты извлечённой логики
если `recalculateItem`/`addSubjectFromRup` вынести в testable helper перед
рефакторингом — рекомендуется сделать это извлечение как часть Фазы 0,
раз тестов сейчас нет вообще):

1. **`recalculateItem` — базовая арифметика.**
   `weeks=18, hours=2, groupCount=1` → `hoursPerGroup=36`, `totalHours=36`
   (округление сохраняется — Math.round применяется к **сумме**, не к
   промежуточным `hoursPerGroup`).
2. **`recalculateItem` — несколько семестров + несколько групп.**
   Sem1: weeks=18,hours=2,groupCount=2 (=72); Sem2: weeks=20,hours=1.5,
   groupCount=1 (=30) → `totalHours = Math.round(72+30) = 102`.
3. **`recalculateItem` — дробные часы округляются только на total, не по
   пути.** Например hours=1.5 у обоих семестров с groupCount, дающим
   нецелый hoursPerGroup — убедиться что промежуточные hoursPerGroup
   хранятся НЕ округлёнными (строка/число с дробью), а `totalHours`
   округляется один раз в конце. Это фиксирует недавний rounding fix.
4. **`recalculateItem` — пустые/невалидные поля.** `weeks=''` или
   `undefined` → трактуется как 0, не крашится.
5. **`addSubjectFromRup` — базовый сеятель без individual.**
   Проверить, что `newItem.weeks1/weeks2` = "18"/"20" по умолчанию, и что
   `distributionEntries` корректно проставляют `hoursPerGroup{N}` и
   `hours{N} = hoursPerGroup{N}/weeks{N}` для N ≤ semesterCount.
6. **`addSubjectFromRup` — regression на defect #1 (semester 3+ никогда не
   инициализируется).** Для RUP с `distributionEntries.length === 3` и
   `semesterCount === 3`, проверить текущее (баговое) поведение: weeks3/
   hours3/groupCount3 отсутствуют в `newItem` до записи `distributionEntries`
   forEach (только `hoursPerGroup3`/`hours3` пишутся, `weeks3`/`groupCount3`
   — нет) → зафиксировать как явный "known bug, characterized" тест,
   помечен как ожидаемо исчезающий после миграции на массив (см. §6).
7. **`addSubjectFromRup` — `_ind` парная строка, filledFromDist=true ветка.**
   RUP с `distributionEntries[i].individualHours > 0` → `indItem` получает
   `hoursPerGroup{N}`, `groupCount{N}='1'`, `hours{N}` пропорционально.
8. **`addSubjectFromRup` — `_ind` fallback ветка (нет per-semester
   individualHours, есть `individualAdditionalHours`/`individualHours`
   верхнеуровневые).** Равномерное распределение по "активным" семестрам
   (у которых `entry.hours>0`); если таких нет — распределение по ВСЕМ
   `semesterCount` семестрам.
9. **`itemsNeedingJournals` (уже есть в `lib.spec.ts`, но добавить
   parity-тест под будущий `semesters[]`-путь)** — те же 4 текущих кейса
   (positive hoursPerGroup / zero hours+positive groups / оба ноль / `_ind`
   исключается), продублированные на новую сигнатуру, чтобы обе формы
   давали идентичный результат в переходный период Фазы 3.
10. **`semesterValue` parity** — старая (плоские поля) и новая (`semesters[]`)
    реализация должны возвращать одинаковый результат для одних и тех же
    логических данных на семестрах 1-3 и на несуществующем семестре (must
    default to 0/'0').
11. **Save payload shape.** `handleSaveWorkload` формирует `SavedWorkload`
    с `items` = точная копия `currentWorkloadItems.value` (без мутаций) —
    snapshot-тест текущей плоской формы перед миграцией, чтобы поймать
    случайное изменение форм полей в процессе рефакторинга.
12. **CSV export column count / values.** `downloadWorkload` на фикстуре с
    3 заполненными семестрами — характеризовать ТЕКУЩИЙ (баговый) вывод,
    который сейчас включает только семестры 1-2 (см. §6), чтобы явно
    видеть, что после миграции число колонок меняется по дизайну, а не
    случайно.
13. **`WorkloadJournalWizard.selectSemester` → `plannedHours`/`groupCount`
    parity** между семестрами 1 и 2 на фикстуре с явным hoursPerGroup/
    groupCount (mock `props.workload`).

---

## 6. Риски и связанные баги

**Что чинит миграция (не регрессировать по пути назад):**
- **Defect #1**: `weeks3`/`groupCount3` (и 4-6) никогда явно
  инициализируются литералом в `addSubjectFromRup` — если
  `distributionEntries` короче `semesterCount`, семестр 3+ безмолвно
  обнуляется/остаётся `undefined`, и `recalculateItem` трактует его как 0
  (`parseFloat(undefined || '0')`). Массив `semesters[]`, построенный из
  единого источника (например, всегда `Array.from({length: semesterCount})`
  с явными нулями по умолчанию), структурно устраняет этот класс бага.
- **CSV-экспорт хардкод на семестры 1-2** (`downloadWorkload`,
  `downloadAllWorkloads`) — семестр 3+ никогда не попадал в выгрузку.
  Динамический цикл по `item.semesters.length` чинит это заодно —
  явно упомянуть в PR description как поведенческое изменение (может
  удивить пользователей, ожидающих старый CSV shape — согласовать с
  продуктом/пользователем перед мержем финальной фазы).

**Что нужно НЕ регрессировать:**
- **Rounding fix**: `totalHours = Math.round(total)` применяется к сумме
  ПОСЛЕ накопления по всем семестрам и группам, а не к каждому
  промежуточному `hoursPerGroup` — если рефакторинг случайно начнёт
  округлять `weeks*hours` до `hoursPerGroup` перед суммированием, это
  тихо испортит точность (мелкие расхождения на дробных `hours`, например
  `hours=1.5`). Тест #3 в §5 существует именно для этого.

**Reactivity/Vue-специфичные риски:**
- `item.semesters[i]` — прямое присваивание по индексу массива (`item.semesters[0] = {...}`)
  реактивно в Vue 3 (Proxy-based reactivity не имеет ограничений Vue 2 на
  `arr[index]=`), НО замена **целого** объекта элемента (`item.semesters[0].weeks = x`)
  vs пересоздание всего массива — предпочесть мутацию свойств вложенного
  объекта (`item.semesters[i-1].weeks = newVal`), не пересборку массива на
  каждый инпут, иначе `v-for` по `item.semesters` может терять
  identity/perf на больших списках. С `:key` завязанным сейчас на `item.id + i`
  (не на сам объект семестра) — сохранить эту схему ключей, она уже
  корректна и для массива.
- `v-model="item.semesters[i-1].weeks"` работает нативно в Vue 3 template
  compiler (index-доступ во `v-model`-выражении поддерживается), не
  требует обходных путей.
- Числовой тип: input `type="number"` с `v-model` без `.number` модификатора
  кладёт **строку**. Так как целевая схема — `number`, нужно либо
  `v-model.number="item.semesters[i-1].weeks"`, либо ручной
  `Number((e.target as HTMLInputElement).value)` в `@input` (как уже
  делается для `hours` через явный `@input`-обработчик, L186) — унифицировать
  подход на все три поля семестра.

**String→number edge cases (backfill, §4):**
- `''` (пустая строка) → 0.
- `undefined` (семестр не заполнен) → сигнал остановиться (не 0-заполнение
  для отсутствующего "хвоста" семестров, а полное отсутствие записи в
  массиве — иначе массив будет искусственно длиннее, чем реально
  использовалось).
- Нечисловая строка (`'abc'`, случайный юзер-инпут, если такой когда-то
  проскочил валидацию) → `NaN` → трактовать как 0, залогировать
  предупреждение с `workload._id` + `item.id` для последующего аудита
  (не блокировать миграцию целиком из-за одной плохой записи).
- Числа с запятой вместо точки (казахстанская локаль) — `parseFloat("18,5")`
  вернёт `18` (обрежет на запятой), не `18.5` — проверить, встречается ли
  такое в реальных данных перед прод-запуском (потенциальный источник
  тихой потери точности; если да — добавить `.replace(',', '.')` перед
  `parseFloat` в скрипте миграции).

**Journals/wizard coupling:**
- `WorkloadJournalWizard.plannedHours` — используется как источник истины
  для клиентской валидации "расписание группы = запланированные часы"
  (см. mutations.ts комментарий L53-54). Если `hoursPerGroup` перестаёт
  быть хранимым полем и становится `weeks*hours`, **любое расхождение в
  порядке округления** между `recalculateItem` (пишущим старое
  `hoursPerGroup`) и новым вычислением на лету в wizard-е сломает эту
  валидацию незаметно (числа "почти совпадают", но не точно) — обе стороны
  должны использовать один и тот же helper (`computeHoursPerGroup(entry)`)
  без дублирования формулы.
- `createJournalsFromWorkloadGroups` (мутация) сама не читает
  weeks/hours/groupCount — но идемпотентность (drop existing journals for
  этот semester перед пересозданием) означает, что если миграция БД
  временно оставляет записи в противоречивом состоянии (dual-write баг),
  повторная генерация журналов может использовать неверный `plannedHours`
  без явной ошибки — валидировать это сценарием в Фазе 3 QA (создать
  журналы до и после миграции конкретной записи, сравнить).

---

## 7. Оценка blast radius

| Категория | Файлов | Оценка LOC изменений |
|---|---|---|
| Schema/validator | 1 (`convex/schema/workloadItem.ts`) + `convex/schema.ts` (1 строка) | ~40 (замена 24 плоских полей на 1 array field, обе фазы 1 и 5) |
| Mutation | `convex/workloads/mutations.ts` | ~5 (только типы, логика insert/patch не меняется) |
| Migration | 2 новых файла в `convex/migration/actions.ts` + 2 файла в `convex/migrations/*.txt` | ~120 (backfill + drop скрипты, включая логирование) |
| Pure helpers | `convex/workloads/lib.ts` | ~60 (новая форма `WorkloadItemLike`, `semesterValue`, `itemsNeedingJournals`, удаление legacy после Фазы 4) |
| Тесты (pure helpers) | `convex/workloads/__tests__/lib.spec.ts` | ~80 (дублирование/замена фикстур под массив) |
| Тип-слой | `src/types/workload.ts` | ~20 |
| Главная страница | `src/pages/WorkloadManagement.vue` | ~150-200 (шаблон L67-224 + скрипт: `addSubjectFromRup` L981-1090, `recalculateItem` L1096-1112, `adjustValue` L1114-1120, `handleSaveWorkload` guard L1150-1155, `downloadWorkload`/`downloadAllWorkloads` L1206-1264) — самый большой файл в blast radius |
| Wizard | `src/components/Workload/WorkloadJournalWizard.vue` | ~15 (только `selectSemester`, L359-383) |
| Store | `src/stores/workloadStore.ts` | ~0-5 (транзитивно через типы, логика не меняется) |
| **Новые характеризационные тесты (Фаза 0)** | 1-2 новых spec-файла (`WorkloadManagement.spec.ts` или извлечённые helpers + spec) | ~250-350 (13 кейсов из §5, plus test setup/fixtures) |

**Итого: ~9-10 существующих файлов кода + 2-3 новых миграционных файла + 1-2 новых test-файла, суммарно ориентировочно 700-900 LOC diff по всем фазам вместе (включая тесты).** Основная концентрация риска и объёма — `WorkloadManagement.vue` (единственный файл с прямым UI-биндингом на все 24 поля).

---

## 8. Открытые вопросы для владельца продукта/данных перед стартом

1. Сколько реально записей в `workloads` в проде (влияет на выбор
   full-scan vs paginated миграции в §4) — нужен доступ к Convex dashboard,
   этим READ-ONLY исследованием не установлено.
2. Формат `totalHours` — оставить `string` (как сейчас, ради минимального
   диффа в остальном UI) или тоже перевести в `number` заодно (более
   чистая модель, но увеличивает blast radius в Фазе 4/5, так как каждое
   место чтения `item.totalHours` нужно будет проверить на неявные
   конкатенации строк vs сложение чисел).
3. Согласовано ли с пользователями изменение CSV-экспорта (переход с
   жёстких 2 семестров на динамическое число) как часть этой миграции, или
   вынести отдельным тикетом после? (см. §6, «Что чинит миграция»).
