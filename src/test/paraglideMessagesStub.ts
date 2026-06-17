/**
 * Jest stub for `@/paraglide/messages`.
 *
 * The real module is compiled ESM (`export * from ...`) that ts-jest does not
 * transform, so importing anything that transitively pulls in paraglide blew up
 * the test runner. Tests don't assert on localized copy, so every message is
 * stubbed as a function returning its own key.
 */
module.exports = new Proxy(
  {},
  {
    get(_target, prop: string) {
      if (prop === "__esModule") return true;
      return () => prop;
    },
  }
);
