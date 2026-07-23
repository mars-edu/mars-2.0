# Спека: поле «Групповые» (`groupHours`) в РУП + park валидации распределения

Статус: **спека, код не менялся.** Owner-решение (2026-07-22/23): добавить поле
«Групповые» как **инпут** на уровне `rupEntry`; временно **отключить** сверку
(красный highlight) полей теория/практика/срс/срсп («пока не считать — потом
уточним»).

---

## 1. Модель (финальная, свелась к «как в начале сегодня»)

```
Всего часов (totalHours) = общий итог по ВСЕМ учебным годам/семестрам
  Групповой режим:   Всего = Групповые + доп.индивидуальные;  Индивидуальные = 0
  Индивид. (спец):   Всего = Индивидуальные;                  Групповые = 0

Пример: Всего 300 = Групповые 150 (Теор 75 + Практ 75) + доп.индив 150
```

- **`Групповые` — независимый ИНПУТ** (НЕ выводится из теор+практ).
- `groupHours`, `individualHours` живут на **`rupEntry`** (весь РУП); `distributionEntries` — разбивка по семестрам, как сейчас.
- Связь `Групповые = Теор+Практ(+…)` **НЕ валидируется** сейчас (owner: могут не совпасть → красный не должен гореть).

---

## 2. Изменения по слоям (implementation-ready)

### 2.1 Схема — `convex/schema.ts`
`rupEntries` (~L350, после `totalHours`): добавить
```ts
groupHours: v.optional(v.string()),
```
**Optional обязательно** — на существующих записях поля нет, иначе schema push упадёт. (Данных в dev нет, но prod-safe.)

### 2.2 Мутации — `convex/rupEntries/mutations.ts`
Обработчики спредят `...args`/`...updates` (create L34 `{...args}`, update L45 `{...cleanUpdates}`) → **поле потечёт само**, нужно лишь добавить в ВАЛИДАТОРЫ args:
- `create` args (~L19): `groupHours: v.optional(v.string())`
- `update` args (~L55): `groupHours: v.optional(v.string())`
- `createMultiLanguage` args (~L304): `groupHours: v.optional(v.string())` — **мёртвая мутация (0 вызовов, см. аудит)**, добавить для консистентности или пропустить (пометить).

### 2.3 Тип — `src/types/rup-entry.ts`
`RupEntry` (~L30, после `totalHours`): `groupHours: string;`
(в интерфейсе required со значением `""` по умолчанию — как `individualAdditionalHours` через `?? ""` в трансформе; в схеме optional.)

### 2.4 Стор — `src/stores/rupEntryStore.ts` (центральное место)
- **transform doc→RupEntry** (~L27-50, рядом с `totalHours: item.totalHours`): `groupHours: item.groupHours ?? "",`
- **`createEmptyRupEntry`** (дефолтный стейт, вызывается из попапа `createEmptyEntry` L551): добавить `groupHours: ""`.
- **payload’ы, где передаётся `totalHours`** — добавить `groupHours`:
  `addRupEntry`/create (~L226, L265), `updateRupEntry` (~L317, L352), `duplicateRupEntry` (~L434, L461, L524).
  (Grep `totalHours:` в файле — каждый сайт зеркалит.)

### 2.5 Форма — `src/components/RupEntryPopup.vue`
- **Инпут** между «Всего часов» (~L200) и «Теоретических» (~L207):
```html
<Input :id="'group-hours-'" v-model="step.groupHours"
       label="Групповые" type="text" inputmode="numeric" placeholder="0" />
```
- **zod** (`rupEntrySchema` ~L947): добавить лениво, НЕ кросс-валидируя:
```ts
groupHours: z.string()
  .refine((v) => v === "" || (!isNaN(Number(v)) && Number(v) >= 0), { message: "…" })
  .optional(),
```
- **save payload** (~L1014, `safeParse({...})`): `groupHours: String(s.groupHours ?? ""),`
- **copyFromSource** (~L689): `step.value.groupHours = source.groupHours ?? "";`
- Edit-prefill (`step.value = {...val}` L828/840/863) — потечёт само, т.к. `val` (RupEntry из стора) теперь несёт `groupHours`.

### 2.6 «Пока не считать» — park валидации (`RupEntryPopup.vue`)
`submit()` НЕ блокирует по `distributionSummary` (проверено — гейт только `isFormValid` zod), т.е. сверка **чисто визуальная** (красный/зелёный, шаблон L465-484). «Не считать» = **убрать красный highlight**.

`distributionSummary` (L615-635) считает `group/srs/srsp/individual` vs таргеты; таргеты: `targetGroup = totalHours − individualAdditionalHours` (L630).

**Минимальная правка:** нейтрализовать цветовые биндинги (L465, L471, L477 — group/срс/срсп): убрать тернар `=== target ? green : red`, оставить нейтральный класс. Числа можно оставить (видно), но без enforcement.

**РЕКОМЕНДАЦИЯ:** park **все четыре** (group + срс + срсп + individual, incl. L483) — owner хочет «чтобы не горело красным» пока модель в движении; individual он не назвал, но безопаснее не мигать ложным красным. Легко вернуть позже. *(Альтернатива-минимум: park только group/срс/срсп по букве, individual оставить — см. открытый вопрос #1.)*

---

## 3. Миграция существующих `groupHours`
`groupHours` optional → бэкфилл **не обязателен** (пустые записи валидны).
**Опционально** (удобство): через `@convex-dev/migrations` проставить
`groupHours = String((Number(theoreticalHours)||0) + (Number(labPracticalHours)||0))`
как стартовое значение (редактируемое). НО owner развязал связь → это лишь
догадка; можно **оставить пустым**, пусть заполняют вручную. *(Открытый вопрос #2.)*

```ts
// convex/rupEntriesMigrations.ts  (если решат бэкфиллить)
export const backfillGroupHours = migrations.define({
  table: "rupEntries",
  migrateOne: (_ctx, r) =>
    r.groupHours === undefined
      ? { groupHours: String((Number(r.theoreticalHours)||0) + (Number(r.labPracticalHours)||0)) }
      : undefined,
});
```

---

## 4. Отложено (НЕ в этой спеке — отдельные тикеты)
- **Калькулятор #4** — использовать `groupHours` как групповой план (`teacher-workload-calculator.ts:383,501,826` берут `totalHours`); индивид отдельным бакетом. Ждёт: подтверждение owner что индивид-бакет = `individualHours + individualAdditionalHours`.
- **Выравнивание нагрузки** — `addSubjectFromRup` главная строка = группа, `_ind` = индив (уже так; станет однозначнее с явным полем).
- **Re-enable валидации** — когда owner уточнит правило (`Групповые == Теор+Практ`? или свободно).

---

## 5. Edge cases
- `groupHours` пусто/`undefined` → `Number("")=0`, omit при сохранении; UI показывает placeholder `0`.
- Легаси-записи без поля → optional, грузятся без ошибки, transform даёт `""`.
- Спец: `groupHours="0"`, `individualHours=totalHours`.
- `createMultiLanguage` (мёртвая) — если не трогать, поле просто не передаётся вариантам (некритично, мутация без вызовов).
- Park валидации не ломает save (сверка и так display-only).
- `String(s.groupHours ?? "")` — защита от undefined из старых стейтов.

---

## 6. Acceptance criteria
1. Инпут «Групповые» виден после «Всего часов», до «Теоретических».
2. Значение сохраняется и подтягивается при редактировании (round-trip create→edit).
3. Несовпадение Групповые/теор/практ/срс/срсп **не даёт красный**.
4. Существующие РУП-записи открываются без ошибок (optional поле).
5. `npx convex codegen` + `tsc --noEmit` чисто (baseline 7 в journal — игнор).
6. Save работает даже при пустом `groupHours`.

---

## 7. Открытые вопросы (owner)
1. **Individual summary** (L483) — тоже park или оставить красный? *(рекоменд.: park все 4.)*
2. **Бэкфилл** `groupHours` существующих = `Теор+Практ`, или пусто? *(рекоменд.: пусто, т.к. связь развязана.)*
3. **Когда/как вернуть валидацию** — правило `Групповые = Теор+Практ`, или Групповые независимо, а свои теор/практ — отдельная сверка?
4. **Калькулятор #4** — подтвердить `групповой план = groupHours`, индивид-бакет = `individualHours + individualAdditionalHours` (для «спец» групповой план = 0).
