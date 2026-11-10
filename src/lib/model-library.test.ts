import { expect, test } from "bun:test";
import { isLibraryModel, linkedChapters, setLinkedChapters } from "./model-library";

test("every active model appears without requiring a chapter tag", () => {
  expect(isLibraryModel({ status: "active", tags: [] })).toBe(true);
  expect(isLibraryModel({ status: "active", tags: ["book-ch3"] })).toBe(true);
});
test("hidden book chapters never appear even if made active", () => {
  expect(isLibraryModel({ status: "active", tags: ["beyond-the-book", "book-ch3"] })).toBe(false);
});
test("draft and hidden models are not library models", () => {
  expect(isLibraryModel({ status: "hidden", tags: [] })).toBe(false);
  expect(isLibraryModel({ status: "draft", tags: ["book-ch3"] })).toBe(false);
});
test("chapter links include chapters 1 through 15 in numeric order", () => {
  expect(linkedChapters(["book-ch15", "book-ch3", "book-ch1", "book-ch3", "book-ch16", "book-ch0"])).toEqual([1, 3, 15]);
});
test("chapter selection preserves unrelated tags and replaces only chapter links", () => {
  expect(setLinkedChapters(["strategy", "beyond-the-book", "book-ch1", "book-ch6"], [3, 15])).toEqual(["strategy", "beyond-the-book", "book-ch3", "book-ch15"]);
});