<template>
  <GuardedPopover
    v-slot="{ requestClose, allowNextClose }"
    id="makeup-hours-popover"
    positioning="center"
    style="width: 520px !important"
    :is-dirty="() => isDirty"
    :on-closed="resetForm"
    :close-by-outside-click="false"
  >
    <div class="bg-card text-card-foreground">
      <PopoverHeader
        :title="makeup_hours_title()"
        :on-cancel="requestClose"
      />

      <div class="px-8 pb-4 space-y-4 max-h-[60vh] overflow-y-auto no-scrollbar">
        <!-- Reason -->
        <div>
          <label class="text-sm font-normal mb-1 block text-muted-foreground">
            {{ makeup_hours_reason_label() }}
          </label>
          <textarea
            v-model="reason"
            :placeholder="makeup_hours_reason_placeholder()"
            rows="2"
            class="w-full px-4 py-2.5 text-sm bg-muted/50 border border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-foreground resize-none transition-all"
          ></textarea>
        </div>

        <!-- Date entries -->
        <div
          v-for="(entry, index) in dateEntries"
          :key="entry.id"
          class="p-3 bg-muted/30 rounded-xl border border-input space-y-3 relative"
        >
          <button
            v-if="dateEntries.length > 1"
            type="button"
            @click="removeEntry(entry.id)"
            class="absolute top-3 right-3 text-muted-foreground hover:text-destructive transition-colors"
          >
            <IconTrash2 class="w-4 h-4" />
          </button>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="text-sm font-normal mb-1 block text-muted-foreground">
                {{ makeup_hours_scheduled_date() }}
              </label>
              <Select
                v-model="entry.existingDate"
                :options="journalDateOptions"
                :placeholder="makeup_hours_select_date()"
              />
            </div>
            <div>
              <label class="text-sm font-normal mb-1 block text-muted-foreground">
                {{ makeup_hours_new_date() }}
              </label>
              <DateInput
                v-model:value="entry.newDate"
              />
            </div>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="text-sm font-normal mb-1 block text-muted-foreground">
                {{ makeup_hours_time_from() }}
              </label>
              <Select
                v-model="entry.startScheduleId"
                :options="startTimeOptions"
                placeholder="—"
                @update:modelValue="(v) => onStartChange(entry, v)"
              />
            </div>
            <div>
              <label class="text-sm font-normal mb-1 block text-muted-foreground">
                {{ makeup_hours_time_to() }}
              </label>
              <Select
                v-model="entry.endScheduleId"
                :options="endTimeOptions(entry.startScheduleId)"
                placeholder="—"
              />
            </div>
          </div>
        </div>

        <button
          type="button"
          @click="addEntry"
          class="w-full py-2.5 border-2 border-dashed border-input rounded-xl text-muted-foreground font-semibold hover:border-primary hover:text-primary hover:bg-primary/5 transition-all flex items-center justify-center gap-2 text-sm"
        >
          <IconPlus class="w-4 h-4" />
          {{ makeup_hours_add_date() }}
        </button>
      </div>

      <PopoverFooter
        :on-cancel="requestClose"
        :on-save="() => onSave(allowNextClose)"
        :disabled="!isFormValid"
        :is-loading="isLoading"
        cancel-text="Отмена"
        :save-text="makeup_hours_submit()"
      />
    </div>
  </GuardedPopover>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import { f7 } from "framework7-vue";
import dayjs from "dayjs";
import GuardedPopover from "@/components/ui/GuardedPopover.vue";
import PopoverHeader from "@/components/ui/PopoverHeader.vue";
import PopoverFooter from "@/components/ui/PopoverFooter.vue";
import Select from "@/components/ui/Select.vue";
import DateInput from "@/components/ui/DateInput.vue";
import { DATE_STORAGE_FORMAT } from "@/constants/calendar";
import IconTrash2 from "~icons/lucide/trash-2";
import IconPlus from "~icons/lucide/plus";
import { useEducationScheduleStore } from "@/stores/educationScheduleStore";
import { storeToRefs } from "pinia";
import {
  makeup_hours_title,
  makeup_hours_reason_label,
  makeup_hours_reason_placeholder,
  makeup_hours_scheduled_date,
  makeup_hours_new_date,
  makeup_hours_time_from,
  makeup_hours_time_to,
  makeup_hours_add_date,
  makeup_hours_submit,
  makeup_hours_select_date,
} from "@/paraglide/messages";

export interface MakeupHoursData {
  reason: string;
  dates: Array<{
    existingDate: string;
    newDate: string;
    startScheduleId: string;
    endScheduleId: string;
  }>;
}

const props = defineProps<{
  journalDates: Array<{ isoDate: string; label: string }>;
  isLoading?: boolean;
}>();

const emit = defineEmits<{
  save: [data: MakeupHoursData];
}>();

const educationScheduleStore = useEducationScheduleStore();
const { getActiveYearSchedules } = storeToRefs(educationScheduleStore);

interface DateEntry {
  id: number;
  existingDate: string;
  newDate: Date[];
  startScheduleId: string;
  endScheduleId: string;
}

function makeEntry(): DateEntry {
  const schedules = getActiveYearSchedules.value;
  return {
    id: Date.now() + Math.random(),
    existingDate: "",
    newDate: [],
    startScheduleId: schedules[0]?.id ?? "",
    endScheduleId: schedules[schedules.length - 1]?.id ?? "",
  };
}

const reason = ref("");
const dateEntries = ref<DateEntry[]>([makeEntry()]);

const journalDateOptions = computed(() =>
  props.journalDates.map((d) => ({ value: d.isoDate, text: d.label }))
);

const startTimeOptions = computed(() =>
  getActiveYearSchedules.value.map((s) => ({ value: s.id, text: s.startTime }))
);

function endTimeOptions(startScheduleId: string) {
  const schedules = getActiveYearSchedules.value;
  const startIdx = schedules.findIndex((s) => s.id === startScheduleId);
  const from = startIdx === -1 ? 0 : startIdx;
  return schedules.slice(from).map((s) => ({ value: s.id, text: s.endTime }));
}

function onStartChange(entry: DateEntry, newStartId: string) {
  const schedules = getActiveYearSchedules.value;
  const startIdx = schedules.findIndex((s) => s.id === newStartId);
  const endIdx = schedules.findIndex((s) => s.id === entry.endScheduleId);
  if (endIdx !== -1 && endIdx < startIdx) {
    entry.endScheduleId = newStartId;
  }
}

function addEntry() {
  dateEntries.value.push(makeEntry());
}

function removeEntry(id: number) {
  dateEntries.value = dateEntries.value.filter((e) => e.id !== id);
}

const isFormValid = computed(() =>
  dateEntries.value.some(
    (e) => e.existingDate && e.newDate.length > 0
  )
);

const isDirty = computed(
  () =>
    reason.value.trim() !== "" ||
    dateEntries.value.some(
      (e) => e.existingDate || e.newDate.length > 0
    )
);

function resetForm() {
  reason.value = "";
  dateEntries.value = [makeEntry()];
}

async function onSave(allowNextClose: () => void) {
  const validDates = dateEntries.value
    .filter((e) => e.existingDate && e.newDate.length > 0)
    .map((e) => ({
      existingDate: e.existingDate,
      newDate: dayjs(e.newDate[0]).format(DATE_STORAGE_FORMAT),
      startScheduleId: e.startScheduleId,
      endScheduleId: e.endScheduleId,
    }));

  if (validDates.length === 0) return;

  const data = { reason: reason.value, dates: validDates };
  resetForm();
  allowNextClose();
  f7.popover.close("#makeup-hours-popover");
  emit("save", data);
}
</script>

