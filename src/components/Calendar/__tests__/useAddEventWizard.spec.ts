import { computed, ref } from "vue";
import { useAddEventWizard } from "../useAddEventWizard";
import type { WeekDaySchedule } from "../useEventFormDerived";

describe("useAddEventWizard", () => {
  function setup(overrides?: {
    class9Id?: string;
    color?: string;
    participants?: string[];
    selectedWeekDays?: WeekDaySchedule[];
    derivedValid?: boolean;
    dateError?: string | null;
    hoursError?: string | null;
    slotTimeError?: string | null;
    programReady?: boolean;
    step5Valid?: boolean;
  }) {
    const class9Id = ref(overrides?.class9Id ?? "");
    const color = ref(overrides?.color ?? "#3F51B5");
    const participants = ref(overrides?.participants ?? []);
    const selectedWeekDays = ref<WeekDaySchedule[]>(
      overrides?.selectedWeekDays ?? []
    );
    const derivedValid = ref(overrides?.derivedValid ?? true);
    const dateError = ref<string | null>(overrides?.dateError ?? null);
    const hoursError = ref<string | null>(overrides?.hoursError ?? null);
    const slotTimeError = ref<string | null>(overrides?.slotTimeError ?? null);
    const programReady = ref(overrides?.programReady ?? false);
    const step5Valid = ref(overrides?.step5Valid ?? true);

    const wizard = useAddEventWizard({
      class9Id,
      color,
      participants,
      selectedWeekDays,
      isScheduleDerivedValid: computed(() => derivedValid.value),
      dateValidationError: computed(() => dateError.value),
      hoursExceededError: computed(() => hoursError.value),
      slotTimeError: computed(() => slotTimeError.value),
      isProgramReady: computed(() => programReady.value),
      isStep5Valid: computed(() => step5Valid.value),
    });

    return {
      class9Id,
      color,
      participants,
      selectedWeekDays,
      derivedValid,
      dateError,
      hoursError,
      slotTimeError,
      programReady,
      step5Valid,
      wizard,
    };
  }

  it("enforces step-by-step progression", () => {
    const { class9Id, participants, selectedWeekDays, programReady, wizard } = setup();

    expect(wizard.currentStep.value).toBe(1);
    expect(wizard.isCurrentStepValid.value).toBe(false);

    wizard.nextStep();
    expect(wizard.currentStep.value).toBe(1);

    class9Id.value = "class9-id";
    expect(wizard.isStep1Valid.value).toBe(true);

    wizard.nextStep();
    expect(wizard.currentStep.value).toBe(2);

    selectedWeekDays.value = [
      { weekId: 0, russianWeekDay: "Понедельник", startId: "", endId: "" },
    ];
    expect(wizard.isStep2Valid.value).toBe(false);

    selectedWeekDays.value = [
      { weekId: 0, russianWeekDay: "Понедельник", startId: "s1", endId: "e1" },
    ];
    expect(wizard.isStep2Valid.value).toBe(true);

    wizard.nextStep();
    expect(wizard.currentStep.value).toBe(3);

    participants.value = ["student-1"];
    expect(wizard.isStep3Valid.value).toBe(true);

    wizard.nextStep();
    expect(wizard.currentStep.value).toBe(4);
    expect(wizard.isCurrentStepValid.value).toBe(false);

    programReady.value = true;
    expect(wizard.isStep4Valid.value).toBe(true);
  });

  it("requires at least one fully configured weekday on step 2", () => {
    const { class9Id, selectedWeekDays, wizard } = setup();

    class9Id.value = "class9-id";
    wizard.nextStep();

    selectedWeekDays.value = [];
    expect(wizard.isStep2Valid.value).toBe(false);

    selectedWeekDays.value = [
      { weekId: 1, russianWeekDay: "Вторник", startId: "start", endId: "" },
    ];
    expect(wizard.isStep2Valid.value).toBe(false);

    selectedWeekDays.value = [
      { weekId: 1, russianWeekDay: "Вторник", startId: "start", endId: "end" },
    ];
    expect(wizard.isStep2Valid.value).toBe(true);
  });

  it("blocks step 2 when date or hours validations fail", () => {
    const { class9Id, selectedWeekDays, dateError, hoursError, wizard } = setup();

    class9Id.value = "class9-id";
    wizard.nextStep();

    selectedWeekDays.value = [
      { weekId: 2, russianWeekDay: "Среда", startId: "start", endId: "end" },
    ];
    expect(wizard.isStep2Valid.value).toBe(true);

    dateError.value = "Дата окончания должна быть позже";
    expect(wizard.isStep2Valid.value).toBe(false);

    dateError.value = null;
    hoursError.value = "Превышение часов";
    expect(wizard.isStep2Valid.value).toBe(false);
  });

  it("resets back to first step", () => {
    const { class9Id, selectedWeekDays, wizard } = setup();

    class9Id.value = "class9-id";
    wizard.nextStep();

    selectedWeekDays.value = [
      { weekId: 4, russianWeekDay: "Пятница", startId: "start", endId: "end" },
    ];
    wizard.nextStep();

    expect(wizard.currentStep.value).toBe(3);
    wizard.reset();
    expect(wizard.currentStep.value).toBe(1);
  });
});
