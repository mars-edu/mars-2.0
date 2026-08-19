import { defineStore } from "pinia";
import { ref, computed } from "vue";
import { convex } from "@/lib/convexClient";
import type { Id } from "@convex/_generated/dataModel";
import { api } from "@convex/_generated/api";
import { ConvexError } from "convex/values";
import type { FunctionArgs } from "convex/server";
import { useConvexQuery } from "convex-vue";
import { useAcademicYearStore } from "@/stores/academicYearStore";
import { useAcademicYearSemesterStore } from "@/stores/academicYearSemesterStore";
import { withLoading } from "@/utils/storeAction";
import { formatRupDeleteBlockedMessage } from "@/lib/rupRefs";
import type { DistributionEntry, RupEntry } from "@/types/rup-entry";

export const useRupEntryStore = defineStore(
  "rupEntryStore",
  () => {
    const loading = ref(false);
    const error = ref<string | null>(null);

    // Reactive Convex query for real-time sync
    const { data: convexRupEntries } = useConvexQuery(
      api.rupEntries.queries.list,
      ref({})
    );

    // Transform Convex data to our RupEntry format
    const rupEntries = computed(() => {
      if (!convexRupEntries.value) return [];

      return convexRupEntries.value.map((item: any) => ({
        id: item._id,
        specialtyIds: item.specialtyIds,
        academicYearId: item.academicYearId,
        baseClass: item.baseClass == null
          ? [9]
          : Array.isArray(item.baseClass)
            ? item.baseClass
            : [item.baseClass],
        language: item.language ?? "",
        groupId: item.groupId,
        moduleIndex: item.moduleIndex,
        moduleName: item.moduleName,
        learningOutcome: item.learningOutcome,
        totalCredits: item.totalCredits,
        totalHours: item.totalHours,
        groupHours: item.groupHours ?? "",
        theoreticalHours: item.theoreticalHours,
        labPracticalHours: item.labPracticalHours,
        field3Value: item.field3Value,
        srspHours: item.srspHours,
        srsHours: item.srsHours,
        trainingPracticeHours: item.trainingPracticeHours,
        individualHours: item.individualHours,
        individualAdditionalHours: item.individualAdditionalHours ?? "",
        variants: item.variants,
        position: item.position,
        distributionEntries: (item.distributionEntries || []).map((d: any) => ({
          id: d._id,
          academicYearId: d.academicYearId,
          semesterId: d.semesterId,
          hours: d.hours,
          srsHours: d.srsHours,
          srspHours: d.srspHours,
          individualHours: d.individualHours,
          intermediateControlId: d.intermediateControlId,
          finalControlId: d.finalControlId,
          examEnabled: d.examEnabled,
          creditEnabled: d.creditEnabled,
          controlLessonEnabled: d.controlLessonEnabled,
        })),
        createdAt: new Date(item.createdAt),
        updatedAt: new Date(item.updatedAt),
      }));
    });

    const _rupEntryById = computed(() => {
      const m = new Map<string, (typeof rupEntries.value)[number]>();
      for (const c of rupEntries.value) m.set(c.id, c);
      return m;
    });
    const getRupEntryById = computed(() => {
      return (id: string) => _rupEntryById.value.get(id);
    });

    const getAutoSelectedSemesterForRupEntry = computed(() => {
      return (rupEntryId: string, activeSemesterId?: string) => {
        const entry = getRupEntryById.value(rupEntryId);
        if (entry && entry.distributionEntries && entry.distributionEntries.length > 0) {
          const entriesWithHours = entry.distributionEntries.filter((e: any) => Number(e.hours) > 0 && e.semesterId);
          
          if (activeSemesterId) {
            const activeSemesterStore = useAcademicYearSemesterStore();
            const activeSemester = activeSemesterStore.getAcademicYearSemesterById(activeSemesterId);
            const activeSemesterNumber = activeSemester ? String(activeSemester.semesterNumber) : null;
            
            const matchingActive = entriesWithHours.find((e: any) => {
              const entrySemesterId = String(e.semesterId ?? "");
              return entrySemesterId === activeSemesterId || (activeSemesterNumber && entrySemesterId === activeSemesterNumber);
            });
            if (matchingActive) return activeSemesterId;
          }
          
          if (entriesWithHours.length > 0) {
            const firstEntrySemesterId = String(entriesWithHours[0].semesterId ?? "");
            // If it's a number, we should try to find the actual semester ID for that number in the active year
            const activeSemesterStore = useAcademicYearSemesterStore();
            const activeYearSemesters = activeSemesterStore.getActiveAcademicYearSemesters;
            const matchingRealSemester = activeYearSemesters.find(s => String(s.semesterNumber) === firstEntrySemesterId);
            return matchingRealSemester ? matchingRealSemester.id : firstEntrySemesterId;
          }
        }
        return activeSemesterId || "";
      };
    });

    const getGroupedVariants = computed(() => {
      return (groupId: string) =>
        rupEntries.value.filter((c) => c.groupId === groupId);
    });

    const getRupEntriesByContext = computed(() => {
      return (academicYearId: string, specialtyIds?: string[], baseClass?: number) =>
        rupEntries.value
          .filter(
            (c) =>
              c.academicYearId === academicYearId &&
              (!specialtyIds ||
                specialtyIds.length === 0 ||
                specialtyIds.some((id) => c.specialtyIds.includes(id))) &&
              (!baseClass || c.baseClass.includes(baseClass))
          )
          .sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
    });

    const getAllModulesAndOutcomes = computed(() => {
      // Group modules by their display text to avoid duplicates
      const moduleMap = new Map();
      rupEntries.value
        .filter(
          (item) => item.learningOutcome && item.learningOutcome.trim() !== ""
        )
        .forEach((item) => {
          const moduleText = `${item.moduleIndex} ${item.moduleName}`;
          if (!moduleMap.has(moduleText)) {
            moduleMap.set(moduleText, {
              text: moduleText,
              value: moduleText,
              items: [],
            });
          }
          moduleMap.get(moduleText).items.push(item.id);
        });

      const modules = Array.from(moduleMap.values());

      // Create a map of all outcomes by module for filtering
      const outcomesByModule: Record<
        string,
        Array<{ value: string; text: string }>
      > = {};
      rupEntries.value
        .filter(
          (item) => item.learningOutcome && item.learningOutcome.trim() !== ""
        )
        .forEach((item) => {
          const moduleText = `${item.moduleIndex} ${item.moduleName}`;
          if (!outcomesByModule[moduleText]) {
            outcomesByModule[moduleText] = [];
          }
          outcomesByModule[moduleText].push({
            value: item.id,
            text: item.learningOutcome,
          });
        });

      // Get all outcomes (unfiltered list)
      const allOutcomes = rupEntries.value
        .filter(
          (item) => item.learningOutcome && item.learningOutcome.trim() !== ""
        )
        .map((item) => ({
          value: item.id,
          text: item.learningOutcome,
          moduleId: `${item.moduleIndex} ${item.moduleName}`,
        }));

      return {
        modules,
        outcomes: allOutcomes,
        outcomesByModule,
      };
    });

    const getAllRupEntries = computed(() => rupEntries.value);
    const rupEntryOptions = computed(() => {
      const academicYearStore = useAcademicYearStore();
      return rupEntries.value
        .filter(
          (item) => item.learningOutcome && item.learningOutcome.trim() !== ""
        )
        .map((item) => {
          const year = academicYearStore.getAcademicYearById(item.academicYearId);
          const yearSuffix = year ? ` (${year.startYear})` : "";
          return {
            value: item.id,
            text: `${item.moduleIndex} ${item.moduleName} - ${item.learningOutcome}${yearSuffix}`,
            moduleIndex: item.moduleIndex,
            moduleName: item.moduleName,
            learningOutcome: item.learningOutcome,
          };
        });
    });

    async function updateRupEntryOrder(
      academicYearId: string,
      specialtyIds: string[],
      oldIndex: number,
      newIndex: number
    ) {
      const contextItems = getRupEntriesByContext.value(
        academicYearId,
        specialtyIds
      );
      const reordered = [...contextItems];
      const [movedItem] = reordered.splice(oldIndex, 1);
      reordered.splice(newIndex, 0, movedItem);

      await convex.mutation(api.rupEntries.mutations.reorder, {
        orderedIds: reordered.map((item) => item.id as Id<"rupEntries">),
      });
    }

    async function duplicateRupEntry(itemToDuplicate: RupEntry) {
      return await withLoading(loading, error, async () => {
        return await convex.mutation(api.rupEntries.mutations.duplicate, {
          id: itemToDuplicate.id as Id<"rupEntries">,
        });
      }, "Failed to duplicate RUP entry");
    }

    // Translate the server's RUP_ENTRY_HAS_REFERENCES ConvexError into a
    // localized human message. Formatting (SSOT of table keys, paraglide
    // labels, display order) lives in @/lib/rupRefs; this wrapper just picks
    // entry-vs-group phrasing and rethrows.
    function rethrowRupDeleteError(err: unknown, groupMode: boolean): never {
      if (err instanceof ConvexError) {
        const data = err.data as { code?: string; references?: unknown } | undefined;
        if (data?.code === "RUP_ENTRY_HAS_REFERENCES") {
          throw new Error(formatRupDeleteBlockedMessage(data.references, groupMode));
        }
      }
      throw err;
    }

    // Atomic upsert of an entire language-variant group (create or edit) in
    // ONE server mutation — replaces the client-side N×M loop that used to
    // live in RupEntryPopup.vue::submit(). See saveRupEntryGroup in
    // convex/rupEntries/mutations.ts for the full contract.
    async function saveRupEntryGroup(
      payload: FunctionArgs<typeof api.rupEntries.mutations.saveRupEntryGroup>
    ) {
      return await withLoading(loading, error, async () => {
        try {
          return await convex.mutation(api.rupEntries.mutations.saveRupEntryGroup, payload);
        } catch (err) {
          rethrowRupDeleteError(err, true);
          throw err;
        }
      }, "Failed to save RUP entry group");
    }

    async function deleteRupEntryGroup(groupId: string) {
      return await withLoading(loading, error, async () => {
        // Atomic on the server: all variants + their distributionEntries are
        // pre-checked for references, then deleted together (or nothing goes,
        // throwing RUP_ENTRY_HAS_REFERENCES with per-table counts).
        try {
          await convex.mutation(api.rupEntries.mutations.removeGroup, { groupId });
        } catch (err) {
          rethrowRupDeleteError(err, true);
        }
        error.value = null;
      }, "Failed to delete RUP entry group");
    }

    async function deleteRupEntry(id: string) {
      return await withLoading(loading, error, async () => {
        // Cascade of distributionEntries is atomic in the mutation. If live
        // refs exist (calendarEvents/ktps/journals/scheduled*), the server
        // throws RUP_ENTRY_HAS_REFERENCES — we translate it here.
        try {
          await convex.mutation(api.rupEntries.mutations.remove, { id: id as Id<"rupEntries"> });
        } catch (err) {
          rethrowRupDeleteError(err, false);
        }
        error.value = null;
      }, "Failed to delete RUP entry");
    }

    function clearError() {
      error.value = null;
    }

    function reset() {
      // Note: rupEntries is now a computed property, so we can't reset it directly
      // The data will automatically sync from Convex
      loading.value = false;
      error.value = null;
    }

    return {
      rupEntries,
      loading,
      error,
      getRupEntryById,
      getAutoSelectedSemesterForRupEntry,
      getGroupedVariants,
      getRupEntriesByContext,
      getAllRupEntries,
      getAllModulesAndOutcomes,
      rupEntryOptions,
      updateRupEntryOrder,
      duplicateRupEntry,
      saveRupEntryGroup,
      deleteRupEntryGroup,
      deleteRupEntry,
      clearError,
      reset,
    };
  },
  {
    persist: true,
  }
);
