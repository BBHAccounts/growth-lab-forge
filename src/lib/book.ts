import type { Json } from "@/integrations/supabase/types";

/** Extra book metadata is optional, so existing tool steps remain valid. */
export interface BookStep {
  id: string;
  title: string;
  instruction: string;
  fields: Json[];
  section?: string;
  reading?: string;
  exercise_title?: string;
  keep?: string;
  action?: string;
  video_path?: string;
  poster_path?: string;
  [key: string]: unknown;
}

export interface BookChapter {
  order_index: number;
  deadline: string | null;
  steps: ReadonlyArray<{ id: string }>;
}

export type BookResponses = { [key: string]: Json | undefined };

export function getBookDone(responses: BookResponses): Record<string, string> {
  const done = responses.__done;
  if (!done || typeof done !== "object" || Array.isArray(done)) return {};
  return Object.fromEntries(Object.entries(done).filter(
    (entry): entry is [string, string] => typeof entry[1] === "string" && Number.isFinite(Date.parse(entry[1])),
  ));
}

/** Merge into the existing JSON, retaining notes and other step timestamps. */
export function markBookStepDone(
  responses: BookResponses,
  stepId: string,
  at = new Date(),
): BookResponses {
  return { ...responses, __done: { ...getBookDone(responses), [stepId]: at.toISOString() } };
}

export function isBookChapterComplete(chapter: BookChapter, responses: BookResponses): boolean {
  const done = getBookDone(responses);
  return chapter.steps.length === 3 && chapter.steps.every(step => Boolean(done[step.id]));
}

export function undoBookStepDone(responses: BookResponses, stepId: string): BookResponses {
  const done = { ...getBookDone(responses) };
  delete done[stepId];
  return { ...responses, __done: done };
}

export function isBookChapterUnlocked(
  chapter: BookChapter,
  chapters: readonly BookChapter[],
  responses: BookResponses,
  sequential: boolean,
  now = new Date(),
): boolean {
  if (!sequential || chapter.order_index === 1) return true;
  if (chapter.deadline && Date.parse(chapter.deadline) <= now.getTime()) return true;
  const previous = chapters.find(item => item.order_index === chapter.order_index - 1);
  return previous ? isBookChapterComplete(previous, responses) : false;
}

export function hasBookChapterTag(tags: readonly string[] | null): boolean {
  return tags?.some(tag => /^book-ch([1-9]|1[0-5])$/.test(tag)) ?? false;
}