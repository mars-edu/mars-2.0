import { defineStore } from "pinia";
import { ref, computed } from "vue";
import { useCourseStore } from "./courseStore";

export interface Journal {
  id: number | string;
  course: number;
  title: string;
  status?: string;
  isPlaceholder?: boolean;
}

export const useJournalStore = defineStore("journal", () => {
  const journals = ref<Journal[]>([]);
  const isLoading = ref(false);
  const error = ref<string | null>(null);
  const courseStore = useCourseStore();

  const fetchJournals = async () => {
    isLoading.value = true;
    error.value = null;
    try {
      // Mock data, replace with API call later
      const mockJournals: Journal[] = [
        {
          id: 1,
          course: 3,
          title: "БМ4.Р.О.1. Владеть основами философских знаний ФКРВ(э)С",
          status: "Каз",
        },
        { id: 2, course: 1, title: "" },
        { id: 3, course: 1, title: "" },
        { id: 4, course: 2, title: "" },
        { id: 5, course: 2, title: "" },
        { id: 6, course: 2, title: "" },
        { id: 7, course: 2, title: "" },
        { id: 8, course: 4, title: "" },
      ];
      journals.value = mockJournals;
    } catch (e) {
      error.value = e instanceof Error ? e.message : "Failed to fetch journals";
    } finally {
      isLoading.value = false;
    }
  };

  const journalsByCourse = computed(() => {
    const grouped: { [key: number]: Journal[] } = {};
    journals.value.forEach((journal) => {
      if (!grouped[journal.course]) {
        grouped[journal.course] = [];
      }
      grouped[journal.course].push(journal);
    });

    courseStore.courses.forEach((course) => {
      const courseKey = parseInt(course.number, 10);
      if (!grouped[courseKey] || grouped[courseKey].length === 0) {
        grouped[courseKey] = [
          {
            id: `placeholder_${courseKey}`,
            course: courseKey,
            title: "",
            isPlaceholder: true,
          },
        ];
      }
    });

    return grouped;
  });

  const reset = () => {
    journals.value = [];
    isLoading.value = false;
    error.value = null;
  };

  return {
    journals,
    isLoading,
    error,
    fetchJournals,
    journalsByCourse,
    reset,
  };
}); 