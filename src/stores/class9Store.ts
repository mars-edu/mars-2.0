import { defineStore } from "pinia";
import { ref, computed } from "vue";

export interface StepData {
  moduleIndex: string;
  moduleName: string;
  learningOutcome: string;
  examEnabled: boolean;
  examSemesters: boolean[];
  creditEnabled: boolean;
  creditSemesters: boolean[];
  controlLessonEnabled: boolean;
  controlLessonSemesters: boolean[];
  totalCredits: string;
  totalHours: string;
  theoreticalHours: string;
  labPracticalHours: string;
  field3Value: string;
  srspHours: string;
  srsHours: string;
  trainingPracticeHours: string;
  individualHours: string;
  distributionSemestersActive: boolean[];
  distributionSemesterHours: string[];
}

export interface Class9Data {
  id: string;
  courseId: string;
  specialtyId: string;
  steps: StepData[];
  createdAt: Date;
  updatedAt: Date;
}

export const useClass9Store = defineStore(
  "class9",
  () => {
    const class9Items = ref<Class9Data[]>([]);
    const loading = ref(false);
    const error = ref<string | null>(null);

    const getClass9ById = computed(() => {
      return (id: string) => class9Items.value.find((c) => c.id === id);
    });

    const getClass9ByCourseId = computed(() => {
      return (courseId: string, specialtyId: string) =>
        class9Items.value.find((c) => c.courseId === courseId && c.specialtyId === specialtyId);
    });

    const getAllClass9Items = computed(() => class9Items.value);
    const isLoading = computed(() => loading.value);
    const getError = computed(() => error.value);

    function createEmptyStepData(): StepData {
      return {
        moduleIndex: '',
        moduleName: '',
        learningOutcome: '',
        examEnabled: false,
        examSemesters: Array(8).fill(false),
        creditEnabled: false,
        creditSemesters: Array(8).fill(false),
        controlLessonEnabled: false,
        controlLessonSemesters: Array(8).fill(false),
        totalCredits: '',
        totalHours: '',
        theoreticalHours: '',
        labPracticalHours: '',
        field3Value: '',
        srspHours: '',
        srsHours: '',
        trainingPracticeHours: '',
        individualHours: '',
        distributionSemestersActive: Array(8).fill(false),
        distributionSemesterHours: Array(8).fill(''),
      };
    }

    async function addClass9(courseId: string, specialtyId: string, steps: StepData[] = [createEmptyStepData()]) {
      loading.value = true;
      try {
        const newClass9: Class9Data = {
          id: crypto.randomUUID(),
          courseId,
          specialtyId,
          steps,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        class9Items.value.push(newClass9);
        error.value = null;
        return newClass9;
      } catch (err) {
        error.value = err instanceof Error ? err.message : "Failed to add class9 data";
        throw err;
      } finally {
        loading.value = false;
      }
    }

    async function updateClass9(id: string, steps: StepData[]) {
      loading.value = true;
      try {
        const index = class9Items.value.findIndex((c) => c.id === id);
        if (index === -1) {
          throw new Error("Class9 data not found");
        }

        const updatedClass9 = {
          ...class9Items.value[index],
          steps,
          updatedAt: new Date(),
        };

        class9Items.value[index] = updatedClass9;
        error.value = null;
        return updatedClass9;
      } catch (err) {
        error.value = err instanceof Error ? err.message : "Failed to update class9 data";
        throw err;
      } finally {
        loading.value = false;
      }
    }

    async function deleteClass9(id: string) {
      loading.value = true;
      try {
        class9Items.value = class9Items.value.filter((c) => c.id !== id);
        error.value = null;
      } catch (err) {
        error.value = err instanceof Error ? err.message : "Failed to delete class9 data";
        throw err;
      } finally {
        loading.value = false;
      }
    }

    function clearError() {
      error.value = null;
    }

    return {
      class9Items,
      loading,
      error,
      getClass9ById,
      getClass9ByCourseId,
      getAllClass9Items,
      isLoading,
      getError,
      createEmptyStepData,
      addClass9,
      updateClass9,
      deleteClass9,
      clearError,
    };
  },
  {
    persist: true,
  }
); 