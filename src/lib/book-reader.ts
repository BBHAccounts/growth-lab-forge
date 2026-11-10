import type { BookResponses } from "./book";
import { bookNoteField } from "./book-video";
import { chapterTitle, type PathChapter } from "./book-path";

export function savedBookNotes(chapters: readonly PathChapter[], responses: BookResponses) {
  return [...chapters].sort((a, b) => a.order_index - b.order_index).flatMap(chapter => {
    const notes = chapter.steps.flatMap(step => {
      const field = bookNoteField(step.fields);
      const value = field ? responses[field.id] : null;
      return typeof value === "string" && value.trim() ? [{ step, text: value }] : [];
    });
    return notes.length ? [{ chapter, notes }] : [];
  });
}

export function bookNotesText(chapters: readonly PathChapter[], responses: BookResponses) {
  return ["Beyond the Book", "My notes", "", ...savedBookNotes(chapters, responses).flatMap(({ chapter, notes }) => [
    `Chapter ${chapter.order_index}: ${chapterTitle(chapter.name)}`, "", ...notes.flatMap(({ step, text }) => [step.title, text, ""]),
  ])].join("\n");
}