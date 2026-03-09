import { defineStore } from "pinia";
import { ref, computed } from "vue";
import { convex } from "@/lib/convexClient";
import { api } from "@convex/_generated/api";
import { useConvexQuery } from "convex-vue";
import { useAcademicYearStore } from "@/stores/academicYearStore";

export interface DistributionEntry {
  id: string;
  academicYearId: string;
  semesterId: string;
  hours: string;
  intermediateControlId?: string | null;
  finalControlId?: string | null;
  examEnabled?: boolean;
  creditEnabled?: boolean;
  controlLessonEnabled?: boolean;
}

export interface Class9Data {
  id: string;
  specialtyIds: string[]; // Changed from specialtyId to specialtyIds array
  academicYearId: string;
  baseClass: number[]; // e.g. [9], [11], or [9, 11]
  language: string;
  groupId?: string;
  moduleIndex: string;
  moduleName: string;
  learningOutcome: string;
  totalCredits: string;
  totalHours: string;
  theoreticalHours: string;
  labPracticalHours: string;
  field3Value: string;
  srspHours: string;
  srsHours: string;
  trainingPracticeHours: string;
  individualHours: string;
  individualAdditionalHours: string;
  distributionEntries: DistributionEntry[];
  position: number;
  createdAt: Date;
  updatedAt: Date;
}

export const useClass9Store = defineStore(
  "class9",
  () => {
    const loading = ref(false);
    const error = ref<string | null>(null);

    // Reactive Convex query for real-time sync
    const { data: convexClass9Items } = useConvexQuery(
      api.class9Items.queries.list,
      ref({})
    );

    // Transform Convex data to our Class9Data format
    const class9Items = computed(() => {
      if (!convexClass9Items.value) return [];

      return convexClass9Items.value.map((item: any) => ({
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

    const getClass9ById = computed(() => {
      return (id: string) => class9Items.value.find((c) => c.id === id);
    });

    const getGroupedVariants = computed(() => {
      return (groupId: string) =>
        class9Items.value.filter((c) => c.groupId === groupId);
    });

    const getClass9ItemsByContext = computed(() => {
      return (academicYearId: string, specialtyIds?: string[], baseClass?: number) =>
        class9Items.value
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
      class9Items.value
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
      class9Items.value
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
      const allOutcomes = class9Items.value
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

    const getAllClass9Items = computed(() => class9Items.value);
    const isLoading = computed(() => loading.value);
    const getError = computed(() => error.value);

    const class9Options = computed(() => {
      const academicYearStore = useAcademicYearStore();
      return class9Items.value
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

    function createEmptyClass9Data(
      academicYearId: string,
      specialtyIds: string[] = [],
      baseClass: number = 9,
      language: string = ""
    ): Class9Data {
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

    async function addClass9(
      academicYearId: string,
      specialtyIds: string[],
      data?: Partial<
        Omit<
          Class9Data,
          "id" | "createdAt" | "updatedAt" | "specialtyIds" | "academicYearId"
        >
      >
    ) {
      loading.value = true;
      try {
        // Use Convex - create parent item
        const contextItems = getClass9ItemsByContext.value(academicYearId, specialtyIds);
        const id = await convex.mutation(api.class9Items.mutations.create, {
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
            await convex.mutation(api.class9Items.mutations.addDistribution, {
              class9ItemId: id,
              academicYearId: dist.academicYearId,
              semesterId: dist.semesterId,
              hours: dist.hours,
              intermediateControlId: dist.intermediateControlId ?? undefined,
              finalControlId: dist.finalControlId ?? undefined,
              examEnabled: dist.examEnabled,
              creditEnabled: dist.creditEnabled,
              controlLessonEnabled: dist.controlLessonEnabled,
            });
          }
        }

        // The reactive query will automatically update class9Items
        error.value = null;
        return id;
      } catch (err) {
        error.value =
          err instanceof Error ? err.message : "Failed to add class9 data";
        throw err;
      } finally {
        loading.value = false;
      }
    }

    async function linkExistingClass9(
      academicYearId: string,
      specialtyIds: string[],
      existingItemId: string,
      customData?: Partial<
        Pick<
          Class9Data,
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
      loading.value = true;
      try {
        const existingItem = getClass9ById.value(existingItemId);
        if (!existingItem) {
          throw new Error("Existing item not found");
        }

        // Create a new item in Convex based on the existing one
        const contextItems = getClass9ItemsByContext.value(
          academicYearId,
          specialtyIds
        );

        const id = await convex.mutation(api.class9Items.mutations.create, {
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

        // The reactive query will automatically update class9Items
        error.value = null;
        return id;
      } catch (err) {
        error.value =
          err instanceof Error ? err.message : "Failed to link class9 data";
        throw err;
      } finally {
        loading.value = false;
      }
    }

    async function addClass9Items(items: Class9Data[]) {
      loading.value = true;
      try {
        // Create all items in Convex
        for (const item of items) {
          await convex.mutation(api.class9Items.mutations.create, {
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

        // The reactive query will automatically update class9Items
        error.value = null;
      } catch (err) {
        error.value =
          err instanceof Error ? err.message : "Failed to add class9 items";
        throw err;
      } finally {
        loading.value = false;
      }
    }

    async function updateClass9(
      id: string,
      data: Partial<Omit<Class9Data, "id" | "createdAt" | "updatedAt">>
    ) {
      loading.value = true;
      try {
        // Use Convex - update parent item with distribution entries
        const updated = await convex.mutation(api.class9Items.mutations.updateWithDistributions, {
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
            intermediateControlId: d.intermediateControlId,
            finalControlId: d.finalControlId,
            examEnabled: d.examEnabled,
            creditEnabled: d.creditEnabled,
            controlLessonEnabled: d.controlLessonEnabled,
          })),
        });

        // The reactive query will automatically update class9Items with fresh data
        error.value = null;
        return updated;
      } catch (err) {
        error.value =
          err instanceof Error ? err.message : "Failed to update class9 data";
        throw err;
      } finally {
        loading.value = false;
      }
    }

    function updateClass9Order(
      academicYearId: string,
      specialtyIds: string[],
      oldIndex: number,
      newIndex: number
    ) {
      const contextItems = getClass9ItemsByContext.value(
        academicYearId,
        specialtyIds
      );
      const [movedItem] = contextItems.splice(oldIndex, 1);
      contextItems.splice(newIndex, 0, movedItem);
      contextItems.forEach((item, index) => {
        const originalItem = class9Items.value.find((i) => i.id === item.id);
        if (originalItem) {
          originalItem.position = index;
        }
      });
    }

    async function duplicateClass9Item(itemToDuplicate: Class9Data) {
      loading.value = true;
      try {
        const originalItem = class9Items.value.find(
          (item) => item.id === itemToDuplicate.id
        );
        if (!originalItem) {
          console.error("Original item not found for duplication");
          throw new Error("Original item not found");
        }

        const insertionPosition = originalItem.position + 1;

        // Update positions of items that come after
        const itemsInContext = class9Items.value.filter(
          (c) =>
            c.academicYearId === itemToDuplicate.academicYearId &&
            c.specialtyIds.some((sid: string) => itemToDuplicate.specialtyIds.includes(sid)) &&
            c.position >= insertionPosition
        );

        // Update positions in Convex
        for (const item of itemsInContext) {
          await convex.mutation(api.class9Items.mutations.update, {
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
        const id = await convex.mutation(api.class9Items.mutations.create, {
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
          await convex.mutation(api.class9Items.mutations.addDistribution, {
            class9ItemId: id,
            academicYearId: dist.academicYearId,
            semesterId: dist.semesterId,
            hours: dist.hours,
            intermediateControlId: dist.intermediateControlId ?? undefined,
            finalControlId: dist.finalControlId ?? undefined,
            examEnabled: dist.examEnabled,
            creditEnabled: dist.creditEnabled,
            controlLessonEnabled: dist.controlLessonEnabled,
          });
        }

        // The reactive query will automatically update class9Items
        error.value = null;
        return id;
      } catch (err) {
        error.value =
          err instanceof Error ? err.message : "Failed to duplicate class9 item";
        throw err;
      } finally {
        loading.value = false;
      }
    }

    async function addClass9MultiLanguage(
      academicYearId: string,
      specialtyIds: string[],
      languages: string[],
      data?: Partial<
        Omit<
          Class9Data,
          "id" | "createdAt" | "updatedAt" | "specialtyIds" | "academicYearId" | "language" | "groupId"
        >
      >
    ) {
      loading.value = true;
      try {
        const groupId = crypto.randomUUID();
        const contextItems = getClass9ItemsByContext.value(academicYearId, specialtyIds);
        const ids: string[] = [];

        for (let i = 0; i < languages.length; i++) {
          const id = await convex.mutation(api.class9Items.mutations.create, {
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
      } catch (err) {
        error.value =
          err instanceof Error ? err.message : "Failed to add multi-language class9 data";
        throw err;
      } finally {
        loading.value = false;
      }
    }

    async function deleteClass9Group(groupId: string) {
      loading.value = true;
      try {
        const itemsInGroup = class9Items.value.filter(
          (c) => c.groupId === groupId
        );
        for (const item of itemsInGroup) {
          await convex.mutation(api.class9Items.mutations.remove, {
            id: item.id as any,
          });
        }
        error.value = null;
      } catch (err) {
        error.value =
          err instanceof Error ? err.message : "Failed to delete class9 group";
        throw err;
      } finally {
        loading.value = false;
      }
    }

    async function deleteClass9(id: string) {
      loading.value = true;
      try {
        // Use Convex - cascade delete handled by mutation
        await convex.mutation(api.class9Items.mutations.remove, {
          id: id as any,
        });
        error.value = null;
      } catch (err) {
        error.value =
          err instanceof Error ? err.message : "Failed to delete class9 data";
        throw err;
      } finally {
        loading.value = false;
      }
    }

    function clearError() {
      error.value = null;
    }

    function reset() {
      // Note: class9Items is now a computed property, so we can't reset it directly
      // The data will automatically sync from Convex
      loading.value = false;
      error.value = null;
    }

    return {
      class9Items,
      loading,
      error,
      getClass9ById,
      getGroupedVariants,
      getClass9ItemsByContext,
      getAllClass9Items,
      getAllModulesAndOutcomes,
      class9Options,
      isLoading,
      getError,
      createEmptyClass9Data,
      addClass9,
      linkExistingClass9,
      addClass9Items,
      updateClass9,
      updateClass9Order,
      duplicateClass9Item,
      addClass9MultiLanguage,
      deleteClass9Group,
      deleteClass9,
      clearError,
      reset,
    };
  },
  {
    persist: true,
  }
);
