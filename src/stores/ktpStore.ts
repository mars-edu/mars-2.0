import { defineStore } from "pinia";
import { ref, computed } from "vue";
import type { ParsedLesson } from "@/services/excel-parser";

export interface Ktp {
  id: string;
  class9Id: string;
  academicYearId: string;
  semesterId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface KtpDetail {
  id: string;
  ktpId: string;
  position: number;
  theme: string;
  totalHours: number | null;
  srsp: number | null;
  srs: number | null;
  homework: string;
  notes: string;
}

function createEmptyKtpDetail(ktpId: string, position: number): KtpDetail {
  return {
    id: crypto.randomUUID(),
    ktpId,
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
    const ktps = ref<Ktp[]>([]);
    const ktpDetails = ref<KtpDetail[]>([]);
    const loading = ref(false);
    const error = ref<string | null>(null);

    function findKtpByClass9Id(
      class9Id: string,
      academicYearId?: string,
      semesterId?: string
    ): Ktp | undefined {
      return ktps.value.find(
        (k) =>
          k.class9Id === class9Id &&
          (!academicYearId || k.academicYearId === academicYearId) &&
          (!semesterId || k.semesterId === semesterId)
      );
    }

    function findKtpById(ktpId: string): Ktp | undefined {
      return ktps.value.find((k) => k.id === ktpId);
    }

    function createKtp(
      class9Id: string,
      academicYearId: string,
      semesterId: string
    ): Ktp {
      const newKtp: Ktp = {
        id: crypto.randomUUID(),
        class9Id,
        academicYearId,
        semesterId,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      ktps.value.push(newKtp);
      return newKtp;
    }

    function ensureKtpForClass9(
      class9Id: string,
      academicYearId: string,
      semesterId: string
    ): Ktp {
      const existing = findKtpByClass9Id(class9Id, academicYearId, semesterId);
      return existing || createKtp(class9Id, academicYearId, semesterId);
    }

    function fetchDetailsForKtp(ktpId: string) {
      loading.value = true;
      error.value = null;

      // Filter existing store data by ktpId
      const filteredDetails = ktpDetails.value
        .filter((d) => d.ktpId === ktpId)
        .sort((a, b) => a.position - b.position);

      // If no data exists for this parent, initialize with empty array
      if (
        filteredDetails.length === 0 &&
        !ktpDetails.value.some((d) => d.ktpId === ktpId)
      ) {
        // You can optionally add some default empty items here if needed
        // For now, we'll just use an empty array
      }

      loading.value = false;
    }

    function addKtpDetail(
      ktpId: string,
      data: Partial<Omit<KtpDetail, "id" | "ktpId" | "position">>
    ) {
      const newPosition = ktpDetails.value.length + 1;
      const newItem = {
        ...createEmptyKtpDetail(ktpId, newPosition),
        ...data,
      };
      ktpDetails.value.push(newItem);
    }

    function updateKtpDetail(
      id: string,
      data: Partial<Omit<KtpDetail, "id" | "ktpId">>
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

    function deleteKtpByClass9Id(
      class9Id: string,
      academicYearId?: string,
      semesterId?: string
    ) {
      const ktp = findKtpByClass9Id(class9Id, academicYearId, semesterId);
      if (!ktp) return { success: true, deleted: 0 };

      // Delete all KTP details for this KTP
      const deletedDetails = ktpDetails.value.filter(
        (d) => d.ktpId === ktp.id
      ).length;
      ktpDetails.value = ktpDetails.value.filter((d) => d.ktpId !== ktp.id);

      // Delete the KTP record itself
      ktps.value = ktps.value.filter((k) => k.id !== ktp.id);

      return { success: true, deleted: deletedDetails };
    }

    function deleteKtpById(ktpId: string) {
      const ktp = ktps.value.find((k) => k.id === ktpId);
      if (!ktp) return { success: true, deleted: 0 };

      // Delete all KTP details for this KTP
      const deletedDetails = ktpDetails.value.filter(
        (d) => d.ktpId === ktpId
      ).length;
      ktpDetails.value = ktpDetails.value.filter((d) => d.ktpId !== ktpId);

      // Delete the KTP record itself
      ktps.value = ktps.value.filter((k) => k.id !== ktpId);

      return { success: true, deleted: deletedDetails };
    }

    function reorderKtpDetails(ktpId: string, reorderedIds: string[]) {
      try {
        error.value = null;

        const parentDetails = ktpDetails.value.filter((d) => d.ktpId === ktpId);
        const otherDetails = ktpDetails.value.filter((d) => d.ktpId !== ktpId);

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

    function bulkImportKtpDetails(ktpId: string, lessons: ParsedLesson[]) {
      try {
        error.value = null;

        const newDetails: KtpDetail[] = lessons.map((lesson, index) => ({
          id: crypto.randomUUID(),
          ktpId,
          position: lesson.lessonNumber || index + 1,
          theme: lesson.subject || lesson.lessonType || "",
          totalHours: typeof lesson.hours === "number" ? lesson.hours : null,
          srsp: null,
          srs: null,
          homework: lesson.homework || "",
          notes: lesson.notes || "",
        }));

        // Remove existing KTP details for this ktpId
        ktpDetails.value = ktpDetails.value.filter((d) => d.ktpId !== ktpId);
        ktpDetails.value.push(...newDetails);
        ktpDetails.value.sort((a, b) => a.position - b.position);

        return { success: true, imported: newDetails.length };
      } catch (err) {
        error.value =
          err instanceof Error ? err.message : "Failed to import data";
        return { success: false, error: error.value };
      }
    }

    const getDetailsByKtpId = computed(() => {
      return (ktpId: string) =>
        ktpDetails.value
          .filter((d) => d.ktpId === ktpId)
          .sort((a, b) => a.position - b.position);
    });

    // Convenience wrappers by class9Id for existing components
    function fetchDetailsForClass9(
      class9Id: string,
      academicYearId?: string,
      semesterId?: string
    ) {
      const ktp = ensureKtpForClass9(
        class9Id,
        academicYearId || "",
        semesterId || ""
      );
      return fetchDetailsForKtp(ktp.id);
    }

    function addKtpDetailForClass9(
      class9Id: string,
      data: Partial<Omit<KtpDetail, "id" | "ktpId" | "position">>,
      academicYearId?: string,
      semesterId?: string
    ) {
      const ktp = ensureKtpForClass9(
        class9Id,
        academicYearId || "",
        semesterId || ""
      );
      return addKtpDetail(ktp.id, data);
    }

    function reorderKtpDetailsForClass9(
      class9Id: string,
      reorderedIds: string[],
      academicYearId?: string,
      semesterId?: string
    ) {
      const ktp = ensureKtpForClass9(
        class9Id,
        academicYearId || "",
        semesterId || ""
      );
      return reorderKtpDetails(ktp.id, reorderedIds);
    }

    function bulkImportKtpDetailsForClass9(
      class9Id: string,
      lessons: ParsedLesson[],
      academicYearId?: string,
      semesterId?: string
    ) {
      const ktp = ensureKtpForClass9(
        class9Id,
        academicYearId || "",
        semesterId || ""
      );
      return bulkImportKtpDetails(ktp.id, lessons);
    }

    const getDetailsByClass9Id = computed(() => {
      return (
        class9Id: string,
        academicYearId?: string,
        semesterId?: string
      ) => {
        const ktp = ensureKtpForClass9(
          class9Id,
          academicYearId || "",
          semesterId || ""
        );
        return getDetailsByKtpId.value(ktp.id);
      };
    });

    const getKtpIdForClass9 = computed(() => {
      return (
        class9Id: string | null | undefined,
        academicYearId?: string,
        semesterId?: string
      ) => {
        if (!class9Id) return null;
        const ktp = findKtpByClass9Id(
          class9Id || "",
          academicYearId,
          semesterId
        );
        return ktp ? ktp.id : null;
      };
    });

    const getModuleTitleForKtp = computed(() => {
      return (ktpId: string | null | undefined) => {
        if (!ktpId) return "Рабочие учебные программы";
        const ktpItem = ktps.value.find((ktp) => ktp.id === ktpId);
        if (!ktpItem) return "Рабочие учебные программы";

        // Return a basic title since we can't access class9Store from within ktpStore
        return `КТП ${ktpItem.id.slice(0, 8)}`;
      };
    });

    return {
      ktps,
      ktpDetails,
      loading,
      error,
      // Primary KTP-based APIs
      ensureKtpForClass9,
      findKtpByClass9Id,
      findKtpById,
      fetchDetailsForKtp,
      addKtpDetail,
      updateKtpDetail,
      deleteKtpDetail,
      deleteKtpByClass9Id,
      deleteKtpById,
      reorderKtpDetails,
      bulkImportKtpDetails,
      getDetailsByKtpId,
      getKtpIdForClass9,
      getModuleTitleForKtp,
      // Convenience class9-based APIs (backward compat)
      fetchDetailsForClass9,
      addKtpDetailForClass9,
      reorderKtpDetailsForClass9,
      bulkImportKtpDetailsForClass9,
      getDetailsByClass9Id,
    };
  },
  {
    persist: true,
  }
);
