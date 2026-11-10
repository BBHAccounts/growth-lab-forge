/// <reference types="bun" />
import { test, expect } from "bun:test";
import { bookWeek, deriveBookPath, type PathChapter } from "./book-path";
const now = new Date("2026-11-24T00:00:00Z");
const chapters: PathChapter[] = Array.from({ length: 15 }, (_, i) => ({ id: `ch${i + 1}`, name: `Chapter ${i + 1}: Title`, order_index: i + 1, deadline: new Date(Date.UTC(2026, 10, 10 + 7 * i)).toISOString(), steps: ["A", "B", "C"].map(s => ({ id: `${i + 1}${s}`, title: "Video", instruction: "", fields: [] })) }));
test("week is one plus full weeks since chapter 1, capped at 1 and 15", () => {
  expect(bookWeek(chapters[0].deadline, now)).toBe(3);
  expect(bookWeek(chapters[0].deadline, new Date("2026-11-16T23:59:59Z"))).toBe(1);
  expect(bookWeek(chapters[0].deadline, new Date("2026-11-09T00:00:00Z"))).toBe(1);
  expect(bookWeek(chapters[0].deadline, new Date("2027-11-09T00:00:00Z"))).toBe(15);
});
test("current chapter is the first open incomplete chapter and next video is its first unfinished step", () => {
  const done = Object.fromEntries(["1A", "1B", "1C", "2A", "2B", "2C", "3A"].map(id => [id, now.toISOString()]));
  const path = deriveBookPath(chapters, { __done: done }, true, now);
  expect(path.states.ch1).toBe("completed"); expect(path.states.ch3).toBe("in progress"); expect(path.states.ch4).toBe("open");
  expect(path.nextStep?.id).toBe("3B"); expect(path.doneCount).toBe(7); expect(path.total).toBe(45);
});
test("deadline-open chapters after the current chapter are open, not current", () => {
  const path = deriveBookPath([...chapters].reverse(), {}, true, now);
  expect(path.current?.order_index).toBe(1); expect(path.states.ch2).toBe("open"); expect(path.states.ch3).toBe("open");
});
test("non-sequential programme has no locked chapters", () => {
  expect(deriveBookPath(chapters, {}, false, now).open).toHaveLength(15);
});
test("notes made out of order show that chapter as in progress without completing it", () => {
  const withNotes = chapters.map(ch => ({ ...ch, steps: ch.steps.map(step => ({ ...step, fields: [{ id: `notes_${step.id}`, type: 'textarea' }] })) }));
  const path = deriveBookPath(withNotes, { notes_15A: "My reflection", notes_9A: "Another reflection" }, true, now);
  expect(path.current?.order_index).toBe(9);
  expect(path.states.ch9).toBe("in progress");
  expect(path.states.ch15).toBe("in progress");
  expect(path.doneCount).toBe(0);
  expect(path.open).toHaveLength(15);
});
