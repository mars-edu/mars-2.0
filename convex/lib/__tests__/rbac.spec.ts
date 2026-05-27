import { isPermissionActive, hasRoleAccess } from "../rbac";

describe("isPermissionActive", () => {
  it("returns true when no time bounds are set", () => {
    expect(isPermissionActive(undefined, undefined, 1000)).toBe(true);
  });

  it("returns false when now is before activeFrom", () => {
    expect(isPermissionActive(5000, undefined, 3000)).toBe(false);
  });

  it("returns false when now is after activeTo", () => {
    expect(isPermissionActive(undefined, 2000, 3000)).toBe(false);
  });

  it("returns true when now is within the active window", () => {
    expect(isPermissionActive(1000, 5000, 3000)).toBe(true);
  });

  it("returns true when now equals activeFrom boundary", () => {
    expect(isPermissionActive(3000, 5000, 3000)).toBe(true);
  });

  it("returns true when now equals activeTo boundary", () => {
    expect(isPermissionActive(1000, 3000, 3000)).toBe(true);
  });
});

describe("hasRoleAccess", () => {
  it("returns true when user has one matching role", () => {
    expect(hasRoleAccess(["TEACHER"], ["ADMIN", "TEACHER"])).toBe(true);
  });

  it("returns false when user has no matching roles", () => {
    expect(hasRoleAccess(["STUDENT"], ["ADMIN", "TEACHER"])).toBe(false);
  });

  it("returns false for empty user roles", () => {
    expect(hasRoleAccess([], ["ADMIN"])).toBe(false);
  });

  it("returns false for empty allowed roles", () => {
    expect(hasRoleAccess(["ADMIN"], [])).toBe(false);
  });

  it("returns true when user has ADMIN and ADMIN is allowed", () => {
    expect(hasRoleAccess(["ADMIN"], ["ADMIN"])).toBe(true);
  });
});
