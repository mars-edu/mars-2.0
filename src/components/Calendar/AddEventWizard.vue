<template>
  <div id="add-event-popover" class="event-popover bg-card text-card-foreground">
    <div class="fixed-header">
      <PopoverHeader
        :title="currentStepMeta.title"
        cancel-text="Закрыть"
        :on-cancel="requestClose"
      />

      <div class="px-4 pb-3 border-b border-input bg-card">
        <p class="text-sm text-muted-foreground">{{ currentStepMeta.subtitle }}</p>
        <div class="flex gap-1.5 mt-3">
          <div
            v-for="step in steps"
            :key="step.id"
            class="h-1.5 flex-1 rounded-full overflow-hidden bg-muted"
          >
            <div
              class="h-full bg-primary transition-all duration-200"
              :class="step.id <= currentStep ? 'w-full' : 'w-0'"
            />
          </div>
        </div>
      </div>

      <div v-if="formError" class="px-4 py-2 text-destructive text-sm border-b border-input">
        {{ formError }}
      </div>
    </div>

    <div class="wizard-content p-4 space-y-5">
      <section v-if="currentStep === 1" class="space-y-4">
        <Select
          id="event-class9-generic"
          label="Дисциплина"
          placeholder="Выберите дисциплину"
          name="event-class9-generic"
          v-model="class9IdModel"
          :options="class9Options"
          searchable
          v-bind="selectHandlers"
        />

        <div class="space-y-2">
          <div class="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
            Нагрузка
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div class="rounded-2xl border border-input bg-secondary/40 p-4">
              <div class="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                План
              </div>
              <div class="mt-1 text-4xl font-bold text-foreground leading-none">
                {{ totalPlannedHours }} ч.
              </div>
              <div class="mt-1 text-xs text-muted-foreground">Полный курс</div>
            </div>
            <div class="rounded-2xl border border-orange-200 bg-orange-50/50 p-4">
              <div class="text-[11px] font-semibold uppercase tracking-wide text-orange-600">
                Семестр
              </div>
              <div class="mt-1 text-4xl font-bold text-orange-600 leading-none">
                {{ semesterPlannedHours }} ч.
              </div>
              <div class="mt-1 text-xs text-orange-500">К распределению</div>
            </div>
          </div>
        </div>

        <ColorPicker
          v-model="colorModel"
          target-id="color-picker-generic"
          label="Цвет"
        />
      </section>

      <section v-if="currentStep === 2" class="space-y-4">
        <div class="rounded-xl border border-input bg-card p-3 space-y-3">
          <div class="flex items-center justify-between">
            <label for="use-custom-period" class="text-base text-foreground">
              Свой период
            </label>
            <label for="use-custom-period" class="relative inline-flex h-7 w-12 cursor-pointer items-center">
              <input
                id="use-custom-period"
                v-model="useCustomPeriodModel"
                type="checkbox"
                class="peer sr-only"
              />
              <span
                class="h-7 w-12 rounded-full bg-muted transition-colors peer-checked:bg-primary"
              ></span>
              <span
                class="absolute left-0.5 top-0.5 h-6 w-6 rounded-full bg-white shadow-sm transition-transform peer-checked:translate-x-5"
              ></span>
            </label>
          </div>

          <template v-if="!useCustomPeriodModel">
            <div
              v-if="semesterDates"
              class="flex items-center justify-between gap-3"
            >
              <div class="text-[15px] md:text-[17px] font-medium leading-tight text-foreground">
                {{ semesterDates.startDate }} - {{ semesterDates.endDate }}
              </div>
              <span
                v-if="semesterDates.semesterText"
                class="shrink-0 rounded-md bg-muted px-2 py-0.5 text-xs text-muted-foreground"
              >
                {{ semesterDates.semesterText }}
              </span>
            </div>
            <div v-else class="text-sm text-muted-foreground">
              Период не определен
            </div>
          </template>

          <template v-else>
            <div class="flex justify-between items-center">
              <span class="text-sm text-foreground">Начало</span>
              <div class="w-1/2">
                <f7-input
                  class="text-right"
                  type="datepicker"
                  placeholder="Дата"
                  v-model:value="startDateModel"
                  readonly
                  :calendar-params="DATE_PICKER_PARAMS"
                ></f7-input>
              </div>
            </div>
            <div class="flex justify-between items-center">
              <span class="text-sm text-foreground">Конец</span>
              <div class="w-1/2">
                <f7-input
                  class="text-right"
                  type="datepicker"
                  placeholder="Дата"
                  v-model:value="endDateModel"
                  readonly
                  :calendar-params="DATE_PICKER_PARAMS"
                ></f7-input>
              </div>
            </div>
          </template>
        </div>

        <div v-if="dateValidationError" class="text-destructive text-sm">
          {{ dateValidationError }}
        </div>

        <div>
          <div class="flex items-center justify-between mb-3">
            <div class="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">Расписание</div>
            <span
              class="rounded-md px-2 py-0.5 text-xs font-semibold"
              :class="isSelectedHoursExceeded ? 'bg-destructive/15 text-destructive' : 'bg-primary/10 text-primary'"
            >{{ selectedHours }} / {{ semesterPlannedHours }} ч.</span>
          </div>
          <div class="flex justify-between gap-1">
            <button
              v-for="day in weekDays"
              :id="`event-weekday-${day.weekId}`"
              :key="day.weekId"
              class="flex-1 py-2 rounded-xl text-sm font-medium flex items-center justify-center cursor-pointer transition-colors"
              :class="{
                'bg-primary text-primary-foreground shadow-sm': day.isSelected,
                'bg-secondary text-secondary-foreground hover:bg-secondary/80': !day.isSelected,
              }"
              @click="toggleWeekDay(day.weekId, day.name)"
            >
              {{ day.russianAbbreviation }}
            </button>
          </div>
        </div>

        <template v-for="day in groupedWeekSchedules" :key="day.weekId">
          <div class="rounded-xl border border-input p-3 space-y-2 bg-card">
            <div class="text-sm font-semibold text-foreground">
              {{ day.russianWeekDay }}
            </div>

            <div
              v-for="slot in day.slots"
              :key="slot.index"
              class="flex items-center gap-2 w-full"
            >
              <div class="flex-1 min-w-0">
                <Select
                  :id="`event-weekday-start-${day.weekId}-${slot.slotOrder}`"
                  :modelValue="slot.value.startId"
                  :options="startTimeOptions"
                  placeholder="Начало"
                  class="w-full"
                  v-bind="selectHandlers"
                  @update:modelValue="
                    (v) => {
                      updateWeekDayTime(slot.index, 'startId', v);
                      // Clear end if it's no longer after the new start
                      const newStartIdx = startTimeOptions.findIndex((o) => o.value === v);
                      const curEndIdx = endTimeOptions.findIndex((o) => o.value === slot.value.endId);
                      if (curEndIdx !== -1 && curEndIdx < newStartIdx) {
                        updateWeekDayTime(slot.index, 'endId', '');
                      }
                    }
                  "
                />
              </div>
              <span class="text-muted-foreground text-sm shrink-0">—</span>
              <div class="flex-1 min-w-0">
                <Select
                  :id="`event-weekday-end-${day.weekId}-${slot.slotOrder}`"
                  :modelValue="slot.value.endId"
                  :options="getEndTimeOptionsForStart(slot.value.startId)"
                  placeholder="Конец"
                  class="w-full"
                  v-bind="selectHandlers"
                  @update:modelValue="
                    (v) => updateWeekDayTime(slot.index, 'endId', v)
                  "
                />
              </div>
              <button
                class="w-7 h-7 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors flex items-center justify-center shrink-0"
                @click="removeWeekDaySlot(day.weekId, slot.index)"
                title="Удалить время"
              >
                <i class="f7-icons text-sm">xmark</i>
              </button>
            </div>

            <button
              :id="`event-weekday-add-${day.weekId}`"
              class="flex items-center justify-center gap-1 text-primary text-sm font-medium hover:bg-primary/10 transition-colors rounded-md px-2 py-1"
              @click="addWeekDaySlot(day.weekId, day.russianWeekDay)"
              title="Добавить время"
            >
              <span class="text-base leading-none">+</span>
            </button>
          </div>
        </template>


        <div v-if="hoursExceededError" class="text-destructive text-sm">
          {{ hoursExceededError }}
        </div>

        <div v-if="slotTimeError" class="text-destructive text-sm">
          {{ slotTimeError }}
        </div>
      </section>

      <section v-if="currentStep === 3" id="event-form-participants" class="space-y-4">

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Select
            id="event-student-language"
            label="Язык обучения"
            placeholder="Все"
            v-model="studentFilters.language"
            :options="studentLanguageOptions"
            v-bind="selectHandlers"
          />
          <Select
            id="event-student-specialty"
            label="Специальность"
            placeholder="Все"
            v-model="studentFilters.specialty"
            :multiple="true"
            :options="studentSpecialtyOptions"
            v-bind="selectHandlers"
          />
          <Select
            id="event-student-course"
            label="Курс"
            placeholder="Все"
            v-model="studentFilters.course"
            :options="studentCourseOptions"
            v-bind="selectHandlers"
          />
          <Select
            id="event-student-gender"
            label="Пол"
            placeholder="Все"
            v-model="studentFilters.gender"
            :options="studentGenderOptions"
            v-bind="selectHandlers"
          />
        </div>

        <div>
          <f7-input
            id="event-student-search"
            type="text"
            placeholder="Поиск по ФИО..."
            v-model:value="studentFilters.searchTerm"
            clear-button
          />
        </div>

        <div class="flex items-center justify-between rounded-xl border border-input bg-secondary/40 px-4 py-2.5">
          <span class="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
            Найдено: <span class="text-foreground">{{ filteredStudents.length }}</span>
          </span>
          <span class="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
            Выбрано: <span class="text-foreground">{{ participantsModel.length }}</span>
          </span>
        </div>

        <div class="flex justify-between">
          <button
            class="text-sm text-primary font-medium hover:underline"
            @click="toggleSelectAllStudents"
          >
            Выбрать всех
          </button>
          <button
            class="text-sm text-muted-foreground hover:text-foreground hover:underline"
            @click="participantsModel = []"
          >
            Сбросить
          </button>
        </div>

        <div class="students-table-wrap rounded-xl border border-input bg-card overflow-hidden">
          <div class="students-table-header">
            <label class="students-table-cell students-table-cell-checkbox">
              <input
                id="event-student-select-all"
                type="checkbox"
                :checked="isAllFilteredStudentsSelected"
                @change="toggleSelectAllStudents"
              />
            </label>
            <div class="students-table-cell students-table-cell-name">Полное имя</div>
            <div class="students-table-cell students-table-cell-course">Курс</div>
          </div>

          <div
            v-for="student in filteredStudents"
            :key="student.id"
            class="students-table-row"
            @click="toggleStudentSelection(student.id)"
          >
            <label
              class="students-table-cell students-table-cell-checkbox"
              :for="`event-student-checkbox-${student.id}`"
              @click.stop
            >
              <input
                :id="`event-student-checkbox-${student.id}`"
                type="checkbox"
                :checked="isStudentSelected(student.id)"
                @click.stop="toggleStudentSelection(student.id)"
              />
            </label>
            <div class="students-table-cell students-table-cell-name">
              {{ studentStore.getStudentFullName(student.id) }}
            </div>
            <div class="students-table-cell students-table-cell-course">
              {{ student.course || "-" }}
            </div>
          </div>

          <div
            v-if="filteredStudents.length === 0"
            class="p-4 text-sm text-muted-foreground text-center"
          >
            Нет обучающихся по выбранным фильтрам
          </div>
        </div>
      </section>

      <section v-if="currentStep === 4" class="space-y-4">
        <button
          id="event-form-ktp"
          class="w-full flex items-center justify-between p-3 rounded-lg border border-input bg-card hover:bg-muted/50 transition-colors"
          @click="openKtpPopup"
        >
          <span class="text-sm text-foreground">РУП/КТП</span>
          <span class="text-muted-foreground flex items-center">
            Открыть
            <i class="f7-icons text-muted-foreground ml-1">chevron_right</i>
          </span>
        </button>

        <div class="bg-secondary p-4 rounded-lg border border-input space-y-1">
          <div class="text-sm text-muted-foreground">Статус программы</div>
          <div class="text-sm font-medium text-foreground">
            {{ currentKtpId ? `Тем КТП: ${currentKtpDetailCount}` : 'КТП не создан' }}
          </div>
          <div v-if="!isProgramReady" class="text-sm text-destructive">
            Добавьте хотя бы одну тему КТП для создания журнала.
          </div>
        </div>
      </section>

      <section v-if="currentStep === 5" class="space-y-4">
        <div class="rounded-xl border border-input bg-card p-3 space-y-3">
          <div class="flex items-center justify-between">
            <div>
              <div class="text-base text-foreground">Индивидуальные журналы</div>
              <div class="text-xs text-muted-foreground">Подгруппы студентов с собственным расписанием</div>
            </div>
            <label class="relative inline-flex h-7 w-12 cursor-pointer items-center">
              <input
                v-model="useIndividualJournalsModel"
                type="checkbox"
                class="peer sr-only"
              />
              <span
                class="h-7 w-12 rounded-full bg-muted transition-colors peer-checked:bg-primary"
              ></span>
              <span
                class="absolute left-0.5 top-0.5 h-6 w-6 rounded-full bg-white shadow-sm transition-transform peer-checked:translate-x-5"
              ></span>
            </label>
          </div>

          <template v-if="useIndividualJournalsModel">
            <div class="flex items-center justify-between bg-secondary/40 rounded-xl px-4 py-2.5">
              <span class="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                План: <span class="text-foreground">{{ semesterPlannedHours }} ч</span>
              </span>
              <span class="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                Инд.: <span class="text-foreground">{{ totalIndividualHours }} ч</span>
              </span>
            </div>

            <div class="grid grid-cols-2 gap-3">
              <button
                class="py-3 rounded-xl text-sm font-medium transition-colors border"
                :class="gradingTypeModel === 'combined'
                  ? 'bg-foreground text-background border-foreground'
                  : 'bg-card text-foreground border-input hover:bg-muted/50'"
                @click="gradingTypeModel = 'combined'"
              >
                Общая
              </button>
              <button
                class="py-3 rounded-xl text-sm font-medium transition-colors border"
                :class="gradingTypeModel === 'separate'
                  ? 'bg-foreground text-background border-foreground'
                  : 'bg-card text-foreground border-input hover:bg-muted/50'"
                @click="gradingTypeModel = 'separate'"
              >
                Раздельная
              </button>
            </div>

            <div
              v-for="(journal, idx) in individualJournalsModel"
              :key="journal.id"
              class="rounded-xl border border-input bg-secondary/40 p-4 space-y-3"
            >
              <div class="flex items-center justify-between">
                <div class="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                  Журнал #{{ idx + 1 }}
                </div>
                <button
                  class="w-7 h-7 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors flex items-center justify-center"
                  @click="removeJournal(journal.id)"
                  title="Удалить журнал"
                >
                  <i class="f7-icons text-sm">xmark</i>
                </button>
              </div>

              <!-- Student picker -->
              <div class="relative">
                <button
                  class="w-full flex items-center justify-between p-2.5 rounded-lg border border-input bg-card text-sm hover:bg-muted/50 transition-colors"
                  @click="openStudentSelectorId = openStudentSelectorId === journal.id ? null : journal.id"
                >
                  <span :class="journal.studentIds.length > 0 ? 'text-foreground' : 'text-muted-foreground'">
                    {{ journal.studentIds.length > 0
                      ? `Студентов: ${journal.studentIds.length}`
                      : 'Выберите студентов'
                    }}
                  </span>
                  <i class="f7-icons text-sm text-muted-foreground">
                    {{ openStudentSelectorId === journal.id ? 'chevron_up' : 'chevron_down' }}
                  </i>
                </button>

                <div
                  v-if="openStudentSelectorId === journal.id"
                  class="absolute z-20 left-0 right-0 mt-1 rounded-xl border border-input bg-card shadow-lg max-h-48 overflow-y-auto"
                >
                  <div
                    v-for="studentId in availableStudentsForJournal(journal.id)"
                    :key="studentId"
                    class="flex items-center gap-2 px-3 py-2 text-sm cursor-pointer hover:bg-muted/50 transition-colors"
                    @click="toggleJournalStudent(journal.id, studentId)"
                  >
                    <input
                      type="checkbox"
                      :checked="journal.studentIds.includes(studentId)"
                      class="pointer-events-none"
                    />
                    <span class="text-foreground">{{ studentStore.getStudentFullName(studentId) }}</span>
                  </div>
                  <div
                    v-if="availableStudentsForJournal(journal.id).length === 0"
                    class="px-3 py-2 text-sm text-muted-foreground text-center"
                  >
                    Все студенты распределены
                  </div>
                </div>
              </div>

              <!-- Day chips -->
              <div class="flex justify-between gap-1">
                <button
                  v-for="day in weekDays"
                  :key="day.weekId"
                  class="flex-1 py-2 rounded-xl text-sm font-medium flex items-center justify-center cursor-pointer transition-colors"
                  :class="{
                    'bg-primary text-primary-foreground shadow-sm': journal.daySlots.some(s => s.weekId === day.weekId),
                    'bg-secondary text-secondary-foreground hover:bg-secondary/80': !journal.daySlots.some(s => s.weekId === day.weekId),
                  }"
                  @click="toggleJournalDay(journal.id, day.weekId, day.name)"
                >
                  {{ day.russianAbbreviation }}
                </button>
              </div>

              <!-- Time slots per day -->
              <template v-for="dayGroup in groupedJournalSlots(journal)" :key="dayGroup.weekId">
                <div class="rounded-xl border border-input p-3 space-y-2 bg-card">
                  <div class="text-sm font-semibold text-foreground">
                    {{ dayGroup.russianWeekDay }}
                  </div>

                  <div
                    v-for="slot in dayGroup.slots"
                    :key="slot.index"
                    class="flex items-center gap-2 w-full"
                  >
                    <div class="flex-1 min-w-0">
                      <Select
                        :id="`journal-${journal.id}-start-${dayGroup.weekId}-${slot.slotOrder}`"
                        :modelValue="slot.value.startId"
                        :options="startTimeOptions"
                        placeholder="Начало"
                        class="w-full"
                        v-bind="selectHandlers"
                        @update:modelValue="
                          (v) => {
                            updateJournalSlotTime(journal.id, slot.index, 'startId', v);
                            const newStartIdx = startTimeOptions.findIndex((o) => o.value === v);
                            const curEndIdx = endTimeOptions.findIndex((o) => o.value === slot.value.endId);
                            if (curEndIdx !== -1 && curEndIdx < newStartIdx) {
                              updateJournalSlotTime(journal.id, slot.index, 'endId', '');
                            }
                          }
                        "
                      />
                    </div>
                    <span class="text-muted-foreground text-sm shrink-0">—</span>
                    <div class="flex-1 min-w-0">
                      <Select
                        :id="`journal-${journal.id}-end-${dayGroup.weekId}-${slot.slotOrder}`"
                        :modelValue="slot.value.endId"
                        :options="getEndTimeOptionsForStart(slot.value.startId)"
                        placeholder="Конец"
                        class="w-full"
                        v-bind="selectHandlers"
                        @update:modelValue="
                          (v) => updateJournalSlotTime(journal.id, slot.index, 'endId', v)
                        "
                      />
                    </div>
                    <button
                      class="w-7 h-7 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors flex items-center justify-center shrink-0"
                      @click="removeJournalSlot(journal.id, slot.index)"
                      title="Удалить время"
                    >
                      <i class="f7-icons text-sm">xmark</i>
                    </button>
                  </div>

                  <button
                    class="flex items-center justify-center gap-1 text-primary text-sm font-medium hover:bg-primary/10 transition-colors rounded-md px-2 py-1"
                    @click="addJournalSlot(journal.id, dayGroup.weekId, dayGroup.russianWeekDay)"
                    title="Добавить время"
                  >
                    <span class="text-base leading-none">+</span>
                  </button>
                </div>
              </template>

              <!-- KTP/RUP stub -->
              <button
                class="text-sm text-primary font-medium hover:underline"
                @click.prevent
              >
                Прикрепить КТП/РУП
              </button>
            </div>

            <button
              class="w-full py-4 border border-dashed border-input rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground hover:border-foreground/40 transition-colors"
              @click="addJournal"
            >
              + Добавить журнал
            </button>
          </template>
        </div>
      </section>
    </div>

    <div class="wizard-footer border-t border-input flex items-stretch bg-card">
      <button
        class="flex-1 py-4 text-sm font-medium text-secondary-foreground hover:bg-secondary/60 transition-colors border-r border-input"
        @click="handleBack"
      >
        {{ isFirstStep ? 'Отмена' : 'Назад' }}
      </button>

      <button
        class="flex-1 py-4 text-sm font-semibold transition-colors"
        :class="isPrimaryEnabled ? 'text-primary hover:bg-primary/10' : 'text-muted-foreground/40 cursor-not-allowed'"
        :disabled="!isPrimaryEnabled"
        @click="handlePrimaryAction"
      >
        {{ isLastStep ? 'Создать' : 'Далее' }}
      </button>
    </div>

    <KtpDetailPopup
      :opened="isKtpPopupOpen"
      :ktp-id="currentKtpId"
      :module-title="currentKtpTitle"
      @update:opened="handleKtpPopupClosed"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref, toRefs, watch, type Ref } from "vue";
import { f7 } from "framework7-vue";
import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";
import "dayjs/locale/ru";
import { storeToRefs } from "pinia";
import { withAllOption, getGenderOptions } from "@/lib/utils";
import PopoverHeader from "@/components/ui/PopoverHeader.vue";
import Select from "@/components/ui/Select.vue";
import ColorPicker from "@/components/ui/ColorPicker.vue";
import KtpDetailPopup from "@/components/KtpDetailPopup.vue";
import {
  WEEK_DAYS,
  DATE_PICKER_PARAMS,
  DATE_UI_FORMAT,
} from "@/constants/calendar";
import { useNestedPopup } from "@/composables/useNestedPopup";
import { useClass9Store } from "@/stores/class9Store";
import { useStudentStore } from "@/stores/studentStore";
import { useSpecialtyStore } from "@/stores/specialtyStore";
import { useLanguageStore } from "@/stores/languageStore";
import { useCourseStore } from "@/stores/courseStore";
import { useEducationScheduleStore } from "@/stores/educationScheduleStore";
import { useAcademicYearSemesterStore } from "@/stores/academicYearSemesterStore";
import { useKtpStore } from "@/stores/ktpStore";
import {
  ADD_WIZARD_STEPS,
  useAddEventWizard,
  type AddWizardStep,
  type IndividualJournalDraft,
} from "./useAddEventWizard";
import type { SemesterDates, WeekDaySchedule } from "./useEventFormDerived";

dayjs.extend(customParseFormat);
dayjs.locale("ru");

const props = defineProps<{
  class9Id: string;
  useCustomPeriod: boolean;
  startDate?: string;
  endDate?: string;
  participants: string[];
  color: string;
  selectedWeekDays: WeekDaySchedule[];
  semesterId: string;
  semesterDates?: SemesterDates | null;
  totalPlannedHours: string;
  semesterPlannedHours: string;
  selectedHours: string;
  hoursExceededError?: string | null;
  slotTimeError?: string | null;
  dateValidationError?: string | null;
  derivedIsValid: boolean;
  tempEventId: string;
  formError?: string | null;
  isSubmitting?: boolean;
  useIndividualJournals: boolean;
  gradingType: "combined" | "separate" | "";
  individualJournals: IndividualJournalDraft[];
  requestClose: () => void;
  sessionKey: number;
}>();

const {
  semesterDates,
  totalPlannedHours,
  semesterPlannedHours,
  selectedHours,
  hoursExceededError,
  slotTimeError,
  dateValidationError,
  formError,
} = toRefs(props);

const emit = defineEmits<{
  (e: "update:class9Id", v: string): void;
  (e: "update:useCustomPeriod", v: boolean): void;
  (e: "update:startDate", v: string): void;
  (e: "update:endDate", v: string): void;
  (e: "update:participants", v: string[]): void;
  (e: "update:color", v: string): void;
  (e: "update:selectedWeekDays", v: WeekDaySchedule[]): void;
  (e: "update:useIndividualJournals", v: boolean): void;
  (e: "update:gradingType", v: "combined" | "separate" | ""): void;
  (e: "update:individualJournals", v: IndividualJournalDraft[]): void;
  (e: "submit"): void;
}>();

const requestClose = () => {
  props.requestClose();
};

const class9Store = useClass9Store();
const studentStore = useStudentStore();
const specialtyStore = useSpecialtyStore();
const languageStore = useLanguageStore();
const courseStore = useCourseStore();
const educationScheduleStore = useEducationScheduleStore();
const academicYearSemesterStore = useAcademicYearSemesterStore();
const ktpStore = useKtpStore();

const { class9Options } = storeToRefs(class9Store);
const { students } = storeToRefs(studentStore);
const { specialtyOptions: storeSpecialtyOptions } = storeToRefs(specialtyStore);
const { languageOptions: storeLanguageOptions } = storeToRefs(languageStore);
const { courseOptions: storeCourseOptions } = storeToRefs(courseStore);
const { getActiveYearSchedules } = storeToRefs(educationScheduleStore);

const { closeParent, openParent, selectHandlers } = useNestedPopup({
  parentPopupId: "#add-event-popup",
});

const class9IdModel = computed({
  get: () => props.class9Id,
  set: (v: string) => emit("update:class9Id", v),
});

const useCustomPeriodModel = computed({
  get: () => props.useCustomPeriod,
  set: (v: boolean) => emit("update:useCustomPeriod", v),
});

const participantsModel = computed({
  get: () => props.participants,
  set: (v: string[]) => emit("update:participants", v),
});

const selectedWeekDaysModel = computed<WeekDaySchedule[]>({
  get: () => props.selectedWeekDays,
  set: (v: WeekDaySchedule[]) => emit("update:selectedWeekDays", v),
});

const colorModel = computed({
  get: () => ({ hex: props.color || "#3F51B5" }),
  set: (v: { hex: string }) => emit("update:color", v?.hex || "#3F51B5"),
});

const useIndividualJournalsModel = computed({
  get: () => props.useIndividualJournals,
  set: (v: boolean) => emit("update:useIndividualJournals", v),
});

const gradingTypeModel = computed({
  get: () => props.gradingType,
  set: (v: "combined" | "separate" | "") => emit("update:gradingType", v),
});

const individualJournalsModel = computed({
  get: () => props.individualJournals,
  set: (v: IndividualJournalDraft[]) => emit("update:individualJournals", v),
});

function parseUiDate(ui?: string): Date | null {
  if (!ui) return null;
  const parsed = dayjs(ui, DATE_UI_FORMAT, true);
  return parsed.isValid() ? parsed.toDate() : null;
}

const startDateModel = computed<Date[]>({
  get: () => {
    const explicit = parseUiDate(props.startDate);
    if (explicit) return [explicit];

    const fallback = parseUiDate(props.semesterDates?.startDate);
    if (fallback) return [fallback];

    return [new Date()];
  },
  set: (v: Date[]) => {
    const date = Array.isArray(v) ? v[0] : undefined;
    if (!date) return;
    emit("update:startDate", dayjs(date).format(DATE_UI_FORMAT));
  },
});

const endDateModel = computed<Date[]>({
  get: () => {
    const explicit = parseUiDate(props.endDate);
    if (explicit) return [explicit];

    const fallback = parseUiDate(props.semesterDates?.endDate);
    if (fallback) return [fallback];

    return [new Date()];
  },
  set: (v: Date[]) => {
    const date = Array.isArray(v) ? v[0] : undefined;
    if (!date) return;
    emit("update:endDate", dayjs(date).format(DATE_UI_FORMAT));
  },
});

const weekDays = computed(() => {
  return WEEK_DAYS.map((day) => ({
    ...day,
    isSelected: selectedWeekDaysModel.value.some(
      (selected) => selected.weekId === day.weekId
    ),
  }));
});

const groupedWeekSchedules = computed(() => {
  const grouped = new Map<
    number,
    {
      weekId: number;
      russianWeekDay: string;
      slots: Array<{
        index: number;
        slotOrder: number;
        value: WeekDaySchedule;
      }>;
    }
  >();

  selectedWeekDaysModel.value.forEach((slot, index) => {
    const existing = grouped.get(slot.weekId);
    if (existing) {
      existing.slots.push({
        index,
        slotOrder: existing.slots.length,
        value: slot,
      });
      return;
    }

    grouped.set(slot.weekId, {
      weekId: slot.weekId,
      russianWeekDay: slot.russianWeekDay,
      slots: [{ index, slotOrder: 0, value: slot }],
    });
  });

  return Array.from(grouped.values()).sort((a, b) => a.weekId - b.weekId);
});

const startTimeOptions = computed(() => {
  return getActiveYearSchedules.value.map((schedule) => ({
    value: schedule.id,
    text: schedule.startTime,
  }));
});

const endTimeOptions = computed(() => {
  return getActiveYearSchedules.value.map((schedule) => ({
    value: schedule.id,
    text: schedule.endTime,
  }));
});

function getEndTimeOptionsForStart(startId: string) {
  const schedules = getActiveYearSchedules.value;
  const startIndex = startId ? schedules.findIndex((s) => s.id === startId) : -1;
  if (startIndex === -1) return [];
  return schedules
    .filter((_, i) => i >= startIndex)
    .map((schedule) => ({ value: schedule.id, text: schedule.endTime }));
}

function toggleWeekDay(weekId: number, name: string) {
  const current = selectedWeekDaysModel.value || [];
  const exists = current.some((d) => d.weekId === weekId);

  if (exists) {
    selectedWeekDaysModel.value = current.filter((d) => d.weekId !== weekId);
    return;
  }

  selectedWeekDaysModel.value = [
    ...current,
    { weekId, russianWeekDay: name, startId: "", endId: "" },
  ];
}

function updateWeekDayTime(
  index: number,
  field: "startId" | "endId",
  value: string | number | Array<string | number>
) {
  const nextValue =
    typeof value === "string"
      ? value
      : Array.isArray(value)
        ? String(value[0] ?? "")
        : String(value);

  const current = selectedWeekDaysModel.value || [];
  if (!current[index]) return;

  const updated = { ...current[index], [field]: nextValue };
  selectedWeekDaysModel.value = [
    ...current.slice(0, index),
    updated,
    ...current.slice(index + 1),
  ];
}

function addWeekDaySlot(weekId: number, russianWeekDay: string) {
  selectedWeekDaysModel.value = [
    ...selectedWeekDaysModel.value,
    { weekId, russianWeekDay, startId: "", endId: "" },
  ];
}

function removeWeekDaySlot(weekId: number, index: number) {
  const current = [...selectedWeekDaysModel.value];
  if (!current[index]) return;

  current.splice(index, 1);
  selectedWeekDaysModel.value = current;

  const hasWeekSlots = current.some((slot) => slot.weekId === weekId);
  if (!hasWeekSlots) {
    selectedWeekDaysModel.value = current.filter((slot) => slot.weekId !== weekId);
  }
}

const studentFilters = reactive({
  searchTerm: "",
  language: "all",
  specialty: [] as string[],
  course: "all",
  gender: "",
});

const studentLanguageOptions = computed(() =>
  withAllOption(storeLanguageOptions.value, "Все", "all")
);
const studentSpecialtyOptions = computed(() =>
  withAllOption(storeSpecialtyOptions.value, "Все", "all")
);
const studentCourseOptions = computed(() =>
  withAllOption(storeCourseOptions.value, "Все", "all")
);
const studentGenderOptions = computed(() => getGenderOptions("Все", ""));

const allowedSpecialtyIds = computed(() => {
  if (!class9IdModel.value) return [];
  const selectedClass9 = class9Store.getClass9ById(class9IdModel.value);
  return selectedClass9?.specialtyIds || [];
});

const allowedAcademicYearId = computed<string | undefined>(() => {
  if (!class9IdModel.value) return undefined;
  const selectedClass9 = class9Store.getClass9ById(class9IdModel.value);
  return selectedClass9?.academicYearId;
});

const filteredStudents = computed(() => {
  const term = studentFilters.searchTerm.trim().toLowerCase();

  return students.value
    .map((student) => ({
      ...student,
      course: studentStore.getCourseByStudentId(student.id) ?? 0,
      fullName: studentStore.getStudentFullName(student.id),
    }))
    .filter((student) =>
      studentFilters.course === "all"
        ? true
        : student.course === Number(studentFilters.course)
    )
    .filter((student) => {
      const ids = allowedSpecialtyIds.value || [];
      return ids.length === 0 ? true : ids.includes(student.specialty);
    })
    .filter((student) => {
      const academicYearId = allowedAcademicYearId.value;
      return academicYearId ? student.academicYearId === academicYearId : true;
    })
    .filter((student) =>
      studentFilters.language === "all"
        ? true
        : student.language === studentFilters.language
    )
    .filter((student) =>
      studentFilters.specialty.length === 0
        ? true
        : studentFilters.specialty.includes(student.specialty)
    )
    .filter((student) =>
      studentFilters.gender ? student.gender === studentFilters.gender : true
    )
    .filter((student) => (term ? student.fullName.toLowerCase().includes(term) : true));
});

const selectedStudentSet = computed(() => new Set(participantsModel.value));

const isAllFilteredStudentsSelected = computed(() => {
  if (filteredStudents.value.length === 0) return false;
  return filteredStudents.value.every((student) =>
    selectedStudentSet.value.has(student.id)
  );
});

function isStudentSelected(studentId: string) {
  return selectedStudentSet.value.has(studentId);
}

function toggleStudentSelection(studentId: string) {
  const nextSelected = new Set(participantsModel.value);
  if (nextSelected.has(studentId)) {
    nextSelected.delete(studentId);
  } else {
    nextSelected.add(studentId);
  }
  participantsModel.value = Array.from(nextSelected);
}

function toggleSelectAllStudents() {
  const nextSelected = new Set(participantsModel.value);
  if (isAllFilteredStudentsSelected.value) {
    filteredStudents.value.forEach((student) => nextSelected.delete(student.id));
  } else {
    filteredStudents.value.forEach((student) => nextSelected.add(student.id));
  }
  participantsModel.value = Array.from(nextSelected);
}

const isKtpPopupOpen = ref(false);
const currentKtpIdRef = ref<string | null>(null);

const semesterForKtp = computed(() => {
  if (!props.semesterId) return null;
  return academicYearSemesterStore.getAcademicYearSemesterById(props.semesterId) || null;
});

const currentKtp = computed(() => {
  if (currentKtpIdRef.value) {
    return ktpStore.findKtpById(currentKtpIdRef.value) || null;
  }

  if (!class9IdModel.value || !semesterForKtp.value || !props.tempEventId) {
    return null;
  }

  return (
    ktpStore.findKtpByClass9Id(
      class9IdModel.value,
      semesterForKtp.value.academicYearId,
      semesterForKtp.value.id,
      props.tempEventId
    ) || null
  );
});

const currentKtpId = computed(() => {
  return currentKtp.value?.id || null;
});

const currentKtpDetailCount = computed(() => {
  if (!currentKtpId.value) return 0;
  return ktpStore.getDetailsByKtpId(currentKtpId.value).length;
});

const isProgramReady = computed(() => currentKtpDetailCount.value > 0);

// --- Step 5: Individual journals ---

const isStep5Valid = computed(() => {
  if (!useIndividualJournalsModel.value) return true;
  if (!gradingTypeModel.value) return false;
  if (individualJournalsModel.value.length === 0) return false;
  return individualJournalsModel.value.every(
    (j) =>
      j.studentIds.length > 0 &&
      j.daySlots.length > 0 &&
      j.daySlots.every((s) => !!s.startId && !!s.endId)
  );
});

const openStudentSelectorId = ref<string | null>(null);

function addJournal() {
  individualJournalsModel.value = [
    ...individualJournalsModel.value,
    { id: crypto.randomUUID(), studentIds: [], daySlots: [] },
  ];
}

function removeJournal(id: string) {
  individualJournalsModel.value = individualJournalsModel.value.filter(
    (j) => j.id !== id
  );
}

function toggleJournalStudent(journalId: string, studentId: string) {
  individualJournalsModel.value = individualJournalsModel.value.map((j) => {
    if (j.id === journalId) {
      const has = j.studentIds.includes(studentId);
      return {
        ...j,
        studentIds: has
          ? j.studentIds.filter((id) => id !== studentId)
          : [...j.studentIds, studentId],
      };
    }
    // Remove student from other journals (exclusive assignment)
    if (j.studentIds.includes(studentId)) {
      return { ...j, studentIds: j.studentIds.filter((id) => id !== studentId) };
    }
    return j;
  });
}

function toggleJournalDay(journalId: string, weekId: number, dayName: string) {
  individualJournalsModel.value = individualJournalsModel.value.map((j) => {
    if (j.id !== journalId) return j;
    const exists = j.daySlots.some((s) => s.weekId === weekId);
    if (exists) {
      const filtered = j.daySlots.filter((s) => s.weekId !== weekId);
      return { ...j, daySlots: filtered };
    }
    return {
      ...j,
      daySlots: [
        ...j.daySlots,
        { weekId, russianWeekDay: dayName, startId: "", endId: "" },
      ],
    };
  });
}

function updateJournalSlotTime(
  journalId: string,
  slotIdx: number,
  field: "startId" | "endId",
  value: string | number | Array<string | number>
) {
  const nextValue =
    typeof value === "string"
      ? value
      : Array.isArray(value)
        ? String(value[0] ?? "")
        : String(value);

  individualJournalsModel.value = individualJournalsModel.value.map((j) => {
    if (j.id !== journalId) return j;
    const slots = [...j.daySlots];
    if (!slots[slotIdx]) return j;
    slots[slotIdx] = { ...slots[slotIdx], [field]: nextValue };
    return { ...j, daySlots: slots };
  });
}

function addJournalSlot(journalId: string, weekId: number, dayName: string) {
  individualJournalsModel.value = individualJournalsModel.value.map((j) => {
    if (j.id !== journalId) return j;
    return {
      ...j,
      daySlots: [
        ...j.daySlots,
        { weekId, russianWeekDay: dayName, startId: "", endId: "" },
      ],
    };
  });
}

function removeJournalSlot(journalId: string, slotIdx: number) {
  individualJournalsModel.value = individualJournalsModel.value.map((j) => {
    if (j.id !== journalId) return j;
    const slots = [...j.daySlots];
    const removed = slots[slotIdx];
    if (!removed) return j;
    slots.splice(slotIdx, 1);
    return { ...j, daySlots: slots };
  });
}

function availableStudentsForJournal(journalId: string) {
  const takenByOthers = new Set<string>();
  for (const j of individualJournalsModel.value) {
    if (j.id !== journalId) {
      j.studentIds.forEach((id) => takenByOthers.add(id));
    }
  }
  return participantsModel.value.filter((id) => !takenByOthers.has(id));
}

function groupedJournalSlots(journal: IndividualJournalDraft) {
  const grouped = new Map<
    number,
    {
      weekId: number;
      russianWeekDay: string;
      slots: Array<{
        index: number;
        slotOrder: number;
        value: WeekDaySchedule;
      }>;
    }
  >();

  journal.daySlots.forEach((slot, index) => {
    const existing = grouped.get(slot.weekId);
    if (existing) {
      existing.slots.push({
        index,
        slotOrder: existing.slots.length,
        value: slot,
      });
      return;
    }
    grouped.set(slot.weekId, {
      weekId: slot.weekId,
      russianWeekDay: slot.russianWeekDay,
      slots: [{ index, slotOrder: 0, value: slot }],
    });
  });

  return Array.from(grouped.values()).sort((a, b) => a.weekId - b.weekId);
}

const totalIndividualHours = computed(() => {
  let count = 0;
  for (const j of individualJournalsModel.value) {
    count += j.daySlots.filter((s) => !!s.startId && !!s.endId).length;
  }
  return count;
});

const currentKtpTitle = computed(() => {
  if (!class9IdModel.value) return undefined;
  const class9Item = class9Store.getClass9ById(class9IdModel.value);
  if (!class9Item) return undefined;
  return `${class9Item.moduleIndex} - ${class9Item.moduleName}`;
});

async function openKtpPopup() {
  if (!class9IdModel.value) {
    f7.dialog.alert(
      "Пожалуйста, сначала выберите результат обучения/дисциплину",
      "Внимание"
    );
    return;
  }

  if (!semesterForKtp.value) {
    f7.dialog.alert("Не удалось определить семестр", "Ошибка");
    return;
  }

  if (!props.tempEventId) {
    f7.dialog.alert("Не удалось подготовить форму создания", "Ошибка");
    return;
  }

  try {
    const ktp = await ktpStore.ensureKtpForClass9(
      class9IdModel.value,
      semesterForKtp.value.academicYearId,
      semesterForKtp.value.id,
      props.tempEventId
    );

    currentKtpIdRef.value = ktp.id;
    ktpStore.fetchDetailsForKtp(ktp.id);
    closeParent();
    isKtpPopupOpen.value = true;
  } catch (error) {
    console.error("Failed to ensure KTP:", error);
    f7.dialog.alert("Не удалось создать КТП", "Ошибка");
  }
}

function handleKtpPopupClosed(isOpen: boolean) {
  isKtpPopupOpen.value = isOpen;
  if (!isOpen) {
    if (currentKtpId.value) {
      ktpStore.fetchDetailsForKtp(currentKtpId.value);
    }
    openParent();
  }
}

watch(
  () => props.class9Id,
  () => {
    currentKtpIdRef.value = null;
  }
);

watch(
  () => props.sessionKey,
  () => {
    currentKtpIdRef.value = null;
    isKtpPopupOpen.value = false;
    openStudentSelectorId.value = null;
    Object.assign(studentFilters, {
      searchTerm: "",
      language: "all",
      specialty: [],
      course: "all",
      gender: "",
    });
    reset();
  }
);

const {
  currentStep,
  currentStepMeta,
  isFirstStep,
  isLastStep,
  isCurrentStepValid,
  nextStep,
  previousStep,
  reset,
} = useAddEventWizard({
  class9Id: class9IdModel,
  color: computed(() => colorModel.value.hex),
  participants: participantsModel,
  selectedWeekDays: selectedWeekDaysModel,
  isScheduleDerivedValid: computed(() => props.derivedIsValid),
  dateValidationError: computed(() => dateValidationError.value || null),
  hoursExceededError: computed(() => hoursExceededError.value || null),
  slotTimeError: computed(() => slotTimeError.value || null),
  isProgramReady,
  isStep5Valid,
});

const steps = ADD_WIZARD_STEPS;

const isSelectedHoursExceeded = computed(() => {
  return Number(selectedHours.value || "0") > Number(semesterPlannedHours.value || "0");
});

const isPrimaryEnabled = computed(() => {
  if (!isCurrentStepValid.value) return false;
  if (isLastStep.value) return !props.isSubmitting;
  return true;
});

function handleBack() {
  if (isFirstStep.value) {
    props.requestClose();
    return;
  }
  previousStep();
}

function handlePrimaryAction() {
  if (!isCurrentStepValid.value) return;

  if (isLastStep.value) {
    emit("submit");
    return;
  }

  nextStep();
}

defineExpose<{
  reset: () => void;
  currentStep: Ref<AddWizardStep>;
}>({
  reset,
  currentStep,
});
</script>

<style scoped>
.event-popover {
  display: flex;
  flex-direction: column;
  max-height: 90vh;
  width: 100%;
  height: 100%;
}

.fixed-header {
  position: sticky;
  top: 0;
  z-index: 10;
  background-color: var(--f7-popover-bg-color);
}

.wizard-content {
  flex: 1;
  overflow-y: auto;
  min-height: 0;
}

.wizard-footer {
  flex-shrink: 0;
}

.students-table-header,
.students-table-row {
  display: grid;
  grid-template-columns: 48px minmax(0, 1fr) 72px;
  align-items: center;
}

.students-table-header {
  background-color: hsl(var(--secondary));
  border-bottom: 1px solid hsl(var(--border));
}

.students-table-row {
  border-bottom: 1px solid hsl(var(--border));
  cursor: pointer;
}

.students-table-row:last-of-type {
  border-bottom: none;
}

.students-table-row:hover {
  background-color: hsl(var(--muted) / 0.5);
}

.students-table-cell {
  padding: 0.625rem 0.75rem;
  font-size: 0.875rem;
  line-height: 1.25rem;
  min-width: 0;
}

.students-table-cell-checkbox {
  display: flex;
  justify-content: center;
}

.students-table-cell-name {
  color: hsl(var(--foreground));
}

.students-table-cell-course {
  text-align: center;
  color: hsl(var(--muted-foreground));
}

.students-table-wrap {
  max-height: 320px;
  overflow-y: auto;
}
</style>
