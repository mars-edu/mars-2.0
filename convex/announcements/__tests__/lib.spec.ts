import {
  assertHasLocalizedContent,
  filterActiveAnnouncements,
  normalizeAnnouncementCategories,
} from "../lib";

const baseAnnouncement = {
  _id: "announcement-id",
  _creationTime: 1,
  kind: "announcement",
  category: "academic",
  type: "info",
  titles: { ru: "Title" },
  descriptions: { ru: "Description" },
  displayDate: "5 марта",
  isPublished: true,
  createdBy: "user-id",
  createdAt: new Date(1000).toISOString(),
  updatedAt: 1000,
};

describe("announcement feed helpers", () => {
  it("returns only published announcements inside the active window ordered newest first", () => {
    const now = new Date(5000).toISOString();
    const activeOlder = {
      ...baseAnnouncement,
      _id: "older",
      createdAt: new Date(1000).toISOString(),
    };
    const activeNewer = {
      ...baseAnnouncement,
      _id: "newer",
      createdAt: new Date(4000).toISOString(),
      publishAt: new Date(3000).toISOString(),
      expiresAt: new Date(6000).toISOString(),
    };
    const draft = {
      ...baseAnnouncement,
      _id: "draft",
      isPublished: false,
      createdAt: new Date(9000).toISOString(),
    };
    const future = {
      ...baseAnnouncement,
      _id: "future",
      publishAt: new Date(6000).toISOString(),
    };
    const expired = {
      ...baseAnnouncement,
      _id: "expired",
      expiresAt: new Date(4000).toISOString(),
    };

    const result = filterActiveAnnouncements(
      [activeOlder, draft, activeNewer, future, expired],
      { now }
    );

    expect(result.map((item) => item._id)).toEqual(["newer", "older"]);
  });

  it("applies category, kind, and limit filters", () => {
    const items = [
      { ...baseAnnouncement, _id: "custom-news", kind: "news", category: "student-life", createdAt: new Date(3000).toISOString() },
      { ...baseAnnouncement, _id: "event-news", kind: "news", category: "events", createdAt: new Date(2000).toISOString() },
      { ...baseAnnouncement, _id: "academic-announcement", createdAt: new Date(1000).toISOString() },
    ];

    const result = filterActiveAnnouncements(items, {
      now: new Date(5000).toISOString(),
      category: "student-life",
      kind: "news",
      limit: 1,
    });

    expect(result.map((item) => item._id)).toEqual(["custom-news"]);
  });

  it("requires at least one localized title and description", () => {
    expect(() =>
      assertHasLocalizedContent(
        { ru: "  ", kk: "", en: "" },
        { ru: "Description" }
      )
    ).toThrow("Announcement title is required");

    expect(() =>
      assertHasLocalizedContent(
        { ru: "Title" },
        { ru: "", kk: "   " }
      )
    ).toThrow("Announcement description is required");

    expect(() =>
      assertHasLocalizedContent(
        { kk: "Тақырып" },
        { kk: "Сипаттама" }
      )
    ).not.toThrow();
  });

  it("normalizes frontend category settings and removes duplicate slugs", () => {
    const categories = normalizeAnnouncementCategories([
      {
        id: " Student Life ",
        labels: { ru: " Студенческая жизнь ", kk: "Студенттік өмір" },
      },
      { id: "student-life", labels: { ru: "Duplicate" } },
      { id: "events", labels: { en: "Events" } },
      { id: "", labels: { ru: "Empty" } },
      { id: "bad !!!", labels: {} },
    ]);

    expect(categories).toEqual([
      {
        id: "student-life",
        labels: { ru: "Студенческая жизнь", kk: "Студенттік өмір" },
        position: 0,
      },
      { id: "events", labels: { en: "Events" }, position: 1 },
    ]);
  });
});
