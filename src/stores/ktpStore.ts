import { defineStore } from "pinia";
import { ref, computed } from "vue";
import type { ParsedLesson } from "@/services/excel-parser";

export interface KtpDetail {
  id: string;
  parentId: string;
  position: number;
  theme: string;
  totalHours: number | null;
  srsp: number | null;
  srs: number | null;
  homework: string;
  notes: string;
}

function createEmptyKtpDetail(parentId: string, position: number): KtpDetail {
  return {
    id: crypto.randomUUID(),
    parentId,
    position,
    theme: "",
    totalHours: null,
    srsp: null,
    srs: null,
    homework: "",
    notes: "",
  };
}

export const useKtpStore = defineStore(
  "ktp",
  () => {
    const ktpDetails = ref<KtpDetail[]>([]);
    const loading = ref(false);
    const error = ref<string | null>(null);

    function fetchDetailsForParent(parentId: string) {
      loading.value = true;
      error.value = null;

      // Filter existing store data by parentId
      const filteredDetails = ktpDetails.value
        .filter((d) => d.parentId === parentId)
        .sort((a, b) => a.position - b.position);

      // If no data exists for this parent, initialize with empty array
      if (
        filteredDetails.length === 0 &&
        !ktpDetails.value.some((d) => d.parentId === parentId)
      ) {
        // You can optionally add some default empty items here if needed
        // For now, we'll just use an empty array
      }

      loading.value = false;
    }

    function addKtpDetail(
      parentId: string,
      data: Partial<Omit<KtpDetail, "id" | "parentId" | "position">>
    ) {
      const newPosition = ktpDetails.value.length + 1;
      const newItem = {
        ...createEmptyKtpDetail(parentId, newPosition),
        ...data,
      };
      ktpDetails.value.push(newItem);
    }

    function updateKtpDetail(
      id: string,
      data: Partial<Omit<KtpDetail, "id" | "parentId">>
    ) {
      const index = ktpDetails.value.findIndex((d) => d.id === id);
      if (index !== -1) {
        ktpDetails.value[index] = { ...ktpDetails.value[index], ...data };
      }
    }

    function deleteKtpDetail(id: string) {
      ktpDetails.value = ktpDetails.value.filter((d) => d.id !== id);
      ktpDetails.value.forEach((item, index) => {
        item.position = index + 1;
      });
    }

    function reorderKtpDetails(parentId: string, reorderedIds: string[]) {
      try {
        error.value = null;

        const parentDetails = ktpDetails.value.filter(
          (d) => d.parentId === parentId
        );
        const otherDetails = ktpDetails.value.filter(
          (d) => d.parentId !== parentId
        );

        const validIds = new Set(parentDetails.map((d) => d.id));
        const filteredOrder = reorderedIds.filter((id) => validIds.has(id));
        if (filteredOrder.length !== parentDetails.length) {
          throw new Error("Reorder list does not match parent items");
        }

        const mapById = new Map(parentDetails.map((d) => [d.id, d] as const));
        const reorderedDetails = filteredOrder.map((id, index) => ({
          ...mapById.get(id)!,
          position: index + 1,
        }));

        ktpDetails.value = [...otherDetails, ...reorderedDetails];
        return { success: true, reordered: reorderedDetails.length };
      } catch (err) {
        error.value =
          err instanceof Error ? err.message : "Failed to reorder items";
        return { success: false, error: error.value };
      }
    }

    function bulkImportKtpDetails(parentId: string, lessons: ParsedLesson[]) {
      try {
        error.value = null;

        const newDetails: KtpDetail[] = lessons.map((lesson, index) => ({
          id: crypto.randomUUID(),
          parentId,
          position: lesson.lessonNumber || index + 1,
          theme: lesson.subject || lesson.lessonType || "",
          totalHours: typeof lesson.hours === "number" ? lesson.hours : null,
          srsp: null,
          srs: null,
          homework: lesson.homework || "",
          notes: lesson.notes || "",
        }));

        ktpDetails.value = ktpDetails.value.filter(
          (d) => d.parentId !== parentId
        );
        ktpDetails.value.push(...newDetails);
        ktpDetails.value.sort((a, b) => a.position - b.position);

        return { success: true, imported: newDetails.length };
      } catch (err) {
        error.value =
          err instanceof Error ? err.message : "Failed to import data";
        return { success: false, error: error.value };
      }
    }

    const getDetailsByParentId = computed(() => {
      return (parentId: string) =>
        ktpDetails.value
          .filter((d) => d.parentId === parentId)
          .sort((a, b) => a.position - b.position);
    });

    return {
      ktpDetails,
      loading,
      error,
      fetchDetailsForParent,
      addKtpDetail,
      updateKtpDetail,
      deleteKtpDetail,
      reorderKtpDetails,
      bulkImportKtpDetails,
      getDetailsByParentId,
    };
  },
  {
    persist: true,
  }
);
