/// <reference types="bun" />
import { expect, test } from "bun:test";
import { bookNoteField, followingBookStep } from "./book-video";
import type { PathChapter } from "./book-path";

test("notes reuse the existing textarea field ID", () => {
  expect(bookNoteField([{ id: "other", type: "text" }, { id: "notes_3B", type: "textarea", label: "Reflection" }])).toEqual({ id: "notes_3B", label: "Reflection" });
  expect(bookNoteField([])).toBeNull();
});
test("next follows programme order, crosses chapters and returns home after the last step", () => {
  const chapter = (n: number): PathChapter => ({ id: String(n), name: "Chapter", deadline: null, order_index: n, steps: ["A", "B", "C"].map(letter => ({ id: `${n}${letter}`, title: letter, instruction: "", fields: [] })) });
  const chapters = [chapter(15), chapter(1), chapter(2)];
  expect(followingBookStep(chapters, "1A")?.id).toBe("1B");
  expect(followingBookStep(chapters, "1C")?.id).toBe("2A");
  expect(followingBookStep(chapters, "15C")).toBeNull();
});