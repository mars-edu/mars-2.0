# Workload — оставшиеся баги (детальный анализ)

Статус на 2026-07-24. PR #4 (`fix/rup-reorder-import`) закрыл workload-фиксы
#3 (weekday-accurate weekCount), #6 (Form-1 auto multi-month), #2 (Form-2
year-window), #9. Ниже — 3 неисправленных бага с полным диагнозом и планом.

---

## #1 — Академические vs астрономические часы (HIGH, systemic)

### Симптом
Отчёт показывает ~25 % **недобор факта** для стандартных 45-мин уроков.
Пример: план 18 ч → факт **13.5 ч** («не хватает 4.5 ч»).

### Root cause
Две части кода считают «час» по-разному, но обе кладут результат в одну и ту
же ячейку «часы» — и потом сравниваются.

**Wizard/расписание — академический час** (`src/components/Calendar/scheduleHours.ts:14-30`):
```ts
export function computeWeeklySlotHours(slots, scheduleIds): number {
  let hoursPerWeek = 0;
  for (const slot of slots) {
    …
    hoursPerWeek += endIndex - startIndex + 1;   // ← +1 за КАЖДЫЙ слот
  }
  return hoursPerWeek;
}
```
Каждый занятый слот = 1 «час». 2-парный урок (2 слота × 45 мин = 1.5 астр. ч)
записывается как **2 часа**.

**Calculator/факт — астрономический час** (`src/services/teacher-workload-calculator.ts:24-58`):
```ts
export function calculateLessonHours(startTime?: string, endTime?: string): number {
  …
  const diffMinutes = end.diff(start, "minute");
  …
  return diffMinutes / 60;   // 90 min → 1.5
}
```
Разница `endTime - startTime` в минутах / 60. Тот же 2-слотный урок = **1.5 ч**.

**План** (`rupEntry.totalHours`) — вводит человек, интуитивно **академический**
(«36 часов в семестр» = 36 занятий по 45 мин).

**Итог:** план (акад) − факт (астр) = систематический недобор `1 − 45/60 = 25 %`.

### Другой fallout
- `stagedHours` в wizard (checked после #3-fix) считает per-slot occurrence в
  единицах `computeWeeklySlotHours` = академ. При сохранении журналов часы
  сохраняются в `weeklySchedules` (slot ids), калькулятор потом использует
  `startTime`/`endTime` слотов → астр. Разница remains.
- `calculateLessonHours` fallback = 1 час когда нет `startTime/endTime` — тоже
  академ-по-контракту, но не 1.5. Ещё расхождение.

### Три варианта fix
| Вариант | Что | Плюс | Минус |
|---------|-----|------|-------|
| **A: канон = академ** | `calculateLessonHours` возвращает count slots (не minutes/60). Требует передавать не `startTime`/`endTime`, а сами slot-id + scheduleIds | plans "40h" совпадают со wizard-хранением | Меняет сигнатуру calc.ts — все место замера факта переписывать; astronomic hours (30-мин консультации и т.п.) искажаются в обратную сторону |
| **B: канон = астр** | wizard `computeWeeklySlotHours` возвращает `sum(endTime−startTime)/60`. RUP-план тоже интерпретируется как астр (или конвертится) | Один truthful unit | RUP-план у 100% РУП-записей = академ (введён владельцем); придётся мигрировать все `rupEntry.totalHours` × 0.75 или добавить «unit» флаг. Prod-риск: 42 rupEntries, но человек-editable |
| **C: unit-tag** | `RupEntry` получает `hoursUnit: 'academic'\|'astronomic'` (default academic), calculator converts на сравнении. Wizard оставить academ | Explicit, backward-compat | Форма РУП — новое поле, callsites +conversion; калькулятор complex |

### Рекомендация
**A** (канон = академ) — единица уже неявная в UI (пары, слоты, недели×часы), человек думает в акад. Calculator меняет только `calculateLessonHours` +
принимает опциональный `slotCount`; fallback = 1 сохраняется. Астроном
исчезает как концепт из calculator.

**Блокер:** нужен согласованный owner-decision — «час» в системе = слот
или минута/60. См. `docs/totalHours-назначение.md`.

### Тесты первыми (обязательно)
Ноль характеризационных на `calculateLessonHours` / `calculateActualHours`.
Без них любая правка = тихий регресс в отчётности/оплате. Написать перед
самой правкой:
- `calculateLessonHours("09:00","09:45")` → сейчас 0.75, после A → 1;
- парный урок 2 слота → сейчас 1.5, после A → 2;
- fallback (undefined times) → 1 (осталось);
- weekly `computeWeeklySlotHours` для смешанной schedule (слоты 45 и 30 мин).

---

## #4 — Дробный план блокирует «завершить» в wizard (HIGH, UX-блок)

### Симптом
Кнопка «Завершить» на wizard-е генерации журналов **никогда не активируется**
для дисциплин с дробным планом (напр. `plannedHours = 25.5`). Пользователь
не может создать журналы для целой нагрузки.

### Root cause
`WorkloadJournalWizard.vue`:
```ts
plannedHours: Math.round(parseFloat(semesterValue(item, sem, "hoursPerGroup")) || 0)   // L377
…
function stagedValid(j: Staged) {
  return j.studentIds.length > 0 && stagedHours(j) === targetHours(j);   // L521-523
}
```
`stagedHours` (после моего #3-fix) = сумма per-slot × реальные weekday-count →
всегда **целое** кратное weekly-slot-hours (18, 36, 54…). А `plannedHours`
округлён `Math.round(25.5) = 26`. Ни одна комбинация slot × weeks не даст
ровно 26 → `===` вечно false → `stagedValid` false → `discComplete` false →
`isComplete` false → кнопка disabled.

### Три варианта fix
| Вариант | Что | Плюс | Минус |
|---------|-----|------|-------|
| **A: tolerance** | `Math.abs(stagedHours − targetHours) < weekly-slot-hours-of-one-slot` (пропускаем при разнице < 1 недели slot-times) | 1-строчный fix, UX разблокирован | Может разрешить save с настоящим mismatch если tolerance слишком широк |
| **B: floor/ceil canonicalize** | `plannedHours = Math.round` → `Math.ceil`, а `stagedHours ≥ targetHours` (не `===`) | Всегда даёт «покрыть план» floor'ом времени | Дискриминирует случаи где план обязательно точный |
| **C: сравнение в единицах "уроки"** | Обе стороны делить на weekly-hours-per-lesson, comparison в lesson-count. Дробность отпадает | Semantic-correct | Требует lesson-hours константу; complexity |
| **D: root-cause — не округлять план** | `plannedHours` = raw float (без `Math.round`); сравнение с эпсилоном `Math.abs(a-b) < 0.01` | Точность | UI показывает "25.5 ч" пользователю — норм |

### Рекомендация
**D**: убрать `Math.round`, использовать эпсилон-comparison. Semantic-honest:
план хранится точно (0.5 = 30 мин), проверка совпадает с точностью 1 slot.
`stagedValid` = `Math.abs(stagedHours(j) − targetHours(j)) < 0.01`.

Если план 25.5, а stagedHours через слоты не может дать 25.5 (только 18/36) —
это уже #1 (unit-хаос): нужна конвертация unit'ов, не эпсилон. **D работает
после #1**. Отдельно от #1: **A с tolerance = min(1 slot's hours, 1)** —
разблокирует UX сейчас с documented compromise.

### Риск без исправления
Preподаватель с 25.5-ч дисциплиной не может auto-сгенерить журналы вообще.
Обходной путь — создать журнал вручную в календаре.

---

## #5 — Merged-journal двойной счёт (MEDIUM, silent double-count)

### Симптом
Часы «объединённых индивидуальных журналов» (merge N студенческих индивидуалок
в один) считаются **дважды** в Форме-1/2: один раз у родительского merge, один
раз через дочерние fallback.

### Root cause
Две стороны конфликтуют.

**`journalStore.ts:132-140`** правильно исключает merged child'ов:
```ts
if (actualEvent.parentIndividualJournalId) {
  return;   // Skip — часть merge, показывается через родителя
}
if (actualEvent.isIndividualJournal && (!actualEvent.mergedJournalIds || … === 0)) {
  return;   // Skip unmerged individual — в отдельной вкладке
}
```
Итого — родитель merge попадает в `journalsByCourse`, дочерние — нет. OK.

**Но `calculator.ts:171-189`** (`calculateActualHours` fallback путь для «no journal for event»):
```ts
if (!journal) {
  console.warn(`[calculateActualHours] No journal found for event…`);
  // Fall back to scheduled hours
  lessonDates.forEach(lesson => {
    dailyActualHours[dayIndex] = (dailyActualHours[dayIndex]||0) + lesson.hours;
  });
  …
}
```
Fallback берёт **все `lessonDates`** события. Дочернее событие ищет свой журнал
через `journalId → journalsByCourse`, не находит (журнал не в `journalsByCourse`
благодаря фильтру store'а), падает в `!journal` fallback → **сkedule часы**
дочернего события возвращаются как «факт». Родительский merge параллельно
уже несёт часы этих же студентов через свои marks. Same lessons counted twice.

### Fix
Два подхода:

**A: Skip child events в calculator loop** — до `calculateActualHours` фильтровать `teacherEvents`:
```ts
teacherEvents.filter(e => !e.parentIndividualJournalId)
```
Один фильтр в `reports.vue:531` перед `generateWorkloadSummary` / `generateAllMonthsWorkload`. Дочерние merged events исчезают из "факта" целиком — их часы считаются только через родительский merge.

**B: fallback возвращает 0** — если journal не найден, значит event не должен считаться (не 1-hour default). Ломает legitimate cases где журнал ещё не создан но событие уже в календаре.

### Рекомендация
**A** — 1-строчный фильтр в reports.vue callsite, semantically точный: merged child'ов калькулятор не должен видеть, их часы уже покрыты родителем. B ломает больше, чем чинит.

### Тесты первыми
Пример fixture: merge из 2 индивидуалок 1 препода. Ожидание: `summaryEntries[teacher].actualHours` = parent hours, не 3 × parent hours.

---

## Общий блокер — тестов на calculator ноль

`teacher-workload-calculator.ts` (875 строк) не имеет ни одного jest-теста.
Правки #1/#4/#5 без характеризационных тестов = тихий регресс в оплате
преподавателей. **Обязательное первое действие** — вынести calculator в
tests-friendly модуль (уже pure, только импортит типы) + написать 10-15
кейсов на текущее поведение (calculateLessonHours, calculateActualHours с
mock journal/marks, generateWorkloadSummary с mock events).

## Приоритет
1. **#5** — 1-строчный фильтр, наибольший ROI без owner-decision, изолирован.
2. **#4** — эпсилон-comparison, UX-разблок; можно сейчас с флагом «post-#1
   переписать normally».
3. **#1** — требует owner-decision по канону + миграция плана / полное
   переписывание unit-логики. **Крупная задача**, вынести отдельно.

Всё выше — **не начинать без характеризационных тестов calculator**.
