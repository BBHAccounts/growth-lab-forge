import { getBookDone, isBookChapterComplete, isBookChapterUnlocked, type BookResponses, type BookStep } from "./book";

export interface PathChapter {
  id: string;
  name: string;
  order_index: number;
  deadline: string | null;
  steps: BookStep[];
}
export type ChapterState = "completed" | "in progress" | "open" | "locked";

export function bookWeek(firstDeadline: string | null, now = new Date()): number {
  const start = firstDeadline ? Date.parse(firstDeadline) : NaN;
  return Number.isFinite(start) ? Math.min(15, Math.max(1, 1 + Math.floor((now.getTime() - start) / 604800000))) : 1;
}

export function deriveBookPath(chapters: readonly PathChapter[], responses: BookResponses, sequential: boolean, now = new Date()) {
  const sorted = [...chapters].sort((a, b) => a.order_index - b.order_index);
  const done = getBookDone(responses);
  const open = sorted.filter(ch => isBookChapterUnlocked(ch, sorted, responses, sequential, now));
  const current = open.find(ch => !isBookChapterComplete(ch, responses)) ?? null;
  const states = Object.fromEntries(sorted.map(ch => [ch.id,
    isBookChapterComplete(ch, responses) ? "completed" : current?.id === ch.id ? "in progress" : open.includes(ch) ? "open" : "locked",
  ])) as Record<string, ChapterState>;
  const nextStep = open.flatMap(ch => ch.steps).find(step => !done[step.id]) ?? null;
  return { chapters: sorted, done, open, current, states, nextStep,
    completed: sorted.filter(ch => isBookChapterComplete(ch, responses)).map(ch => ch.order_index),
    doneCount: sorted.flatMap(ch => ch.steps).filter(step => done[step.id]).length,
    total: sorted.reduce((count, ch) => count + ch.steps.length, 0),
    week: bookWeek(sorted.find(ch => ch.order_index === 1)?.deadline ?? null, now),
  };
}

const words = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "eleven", "twelve", "thirteen", "fourteen", "fifteen"];
export function chapterCountWord(count: number) { return words[count] ?? String(count); }
export function chapterTitle(name: string) { return name.replace(/^Chapter\s+\d+\s*:\s*/i, ""); }
export function bookOpeningDate(deadline: string | null) {
  return deadline ? new Intl.DateTimeFormat("en-GB", { weekday: "long", day: "numeric", month: "long" }).format(new Date(deadline)) : "its scheduled week";
}
export function chapterOpeningText(chapter: PathChapter) {
  return `Opens when you finish Chapter ${chapter.order_index - 1}, or on ${bookOpeningDate(chapter.deadline)}`;
}

export function latestBookNote(chapters: readonly PathChapter[], responses: BookResponses) {
  const done = getBookDone(responses);
  const notes = chapters.flatMap(ch => ch.steps.flatMap(step => step.fields.flatMap(field => {
    if (!field || typeof field !== "object" || Array.isArray(field) || typeof field.id !== "string") return [];
    const value = responses[field.id];
    return typeof value === "string" && value.trim() ? [{ text: value, step, chapter: ch, at: Date.parse(done[step.id] ?? "") || 0 }] : [];
  })));
  return notes.sort((a, b) => b.at - a.at)[0] ?? null;
}