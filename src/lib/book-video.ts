import type { Json } from "@/integrations/supabase/types";
import type { PathChapter } from "./book-path";

export function bookNoteField(fields: Json[]): { id: string; label: string } | null {
  const field = fields.find(field => field && typeof field === "object" && !Array.isArray(field) && (field.type === "textarea" || field.type === "long_text"));
  if (!field || typeof field !== "object" || Array.isArray(field) || typeof field.id !== "string") return null;
  return { id: field.id, label: typeof field.label === "string" ? field.label : "Your notes" };
}

export function followingBookStep(chapters: readonly PathChapter[], stepId: string) {
  const steps = [...chapters].sort((a, b) => a.order_index - b.order_index).flatMap(ch => ch.steps);
  const index = steps.findIndex(step => step.id === stepId);
  return index >= 0 ? steps[index + 1] ?? null : null;
}