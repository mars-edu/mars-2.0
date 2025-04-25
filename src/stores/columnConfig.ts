import { defineStore } from "pinia";
import { ref, computed } from "vue";

interface Column {
  name: string;
  width: number;
}

interface CourseColumnConfig {
  [courseId: string]: Column[];
}

export const useColumnConfigStore = defineStore(
  "columnConfig",
  () => {
    const columnsByCourse = ref<CourseColumnConfig>({});

    function setColumnsForCourse(courseId: string, newColumns: Column[]) {
      columnsByCourse.value[courseId] = [...newColumns];
    }

    function getColumnsForCourse(courseId: string) {
      return columnsByCourse.value[courseId] || [];
    }

    function resetColumnsForCourse(courseId: string) {
      if (columnsByCourse.value[courseId]) {
        delete columnsByCourse.value[courseId];
      }
    }

    function hasColumnsForCourse(courseId: string) {
      return (
        !!columnsByCourse.value[courseId] &&
        columnsByCourse.value[courseId].length > 0
      );
    }

    return {
      columnsByCourse,
      setColumnsForCourse,
      getColumnsForCourse,
      resetColumnsForCourse,
      hasColumnsForCourse,
    };
  },
  {
    persist: true,
  }
);
