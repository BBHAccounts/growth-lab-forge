import { expect, test } from "bun:test";
import { validEmailCode } from "./email-code";
test("sign-in requires exactly six numeric digits", () => {
  expect(validEmailCode("123456")).toBe(true);
  expect(validEmailCode("012345")).toBe(true);
  for (const value of ["12345", "1234567", "abcdef", "123 45", ""]) expect(validEmailCode(value)).toBe(false);
});