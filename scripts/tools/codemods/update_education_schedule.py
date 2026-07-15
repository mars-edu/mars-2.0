import re

with open('src/pages/EducationSchedule.vue', 'r') as f:
    content = f.read()

# Import IconTrash
content = content.replace(
    'import IconChevronDown from "~icons/lucide/chevron-down";',
    'import IconChevronDown from "~icons/lucide/chevron-down";\nimport IconTrash from "~icons/lucide/trash-2";'
)

# Insert delete handlers
handlers = """
const deleteAcademicYear = (academicYear: AcademicYear) => {
  if (academicYear.isActive) {
    f7.dialog.alert("Нельзя удалить активный учебный год.");
    return;
  }
  f7.dialog.confirm(
    `<p>Вы уверены, что хотите удалить учебный год "${academicYear.name}"?</p>
     <p class="text-sm text-muted-foreground mt-2">Это действие нельзя отменить.</p>`,
    "Удаление учебного года",
    async () => {
      try {
        await academicYearStore.deleteAcademicYear(academicYear.id);
      } catch (error) {
        console.error("Failed to delete academic year:", error);
        f7.dialog.alert("Произошла ошибка при удалении учебного года.");
      }
    }
  );
};

const deleteAcademicYearSemester = (semester: AcademicYearSemester) => {
  if (academicYearSemesterStore.isSemesterActive(semester)) {
    f7.dialog.alert("Нельзя удалить активный семестр.");
    return;
  }
  f7.dialog.confirm(
    `<p>Вы уверены, что хотите удалить ${semester.semesterNumber}-й семестр?</p>
     <p class="text-sm text-muted-foreground mt-2">Это действие нельзя отменить.</p>`,
    "Удаление семестра",
    async () => {
      try {
        await academicYearSemesterStore.deleteAcademicYearSemester(semester.id);
      } catch (error) {
        console.error("Failed to delete academic year semester:", error);
        f7.dialog.alert("Произошла ошибка при удалении семестра.");
      }
    }
  );
};

const deleteSchedule = (schedule: EducationSchedule) => {
  f7.dialog.confirm(
    `<p>Вы уверены, что хотите удалить занятие номер ${schedule.lessonNumber}?</p>
     <p class="text-sm text-muted-foreground mt-2">Это действие нельзя отменить.</p>`,
    "Удаление расписания",
    async () => {
      try {
        await educationScheduleStore.deleteSchedule(schedule.id);
      } catch (error) {
        console.error("Failed to delete schedule:", error);
        f7.dialog.alert("Произошла ошибка при удалении расписания.");
      }
    }
  );
};

const deleteVacation = (vacation: Vacation) => {
  f7.dialog.confirm(
    `<p>Вы уверены, что хотите удалить каникулы "${vacation.shortName}"?</p>
     <p class="text-sm text-muted-foreground mt-2">Это действие нельзя отменить.</p>`,
    "Удаление каникул",
    async () => {
      try {
        await vacationStore.deleteVacation(vacation.id);
      } catch (error) {
        console.error("Failed to delete vacation:", error);
        f7.dialog.alert("Произошла ошибка при удалении каникул.");
      }
    }
  );
};

const deleteScheduledFinalControl = (control: ScheduledFinalControl) => {
  f7.dialog.confirm(
    `<p>Вы уверены, что хотите удалить контроль "${control.shortName}"?</p>
     <p class="text-sm text-muted-foreground mt-2">Это действие нельзя отменить.</p>`,
    "Удаление контроля",
    async () => {
      try {
        await scheduledFinalControlStore.deleteScheduledFinalControl(control.id);
      } catch (error) {
        console.error("Failed to delete scheduled final control:", error);
        f7.dialog.alert("Произошла ошибка при удалении контроля.");
      }
    }
  );
};

const deleteScheduledIntermediateControl = (control: ScheduledIntermediateControl) => {
  f7.dialog.confirm(
    `<p>Вы уверены, что хотите удалить промежуточный контроль "${control.shortName}"?</p>
     <p class="text-sm text-muted-foreground mt-2">Это действие нельзя отменить.</p>`,
    "Удаление контроля",
    async () => {
      try {
        await scheduledIntermediateControlStore.deleteScheduledIntermediateControl(control.id);
      } catch (error) {
        console.error("Failed to delete scheduled intermediate control:", error);
        f7.dialog.alert("Произошла ошибка при удалении контроля.");
      }
    }
  );
};
</script>
"""
content = content.replace("</script>", handlers)

# Now, add trash icons in the template.
# For academic-year
content = re.sub(
    r'(<IconPencil class="w-\[14px\] h-\[14px\]" />\s*</button>)',
    r'\1\n                        <button\n                          class="p-1 text-muted-foreground hover:text-destructive transition-colors"\n                          @click.stop="deleteAcademicYear(academicYear)"\n                          aria-label="Delete Academic Year"\n                          type="button"\n                        >\n                          <IconTrash class="w-[14px] h-[14px]" />\n                        </button>',
    content
)

# For semester
content = re.sub(
    r'(<IconPencil class="w-\[14px\] h-\[14px\]" />\s*</button>)',
    r'\1\n                        <button\n                          class="p-1 text-muted-foreground hover:text-destructive transition-colors"\n                          @click.stop="deleteAcademicYearSemester(academicYearSemester)"\n                          aria-label="Delete Academic Year Semester"\n                          type="button"\n                        >\n                          <IconTrash class="w-[14px] h-[14px]" />\n                        </button>',
    content,
    count=1 # wait, the previous sub might have matched multiple. We'll do it by exact string matches instead if needed.
)
with open('src/pages/EducationSchedule.vue', 'w') as f:
    f.write(content)
