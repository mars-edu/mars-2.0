/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: "node",
  transform: {
    "^.+\\.(ts|tsx)$": [
      "ts-jest",
      {
        tsconfig: "./tsconfig.json",
        diagnostics: false,
      },
    ],
  },
  moduleFileExtensions: ["ts", "tsx", "js", "json", "vue"],
  moduleNameMapper: {
    // Stub compiled-ESM paraglide messages (untransformable by ts-jest).
    // Must precede the generic "@/" mapping below.
    "^@/paraglide/messages$": "<rootDir>/src/test/paraglideMessagesStub.ts",
    "^@/(.*)$": "<rootDir>/src/$1",
  },
  testMatch: ["**/__tests__/**/*.spec.(ts|tsx|js)"],
  setupFiles: [],
  collectCoverageFrom: [
    "src/utils/eventDate.ts",
    "src/composables/useUnsavedChangesDialog.ts",
    "src/composables/useUnsavedPopoverGuard.ts",
  ],
};
