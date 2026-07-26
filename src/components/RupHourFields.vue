<template>
  <div class="mt-6 pt-4 border-t border-border grid grid-cols-2 gap-x-8 gap-y-4">
    <Input
      :id="'total-credits-'"
      :model-value="editedEntry.totalCredits"
      @update:model-value="(v: string) => update('totalCredits', v)"
      label="Всего кредитов"
      type="text" inputmode="numeric"
      placeholder="0"
    />
    <Input
      :id="'total-hours-'"
      :model-value="editedEntry.totalHours"
      @update:model-value="(v: string) => update('totalHours', v)"
      label="Всего часов"
      type="text" inputmode="numeric"
      placeholder="0"
    />
    <Input
      :id="'group-hours-'"
      :model-value="editedEntry.groupHours"
      @update:model-value="(v: string) => update('groupHours', v)"
      label="Групповые"
      type="text" inputmode="numeric"
      placeholder="0"
    />
    <Input
      :id="'theoretical-hours-'"
      :model-value="editedEntry.theoreticalHours"
      @update:model-value="(v: string) => update('theoreticalHours', v)"
      label="Теоретических"
      type="text" inputmode="numeric"
      placeholder="0"
    />
    <Input
      :id="'lab-practical-hours-'"
      :model-value="editedEntry.labPracticalHours"
      @update:model-value="(v: string) => update('labPracticalHours', v)"
      label="Лабараторно-практических"
      type="text" inputmode="numeric"
      placeholder="0"
    />
    <Input
      :id="'field3-value-'"
      :model-value="editedEntry.field3Value"
      @update:model-value="(v: string) => update('field3Value', v)"
      label="3"
      type="text" inputmode="numeric"
      placeholder="0"
    />

    <Input
      :id="'srsp-hours-'"
      :model-value="editedEntry.srspHours"
      @update:model-value="(v: string) => update('srspHours', v)"
      label="Самостоятельная работа студента с педагогом"
      type="text" inputmode="numeric"
      placeholder="0"
    >
      <template #button>
        <button
          type="button"
          title="Распределить по семестрам"
          class="w-6 h-6 flex items-center justify-center rounded-md bg-transparent border-0 p-0 text-muted-foreground hover:bg-muted hover:text-foreground cursor-pointer transition-colors active:scale-95"
          @click="emit('distribute', 'srspHours')"
        >
          <IconArrowDown class="w-4 h-4" />
        </button>
      </template>
    </Input>

    <Input
      :id="'srs-hours-'"
      :model-value="editedEntry.srsHours"
      @update:model-value="(v: string) => update('srsHours', v)"
      label="Самостоятельная работа студента"
      type="text" inputmode="numeric"
      placeholder="0"
    >
      <template #button>
        <button
          type="button"
          title="Распределить по семестрам"
          class="w-6 h-6 flex items-center justify-center rounded-md bg-transparent border-0 p-0 text-muted-foreground hover:bg-muted hover:text-foreground cursor-pointer transition-colors active:scale-95"
          @click="emit('distribute', 'srsHours')"
        >
          <IconArrowDown class="w-4 h-4" />
        </button>
      </template>
    </Input>

    <Input
      :id="'training-practice-hours-'"
      :model-value="editedEntry.trainingPracticeHours"
      @update:model-value="(v: string) => update('trainingPracticeHours', v)"
      label="Производственное обучение / профессиональная практика"
      type="text" inputmode="numeric"
      placeholder="0"
    />

    <Input
      :id="'individual-hours-'"
      :model-value="editedEntry.individualHours"
      @update:model-value="(v: string) => update('individualHours', v)"
      label="Индивидуальные"
      type="text" inputmode="numeric"
      placeholder="0"
    />

    <Input
      :id="'individual-additional-hours-'"
      :model-value="editedEntry.individualAdditionalHours"
      @update:model-value="(v: string) => update('individualAdditionalHours', v)"
      label="Индивидуальные (дополнительно)"
      type="text" inputmode="numeric"
      placeholder="0"
    >
      <template #button>
        <button
          type="button"
          title="Распределить по семестрам"
          class="w-6 h-6 flex items-center justify-center rounded-md bg-transparent border-0 p-0 text-muted-foreground hover:bg-muted hover:text-foreground cursor-pointer transition-colors active:scale-95"
          @click="emit('distribute', 'individualAdditionalHours')"
        >
          <IconArrowDown class="w-4 h-4" />
        </button>
      </template>
    </Input>
  </div>
</template>

<script setup lang="ts">
import Input from "@/components/ui/Input.vue";
import IconArrowDown from "~icons/lucide/arrow-down";

/**
 * Extracted from RupEntryPopup (spec P3, step 4). Pure input grid — the RUP
 * entry's top-level hour fields (total credits/hours + per-bucket subtotals)
 * plus three "distribute across semesters" trigger buttons.
 *
 * State stays with the parent (many pieces of the form read `editedEntry`); this
 * component is a v-model shell that emits partial updates, and emits
 * `distribute(field)` when the user clicks a distribute chevron — the parent's
 * distributeHoursFromField mutates its `editedEntry.distributionEntries` accordingly.
 */
type HourField =
  | "totalCredits" | "totalHours" | "groupHours"
  | "theoreticalHours" | "labPracticalHours" | "field3Value"
  | "srspHours" | "srsHours" | "trainingPracticeHours"
  | "individualHours" | "individualAdditionalHours";

export type RupHoursForm = Partial<Record<HourField, string>> & Record<string, unknown>;
export type DistributeField = "srspHours" | "srsHours" | "individualAdditionalHours";

const props = defineProps<{
  editedEntry: RupHoursForm;
}>();

const emit = defineEmits<{
  (e: "update:editedEntry", value: RupHoursForm): void;
  (e: "distribute", field: DistributeField): void;
}>();

function update(field: HourField, value: string) {
  emit("update:editedEntry", { ...props.editedEntry, [field]: value });
}
</script>
