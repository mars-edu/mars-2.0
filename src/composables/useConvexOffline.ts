/**
 * Convex Offline Composable
 *
 * Provides a unified interface for Convex queries and mutations
 * with offline support. Automatically queues mutations when offline
 * and syncs when back online.
 */

import { ref, computed, watch, onMounted, type Ref, type ComputedRef } from "vue";
import { useConvexQuery as useQuery, useConvexMutation as useMutation } from "convex-vue";
import type { FunctionReference } from "convex/server";
import {
  useOfflineSync,
  queueMutation,
  cacheData,
  getCachedData,
  isOffline,
} from "@/lib/offlineSync";

/**
 * Wrapper for Convex queries with offline caching
 */
export function useConvexQuery<T>(
  queryRef: FunctionReference<"query">,
  args: Ref<Record<string, any>> | (() => Record<string, any>),
  options?: {
    cacheKey?: string;
    enabled?: Ref<boolean>;
  }
) {
  const { isOnline, cacheData: cache, getCachedData: getCache } = useOfflineSync();

  // Get args value
  const getArgs = () => (typeof args === "function" ? args() : args.value);

  // Generate cache key
  const cacheKey = computed(() => {
    return (
      options?.cacheKey ||
      `query:${queryRef.toString()}:${JSON.stringify(getArgs())}`
    );
  });

  // Local cached data
  const cachedData = ref<T | null>(null);
  const cachedAt = ref<number | null>(null);

  // Check if query should be enabled
  const shouldQuery = computed(() => {
    return (options?.enabled?.value ?? true) && isOnline.value;
  });

  // Convex query
  const convexQuery = useQuery(queryRef, args);

  // Combined data (Convex data or cached data)
  const data = computed<T | undefined>(() => {
    if (convexQuery.data.value !== undefined) {
      return convexQuery.data.value as T;
    }
    return (cachedData.value as T) ?? undefined;
  });

  // Loading state
  const loading = computed(() => {
    return (shouldQuery.value && convexQuery.isPending.value) || false;
  });

  // Cache data when it changes
  watch(
    () => convexQuery.data.value,
    async (newData) => {
      if (newData !== undefined) {
        await cacheData(cacheKey.value, newData);
        cachedData.value = newData as T;
        cachedAt.value = Date.now();
      }
    }
  );

  // Load cached data on mount
  onMounted(async () => {
    const cached = await getCachedData<T>(cacheKey.value);
    if (cached) {
      cachedData.value = cached.data;
      cachedAt.value = cached.cachedAt;
    }
  });

  return {
    data,
    loading,
    cachedData,
    cachedAt,
    isOnline,
    error: convexQuery.error,
    refresh: async () => {
      // Force re-fetch by triggering reactivity
      if (typeof args !== "function" && args.value) {
        const current = { ...args.value };
        args.value = current;
      }
    },
  };
}

/**
 * Wrapper for Convex mutations with offline support
 */
export function useConvexMutation<Args extends Record<string, any>, Result>(
  mutationRef: FunctionReference<"mutation">,
  options?: {
    offlineOperation?: string; // Operation name for offline queue
    optimisticUpdate?: (args: Args) => void;
    onSuccess?: (result: Result) => void;
    onError?: (error: Error) => void;
  }
) {
  const { isOnline, queueMutation: queue } = useOfflineSync();

  const loading = ref(false);
  const error = ref<Error | null>(null);

  // Convex mutation
  const convexMutationResult = useMutation(mutationRef);

  /**
   * Execute the mutation (online) or queue it (offline)
   */
  async function mutate(args: Args): Promise<Result | string> {
    loading.value = true;
    error.value = null;

    // Apply optimistic update if provided
    if (options?.optimisticUpdate) {
      options.optimisticUpdate(args);
    }

    try {
      if (isOnline.value && convexMutationResult) {
        // Execute directly using the mutate function from convex-vue
        const { result, error: mutationError } = await convexMutationResult.mutate(args);
        if (mutationError) {
          throw mutationError;
        }
        options?.onSuccess?.(result as Result);
        return result as Result;
      } else {
        // Queue for later
        const operationName =
          options?.offlineOperation || mutationRef.toString();
        const queueId = await queueMutation(operationName, args);
        console.log(`[useConvexMutation] Queued offline: ${operationName}`);
        return queueId;
      }
    } catch (err) {
      const e = err instanceof Error ? err : new Error(String(err));
      error.value = e;
      options?.onError?.(e);
      throw e;
    } finally {
      loading.value = false;
    }
  }

  return {
    mutate,
    loading: computed(() => loading.value),
    error: computed(() => error.value),
    isOnline,
  };
}

import { api } from "@convex/_generated/api";

/**
 * Composable for marks with offline support
 */
export function useConvexMarks(journalId: Ref<string>) {
  const { isOnline } = useOfflineSync();

  // Query for journal marks
  const {
    data: marksData,
    loading,
    cachedData,
  } = useConvexQuery(
    api.marks.queries.getJournalMarks,
    () => ({ journalId: journalId.value }),
    {
      cacheKey: `marks:${journalId.value}`,
      enabled: computed(() => !!journalId.value),
    }
  );

  // Mutation for updating marks
  const { mutate: updateMarkMutation } = useConvexMutation(
    api.marks.mutations.updateMark,
    {
      offlineOperation: "marks.updateMark",
    }
  );

  /**
   * Update a mark with offline support
   */
  async function updateMark(params: {
    studentId: string;
    columnIndex: number;
    rowIndex: number;
    value: string | null;
    columnType: "date" | "session";
    columnDate?: string;
    columnLabel?: string;
    controlType?: "intermediate" | "final";
    controlId?: string;
    sessionId?: string;
    scheduledControlId?: string;
    userId?: string;
  }) {
    return await updateMarkMutation({
      journalId: journalId.value,
      ...params,
    } as any);
  }

  return {
    marks: marksData,
    loading,
    cachedData,
    updateMark,
    isOnline,
  };
}

/**
 * Composable for academic years with offline support
 */
export function useConvexAcademicYears() {
  const { isOnline } = useOfflineSync();

  const { data: academicYears, loading } = useConvexQuery(
    api.academicYears.queries.list,
    () => ({}),
    { cacheKey: "academicYears:list" }
  );

  const { data: activeYear } = useConvexQuery(
    api.academicYears.queries.getActive,
    () => ({}),
    { cacheKey: "academicYears:active" }
  );

  const { mutate: createMutation } = useConvexMutation(
    api.academicYears.mutations.create,
    { offlineOperation: "academicYears.create" }
  );

  const { mutate: updateMutation } = useConvexMutation(
    api.academicYears.mutations.update,
    { offlineOperation: "academicYears.update" }
  );

  const { mutate: setActiveMutation } = useConvexMutation(
    api.academicYears.mutations.setActive,
    { offlineOperation: "academicYears.setActive" }
  );

  return {
    academicYears,
    activeYear,
    loading,
    create: createMutation,
    update: updateMutation,
    setActive: setActiveMutation,
    isOnline,
  };
}

/**
 * Composable for students with offline support
 */
export function useConvexStudents() {
  const { isOnline } = useOfflineSync();

  const { data: students, loading } = useConvexQuery(
    api.students.queries.list,
    () => ({}),
    { cacheKey: "students:list" }
  );

  const { mutate: createMutation } = useConvexMutation(
    api.students.mutations.create,
    { offlineOperation: "students.create" }
  );

  const { mutate: updateMutation } = useConvexMutation(
    api.students.mutations.update,
    { offlineOperation: "students.update" }
  );

  const { mutate: deleteMutation } = useConvexMutation(
    api.students.mutations.remove,
    { offlineOperation: "students.remove" }
  );

  return {
    students,
    loading,
    create: createMutation,
    update: updateMutation,
    remove: deleteMutation,
    isOnline,
  };
}

/**
 * Composable for teachers with offline support
 */
export function useConvexTeachers() {
  const { isOnline } = useOfflineSync();

  const { data: teachers, loading } = useConvexQuery(
    api.teachers.queries.list,
    () => ({}),
    { cacheKey: "teachers:list" }
  );

  const { mutate: createMutation } = useConvexMutation(
    api.teachers.mutations.create,
    { offlineOperation: "teachers.create" }
  );

  const { mutate: updateMutation } = useConvexMutation(
    api.teachers.mutations.update,
    { offlineOperation: "teachers.update" }
  );

  const { mutate: deleteMutation } = useConvexMutation(
    api.teachers.mutations.remove,
    { offlineOperation: "teachers.remove" }
  );

  return {
    teachers,
    loading,
    create: createMutation,
    update: updateMutation,
    remove: deleteMutation,
    isOnline,
  };
}
