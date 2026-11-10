/// <reference types="bun" />
import { describe, expect, test } from "bun:test";
import { getBookDone, hasBookChapterTag, isBookChapterComplete, isBookChapterUnlocked, markBookStepDone, undoBookStepDone } from "./book";

const now = new Date("2026-11-10T14:26:00Z");
const first = { order_index: 1, deadline: null, steps: [{ id: "1A" }, { id: "1B" }, { id: "1C" }] };
const second = { order_index: 2, deadline: "2026-11-17T00:00:00Z", steps: [{ id: "2A" }, { id: "2B" }, { id: "2C" }] };
const chapters = [first, second];
const complete = { __done: { "1A": now.toISOString(), "1B": now.toISOString(), "1C": now.toISOString() } };

describe("book chapter rules", () => {
  test("undo removes only that step completion and retains private notes and other completions", () => {
    const original = { notes_1A: "Private answer", __done: { "1A": now.toISOString(), "1B": now.toISOString() } };
    expect(undoBookStepDone(original, "1A")).toEqual({ notes_1A: "Private answer", __done: { "1B": now.toISOString() } });
    expect(getBookDone(original)["1A"]).toBe(now.toISOString());
  });
  test("chapter 1 is always open", () => {
    expect(isBookChapterUnlocked(first, chapters, {}, true, now)).toBe(true);
  });
  test("all three previous steps unlock the next chapter before its deadline", () => {
    expect(isBookChapterUnlocked(second, chapters, complete, true, now)).toBe(true);
    expect(isBookChapterUnlocked(second, chapters, { __done: { "1A": now.toISOString(), "1B": now.toISOString() } }, true, now)).toBe(false);
  });
  test("the chapter's own deadline unlocks it independently of completion", () => {
    expect(isBookChapterUnlocked(second, chapters, {}, true, new Date("2026-11-16T23:59:59Z"))).toBe(false);
    expect(isBookChapterUnlocked(second, chapters, {}, true, new Date("2026-11-17T00:00:00Z"))).toBe(true);
  });
  test("non-sequential programmes open every chapter", () => {
    expect(isBookChapterUnlocked(second, chapters, {}, false, now)).toBe(true);
  });
  test("chapter number is order_index, not array position", () => {
    expect(isBookChapterUnlocked(second, [second, first], complete, true, now)).toBe(true);
    expect(isBookChapterUnlocked({ ...second, order_index: 3 }, chapters, complete, true, now)).toBe(false);
  });
  test("completion requires exactly three valid done timestamps, not filled notes", () => {
    expect(isBookChapterComplete(first, complete)).toBe(true);
    expect(isBookChapterComplete(first, { notes_1A: "answer" })).toBe(false);
    expect(isBookChapterComplete(first, { __done: { "1A": "invalid", "1B": now.toISOString(), "1C": now.toISOString() } })).toBe(false);
    expect(isBookChapterComplete({ ...first, steps: [] }, complete)).toBe(false);
  });
  test("done is stored under __done with the step ID and ISO timestamp, retaining notes", () => {
    const original = { notes_1A: "Private notes", __done: { "1B": now.toISOString() }, custom: { value: 7 } };
    expect(markBookStepDone(original, "1A", now)).toEqual({ ...original, __done: { "1B": "2026-11-10T14:26:00.000Z", "1A": "2026-11-10T14:26:00.000Z" } });
    expect(getBookDone(original)).not.toHaveProperty("1A");
  });
  test("only book-ch1 through book-ch15 tags match linked Growth Lab models", () => {
    expect(hasBookChapterTag(["book-ch1"])).toBe(true);
    expect(hasBookChapterTag(["book-ch15"])).toBe(true);
    expect(hasBookChapterTag(["book-ch0", "book-ch16", "beyond-the-book", "book-ch1-other"])).toBe(false);
  });
});