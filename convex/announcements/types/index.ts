export type LocalizedContent = {
  ru?: string;
  kk?: string;
  en?: string;
};

export type AnnouncementFeedItem = {
  kind: string;
  category: string;
  isPublished: boolean;
  publishAt?: string;
  expiresAt?: string;
  createdAt: string;
};

export type AnnouncementFeedFilters = {
  now?: string;
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
