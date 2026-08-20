import { computed, type Ref } from "vue";
import { f7 } from "framework7-vue";
import type { Mark } from "@/types/marks";
import type { CalendarEvent } from "@/types/calendar";
import type { Journal } from "@/types/journal";
import type { Student } from "@/types/student";
import type { Specialty } from "@/types/specialty";
import type { FinalControl } from "@/types/final-control";
import { useMarksStore } from "@/stores/marksStore";
import {
  exportAnalyticsViaConvex,
} from "@/services/convex-excel-export";
import {
  analytics_export_error,
} from "@/paraglide/messages";

export interface ReportJournalEntry {
  id: string;
  title: string;
  journal: Journal;
  event: CalendarEvent;
}

export interface ReportTableRow {
  studentId: string;
  index: number;
  fullName: string;
  courseLabel: string;
  semester: Record<string, number | null>;
  withoutFinal: Record<string, number | null>;
  finals: Record<string, Record<string, number | null>>;
  overallAverage: number | null;
}

export function normalizeNumericValue(
  value: string | number | null | undefined
): number | null {
  if (value === null || value === undefined || value === "") {
    return null;
  }
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string") {
    const normalized = value.replace(",", ".").trim();
    if (normalized.length === 0) return null;
    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

export function computeAverageFromMarks(marks: Mark[] | null): number | null {
  if (!marks || !marks.length) return null;
  const numericValues: number[] = [];
  marks.forEach((mark) => {
    if (!Array.isArray(mark.values)) return;
    mark.values.forEach((value) => {
      const numeric = normalizeNumericValue(value as any);
      if (numeric !== null) {
        numericValues.push(numeric);
      }
    });
  });
  if (!numericValues.length) return null;
  const sum = numericValues.reduce((total, current) => total + current, 0);
  const average = sum / numericValues.length;
  return Number.isFinite(average)
    ? Number.parseFloat(average.toFixed(1))
    : null;
}

interface UseAnalyticsReportStateOptions {
  selectedAnalyticsStudents: Ref<Array<{ id: string; fullName: string; course: number }>>;
  relevantJournals: Ref<ReportJournalEntry[]>;
  selectedReportCategory: Ref<string>;
  sortedFinalControls: Ref<FinalControl[]>;
  students: Ref<Student[]>;
  specialties: Ref<Specialty[]>;
  selectedStudentIds: Ref<string[]>;
  canGenerateReport: Ref<boolean>;
}

export function useAnalyticsReportState(opts: UseAnalyticsReportStateOptions) {
  const marksStore = useMarksStore();

  const reportRows = computed<ReportTableRow[]>(() => {
    const studentsList = opts.selectedAnalyticsStudents.value;
    const disciplines = opts.relevantJournals.value;

    const marksCache = new Map<string, Mark[] | null>();
    for (const student of studentsList) {
      for (const discipline of disciplines) {
        const key = `${discipline.id}:${student.id}`;
        if (!marksCache.has(key)) {
          marksCache.set(
            key,
            marksStore.getStudentMarks(discipline.id, student.id) as Mark[] | null
          );
        }
      }
    }

    return studentsList.map((student, index) => {
      const disciplineScores: Record<string, number | null> = {};
      const numericScores: number[] = [];
      const disciplineSemesterScores: Record<string, number | null> = {};
      const finalsData: Record<string, Record<string, number | null>> = {};

      disciplines.forEach((discipline) => {
        const participates =
          (discipline.journal.students || []).includes(student.id) ||
          discipline.event.participants?.includes(student.id);

        if (!participates) {
          disciplineScores[discipline.id] = null;
          disciplineSemesterScores[discipline.id] = null;
          return;
        }

        const marks = marksCache.get(`${discipline.id}:${student.id}`) ?? null;
        const average = computeAverageFromMarks(marks);
        if (average !== null) {
          numericScores.push(average);
        }
        disciplineScores[discipline.id] = average;

        if (marks) {
          const semesterMarks = marks.filter((m: Mark) => m.type === "date");
          const semesterAverage = computeAverageFromMarks(semesterMarks);
          disciplineSemesterScores[discipline.id] = semesterAverage;
        }

        opts.sortedFinalControls.value.forEach((finalForm) => {
          if (!finalsData[finalForm.id]) {
            finalsData[finalForm.id] = {};
          }

          if (marks) {
            const sessionMark = marks.find(
              (m: Mark) =>
                m.type === "session" &&
                m.controlType === "final" &&
                m.controlId === finalForm.id
            );
            const value =
              sessionMark && Array.isArray(sessionMark.values)
                ? normalizeNumericValue(sessionMark.values[0])
                : null;
            finalsData[finalForm.id][discipline.id] = value;
          } else {
            finalsData[finalForm.id][discipline.id] = null;
          }
        });
      });

      const computeWithoutFinalValue = (): Record<string, number | null> => {
        const result: Record<string, number | null> = {};

        disciplines.forEach((discipline) => {
          const participates =
            (discipline.journal.students || []).includes(student.id) ||
            discipline.event.participants?.includes(student.id);

          if (!participates) {
            result[discipline.id] = null;
            return;
          }

          const marks = marksCache.get(`${discipline.id}:${student.id}`) ?? null;
          if (!marks) {
            result[discipline.id] = null;
            return;
          }

          if (opts.selectedReportCategory.value === "final") {
            const semesterMarks = marks.filter((m: Mark) => m.type === "date");
            const semesterAverage = computeAverageFromMarks(semesterMarks);
            result[discipline.id] = semesterAverage;
          } else {
            const categoryName = opts.selectedReportCategory.value;
            if (!categoryName) {
              result[discipline.id] = null;
              return;
            }

            const sessionMark = marks.find(
              (m: Mark) =>
                m.type === "session" &&
                m.controlType === "intermediate" &&
                m.label === categoryName
            );

            const value =
              sessionMark && Array.isArray(sessionMark.values)
                ? normalizeNumericValue(sessionMark.values[0])
                : null;
            result[discipline.id] = value;
          }
        });

        return result;
      };

      const overallAverage =
        numericScores.length > 0
          ? Number.parseFloat(
              (
                numericScores.reduce((total, current) => total + current, 0) /
                numericScores.length
              ).toFixed(1)
            )
          : null;

      return {
        studentId: student.id,
        index: index + 1,
        fullName: student.fullName,
        courseLabel: student.course > 0 ? String(student.course) : "—",
        semester: disciplineSemesterScores,
        withoutFinal: computeWithoutFinalValue(),
        finals: finalsData,
        overallAverage,
      };
    });
  });

  const reportRowsByCourseAndSpecialty = computed(() => {
    const courseGroups = new Map<string, Map<string, ReportTableRow[]>>();

    reportRows.value.forEach((row) => {
      const courseKey = row.courseLabel || "—";
      const student = opts.students.value.find((s) => s.id === row.studentId);
      const specialtyKey = student?.specialty || "—";

      if (!courseGroups.has(courseKey)) {
        courseGroups.set(courseKey, new Map());
      }
      const specialtyGroups = courseGroups.get(courseKey)!;
      if (!specialtyGroups.has(specialtyKey)) {
        specialtyGroups.set(specialtyKey, []);
      }
      specialtyGroups.get(specialtyKey)!.push(row);
    });

    const courseEntries = Array.from(courseGroups.entries()).map(
      ([course, specialtyMap]) => {
        const specialtyEntries = Array.from(specialtyMap.entries()).map(
          ([specialtyId, rows]) => {
            const sorted = rows.slice().sort((a, b) =>
              a.fullName.localeCompare(b.fullName, "ru", {
                sensitivity: "base",
              })
            );
            const reindexed = sorted.map((r, i) => ({ ...r, index: i + 1 }));

            const specialty = opts.specialties.value.find(
              (s) => s.id === specialtyId
            );
            const specialtyName =
              specialty?.codeName || specialty?.name || specialtyId;

            return {
              specialtyCode: specialty?.code || specialtyId,
              specialtyName,
              rows: reindexed,
            };
          }
        );

        specialtyEntries.sort((a, b) =>
          a.specialtyName.localeCompare(b.specialtyName, "ru", {
            sensitivity: "base",
          })
        );

        return { course, specialtyGroups: specialtyEntries };
      }
    );

    courseEntries.sort((a, b) => {
      const an = Number.parseInt(a.course, 10);
      const bn = Number.parseInt(b.course, 10);
      const aValid = Number.isFinite(an);
      const bValid = Number.isFinite(bn);
      if (aValid && bValid) return an - bn;
      if (aValid) return -1;
      if (bValid) return 1;
      return a.course.localeCompare(b.course, "ru", { sensitivity: "base" });
    });

    return courseEntries;
  });

  const getDisciplinesForSemesterForGroup = (
    journals: ReportJournalEntry[],
    studentIds: string[]
  ) => {
    const hasData = new Set<string>();
    studentIds.forEach((studentId) => {
      journals.forEach((discipline) => {
        const marks = marksStore.getStudentMarks(discipline.id, studentId);
        if (marks) {
          const hasDateMarks = (marks as Mark[]).some(
            (m: Mark) => m.type === "date"
          );
          if (hasDateMarks) hasData.add(discipline.id);
        }
      });
    });
    return journals
      .filter((d) => hasData.has(d.id))
      .map((d) => ({ id: d.id, title: d.title }));
  };

  const getDisciplinesForWithoutFinalForGroup = (
    journals: ReportJournalEntry[],
    studentIds: string[],
    categoryName: string | null
  ) => {
    if (!categoryName || categoryName === "final") {
      return getDisciplinesForSemesterForGroup(journals, studentIds);
    }
    const hasData = new Set<string>();
    studentIds.forEach((studentId) => {
      journals.forEach((discipline) => {
        const marks = marksStore.getStudentMarks(discipline.id, studentId);
        if (marks) {
          const hasCategory = (marks as Mark[]).some(
            (m: Mark) =>
              m.type === "session" &&
              m.controlType === "intermediate" &&
              m.label === categoryName
          );
          if (hasCategory) hasData.add(discipline.id);
        }
      });
    });
    return journals
      .filter((d) => hasData.has(d.id))
      .map((d) => ({ id: d.id, title: d.title }));
  };

  const getDisciplinesForFinalFormForGroup = (
    journals: ReportJournalEntry[],
    studentIds: string[],
    formId: string
  ) => {
    const hasData = new Set<string>();
    studentIds.forEach((studentId) => {
      journals.forEach((discipline) => {
        const marks = marksStore.getStudentMarks(discipline.id, studentId);
        if (marks) {
          const hasForm = (marks as Mark[]).some(
            (m: Mark) =>
              m.type === "session" &&
              m.controlType === "final" &&
              m.controlId === formId
          );
          if (hasForm) hasData.add(discipline.id);
        }
      });
    });
    return journals
      .filter((d) => hasData.has(d.id))
      .map((d) => ({ id: d.id, title: d.title }));
  };

  const reportGroupsByCourse = computed(() => {
    return reportRowsByCourseAndSpecialty.value.map((courseGroup) => {
      const specialtyGroupsWithDisciplines = courseGroup.specialtyGroups.map(
        (specialtyGroup) => {
          const studentIds = specialtyGroup.rows.map((r) => r.studentId);
          const journals = opts.relevantJournals.value.filter((j) =>
            j.event.participants?.some((id: string) => studentIds.includes(id)) ||
            (j.journal.students || []).some((id: string) => studentIds.includes(id))
          );
          const disciplinesSemester = getDisciplinesForSemesterForGroup(
            journals,
            studentIds
          );
          const categoryValue = opts.selectedReportCategory.value || null;
          const disciplinesWithoutFinal =
            categoryValue === "final" || !categoryValue
              ? []
              : getDisciplinesForWithoutFinalForGroup(
                  journals,
                  studentIds,
                  categoryValue
                );
          const disciplinesByForm: Record<
            string,
            Array<{ id: string; title: string }>
          > = {};
          opts.sortedFinalControls.value.forEach((form) => {
            disciplinesByForm[form.id] = getDisciplinesForFinalFormForGroup(
              journals,
              studentIds,
              form.id
            );
          });

          return {
            specialtyCode: specialtyGroup.specialtyCode,
            specialtyName: specialtyGroup.specialtyName,
            rows: specialtyGroup.rows,
            disciplinesSemester,
            disciplinesWithoutFinal,
            disciplinesByForm,
          };
        }
      );

      return {
        course: courseGroup.course,
        specialtyGroups: specialtyGroupsWithDisciplines,
      };
    });
  });

  const analyticsAverageScore = computed<number | null>(() => {
    const scores = reportRows.value
      .map((r) => r.overallAverage)
      .filter((s): s is number => s !== null);
    return scores.length
      ? scores.reduce((a, b) => a + b, 0) / scores.length
      : null;
  });

  const analyticsAttendancePercent = computed<number | null>(() => {
    let present = 0;
    let total = 0;
    opts.selectedAnalyticsStudents.value.forEach((student) => {
      opts.relevantJournals.value.forEach((journal) => {
        const marks = marksStore.getStudentMarks(journal.id, student.id);
        if (!marks) return;
        marks
          .filter((m: Mark) => m.type === "date")
          .forEach((m: Mark) => {
            if (!Array.isArray(m.values)) return;
            m.values.forEach((v) => {
              if (v === null || v === undefined || v === "") return;
              total++;
              const s = String(v).trim().toLowerCase();
              if (s !== "н" && s !== "б" && s !== "0" && s !== "0.0") {
                present++;
              }
            });
          });
      });
    });
    return total > 0 ? (present / total) * 100 : null;
  });

  const analyticsMonthlyData = computed<{ month: string; avgScore: number }[]>(() => {
    const monthNames = [
      "Янв","Фев","Мар","Апр","Май","Июн",
      "Июл","Авг","Сен","Окт","Ноя","Дек",
    ];
    const byMonth: Record<number, number[]> = {};

    opts.selectedAnalyticsStudents.value.forEach((student) => {
      opts.relevantJournals.value.forEach((journal) => {
        const marks = marksStore.getStudentMarks(journal.id, student.id);
        if (!marks) return;
        marks
          .filter((m: Mark) => m.type === "date" && m.isoDate)
          .forEach((m: Mark) => {
            const month = new Date(m.isoDate!).getMonth();
            if (!Array.isArray(m.values)) return;
            m.values.forEach((v) => {
              const n =
                typeof v === "number"
                  ? v
                  : parseFloat(String(v).replace(",", "."));
              if (Number.isFinite(n)) {
                if (!byMonth[month]) byMonth[month] = [];
                byMonth[month].push(n);
              }
            });
          });
      });
    });

    return Object.entries(byMonth)
      .sort(([a], [b]) => Number(a) - Number(b))
      .map(([monthIdx, values]) => ({
        month: monthNames[Number(monthIdx)],
        avgScore: values.reduce((a, b) => a + b, 0) / values.length,
      }));
  });

  const analyticsOverallAverages = computed<(number | null)[]>(() =>
    reportRows.value.map((r) => r.overallAverage)
  );

  const exportToExcel = async () => {
    if (!opts.canGenerateReport.value) return;

    const date = new Date();
    const filename = `Отчёт_успеваемость_${date.getFullYear()}-${String(
      date.getMonth() + 1
    ).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}.xlsx`;

    try {
      const courseGroups = reportGroupsByCourse.value.map((group) => ({
        course: group.course,
        specialtyGroups: group.specialtyGroups.map((spec) => ({
          specialtyName: spec.specialtyName,
          disciplinesSemester: spec.disciplinesSemester.map((d) => ({
            id: d.id,
            title: d.title,
          })),
          disciplinesWithoutFinal: spec.disciplinesWithoutFinal.map((d) => ({
            id: d.id,
            title: d.title,
          })),
          disciplinesByForm: Object.fromEntries(
            Object.entries(spec.disciplinesByForm).map(([formId, disciplines]) => [
              formId,
              (disciplines as { id: string; title: string }[]).map((d) => ({
                id: d.id,
                title: d.title,
              })),
            ])
          ),
          rows: spec.rows.map((r) => ({
            index: r.index,
            fullName: r.fullName,
            semester: Object.fromEntries(Object.entries(r.semester || {}).map(([k, v]) => [k, v ?? ""])),
            withoutFinal: Object.fromEntries(Object.entries(r.withoutFinal || {}).map(([k, v]) => [k, v ?? ""])),
            finals: Object.fromEntries(
              Object.entries(r.finals || {}).map(([fk, fv]) => [
                fk,
                Object.fromEntries(Object.entries(fv || {}).map(([k, v]) => [k, v ?? ""])),
              ])
            ),
            overallAverage: r.overallAverage ?? undefined,
          })),
        })),
      }));

      const finalForms = opts.sortedFinalControls.value.map((f) => ({
        id: f.id,
        shortName: f.shortName,
      }));

      await exportAnalyticsViaConvex({ courseGroups, finalForms }, filename);
    } catch (e) {
      console.error("[excel] export failed", e);
      f7.dialog.alert(analytics_export_error());
    }
  };

  return {
    reportRows,
    reportRowsByCourseAndSpecialty,
    reportGroupsByCourse,
    analyticsAverageScore,
    analyticsAttendancePercent,
    analyticsMonthlyData,
    analyticsOverallAverages,
    exportToExcel,
  };
}
