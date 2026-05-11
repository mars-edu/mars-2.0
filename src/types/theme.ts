export const THEMES = ["light", "dark", "lavanda", "coral", "graphite"] as const;
export type Theme = typeof THEMES[number];
