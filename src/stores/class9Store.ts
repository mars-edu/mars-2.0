import { defineStore } from "pinia";
import { ref, computed } from "vue";
import { convex } from "@/lib/convexClient";
import { api } from "@convex/_generated/api";

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
  distributionEntries: DistributionEntry[];
  position: number;
  createdAt: Date;
  updatedAt: Date;
}

export const useClass9Store = defineStore(
  "class9",
  () => {
    const class9Items = ref<Class9Data[]>([]);
    const loading = ref(false);
    const error = ref<string | null>(null);
    const migrationCompleted = ref(false);
    const controlMigrationCompleted = ref(false);

    // Run migrations on store initialization
    migrateClass9DataToMultipleSpecialties();
    migrateControlTypesToDynamic();

    const getClass9ById = computed(() => {
      return (id: string) => class9Items.value.find((c) => c.id === id);
    });

    const getClass9ItemsByContext = computed(() => {
      return (academicYearId: string, specialtyIds?: string[]) =>
        class9Items.value
          .filter(
            (c) =>
              c.academicYearId === academicYearId &&
              (!specialtyIds ||
                specialtyIds.length === 0 ||
                specialtyIds.some((id) => c.specialtyIds.includes(id)))
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
      return class9Items.value
        .filter(
          (item) => item.learningOutcome && item.learningOutcome.trim() !== ""
        )
        .map((item) => ({
          value: item.id,
          text: `${item.moduleIndex} ${item.moduleName} - ${item.learningOutcome}`,
          moduleIndex: item.moduleIndex,
          moduleName: item.moduleName,
          learningOutcome: item.learningOutcome,
        }));
    });

    function createEmptyClass9Data(
      academicYearId: string,
      specialtyIds: string[] = []
    ): Class9Data {
      return {
        id: crypto.randomUUID(),
        specialtyIds,
        academicYearId,
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
              intermediateControlId: dist.intermediateControlId,
              finalControlId: dist.finalControlId,
              examEnabled: dist.examEnabled,
              creditEnabled: dist.creditEnabled,
              controlLessonEnabled: dist.controlLessonEnabled,
            });
          }
        }

        // Load the created item with nested data
        const created = await convex.query(api.class9Items.queries.getById, { id });
        if (created) {
          const mapped: Class9Data = {
            id: created._id,
            specialtyIds: created.specialtyIds,
            academicYearId: created.academicYearId,
            moduleIndex: created.moduleIndex,
            moduleName: created.moduleName,
            learningOutcome: created.learningOutcome,
            totalCredits: created.totalCredits,
            totalHours: created.totalHours,
            theoreticalHours: created.theoreticalHours,
            labPracticalHours: created.labPracticalHours,
            field3Value: created.field3Value,
            srspHours: created.srspHours,
            srsHours: created.srsHours,
            trainingPracticeHours: created.trainingPracticeHours,
            individualHours: created.individualHours,
            position: created.position,
            distributionEntries: (created.distributionEntries || []).map((d: any) => ({
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
            createdAt: new Date(created.createdAt),
            updatedAt: new Date(created.updatedAt),
          };
          class9Items.value.push(mapped);
          error.value = null;
          return mapped;
        }
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
        >
      >
    ) {
      loading.value = true;
      try {
        const existingItem = getClass9ById.value(existingItemId);
        if (!existingItem) {
          throw new Error("Existing item not found");
        }

        const contextItems = getClass9ItemsByContext.value(
          academicYearId,
          specialtyIds
        );

        const linkedClass9: Class9Data = {
          ...existingItem,
          id: crypto.randomUUID(),
          specialtyIds,
          academicYearId,
          position: contextItems.length,
          createdAt: new Date(),
          updatedAt: new Date(),
          ...customData,
        };

        class9Items.value.push(linkedClass9);
        error.value = null;
        return linkedClass9;
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
        class9Items.value.push(...items);
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
        // Use Convex - update parent item
        const updated = await convex.mutation(api.class9Items.mutations.update, {
          id: id as any,
          specialtyIds: data.specialtyIds,
          academicYearId: data.academicYearId,
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
          position: data.position,
        });

        // Note: distributionEntries updates handled separately via addDistribution/updateDistribution/removeDistribution

        if (updated) {
          const mapped: Class9Data = {
            id: updated._id,
            specialtyIds: updated.specialtyIds,
            academicYearId: updated.academicYearId,
            moduleIndex: updated.moduleIndex,
            moduleName: updated.moduleName,
            learningOutcome: updated.learningOutcome,
            totalCredits: updated.totalCredits,
            totalHours: updated.totalHours,
            theoreticalHours: updated.theoreticalHours,
            labPracticalHours: updated.labPracticalHours,
            field3Value: updated.field3Value,
            srspHours: updated.srspHours,
            srsHours: updated.srsHours,
            trainingPracticeHours: updated.trainingPracticeHours,
            individualHours: updated.individualHours,
            position: updated.position,
            distributionEntries: (updated.distributionEntries || []).map((d: any) => ({
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
            createdAt: new Date(updated.createdAt),
            updatedAt: new Date(updated.updatedAt),
          };

          const index = class9Items.value.findIndex((c) => c.id === id);
          if (index !== -1) {
            class9Items.value[index] = mapped;
          }
          error.value = null;
          return mapped;
        }
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

    function duplicateClass9Item(itemToDuplicate: Class9Data) {
      const duplicatedItem: Class9Data = JSON.parse(
        JSON.stringify(itemToDuplicate)
      );
      duplicatedItem.id = crypto.randomUUID();
      duplicatedItem.moduleName = itemToDuplicate.moduleName;
      duplicatedItem.createdAt = new Date();
      duplicatedItem.updatedAt = new Date();

      const originalItem = class9Items.value.find(
        (item) => item.id === itemToDuplicate.id
      );
      if (!originalItem) {
        console.error("Original item not found for duplication");
        return;
      }

      const insertionPosition = originalItem.position + 1;

      const itemsInContext = class9Items.value.filter(
        (c) =>
          c.academicYearId === itemToDuplicate.academicYearId &&
          c.specialtyIds.some((id) => itemToDuplicate.specialtyIds.includes(id))
      );

      itemsInContext.forEach((item) => {
        if (item.position >= insertionPosition) {
          item.position++;
        }
      });

      duplicatedItem.position = insertionPosition;
      class9Items.value.push(duplicatedItem);
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
      class9Items.value = [];
      loading.value = false;
      error.value = null;
    }

    function forceMigrateData() {
      migrationCompleted.value = false;
      migrateClass9DataToMultipleSpecialties();
    }

    // Migration method to convert old specialtyId format to new specialtyIds array format
    function migrateClass9DataToMultipleSpecialties() {
      if (migrationCompleted.value) {
        return; // Migration already completed
      }

      let hasChanges = false;
      const migratedItems = class9Items.value.map((item) => {
        // Check if item has old format (specialtyId as string and no specialtyIds array)
        if (
          "specialtyId" in item &&
          typeof (item as any).specialtyId === "string" &&
          !("specialtyIds" in item)
        ) {
          const oldItem = item as any;
          hasChanges = true;

          // Convert to new format
          return {
            ...oldItem,
            specialtyIds: [oldItem.specialtyId], // Convert single ID to array
          } as Class9Data;
        }

        // Item already has new format or no specialty data
        return item;
      });

      if (hasChanges) {
        class9Items.value = migratedItems;
        console.log(
          `🔄 Migrated ${migratedItems.length} Class9 items from single specialty to multiple specialties format`
        );
      }

      migrationCompleted.value = true;
    }

    function migrateControlTypesToDynamic() {
      if (controlMigrationCompleted.value) {
        return;
      }

      let hasChanges = false;
      class9Items.value.forEach((item) => {
        item.distributionEntries.forEach((entry) => {
          const anyEntry = entry as any;
          if (
            typeof anyEntry.examEnabled === "boolean" ||
            typeof anyEntry.creditEnabled === "boolean" ||
            typeof anyEntry.controlLessonEnabled === "boolean"
          ) {
            if (!entry.finalControlId) {
              hasChanges = true;
            }
          }
        });
      });

      if (hasChanges) {
        console.log(
          `🔄 Migrated Class9 distribution entries to support dynamic control types. Old boolean flags preserved for backward compatibility.`
        );
      }

      controlMigrationCompleted.value = true;
    }

    // Test migration method (for development purposes)
    function testMigration() {
      console.log("🧪 Testing migration...");

      // Create test data with old format
      const testItems: Class9Data[] = [
        {
          id: "test-1",
          specialtyId: "old-specialty-1", // Old format
          academicYearId: "year-1",
          moduleIndex: "1",
          moduleName: "Test Module 1",
          learningOutcome: "Test Outcome 1",
          totalCredits: "5",
          totalHours: "100",
          theoreticalHours: "50",
          labPracticalHours: "30",
          field3Value: "10",
          srspHours: "5",
          srsHours: "5",
          trainingPracticeHours: "0",
          individualHours: "0",
          distributionEntries: [],
          position: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
        } as any, // Type assertion to bypass TypeScript for testing
        {
          id: "test-2",
          specialtyIds: ["new-specialty-1", "new-specialty-2"], // Already new format
          academicYearId: "year-1",
          moduleIndex: "2",
          moduleName: "Test Module 2",
          learningOutcome: "Test Outcome 2",
          totalCredits: "3",
          totalHours: "60",
          theoreticalHours: "30",
          labPracticalHours: "20",
          field3Value: "5",
          srspHours: "3",
          srsHours: "2",
          trainingPracticeHours: "0",
          individualHours: "0",
          distributionEntries: [],
          position: 1,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      class9Items.value = testItems;

      // Run migration
      migrateClass9DataToMultipleSpecialties();

      // Check results
      const migratedItem1 = class9Items.value.find(
        (item) => item.id === "test-1"
      );
      const migratedItem2 = class9Items.value.find(
        (item) => item.id === "test-2"
      );

      console.log("✅ Migration test results:");
      console.log("Test item 1 specialtyIds:", migratedItem1?.specialtyIds);
      console.log("Test item 2 specialtyIds:", migratedItem2?.specialtyIds);
      console.log("Migration completed:", migrationCompleted.value);

      // Reset test data
      class9Items.value = [];
    }

    async function loadFromBackend() {
      loading.value = true;
      try {
        const data = await convex.query(api.class9Items.queries.list, {});
        class9Items.value = data.map((item: any) => ({
          id: item._id,
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

        // Run migration functions on loaded data
        migrateClass9DataToMultipleSpecialties();
        migrateControlTypesToDynamic();

        error.value = null;
      } catch (err) {
        console.error("[class9Store] Failed to load from Convex:", err);
        error.value = "Failed to load class9 items";
      } finally {
        loading.value = false;
      }
    }

    return {
      class9Items,
      loading,
      error,
      migrationCompleted,
      controlMigrationCompleted,
      getClass9ById,
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
      deleteClass9,
      clearError,
      reset,
      forceMigrateData,
      migrateClass9DataToMultipleSpecialties,
      migrateControlTypesToDynamic,
      testMigration,
      loadFromBackend,
    };
  },
  {
    persist: true,
  }
);
