import { defineStore } from "pinia";
import { ref, computed } from "vue";

export interface Journal {
  id: number | string;
  category: number;
  title: string;
  status?: string;
}

export const useJournalStore = defineStore("journal", () => {
  const journals = ref<Journal[]>([]);
  const isLoading = ref(false);
  const error = ref<string | null>(null);

  const fetchJournals = async () => {
    isLoading.value = true;
    error.value = null;
    try {
      // Mock data, replace with API call later
      const mockJournals: Journal[] = [
        {
          id: 1,
          category: 3,
          title: "БМ4.Р.О.1. Владеть основами философских знаний ФКРВ(э)С",
          status: "Каз",
        },
        { id: 2, category: 1, title: "" },
        { id: 3, category: 1, title: "" },
        { id: 4, category: 2, title: "" },
        { id: 5, category: 2, title: "" },
        { id: 6, category: 2, title: "" },
        { id: 7, category: 2, title: "" },
        { id: 8, category: 4, title: "" },
      ];
      journals.value = mockJournals;
    } catch (e) {
      error.value = e instanceof Error ? e.message : "Failed to fetch journals";
    } finally {
      isLoading.value = false;
    }
  };

  const journalsByCategory = computed(() => {
    const grouped: { [key: number]: Journal[] } = { 1: [], 2: [], 3: [], 4: [] };
    journals.value.forEach((journal) => {
      if (grouped[journal.category]) {
        grouped[journal.category].push(journal);
      }
    });
    // Ensure at least two items in category 1 and four in category 2 for layout
    while (grouped[1].length < 2) {
      grouped[1].push({ id: `ph_1_${grouped[1].length}`, category: 1, title: "" });
    }
    while (grouped[2].length < 4) {
      grouped[2].push({ id: `ph_2_${grouped[2].length}`, category: 2, title: "" });
    }
    return grouped;
  });


  return {
    journals,
    isLoading,
    error,
    fetchJournals,
    journalsByCategory,
  };
}); 