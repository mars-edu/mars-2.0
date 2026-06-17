import { defineStore } from "pinia";
import { ref, computed } from "vue";
import { convex } from "@/lib/convexClient";
import { api } from "@convex/_generated/api";
import { useConvexQuery } from "convex-vue";
import { useAcademicYearStore } from "@/stores/academicYearStore";
import { useAcademicYearSemesterStore } from "@/stores/academicYearSemesterStore";
import { withLoading } from "@/utils/storeAction";
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
        theoreticalHours: item.theoreticalHours,
        labPracticalHours: item.labPracticalHours,
        field3Value: item.field3Value,
        srspHours: item.srspHours,
        srsHours: item.srsHours,
        trainingPracticeHours: item.trainingPracticeHours,
        individualHours: item.individualHours,
        individualAdditionalHours: item.individualAdditionalHours ?? "",
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

    function createEmptyRupEntry(
      academicYearId: string,
      specialtyIds: string[] = [],
      baseClass: number = 9,
      language: string = ""
    ): RupEntry {
      return {
        id: crypto.randomUUID(),
        specialtyIds,
        academicYearId,
        baseClass: [baseClass],
        language,
        groupId: undefined,
        moduleIndex: "",
        moduleName: "",
        learningOutcome: "",
        totalCredits: "",
        totalHours: "",
        theoreticalHours: "",
        labPracticalHours: "",
        field3Value: "",
        srspHours: "",
        srsHours: "",
        trainingPracticeHours: "",
        individualHours: "",
        individualAdditionalHours: "",
        distributionEntries: [],
        position: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    }

    async function addRupEntry(
      academicYearId: string,
      specialtyIds: string[],
      data?: Partial<
        Omit<
          RupEntry,
          "id" | "createdAt" | "updatedAt" | "specialtyIds" | "academicYearId"
        >
      >
    ) {
      return await withLoading(loading, error, async () => {
        // Use Convex - create parent item
                const contextItems = getRupEntriesByContext.value(academicYearId, specialtyIds);
                const id = await convex.mutation(api.rupEntries.mutations.create, {
                  specialtyIds,
                  academicYearId,
                  baseClass: data?.baseClass ?? [9],
                  language: data?.language ?? "",
                  groupId: data?.groupId,
                  moduleIndex: data?.moduleIndex || "",
                  moduleName: data?.moduleName || "",
                  learningOutcome: data?.learningOutcome || "",
                  totalCredits: data?.totalCredits || "",
                  totalHours: data?.totalHours || "",
                  theoreticalHours: data?.theoreticalHours || "",
                  labPracticalHours: data?.labPracticalHours || "",
                  field3Value: data?.field3Value || "",
                  srspHours: data?.srspHours || "",
                  srsHours: data?.srsHours || "",
                  trainingPracticeHours: data?.trainingPracticeHours || "",
                  individualHours: data?.individualHours || "",
                  individualAdditionalHours: data?.individualAdditionalHours || "",
                  position: contextItems.length,
                });

                // Create nested distribution entries if provided
                if (data?.distributionEntries && data.distributionEntries.length > 0) {
                  for (const dist of data.distributionEntries) {
                    await convex.mutation(api.rupEntries.mutations.addDistribution, {
                      rupEntryId: id,
                      academicYearId: dist.academicYearId,
                      semesterId: dist.semesterId,
                      hours: dist.hours,
                      srsHours: (dist as any).srsHours,
                      srspHours: (dist as any).srspHours,
                      individualHours: (dist as any).individualHours,
                      intermediateControlId: dist.intermediateControlId ?? undefined,
                      finalControlId: dist.finalControlId ?? undefined,
                      examEnabled: dist.examEnabled,
                      creditEnabled: dist.creditEnabled,
                      controlLessonEnabled: dist.controlLessonEnabled,
                    });
                  }
                }

                // The reactive query will automatically update rupEntries
                error.value = null;
                return id;
        }, "Failed to add RUP entry");
    }

    async function linkExistingRupEntry(
      academicYearId: string,
      specialtyIds: string[],
      existingItemId: string,
      customData?: Partial<
        Pick<
          RupEntry,
          | "totalHours"
          | "theoreticalHours"
          | "labPracticalHours"
          | "srspHours"
          | "srsHours"
          | "trainingPracticeHours"
          | "individualHours"
          | "individualAdditionalHours"
        >
      >
    ) {
      return await withLoading(loading, error, async () => {
        const existingItem = getRupEntryById.value(existingItemId);
                if (!existingItem) {
                  throw new Error("Existing item not found");
                }

                // Create a new item in Convex based on the existing one
                const contextItems = getRupEntriesByContext.value(
                  academicYearId,
                  specialtyIds
                );

                const id = await convex.mutation(api.rupEntries.mutations.create, {
                  specialtyIds,
                  academicYearId,
                  baseClass: existingItem.baseClass ?? [9],
                  language: existingItem.language ?? "",
                  groupId: existingItem.groupId,
                  moduleIndex: existingItem.moduleIndex,
                  moduleName: existingItem.moduleName,
                  learningOutcome: existingItem.learningOutcome,
                  totalCredits: existingItem.totalCredits,
                  totalHours: customData?.totalHours || existingItem.totalHours,
                  theoreticalHours: customData?.theoreticalHours || existingItem.theoreticalHours,
                  labPracticalHours: customData?.labPracticalHours || existingItem.labPracticalHours,
                  field3Value: existingItem.field3Value,
                  srspHours: customData?.srspHours || existingItem.srspHours,
                  srsHours: customData?.srsHours || existingItem.srsHours,
                  trainingPracticeHours: customData?.trainingPracticeHours || existingItem.trainingPracticeHours,
                  individualHours: customData?.individualHours || existingItem.individualHours,
                  individualAdditionalHours:
                    customData?.individualAdditionalHours ||
                    existingItem.individualAdditionalHours ||
                    "",
                  position: contextItems.length,
                });

                // The reactive query will automatically update rupEntries
                error.value = null;
                return id;
        }, "Failed to link RUP entry");
    }

    async function addRupEntries(items: RupEntry[]) {
      return await withLoading(loading, error, async () => {
        // Create all items in Convex
                for (const item of items) {
                  await convex.mutation(api.rupEntries.mutations.create, {
                    specialtyIds: item.specialtyIds,
                    academicYearId: item.academicYearId,
                    baseClass: item.baseClass ?? [9],
                    language: item.language ?? "",
                    groupId: item.groupId,
                    moduleIndex: item.moduleIndex,
                    moduleName: item.moduleName,
                    learningOutcome: item.learningOutcome,
                    totalCredits: item.totalCredits,
                    totalHours: item.totalHours,
                    theoreticalHours: item.theoreticalHours,
                    labPracticalHours: item.labPracticalHours,
                    field3Value: item.field3Value,
                    srspHours: item.srspHours,
                    srsHours: item.srsHours,
                    trainingPracticeHours: item.trainingPracticeHours,
                    individualHours: item.individualHours,
                    individualAdditionalHours: item.individualAdditionalHours || "",
                    position: item.position,
                  });
                }

                // The reactive query will automatically update rupEntries
                error.value = null;
        }, "Failed to add RUP entries");
    }

    async function updateRupEntry(
      id: string,
      data: Partial<Omit<RupEntry, "id" | "createdAt" | "updatedAt">>
    ) {
      return await withLoading(loading, error, async () => {
        // Use Convex - update parent item with distribution entries
                const updated = await convex.mutation(api.rupEntries.mutations.updateWithDistributions, {
                  id: id as any,
                  specialtyIds: data.specialtyIds,
                  academicYearId: data.academicYearId,
                  baseClass: data.baseClass,
                  language: data.language,
                  groupId: data.groupId,
                  moduleIndex: data.moduleIndex,
                  moduleName: data.moduleName,
                  learningOutcome: data.learningOutcome,
                  totalCredits: data.totalCredits,
                  totalHours: data.totalHours,
                  theoreticalHours: data.theoreticalHours,
                  labPracticalHours: data.labPracticalHours,
                  field3Value: data.field3Value,
                  srspHours: data.srspHours,
                  srsHours: data.srsHours,
                  trainingPracticeHours: data.trainingPracticeHours,
                  individualHours: data.individualHours,
                  individualAdditionalHours: data.individualAdditionalHours,
                  position: data.position,
                  distributionEntries: (data.distributionEntries || []).map((d) => ({
                    id: d.id,
                    academicYearId: d.academicYearId,
                    semesterId: d.semesterId,
                    hours: d.hours,
                    srsHours: (d as any).srsHours,
                    srspHours: (d as any).srspHours,
                    individualHours: (d as any).individualHours,
                    intermediateControlId: d.intermediateControlId,
                    finalControlId: d.finalControlId,
                    examEnabled: d.examEnabled,
                    creditEnabled: d.creditEnabled,
                    controlLessonEnabled: d.controlLessonEnabled,
                  })),
                });

                // The reactive query will automatically update rupEntries with fresh data
                error.value = null;
                return updated;
        }, "Failed to update RUP entry");
    }

    function updateRupEntryOrder(
      academicYearId: string,
      specialtyIds: string[],
      oldIndex: number,
      newIndex: number
    ) {
      const contextItems = getRupEntriesByContext.value(
        academicYearId,
        specialtyIds
      );
      const [movedItem] = contextItems.splice(oldIndex, 1);
      contextItems.splice(newIndex, 0, movedItem);
      contextItems.forEach((item, index) => {
        const originalItem = rupEntries.value.find((i) => i.id === item.id);
        if (originalItem) {
          originalItem.position = index;
        }
      });
    }

    async function duplicateRupEntry(itemToDuplicate: RupEntry) {
      return await withLoading(loading, error, async () => {
        const originalItem = rupEntries.value.find(
                  (item) => item.id === itemToDuplicate.id
                );
                if (!originalItem) {
                  console.error("Original item not found for duplication");
                  throw new Error("Original item not found");
                }

                const insertionPosition = originalItem.position + 1;

                // Update positions of items that come after
                const itemsInContext = rupEntries.value.filter(
                  (c) =>
                    c.academicYearId === itemToDuplicate.academicYearId &&
                    c.specialtyIds.some((sid: string) => itemToDuplicate.specialtyIds.includes(sid)) &&
                    c.position >= insertionPosition
                );

                // Update positions in Convex
                for (const item of itemsInContext) {
                  await convex.mutation(api.rupEntries.mutations.update, {
                    id: item.id as any,
                    specialtyIds: item.specialtyIds,
                    academicYearId: item.academicYearId,
                    moduleIndex: item.moduleIndex,
                    moduleName: item.moduleName,
                    learningOutcome: item.learningOutcome,
                    totalCredits: item.totalCredits,
                    totalHours: item.totalHours,
                    theoreticalHours: item.theoreticalHours,
                    labPracticalHours: item.labPracticalHours,
                    field3Value: item.field3Value,
                    srspHours: item.srspHours,
                    srsHours: item.srsHours,
                    trainingPracticeHours: item.trainingPracticeHours,
                    individualHours: item.individualHours,
                    individualAdditionalHours: item.individualAdditionalHours || "",
                    position: item.position + 1,
                  });
                }

                // Create the duplicated item in Convex
                const id = await convex.mutation(api.rupEntries.mutations.create, {
                  specialtyIds: itemToDuplicate.specialtyIds,
                  academicYearId: itemToDuplicate.academicYearId,
                  baseClass: itemToDuplicate.baseClass ?? [9],
                  language: itemToDuplicate.language ?? "",
                  groupId: itemToDuplicate.groupId,
                  moduleIndex: itemToDuplicate.moduleIndex,
                  moduleName: itemToDuplicate.moduleName,
                  learningOutcome: itemToDuplicate.learningOutcome,
                  totalCredits: itemToDuplicate.totalCredits,
                  totalHours: itemToDuplicate.totalHours,
                  theoreticalHours: itemToDuplicate.theoreticalHours,
                  labPracticalHours: itemToDuplicate.labPracticalHours,
                  field3Value: itemToDuplicate.field3Value,
                  srspHours: itemToDuplicate.srspHours,
                  srsHours: itemToDuplicate.srsHours,
                  trainingPracticeHours: itemToDuplicate.trainingPracticeHours,
                  individualHours: itemToDuplicate.individualHours,
                  individualAdditionalHours: itemToDuplicate.individualAdditionalHours || "",
                  position: insertionPosition,
                });

                // Duplicate distribution entries
                for (const dist of itemToDuplicate.distributionEntries) {
                  await convex.mutation(api.rupEntries.mutations.addDistribution, {
                    rupEntryId: id,
                    academicYearId: dist.academicYearId,
                    semesterId: dist.semesterId,
                    hours: dist.hours,
                    srsHours: (dist as any).srsHours,
                    srspHours: (dist as any).srspHours,
                    individualHours: (dist as any).individualHours,
                    intermediateControlId: dist.intermediateControlId ?? undefined,
                    finalControlId: dist.finalControlId ?? undefined,
                    examEnabled: dist.examEnabled,
                    creditEnabled: dist.creditEnabled,
                    controlLessonEnabled: dist.controlLessonEnabled,
                  });
                }

                // The reactive query will automatically update rupEntries
                error.value = null;
                return id;
        }, "Failed to duplicate RUP entry");
    }

    async function addRupEntryMultiLanguage(
      academicYearId: string,
      specialtyIds: string[],
      languages: string[],
      data?: Partial<
        Omit<
          RupEntry,
          "id" | "createdAt" | "updatedAt" | "specialtyIds" | "academicYearId" | "language" | "groupId"
        >
      >
    ) {
      return await withLoading(loading, error, async () => {
        const groupId = crypto.randomUUID();
                const contextItems = getRupEntriesByContext.value(academicYearId, specialtyIds);
                const ids: string[] = [];

                for (let i = 0; i < languages.length; i++) {
                  const id = await convex.mutation(api.rupEntries.mutations.create, {
                    specialtyIds,
                    academicYearId,
                    baseClass: data?.baseClass ?? [9],
                    language: languages[i],
                    groupId,
                    moduleIndex: data?.moduleIndex || "",
                    moduleName: data?.moduleName || "",
                    learningOutcome: data?.learningOutcome || "",
                    totalCredits: data?.totalCredits || "",
                    totalHours: data?.totalHours || "",
                    theoreticalHours: data?.theoreticalHours || "",
                    labPracticalHours: data?.labPracticalHours || "",
                    field3Value: data?.field3Value || "",
                    srspHours: data?.srspHours || "",
                    srsHours: data?.srsHours || "",
                    trainingPracticeHours: data?.trainingPracticeHours || "",
                    individualHours: data?.individualHours || "",
                    individualAdditionalHours: data?.individualAdditionalHours || "",
                    position: contextItems.length + i,
                  });
                  ids.push(id);
                }

                error.value = null;
                return { groupId, ids };
        }, "Failed to add multi-language RUP entry");
    }

    async function deleteRupEntryGroup(groupId: string) {
      return await withLoading(loading, error, async () => {
        const itemsInGroup = rupEntries.value.filter(
                  (c) => c.groupId === groupId
                );
                for (const item of itemsInGroup) {
                  await convex.mutation(api.rupEntries.mutations.remove, {
                    id: item.id as any,
                  });
                }
                error.value = null;
        }, "Failed to delete RUP entry group");
    }

    async function deleteRupEntry(id: string) {
      return await withLoading(loading, error, async () => {
        // Use Convex - cascade delete handled by mutation
                await convex.mutation(api.rupEntries.mutations.remove, {
                  id: id as any,
                });
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
      createEmptyRupEntry,
      addRupEntry,
      linkExistingRupEntry,
      addRupEntries,
      updateRupEntry,
      updateRupEntryOrder,
      duplicateRupEntry,
      addRupEntryMultiLanguage,
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
