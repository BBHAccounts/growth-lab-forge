import { describe, expect, test } from "bun:test";
import { bookRootDestination, isBookTool, safeAppReturn } from "./book-routing";

describe("book-only routing", () => {
  test("book members and admins open the path", () => {
    expect(bookRootDestination(true, false)).toBe("/book");
    expect(bookRootDestination(false, true)).toBe("/book");
  });
  test("everyone else opens joining", () => {
    expect(bookRootDestination(false, false)).toBe("/book/join");
  });
  test("sign-in returns only to retained local pages", () => {
    expect(safeAppReturn("/book/tools/tool-123")).toBe("/book/tools/tool-123");
    expect(safeAppReturn("/book/v/3B")).toBe("/book/v/3B");
    expect(safeAppReturn("/account")).toBe("/account");
    for (const path of ["//example.com", "https://example.com", "/models/123", "/research", "/book/../auth", "/book\\evil", null]) expect(safeAppReturn(path)).toBe("/book");
  });
  test("participant tools have book chapter tags 1 to 15 only", () => {
    expect(isBookTool(["book-ch1"])).toBe(true);
    expect(isBookTool(["book-ch15"])).toBe(true);
    for (const tags of [["book-ch0"], ["book-ch16"], ["beyond-the-book"], [], null]) expect(isBookTool(tags)).toBe(false);
  });
});