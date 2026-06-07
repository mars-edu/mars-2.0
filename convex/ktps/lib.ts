/**
 * Validates that orderedIds is an exact permutation of existingIds.
 * Returns an error message or null when valid.
 */
export function validateReorder(
  existingIds: string[],
  orderedIds: string[]
): string | null {
  if (orderedIds.length !== existingIds.length) {
    return `Reorder list length ${orderedIds.length} does not match existing details count ${existingIds.length}`;
  }
  if (new Set(orderedIds).size !== orderedIds.length) {
    return "Duplicate ids in reorder list";
  }
  const existing = new Set(existingIds);
  for (const id of orderedIds) {
    if (!existing.has(id)) {
      return `Unknown detail id in reorder list: ${id}`;
    }
  }
  return null;
}
