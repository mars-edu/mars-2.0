<template>
  <f7-popup
    id="individual-journal-popup"
    :opened="isPopupOpen"
    @popup:closed="onPopupClosed"
    class="individual-journal-popup"
  >
    <f7-page>
      <div class="bg-card text-card-foreground h-full flex flex-col">
        <PopoverHeader
          :title="isEditMode ? 'Редактировать индивидуальный журнал' : 'Создать индивидуальный журнал'"
          :on-cancel="handleClose"
        />
        <div class="p-4 space-y-4 flex-1 overflow-y-auto">
          <!-- Search Input -->
          <div>
            <f7-input
              type="text"
              placeholder="Поиск по студенту, дисциплине..."
              :value="searchTerm"
              @input="searchTerm = $event.target.value"
              clear-button
              class="bg-background border border-input rounded-lg"
            />
          </div>

          <!-- Available Journals Table -->
          <div v-if="filteredAvailableJournals.length > 0" class="border border-input rounded-lg overflow-hidden">
            <div class="overflow-y-auto max-h-[400px]">
              <table class="w-full text-sm">
                <thead class="sticky top-0 bg-muted z-10">
                  <tr class="border-b border-input">
                    <th class="p-2 text-left w-12">
                      <f7-checkbox
                        :checked="isAllJournalsSelected"
                        @change="toggleSelectAllJournals"
                      />
                    </th>
                    <th class="p-2 text-left font-medium">Студент</th>
                    <th class="p-2 text-left font-medium">Дисциплина</th>
                    <th class="p-2 text-left font-medium">Курс / Группа</th>
                    <th class="p-2 text-left font-medium">Расписание</th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="journal in filteredAvailableJournals"
                    :key="journal.id"
                    class="border-b border-input hover:bg-muted/50 cursor-pointer"
                    @click="toggleJournalSelection(journal.id)"
                  >
                    <td class="p-2" @click.stop>
                      <f7-checkbox
                        :checked="localSelectedJournals.has(journal.id)"
                        @change="toggleJournalSelection(journal.id)"
                      />
                    </td>
                    <td class="p-2">{{ journal.studentName }}</td>
                    <td class="p-2 text-xs">{{ journal.discipline }}</td>
                    <td class="p-2 text-xs">{{ journal.courseAndGroup }}</td>
                    <td class="p-2 text-xs text-muted-foreground">{{ journal.schedule }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- No Available Journals Message -->
          <div v-else class="text-center py-8 text-muted-foreground border border-input rounded-lg bg-muted/20">
            <p class="text-sm">
              {{ searchTerm ? 'Журналы не найдены' : 'Нет доступных журналов для объединения' }}
            </p>
          </div>

          <!-- Selected Journals Display -->
          <div v-if="localSelectedJournals.size > 0" class="mt-4">
            <div class="flex items-center justify-between mb-2">
              <h3 class="text-sm font-medium">
                Выбрано журналов: {{ localSelectedJournals.size }}
              </h3>
              <button
                @click="deselectAll"
                class="text-xs text-destructive hover:underline"
              >
                Очистить все
              </button>
            </div>
            <div class="space-y-2 max-h-[200px] overflow-y-auto">
              <div
                v-for="journalId in Array.from(localSelectedJournals)"
                :key="journalId"
                class="flex items-center justify-between p-2 bg-muted rounded-md"
              >
                <span class="text-sm">{{ getJournalDisplayName(journalId) }}</span>
                <button
                  @click="removeJournal(journalId)"
                  class="text-destructive hover:bg-destructive/10 p-1 rounded"
                >
                  <IconX class="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          <!-- Delete Button (Edit mode only) -->
          <div v-if="isEditMode" class="mt-4 pt-4 border-t border-border">
            <Button
              variant="danger"
              class="w-full"
              @click="showDeleteConfirmation"
            >
              <IconTrash class="w-[18px] h-[18px] mr-2" />
              Удалить индивидуальный журнал
            </Button>
          </div>
        </div>

        <PopoverFooter
          :on-save="handleSave"
          :disabled="localSelectedJournals.size === 0"
          :is-loading="isLoading"
          save-text="Сохранить"
        />
      </div>
    </f7-page>
  </f7-popup>
</template>

<script setup lang="ts">
import { ref, computed, watch, reactive } from "vue";
import { f7Popup, f7Page, f7Input, f7Checkbox, f7 } from "framework7-vue";
import IconX from "~icons/lucide/x";
import IconTrash from "~icons/lucide/trash-2";
import PopoverHeader from "@/components/ui/PopoverHeader.vue";
import PopoverFooter from "@/components/ui/PopoverFooter.vue";
import Button from "@/components/ui/Button.vue";
import { useJournalStore, type Journal } from "@/stores/journalStore";
import { useCalendarStore } from "@/stores/calendarStore";
import { useStudentStore } from "@/stores/studentStore";
import { useAcademicYearSemesterStore } from "@/stores/academicYearSemesterStore";
import { storeToRefs } from "pinia";

interface LocalJournalDisplay {
  id: string;
  studentName: string;
  discipline: string;
  courseAndGroup: string;
  schedule: string;
}

interface Props {
  journalId?: string;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  save: [];
  close: [];
}>();

const journalStore = useJournalStore();
const calendarStore = useCalendarStore();
const studentStore = useStudentStore();
const academicYearSemesterStore = useAcademicYearSemesterStore();
const { journalsByCourse, mixedGroupJournals } = storeToRefs(journalStore);

const isPopupOpen = ref(false);
const currentJournalId = ref<string | undefined>(undefined);
const isEditMode = computed(() => !!currentJournalId.value);
const isLoading = ref(false);
const searchTerm = ref("");
const localSelectedJournals = reactive(new Set<string>());

// Get all single-student journals
const availableJournals = computed((): LocalJournalDisplay[] => {
  const journalMap = new Map<string, LocalJournalDisplay>();

  const addJournal = (journal: Journal) => {
    // Skip the current individual journal itself
    if (currentJournalId.value && journal.id === currentJournalId.value) return;

    // Skip if already added (prevent duplicates)
    if (journalMap.has(journal.id)) return;

    // Skip if already merged into a different individual journal
    if (journal.parentIndividualJournalId && journal.parentIndividualJournalId !== currentJournalId.value) return;

    const studentNames = journal.students.map(sid => {
      const s = studentStore.students.find(st => st.id === sid);
      return s ? studentStore.getStudentFullName(s.id) : sid;
    });

    const studentDisplay = studentNames.length === 1
      ? studentNames[0]
      : `${studentNames.length} студентов`;

    journalMap.set(journal.id, {
      id: journal.id,
      studentName: studentDisplay,
      discipline: journalStore.getDisciplineTitle(journal),
      courseAndGroup: journalStore.getJournalSubtitle(journal),
      schedule: journalStore.getJournalScheduleText(journal),
    });
  };

  // Add from all courses
  Object.values(journalsByCourse.value).forEach(courseJournals => {
    courseJournals.forEach(addJournal);
  });

  // Add from mixed groups
  mixedGroupJournals.value.forEach(addJournal);

  return Array.from(journalMap.values());
});

// Filter available journals based on search
const filteredAvailableJournals = computed(() => {
  const term = searchTerm.value.toLowerCase();

  return availableJournals.value.filter((journal) => {
    // In edit mode, hide already selected journals from the table
    if (isEditMode.value && localSelectedJournals.has(journal.id)) {
      return false;
    }

    // Apply search filter
    if (!term) return true;
    return (
      journal.studentName.toLowerCase().includes(term) ||
      journal.discipline.toLowerCase().includes(term) ||
      journal.courseAndGroup.toLowerCase().includes(term)
    );
  });
});

const isAllJournalsSelected = computed(() => {
  if (filteredAvailableJournals.value.length === 0) return false;
  return filteredAvailableJournals.value.every(j => localSelectedJournals.has(j.id));
});

// Get display name for a journal ID
function getJournalDisplayName(journalId: string): string {
  const journal = availableJournals.value.find(j => j.id === journalId);
  if (!journal) return journalId;
  return `${journal.studentName} - ${journal.discipline}`;
}

// Toggle selection
function toggleJournalSelection(journalId: string) {
  if (localSelectedJournals.has(journalId)) {
    localSelectedJournals.delete(journalId);
  } else {
    localSelectedJournals.add(journalId);
  }
}

// Toggle select all
function toggleSelectAllJournals() {
  if (isAllJournalsSelected.value) {
    // Deselect all visible journals
    filteredAvailableJournals.value.forEach(j => {
      localSelectedJournals.delete(j.id);
    });
  } else {
    // Select all visible journals
    filteredAvailableJournals.value.forEach(j => {
      localSelectedJournals.add(j.id);
    });
  }
}

// Deselect all
function deselectAll() {
  localSelectedJournals.clear();
}

// Remove a journal from selection
function removeJournal(journalId: string) {
  localSelectedJournals.delete(journalId);
}

// Load existing selections when opening in edit mode
function loadExistingSelections() {
  if (!currentJournalId.value) return;

  const event = calendarStore.getEventById(currentJournalId.value);

  if (event?.mergedJournalIds) {
    localSelectedJournals.clear();
    // Use Set to ensure unique IDs
    const uniqueIds = [...new Set(event.mergedJournalIds)];
    uniqueIds.forEach(id => {
      localSelectedJournals.add(id);
    });
  }
}

const open = (journalId?: string) => {
  currentJournalId.value = journalId;
  isPopupOpen.value = true;
  searchTerm.value = "";

  if (isEditMode.value) {
    loadExistingSelections();
  } else {
    localSelectedJournals.clear();
  }
};

const handleClose = () => {
  isPopupOpen.value = false;
  localSelectedJournals.clear();
  searchTerm.value = "";
};

const onPopupClosed = () => {
  handleClose();
  emit("close");
};

const handleSave = async () => {
  if (localSelectedJournals.size === 0) {
    f7.dialog.alert('Выберите хотя бы один журнал для объединения');
    return;
  }

  isLoading.value = true;

  try {
    // Collect all students from selected journals
    const allStudents: string[] = [];
    const mergedJournalIds = Array.from(localSelectedJournals);

    mergedJournalIds.forEach(journalId => {
      const journal = journalStore.getJournalById(journalId);
      if (journal) {
        allStudents.push(...journal.students);
      }
    });

    if (isEditMode.value) {
      // Update existing individual journal
      await calendarStore.updateEvent(currentJournalId.value!, {
        mergedJournalIds,
        participants: allStudents,
      });

      // Update parent references for newly merged journals
      mergedJournalIds.forEach(async (id) => {
        await calendarStore.updateEvent(id, {
          parentIndividualJournalId: currentJournalId.value,
        });
      });

      // Clear parent references for journals that were removed from the merge
      const existingEvent = calendarStore.getEventById(currentJournalId.value!);
      const removedJournals = (existingEvent?.mergedJournalIds || []).filter(
        id => !mergedJournalIds.includes(id)
      );

      removedJournals.forEach(async (id) => {
        await calendarStore.updateEvent(id, {
          parentIndividualJournalId: undefined,
        });
      });
    } else {
      // Create new individual journal
      const firstJournal = journalStore.getJournalById(mergedJournalIds[0]);
      if (!firstJournal) return;

      const firstEvent = calendarStore.getEventById(firstJournal.id);
      if (!firstEvent) return;

      const newEvent = await calendarStore.addEvent({
        class9Id: firstJournal.disciplineId,
        participants: allStudents,
        semester: firstEvent.semester || academicYearSemesterStore.getActiveAcademicYearSemester?.id || '',
        isIndividualJournal: true,
        mergedJournalIds,
        teacherId: firstEvent.teacherId,
        startDate: firstEvent.startDate,
        endDate: firstEvent.endDate,
        startTime: firstEvent.startTime,
        endTime: firstEvent.endTime,
        weeklySchedules: firstEvent.weeklySchedules || [],
        useCustomPeriod: firstEvent.useCustomPeriod,
        color: firstEvent.color,
      });

      // Update parent references
      mergedJournalIds.forEach(async (id) => {
        await calendarStore.updateEvent(id, {
          parentIndividualJournalId: newEvent.id,
        });
      });
    }

    emit('save');
    handleClose();
  } catch (error) {
    console.error('Failed to save individual journal:', error);
    f7.dialog.alert('Не удалось сохранить журнал');
  } finally {
    isLoading.value = false;
  }
};

const showDeleteConfirmation = () => {
  f7.dialog.confirm(
    'Вы уверены, что хотите удалить этот индивидуальный журнал? Все объединенные журналы станут независимыми.',
    'Удалить журнал',
    async () => {
      await handleDelete();
    }
  );
};

const handleDelete = async () => {
  if (!currentJournalId.value) return;

  isLoading.value = true;

  try {
    const event = calendarStore.getEventById(currentJournalId.value);

    // Clear parent references from all merged journals
    if (event?.mergedJournalIds) {
      for (const id of event.mergedJournalIds) {
        await calendarStore.updateEvent(id, {
          parentIndividualJournalId: undefined,
        });
      }
    }

    // Delete the individual journal
    await calendarStore.deleteEvent(currentJournalId.value);

    emit('save');
    handleClose();
  } catch (error) {
    console.error('Failed to delete individual journal:', error);
    f7.dialog.alert('Не удалось удалить журнал');
  } finally {
    isLoading.value = false;
  }
};

defineExpose({
  open,
});
</script>

<style>
.individual-journal-popup {
  width: 700px;
  max-width: 90vw;
  height: auto;
  max-height: 80vh;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  border-radius: 1rem;
  overflow: hidden;
}

.individual-journal-popup .page-content {
  padding: 0;
}
</style>
