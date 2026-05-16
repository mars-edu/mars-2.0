export interface AnnouncementCategory {
  id: string;
  label?: string;
  labels: AnnouncementContent;
  position?: number;
}

export interface AnnouncementContent {
  ru?: string;
  kk?: string;
  en?: string;
}

export interface AnnouncementCreatePayload {
  kind?: "announcement" | "news";
  category: string;
  type: "info" | "alert" | "system";
  titles: AnnouncementContent;
  descriptions: AnnouncementContent;
  displayDate: string;
  publishAt?: number;
  expiresAt?: number;
  isPublished?: boolean;
}

export interface AnnouncementCardItem {
  id: string;
  title: string;
  description: string;
  date: string;
  category: string;
  badge: string;
  badgeClass: string;
}
