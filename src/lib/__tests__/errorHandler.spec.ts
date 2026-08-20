jest.mock("framework7-vue", () => ({
  f7: {
    dialog: {
      alert: jest.fn(),
    },
  },
}), { virtual: true });

jest.mock("@/lib/notify", () => ({
  notify: {
    error: jest.fn(),
  },
}));

import { ConvexError } from "convex/values";
import { getErrorMessage } from "../errorHandler";

describe("errorHandler", () => {
  describe("getErrorMessage", () => {
    it("extracts message from standard Error", () => {
      const err = new Error("Ошибка подключения к серверу");
      expect(getErrorMessage(err)).toBe("Ошибка подключения к серверу");
    });

    it("strips Convex server error prefixes", () => {
      const err = new Error("Uncaught ConvexError: Запись РУП не найдена");
      expect(getErrorMessage(err)).toBe("Запись РУП не найдена");
    });

    it("maps known Convex error codes to localized messages", () => {
      const errWithCode = new ConvexError({ code: "NOT_FOUND" });
      expect(getErrorMessage(errWithCode)).toBe("error_not_found");

      const errUnauthorized = new ConvexError({ code: "UNAUTHORIZED" });
      expect(getErrorMessage(errUnauthorized)).toBe("error_unauthorized");
    });

    it("extracts message from ConvexError when no code given", () => {
      const err = new ConvexError({ message: "Журнал не найден" });
      expect(getErrorMessage(err)).toBe("Журнал не найден");
    });

    it("handles string error inputs directly", () => {
      expect(getErrorMessage("Прямой текст ошибки")).toBe("Прямой текст ошибки");
    });

    it("falls back to default error text for null or undefined", () => {
      expect(getErrorMessage(null, "Произошла ошибка")).toBe("Произошла ошибка");
      expect(getErrorMessage(undefined, "Резервная ошибка")).toBe("Резервная ошибка");
    });
  });
});
