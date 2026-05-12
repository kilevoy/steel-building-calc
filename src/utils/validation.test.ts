import { describe, expect, it } from "vitest";
import { validateNonNegativeNumber, validatePositiveNumber } from "./validation";

describe("number validation", () => {
  it("accepts positive values for positive validation", () => {
    expect(validatePositiveNumber(1, "Поле")).toBeNull();
  });

  it("rejects zero and negative values for positive validation", () => {
    expect(validatePositiveNumber(0, "Поле")).toBe("Поле: значение должно быть больше 0.");
    expect(validatePositiveNumber(-1, "Поле")).toBe("Поле: значение должно быть больше 0.");
  });

  it("accepts zero for non-negative validation", () => {
    expect(validateNonNegativeNumber(0, "Поле")).toBeNull();
  });

  it("rejects negative values for non-negative validation", () => {
    expect(validateNonNegativeNumber(-1, "Поле")).toBe("Поле: значение не может быть отрицательным.");
  });
});
