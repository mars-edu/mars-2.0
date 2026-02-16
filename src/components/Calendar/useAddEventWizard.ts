import { computed, ref, type ComputedRef, type Ref } from "vue";
import type { WeekDaySchedule } from "./useEventFormDerived";

export type AddWizardStep = 1 | 2 | 3 | 4 | 5;

export interface IndividualJournalDraft {
  id: string;
  studentIds: string[];
  daySlots: WeekDaySchedule[];
}

export interface AddWizardDraft {
  class9Id: string;
  useCustomPeriod: boolean;
  startDate: string;
  endDate: string;
  participants: string[];
  color: string;
  selectedWeekDays: WeekDaySchedule[];
  tempEventId: string;
  useIndividualJournals: boolean;
  gradingType: "combined" | "separate" | "";
  individualJournals: IndividualJournalDraft[];
}

export const ADD_WIZARD_STEPS: ReadonlyArray<{
  id: AddWizardStep;
  title: string;
  subtitle: string;
}> = [
  { id: 1, title: "Основное", subtitle: "Дисциплина" },
  { id: 2, title: "Время", subtitle: "Расписание" },
  { id: 3, title: "Студенты", subtitle: "Группа" },
  { id: 4, title: "Программа", subtitle: "Материалы" },
  { id: 5, title: "Журналы", subtitle: "Индивидуальные" },
] as const;

const DEFAULT_COLOR = "#3F51B5";

export function createEmptyAddWizardDraft(): AddWizardDraft {
  return {
    class9Id: "",
    useCustomPeriod: false,
    startDate: "",
    endDate: "",
    participants: [],
    color: DEFAULT_COLOR,
    selectedWeekDays: [],
    tempEventId: "",
    useIndividualJournals: false,
    gradingType: "",
    individualJournals: [],
  };
}

export function serializeAddWizardDraft(draft: AddWizardDraft): string {
  const normalizedWeekDays = [...draft.selectedWeekDays]
    .map((day) => ({
      weekId: day.weekId,
      russianWeekDay: day.russianWeekDay,
      startId: day.startId,
      endId: day.endId,
    }))
    .sort((a, b) => a.weekId - b.weekId);

  const normalizedJournals = [...draft.individualJournals]
    .map((j) => ({
      id: j.id,
      studentIds: [...j.studentIds].sort(),
      daySlots: [...j.daySlots]
        .map((s) => ({
          weekId: s.weekId,
          russianWeekDay: s.russianWeekDay,
          startId: s.startId,
          endId: s.endId,
        }))
        .sort((a, b) => a.weekId - b.weekId),
    }))
    .sort((a, b) => a.id.localeCompare(b.id));

  return JSON.stringify({
    ...draft,
    participants: [...draft.participants].sort(),
    selectedWeekDays: normalizedWeekDays,
    individualJournals: normalizedJournals,
  });
}

type MaybeComputed<T> = Ref<T> | ComputedRef<T>;

interface UseAddEventWizardOptions {
  class9Id: MaybeComputed<string>;
  color: MaybeComputed<string>;
  participants: MaybeComputed<string[]>;
  selectedWeekDays: MaybeComputed<WeekDaySchedule[]>;
  isScheduleDerivedValid: MaybeComputed<boolean>;
  dateValidationError: MaybeComputed<string | null>;
  hoursExceededError: MaybeComputed<string | null>;
  slotTimeError: MaybeComputed<string | null>;
  isProgramReady: MaybeComputed<boolean>;
  isStep5Valid: MaybeComputed<boolean>;
}

export function useAddEventWizard(options: UseAddEventWizardOptions) {
  const currentStep = ref<AddWizardStep>(1);

  const isStep1Valid = computed(
    () => !!options.class9Id.value && !!options.color.value
  );

  const isScheduleComplete = computed(() => {
    if (options.selectedWeekDays.value.length === 0) return false;
    return options.selectedWeekDays.value.every(
      (day) => !!day.startId && !!day.endId
    );
  });

  const isStep2Valid = computed(() => {
    if (!options.isScheduleDerivedValid.value) return false;
    if (!!options.dateValidationError.value) return false;
    if (!!options.hoursExceededError.value) return false;
    if (!!options.slotTimeError.value) return false;
    return isScheduleComplete.value;
  });

  const isStep3Valid = computed(() => options.participants.value.length > 0);
  const isStep4Valid = computed(() => true);
  const isStep5Valid = computed(() => options.isStep5Valid.value);

  const stepValidity = computed<Record<AddWizardStep, boolean>>(() => ({
    1: isStep1Valid.value,
    2: isStep2Valid.value,
    3: isStep3Valid.value,
    4: isStep4Valid.value,
    5: isStep5Valid.value,
  }));

  const currentStepMeta = computed(
    () => ADD_WIZARD_STEPS.find((step) => step.id === currentStep.value)!
  );

  const isFirstStep = computed(() => currentStep.value === 1);
  const isLastStep = computed(() => currentStep.value === 5);

  const isCurrentStepValid = computed(
    () => stepValidity.value[currentStep.value]
  );

  const nextStep = () => {
    if (!isCurrentStepValid.value || isLastStep.value) return;
    currentStep.value = (currentStep.value + 1) as AddWizardStep;
  };

  const previousStep = () => {
    if (isFirstStep.value) return;
    currentStep.value = (currentStep.value - 1) as AddWizardStep;
  };

  const reset = () => {
    currentStep.value = 1;
  };

  return {
    currentStep,
    currentStepMeta,
    isFirstStep,
    isLastStep,
    isCurrentStepValid,
    isStep1Valid,
    isStep2Valid,
    isStep3Valid,
    isStep4Valid,
    isStep5Valid,
    stepValidity,
    nextStep,
    previousStep,
    reset,
  };
}
