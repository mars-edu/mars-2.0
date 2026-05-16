export type LocalizedContent = {
  ru?: string;
  kk?: string;
  en?: string;
};

export type AnnouncementFeedItem = {
  kind: string;
  category: string;
  isPublished: boolean;
  publishAt?: number;
  expiresAt?: number;
  createdAt: number;
};

export type AnnouncementFeedFilters = {
  now?: number;
  category?: string;
  kind?: string;
  limit?: number;
};

export type AnnouncementCategoryInput = {
  id: string;
  labels: LocalizedContent;
};

export type NormalizedAnnouncementCategory = AnnouncementCategoryInput & {
  position: number;
};
