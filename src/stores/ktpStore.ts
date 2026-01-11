import { defineStore } from "pinia";
import { ref, computed, watch } from "vue";
import type { ParsedLesson } from "@/services/excel-parser";
import { convex } from "@/lib/convexClient";
import { api } from "@convex/_generated/api";
import { useConvexQuery } from "convex-vue";

export interface Ktp {
  id: string;
  class9Id: string;
  academicYearId: string;
  semesterId: string;
  eventId?: string; // Back-reference to the calendar event (if KTP is event-specific)
  name?: string; // Optional custom name for the KTP
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
      semesterId?: string,
      eventId?: string
    ): Ktp | undefined {
      return ktps.value.find(
        (k) =>
          k.class9Id === class9Id &&
          (!academicYearId || k.academicYearId === academicYearId) &&
          (!semesterId || k.semesterId === semesterId) &&
          (!eventId || k.eventId === eventId)
      );
    }

    function findKtpById(ktpId: string): Ktp | undefined {
      return ktps.value.find((k) => k.id === ktpId);
    }

    async function createKtp(
      class9Id: string,
      academicYearId: string,
      semesterId: string,
      eventId?: string,
      name?: string
    ): Promise<Ktp> {
      const id = await convex.mutation(api.ktps.mutations.create, {
        class9Id,
        academicYearId,
        semesterId,
        eventId,
        name,
      });
      const created = await convex.query(api.ktps.queries.getById, { id });
      if (created) {
        const mapped: Ktp = {
          id: created._id,
          class9Id: created.class9Id,
          academicYearId: created.academicYearId,
          semesterId: created.semesterId,
          eventId: created.eventId,
          name: created.name,
          createdAt: new Date(created.createdAt),
          updatedAt: new Date(created.updatedAt),
        };
        ktps.value.push(mapped);
        return mapped;
      }

      // Fallback if query fails
      throw new Error("Failed to create KTP");
    }

    async function ensureKtpForClass9(
      class9Id: string,
      academicYearId: string,
      semesterId: string,
      eventId?: string,
      name?: string
    ): Promise<Ktp> {
      if (!semesterId) {
        throw new Error("semesterId is required to create a KTP");
      }
      const existing = findKtpByClass9Id(class9Id, academicYearId, semesterId, eventId);
      return existing || await createKtp(class9Id, academicYearId, semesterId, eventId, name);
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
        homework: data.homework,
        notes: data.notes,
      });

      const index = ktpDetails.value.findIndex((d) => d.id === id);
      if (index !== -1) {
        ktpDetails.value[index] = { ...ktpDetails.value[index], ...data };
      }
    }

    async function deleteKtpDetail(id: string) {
      await convex.mutation(api.ktps.mutations.removeDetail, {
        id: id as any,
      });

      ktpDetails.value = ktpDetails.value.filter((d) => d.id !== id);
      ktpDetails.value.forEach((item, index) => {
        item.position = index + 1;
      });
    }

    async function clearKtpDetails(ktpId: string) {
      await convex.mutation(api.ktps.mutations.clearDetails, {
        ktpId: ktpId as any,
      });
      ktpDetails.value = ktpDetails.value.filter((d) => d.ktpId !== ktpId);
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
        });

        // Reload the KTP with new details
        const updated = await convex.query(api.ktps.queries.getById, { id: ktpId as any });
        if (updated && updated.details) {
          // Remove old details for this ktpId
          ktpDetails.value = ktpDetails.value.filter((d) => d.ktpId !== ktpId);
          // Add new details
          const mappedDetails = updated.details.map((d: any) => ({
            id: d._id,
            ktpId: d.ktpId,
            position: d.position,
            theme: d.theme,
            totalHours: d.totalHours,
            srsp: d.srsp,
            srs: d.srs,
            homework: d.homework,
            notes: d.notes,
          }));
          ktpDetails.value.push(...mappedDetails);
          return { success: true, imported: mappedDetails.length };
        }

        return { success: false, error: "Failed to reload after import" };
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
    async function fetchDetailsForClass9(
      class9Id: string,
      academicYearId?: string,
      semesterId?: string
    ) {
      if (!academicYearId || !semesterId) {
        throw new Error("academicYearId and semesterId are required");
      }
      const ktp = await ensureKtpForClass9(
        class9Id,
        academicYearId,
        semesterId
      );
      return fetchDetailsForKtp(ktp.id);
    }

    async function addKtpDetailForClass9(
      class9Id: string,
      data: Partial<Omit<KtpDetail, "id" | "ktpId" | "position">>,
      academicYearId?: string,
      semesterId?: string
    ) {
      if (!academicYearId || !semesterId) {
        throw new Error("academicYearId and semesterId are required");
      }
      const ktp = await ensureKtpForClass9(
        class9Id,
        academicYearId,
        semesterId
      );
      return addKtpDetail(ktp.id, data);
    }

    async function reorderKtpDetailsForClass9(
      class9Id: string,
      reorderedIds: string[],
      academicYearId?: string,
      semesterId?: string
    ) {
      if (!academicYearId || !semesterId) {
        throw new Error("academicYearId and semesterId are required");
      }
      const ktp = await ensureKtpForClass9(
        class9Id,
        academicYearId,
        semesterId
      );
      return reorderKtpDetails(ktp.id, reorderedIds);
    }

    async function bulkImportKtpDetailsForClass9(
      class9Id: string,
      lessons: ParsedLesson[],
      academicYearId?: string,
      semesterId?: string
    ) {
      if (!academicYearId || !semesterId) {
        throw new Error("academicYearId and semesterId are required");
      }
      const ktp = await ensureKtpForClass9(
        class9Id,
        academicYearId,
        semesterId
      );
      return bulkImportKtpDetails(ktp.id, lessons);
    }

    const getDetailsByClass9Id = computed(() => {
      return (
        class9Id: string,
        academicYearId?: string,
        semesterId?: string
      ) => {
        if (!academicYearId || !semesterId) {
          throw new Error("academicYearId and semesterId are required");
        }
        const ktp = findKtpByClass9Id(
          class9Id,
          academicYearId,
          semesterId
        );
        if (!ktp) return [];
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
            class9Id: ktp.class9Id,
            academicYearId: ktp.academicYearId,
            semesterId: ktp.semesterId,
            eventId: ktp.eventId,
            name: ktp.name,
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
      ensureKtpForClass9,
      findKtpByClass9Id,
      findKtpById,
      fetchDetailsForKtp,
      addKtpDetail,
      updateKtpDetail,
      deleteKtpDetail,
      deleteKtpByClass9Id,
      deleteKtpById,
      clearKtpDetails,
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
      loadFromBackend,
    };
  },
  {
    persist: true,
  }
);
