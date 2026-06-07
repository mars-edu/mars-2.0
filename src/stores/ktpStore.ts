import { defineStore } from "pinia";
import { ref, computed, watch } from "vue";
import type { ParsedLesson } from "@/services/excel-parser";
import { convex } from "@/lib/convexClient";
import { api } from "@convex/_generated/api";
import { useConvexQuery } from "convex-vue";

export interface Ktp {
  id: string;
  rupEntryId: string;
  academicYearId: string;
  semesterId: string;
  eventId?: string; // Back-reference to the calendar event (if KTP is event-specific)
  name?: string; // Optional custom name for the KTP
  color?: string; // hex, e.g. '#FACC15'
  languages?: string[]; // subset of ['KZ','RU','EN']
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
  theoretical: number | null;
  practical: number | null;
  individual: number | null;
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
    theoretical: null,
    practical: null,
    individual: null,
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

    function findKtpByRupEntryId(
      rupEntryId: string,
      academicYearId?: string,
      semesterId?: string,
      eventId?: string
    ): Ktp | undefined {
      return ktps.value.find(
        (k) =>
          k.rupEntryId === rupEntryId &&
          (!academicYearId || k.academicYearId === academicYearId) &&
          (!semesterId || k.semesterId === semesterId) &&
          (!eventId || k.eventId === eventId)
      );
    }

    function findKtpById(ktpId: string): Ktp | undefined {
      return ktps.value.find((k) => k.id === ktpId);
    }

    async function createKtp(
      rupEntryId: string,
      academicYearId: string,
      semesterId: string,
      eventId?: string,
      name?: string,
      extra?: { color?: string; languages?: string[] }
    ): Promise<Ktp> {
      const id = await convex.mutation(api.ktps.mutations.create, {
        rupEntryId,
        academicYearId,
        semesterId,
        eventId,
        name,
        color: extra?.color,
        languages: extra?.languages,
      });
      const created = await convex.query(api.ktps.queries.getById, { id });
      if (created) {
        const mapped: Ktp = {
          id: created._id,
          rupEntryId: created.rupEntryId,
          academicYearId: created.academicYearId,
          semesterId: created.semesterId,
          eventId: created.eventId,
          name: created.name,
          color: created.color,
          languages: created.languages,
          createdAt: new Date(created.createdAt),
          updatedAt: new Date(created.updatedAt),
        };
        ktps.value.push(mapped);
        return mapped;
      }

      // Fallback if query fails
      throw new Error("Failed to create KTP");
    }

    async function ensureKtpForRupEntry(
      rupEntryId: string,
      academicYearId: string,
      semesterId: string,
      eventId?: string,
      name?: string,
      extra?: { color?: string; languages?: string[] }
    ): Promise<Ktp> {
      if (!semesterId) {
        throw new Error("semesterId is required to create a KTP");
      }
      const existing = findKtpByRupEntryId(rupEntryId, academicYearId, semesterId, eventId);
      return existing || await createKtp(rupEntryId, academicYearId, semesterId, eventId, name, extra);
    }

    async function updateKtp(
      id: string,
      data: { name?: string; color?: string; languages?: string[] }
    ) {
      await convex.mutation(api.ktps.mutations.update, {
        id: id as any,
        ...data,
      });
      const index = ktps.value.findIndex((k) => k.id === id);
      if (index !== -1) {
        ktps.value[index] = { ...ktps.value[index], ...data };
      }
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

    /** Re-query one ktp from Convex and replace its local details. */
    async function refreshDetailsFromBackend(ktpId: string): Promise<number> {
      const updated = await convex.query(api.ktps.queries.getById, { id: ktpId as any });
      if (!updated || !updated.details) return 0;
      ktpDetails.value = ktpDetails.value.filter((d) => d.ktpId !== ktpId);
      const mappedDetails = updated.details.map((d: any) => ({
        id: d._id,
        ktpId: d.ktpId,
        position: d.position,
        theme: d.theme,
        totalHours: d.totalHours ?? null,
        srsp: d.srsp ?? null,
        srs: d.srs ?? null,
        theoretical: d.theoretical ?? null,
        practical: d.practical ?? null,
        individual: d.individual ?? null,
        homework: d.homework,
        notes: d.notes,
      }));
      ktpDetails.value.push(...mappedDetails);
      return mappedDetails.length;
    }

    async function addKtpDetail(
      ktpId: string,
      data: Partial<Omit<KtpDetail, "id" | "ktpId" | "position">>
    ) {
      const newPosition = ktpDetails.value.filter(d => d.ktpId === ktpId).length + 1;
      const id = await convex.mutation(api.ktps.mutations.addDetail, {
        ktpId: ktpId as any,
        position: newPosition,
        theme: data.theme || "",
        totalHours: data.totalHours ?? undefined,
        srsp: data.srsp ?? undefined,
        srs: data.srs ?? undefined,
        theoretical: data.theoretical ?? undefined,
        practical: data.practical ?? undefined,
        individual: data.individual ?? undefined,
        homework: data.homework || "",
        notes: data.notes || "",
      });
      const created = await convex.query(api.ktps.queries.getById, { id: ktpId as any });
      if (created && created.details) {
        const newDetail = created.details.find((d: any) => d._id === id);
        if (newDetail) {
          const mapped: KtpDetail = {
            id: newDetail._id,
            ktpId: newDetail.ktpId,
            position: newDetail.position,
            theme: newDetail.theme,
            totalHours: newDetail.totalHours,
            srsp: newDetail.srsp,
            srs: newDetail.srs,
            theoretical: newDetail.theoretical ?? null,
            practical: newDetail.practical ?? null,
            individual: newDetail.individual ?? null,
            homework: newDetail.homework,
            notes: newDetail.notes,
          };
          ktpDetails.value.push(mapped);
        }
      }
    }

    async function updateKtpDetail(
      id: string,
      data: Partial<Omit<KtpDetail, "id" | "ktpId">>
    ) {
      await convex.mutation(api.ktps.mutations.updateDetail, {
        id: id as any,
        position: data.position,
        theme: data.theme,
        totalHours: data.totalHours ?? undefined,
        srsp: data.srsp ?? undefined,
        srs: data.srs ?? undefined,
        theoretical: data.theoretical ?? undefined,
        practical: data.practical ?? undefined,
        individual: data.individual ?? undefined,
        homework: data.homework,
        notes: data.notes,
      });

      const index = ktpDetails.value.findIndex((d) => d.id === id);
      if (index !== -1) {
        ktpDetails.value[index] = { ...ktpDetails.value[index], ...data };
      }
    }

    async function deleteKtpDetail(id: string) {
      const target = ktpDetails.value.find((d) => d.id === id);
      await convex.mutation(api.ktps.mutations.removeDetail, {
        id: id as any,
      });

      ktpDetails.value = ktpDetails.value.filter((d) => d.id !== id);
      if (target) {
        // Renumber only the affected ktp's details, in position order
        ktpDetails.value
          .filter((d) => d.ktpId === target.ktpId)
          .sort((a, b) => a.position - b.position)
          .forEach((item, index) => {
            item.position = index + 1;
          });
      }
    }

    async function clearKtpDetails(ktpId: string) {
      await convex.mutation(api.ktps.mutations.clearDetails, {
        ktpId: ktpId as any,
      });
      ktpDetails.value = ktpDetails.value.filter((d) => d.ktpId !== ktpId);
    }

    async function deleteKtpByRupEntryId(
      rupEntryId: string,
      academicYearId?: string,
      semesterId?: string
    ) {
      const ktp = findKtpByRupEntryId(rupEntryId, academicYearId, semesterId);
      if (!ktp) return { success: true, deleted: 0 };

      // Delete on backend first (cascades to details server-side)
      await convex.mutation(api.ktps.mutations.remove, {
        id: ktp.id as any,
      });

      // Delete all KTP details for this KTP
      const deletedDetails = ktpDetails.value.filter(
        (d) => d.ktpId === ktp.id
      ).length;
      ktpDetails.value = ktpDetails.value.filter((d) => d.ktpId !== ktp.id);

      // Delete the KTP record itself
      ktps.value = ktps.value.filter((k) => k.id !== ktp.id);

      return { success: true, deleted: deletedDetails };
    }

    async function deleteKtpById(ktpId: string) {
      await convex.mutation(api.ktps.mutations.remove, {
        id: ktpId as any,
      });

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

    async function reorderKtpDetails(ktpId: string, reorderedIds: string[]) {
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

        // Optimistic local update
        ktpDetails.value = [...otherDetails, ...reorderedDetails];

        // Persist to backend; revert local state from backend on failure
        try {
          await convex.mutation(api.ktps.mutations.reorderDetails, {
            ktpId: ktpId as any,
            orderedIds: filteredOrder as any,
          });
        } catch (mutationErr) {
          await refreshDetailsFromBackend(ktpId);
          throw mutationErr;
        }

        return { success: true, reordered: reorderedDetails.length };
      } catch (err) {
        error.value =
          err instanceof Error ? err.message : "Failed to reorder items";
        return { success: false, error: error.value };
      }
    }

    async function bulkImportKtpDetails(ktpId: string, lessons: ParsedLesson[]) {
      try {
        error.value = null;

        // Use Convex bulk import
        const details = lessons.map((lesson, index) => ({
          position: lesson.lessonNumber || index + 1,
          theme: lesson.subject || lesson.lessonType || "",
          totalHours: typeof lesson.hours === "number" ? lesson.hours : undefined,
          srsp: undefined,
          srs: undefined,
          homework: lesson.homework || "",
          notes: lesson.notes || "",
        }));

        await convex.mutation(api.ktps.mutations.bulkImportDetails, {
          ktpId: ktpId as any,
          details,
          replace: true,
        });

        // Reload the KTP with new details
        const imported = await refreshDetailsFromBackend(ktpId);
        return { success: true, imported };
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

    // Convenience wrappers by RUP entry ID for existing components
    async function fetchDetailsForRupEntry(
      rupEntryId: string,
      academicYearId?: string,
      semesterId?: string
    ) {
      if (!academicYearId || !semesterId) {
        throw new Error("academicYearId and semesterId are required");
      }
      const ktp = await ensureKtpForRupEntry(
        rupEntryId,
        academicYearId,
        semesterId
      );
      return fetchDetailsForKtp(ktp.id);
    }

    async function addKtpDetailForRupEntry(
      rupEntryId: string,
      data: Partial<Omit<KtpDetail, "id" | "ktpId" | "position">>,
      academicYearId?: string,
      semesterId?: string
    ) {
      if (!academicYearId || !semesterId) {
        throw new Error("academicYearId and semesterId are required");
      }
      const ktp = await ensureKtpForRupEntry(
        rupEntryId,
        academicYearId,
        semesterId
      );
      return addKtpDetail(ktp.id, data);
    }

    async function reorderKtpDetailsForRupEntry(
      rupEntryId: string,
      reorderedIds: string[],
      academicYearId?: string,
      semesterId?: string
    ) {
      if (!academicYearId || !semesterId) {
        throw new Error("academicYearId and semesterId are required");
      }
      const ktp = await ensureKtpForRupEntry(
        rupEntryId,
        academicYearId,
        semesterId
      );
      return reorderKtpDetails(ktp.id, reorderedIds);
    }

    async function bulkImportKtpDetailsForRupEntry(
      rupEntryId: string,
      lessons: ParsedLesson[],
      academicYearId?: string,
      semesterId?: string
    ) {
      if (!academicYearId || !semesterId) {
        throw new Error("academicYearId and semesterId are required");
      }
      const ktp = await ensureKtpForRupEntry(
        rupEntryId,
        academicYearId,
        semesterId
      );
      return bulkImportKtpDetails(ktp.id, lessons);
    }

    const getDetailsByRupEntryId = computed(() => {
      return (
        rupEntryId: string,
        academicYearId?: string,
        semesterId?: string
      ) => {
        if (!academicYearId || !semesterId) {
          throw new Error("academicYearId and semesterId are required");
        }
        const ktp = findKtpByRupEntryId(
          rupEntryId,
          academicYearId,
          semesterId
        );
        if (!ktp) return [];
        return getDetailsByKtpId.value(ktp.id);
      };
    });

    const getKtpIdForRupEntry = computed(() => {
      return (
        rupEntryId: string | null | undefined,
        academicYearId?: string,
        semesterId?: string
      ) => {
        if (!rupEntryId) return null;
        const ktp = findKtpByRupEntryId(
          rupEntryId || "",
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

        // Return a basic title since we can't access rupEntryStore from within ktpStore
        return `КТП ${ktpItem.id.slice(0, 8)}`;
      };
    });

    async function loadFromBackend() {
      loading.value = true;
      try {
        const data = await convex.query(api.ktps.queries.list, {});

        // Clear existing data
        ktps.value = [];
        ktpDetails.value = [];

        // Map ktps and their nested details
        data.forEach((ktp: any) => {
          ktps.value.push({
            id: ktp._id,
            rupEntryId: ktp.rupEntryId,
            academicYearId: ktp.academicYearId,
            semesterId: ktp.semesterId,
            eventId: ktp.eventId,
            name: ktp.name,
            color: ktp.color,
            languages: ktp.languages,
            createdAt: new Date(ktp.createdAt),
            updatedAt: new Date(ktp.updatedAt),
          });

          // Map nested details
          if (ktp.details && ktp.details.length > 0) {
            ktp.details.forEach((detail: any) => {
              ktpDetails.value.push({
                id: detail._id,
                ktpId: detail.ktpId,
                position: detail.position,
                theme: detail.theme,
                totalHours: detail.totalHours,
                srsp: detail.srsp,
                srs: detail.srs,
                theoretical: detail.theoretical ?? null,
                practical: detail.practical ?? null,
                individual: detail.individual ?? null,
                homework: detail.homework,
                notes: detail.notes,
              });
            });
          }
        });

        error.value = null;
      } catch (err) {
        console.error("[ktpStore] Failed to load from Convex:", err);
        error.value = "Failed to load ktps";
      } finally {
        loading.value = false;
      }
    }

    return {
      ktps,
      ktpDetails,
      loading,
      error,
      // Primary KTP-based APIs
      ensureKtpForRupEntry,
      updateKtp,
      findKtpByRupEntryId,
      findKtpById,
      fetchDetailsForKtp,
      refreshDetailsFromBackend,
      addKtpDetail,
      updateKtpDetail,
      deleteKtpDetail,
      deleteKtpByRupEntryId,
      deleteKtpById,
      clearKtpDetails,
      reorderKtpDetails,
      bulkImportKtpDetails,
      getDetailsByKtpId,
      getKtpIdForRupEntry,
      getModuleTitleForKtp,
      // Convenience RUP entry-based APIs (backward compat)
      fetchDetailsForRupEntry,
      addKtpDetailForRupEntry,
      reorderKtpDetailsForRupEntry,
      bulkImportKtpDetailsForRupEntry,
      getDetailsByRupEntryId,
      loadFromBackend,
    };
  },
  {
    persist: true,
  }
);
