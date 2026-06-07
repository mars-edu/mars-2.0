import { defineStore } from "pinia";
import { ref, computed } from "vue";
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

function mapKtp(ktp: any): Ktp {
  return {
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
  };
}

function mapKtpDetail(detail: any): KtpDetail {
  return {
    id: detail._id,
    ktpId: detail.ktpId,
    position: detail.position,
    theme: detail.theme,
    totalHours: detail.totalHours ?? null,
    srsp: detail.srsp ?? null,
    srs: detail.srs ?? null,
    theoretical: detail.theoretical ?? null,
    practical: detail.practical ?? null,
    individual: detail.individual ?? null,
    homework: detail.homework,
    notes: detail.notes,
  };
}

export const useKtpStore = defineStore("ktp", () => {
  // Reactive Convex subscription — single source of truth.
  // The list query embeds each ktp's details, so one subscription
  // covers both headers and detail rows. Mutations below never mirror
  // state locally; the subscription auto-refreshes after every write.
  const ktpsResult = useConvexQuery(api.ktps.queries.list, ref({})) as any;

  const ktps = computed<Ktp[]>(() => {
    if (!ktpsResult.data.value) return [];
    return ktpsResult.data.value.map(mapKtp);
  });

  const ktpDetails = computed<KtpDetail[]>(() => {
    if (!ktpsResult.data.value) return [];
    return ktpsResult.data.value.flatMap((ktp: any) =>
      (ktp.details || []).map(mapKtpDetail)
    );
  });

  const mutationLoading = ref(false);
  const error = ref<string | null>(null);

  // loading = subscription pending OR mutation in flight (announcementStore pattern)
  const loading = computed(
    () => mutationLoading.value || ktpsResult.isPending.value
  );

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
      semesterId: semesterId as any,
      eventId,
      name,
      color: extra?.color,
      languages: extra?.languages,
    });
    // Read-after-write so callers get the created Ktp immediately,
    // even if the subscription hasn't delivered yet.
    const created = await convex.query(api.ktps.queries.getById, { id });
    if (created) {
      return mapKtp(created);
    }
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
    const existing = findKtpByRupEntryId(
      rupEntryId,
      academicYearId,
      semesterId,
      eventId
    );
    return (
      existing ||
      (await createKtp(rupEntryId, academicYearId, semesterId, eventId, name, extra))
    );
  }

  async function updateKtp(
    id: string,
    data: { name?: string; color?: string; languages?: string[] }
  ) {
    // Drop undefined keys so "not provided" never clobbers existing values
    const cleanData = Object.fromEntries(
      Object.entries(data).filter(([, v]) => v !== undefined)
    );
    await convex.mutation(api.ktps.mutations.update, {
      id: id as any,
      ...cleanData,
    });
  }

  /**
   * Compatibility no-op: data arrives via the reactive subscription.
   * Kept so existing call sites don't break.
   */
  function fetchDetailsForKtp(_ktpId: string) {}

  async function addKtpDetail(
    ktpId: string,
    data: Partial<Omit<KtpDetail, "id" | "ktpId" | "position">>
  ) {
    const newPosition =
      ktpDetails.value.filter((d) => d.ktpId === ktpId).length + 1;
    await convex.mutation(api.ktps.mutations.addDetail, {
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
  }

  async function deleteKtpDetail(id: string) {
    // Backend renumbers remaining siblings; subscription delivers the result
    await convex.mutation(api.ktps.mutations.removeDetail, {
      id: id as any,
    });
  }

  async function clearKtpDetails(ktpId: string) {
    await convex.mutation(api.ktps.mutations.clearDetails, {
      ktpId: ktpId as any,
    });
  }

  async function deleteKtpByRupEntryId(
    rupEntryId: string,
    academicYearId?: string,
    semesterId?: string
  ) {
    const ktp = findKtpByRupEntryId(rupEntryId, academicYearId, semesterId);
    if (!ktp) return { success: true, deleted: 0 };

    const deletedDetails = ktpDetails.value.filter(
      (d) => d.ktpId === ktp.id
    ).length;

    // Cascades to details server-side
    await convex.mutation(api.ktps.mutations.remove, {
      id: ktp.id as any,
    });

    return { success: true, deleted: deletedDetails };
  }

  async function deleteKtpById(ktpId: string) {
    const ktp = ktps.value.find((k) => k.id === ktpId);
    if (!ktp) return { success: true, deleted: 0 };

    const deletedDetails = ktpDetails.value.filter(
      (d) => d.ktpId === ktpId
    ).length;

    await convex.mutation(api.ktps.mutations.remove, {
      id: ktpId as any,
    });

    return { success: true, deleted: deletedDetails };
  }

  async function reorderKtpDetails(ktpId: string, reorderedIds: string[]) {
    try {
      error.value = null;

      const parentDetails = ktpDetails.value.filter((d) => d.ktpId === ktpId);
      const validIds = new Set(parentDetails.map((d) => d.id));
      const filteredOrder = reorderedIds.filter((id) => validIds.has(id));
      if (filteredOrder.length !== parentDetails.length) {
        throw new Error("Reorder list does not match parent items");
      }

      await convex.mutation(api.ktps.mutations.reorderDetails, {
        ktpId: ktpId as any,
        orderedIds: filteredOrder as any,
      });

      return { success: true, reordered: filteredOrder.length };
    } catch (err) {
      error.value =
        err instanceof Error ? err.message : "Failed to reorder items";
      return { success: false, error: error.value };
    }
  }

  async function bulkImportKtpDetails(ktpId: string, lessons: ParsedLesson[]) {
    try {
      error.value = null;

      const details = lessons.map((lesson, index) => ({
        position: lesson.lessonNumber || index + 1,
        theme: lesson.subject || lesson.lessonType || "",
        totalHours: typeof lesson.hours === "number" ? lesson.hours : undefined,
        srsp: undefined,
        srs: undefined,
        homework: lesson.homework || "",
        notes: lesson.notes || "",
      }));

      const result = await convex.mutation(api.ktps.mutations.bulkImportDetails, {
        ktpId: ktpId as any,
        details,
        replace: true,
      });

      return { success: true, imported: result.insertedIds.length };
    } catch (err) {
      error.value =
        err instanceof Error ? err.message : "Failed to import data";
      return { success: false, error: error.value };
    }
  }

  /**
   * Replace all details of a ktp with the given rows (used by
   * "import from another KTP" — RupImportDialog).
   */
  async function bulkReplaceKtpDetails(
    ktpId: string,
    details: Array<Partial<Omit<KtpDetail, "id" | "ktpId">> & { position: number }>
  ) {
    try {
      error.value = null;

      const payload = details.map((d) => ({
        position: d.position,
        theme: d.theme || "",
        totalHours: d.totalHours ?? undefined,
        srsp: d.srsp ?? undefined,
        srs: d.srs ?? undefined,
        theoretical: d.theoretical ?? undefined,
        practical: d.practical ?? undefined,
        individual: d.individual ?? undefined,
        homework: d.homework || "",
        notes: d.notes || "",
      }));

      const result = await convex.mutation(api.ktps.mutations.bulkImportDetails, {
        ktpId: ktpId as any,
        details: payload,
        replace: true,
      });

      return { success: true, imported: result.insertedIds.length };
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
    const ktp = await ensureKtpForRupEntry(rupEntryId, academicYearId, semesterId);
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
    const ktp = await ensureKtpForRupEntry(rupEntryId, academicYearId, semesterId);
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
    const ktp = await ensureKtpForRupEntry(rupEntryId, academicYearId, semesterId);
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
    const ktp = await ensureKtpForRupEntry(rupEntryId, academicYearId, semesterId);
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
      const ktp = findKtpByRupEntryId(rupEntryId, academicYearId, semesterId);
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
      const ktp = findKtpByRupEntryId(rupEntryId || "", academicYearId, semesterId);
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

  return {
    ktps,
    ktpDetails,
    loading,
    error,
    // Primary KTP-based APIs
    ensureKtpForRupEntry,
    findKtpByRupEntryId,
    findKtpById,
    fetchDetailsForKtp,
    updateKtp,
    addKtpDetail,
    updateKtpDetail,
    deleteKtpDetail,
    deleteKtpByRupEntryId,
    deleteKtpById,
    clearKtpDetails,
    reorderKtpDetails,
    bulkImportKtpDetails,
    bulkReplaceKtpDetails,
    getDetailsByKtpId,
    getKtpIdForRupEntry,
    getModuleTitleForKtp,
    // Convenience RUP entry-based APIs (backward compat)
    fetchDetailsForRupEntry,
    addKtpDetailForRupEntry,
    reorderKtpDetailsForRupEntry,
    bulkImportKtpDetailsForRupEntry,
    getDetailsByRupEntryId,
  };
});
