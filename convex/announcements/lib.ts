import type {
  AnnouncementCategoryInput,
  AnnouncementFeedFilters,
  AnnouncementFeedItem,
  LocalizedContent,
  NormalizedAnnouncementCategory,
} from "./types";

export function normalizeCategoryId(id: string) {
  return id
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function normalizeAnnouncementCategories(
  categories: AnnouncementCategoryInput[]
): NormalizedAnnouncementCategory[] {
  const seen = new Set<string>();
  const normalized: NormalizedAnnouncementCategory[] = [];

  for (const category of categories) {
    const id = normalizeCategoryId(category.id);
    const labels: LocalizedContent = {};

    for (const lang of ["ru", "kk", "en"] as const) {
      const value = category.labels[lang]?.trim();
      if (value) labels[lang] = value;
    }

    if (!id || !hasLocalizedText(labels) || seen.has(id)) continue;

    seen.add(id);
    normalized.push({
      id,
      labels,
      position: normalized.length,
    });
  }

  return normalized;
}

export function hasLocalizedText(content: LocalizedContent) {
  return Object.values(content).some((value) => value?.trim());
}

export function assertHasLocalizedContent(
  titles: LocalizedContent,
  descriptions: LocalizedContent
) {
  if (!hasLocalizedText(titles)) {
    throw new Error("Announcement title is required");
  }

  if (!hasLocalizedText(descriptions)) {
    throw new Error("Announcement description is required");
  }
}

export function isActiveAnnouncement<T extends AnnouncementFeedItem>(
  item: T,
  now = Date.now()
) {
  if (!item.isPublished) return false;
  if (item.publishAt !== undefined && item.publishAt > now) return false;
  if (item.expiresAt !== undefined && item.expiresAt <= now) return false;
  return true;
}

export function filterActiveAnnouncements<T extends AnnouncementFeedItem>(
  items: T[],
  filters: AnnouncementFeedFilters = {}
) {
  const now = filters.now ?? Date.now();
  const limit = Math.max(0, filters.limit ?? 20);

  return items
    .filter((item) => isActiveAnnouncement(item, now))
    .filter((item) => !filters.category || item.category === filters.category)
    .filter((item) => !filters.kind || item.kind === filters.kind)
    .sort((a, b) => b.createdAt - a.createdAt)
    .slice(0, limit);
}
