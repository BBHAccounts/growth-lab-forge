/// <reference types="bun" />
import { expect, test } from "bun:test";
import { bookNotesText, savedBookNotes } from "./book-reader";
import type { PathChapter } from "./book-path";

const chapter = (n: number): PathChapter => ({ id: String(n), name: `Chapter ${n}: Environment`, order_index: n, deadline: null, steps: [{ id: `${n}B`, title: `Video ${n}B`, instruction: "", fields: [{ id: `notes_${n}B`, type: "textarea" }] }] });
test("saved notes include only exercise fields in chapter and video order", () => {
  const groups = savedBookNotes([chapter(3), chapter(1), chapter(2)], { notes_1B: "First answer", notes_2B: "  ", notes_3B: "Third answer", unrelated: "Never export", __done: { "1B": "2026-11-10T00:00:00Z" } });
  expect(groups.map(g => g.chapter.order_index)).toEqual([1, 3]);
  expect(groups[0].notes[0]).toMatchObject({ text: "First answer", step: { id: "1B" } });
});
test("plain text download contains the user's saved notes with chapter and video references", () => {
  const text = bookNotesText([chapter(3)], { notes_3B: "My private reflection", unrelated: "Not a book note" });
  expect(text).toContain("Chapter 3: Environment\n\nVideo 3B\nMy private reflection");
  expect(text).not.toContain("Not a book note");
});