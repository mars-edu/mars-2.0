import type { Ref } from "vue";

export async function withLoading<T>(
  loading: Ref<boolean>,
  error: Ref<string | null>,
  action: () => Promise<T>,
  fallbackMsg = "Operation failed"
): Promise<T> {
  loading.value = true;
  error.value = null;
  try {
    return await action();
  } catch (err) {
    error.value = err instanceof Error ? err.message : fallbackMsg;
    throw err;
  } finally {
    loading.value = false;
  }
}
