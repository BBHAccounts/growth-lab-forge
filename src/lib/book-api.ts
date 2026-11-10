import { supabase } from "@/integrations/supabase/client";
import { markBookStepDone, undoBookStepDone, type BookResponses } from "./book";

export async function joinBookProgramme(code: string): Promise<string> {
  const { data, error } = await supabase.rpc("join_book_programme", { code });
  if (error) throw error;
  if (!data) throw new Error("This code cannot be used to join a book programme.");
  return data;
}

/** This is an access override only, not a replacement for normal GL access rules. */
export async function canAccessBookModel(modelId: string): Promise<boolean> {
  const { data, error } = await supabase.rpc("can_access_book_model", { model_id: modelId });
  if (error) throw error;
  return data === true;
}

export async function getBookMediaSignedUrl(path: string, expiresIn = 3600): Promise<string> {
  const { data, error } = await supabase.storage.from("book-media").createSignedUrl(path, expiresIn);
  if (error) throw error;
  return data.signedUrl;
}

/** Pass the latest full responses JSON, as with the existing programme auto-save. */
export async function saveBookStepDone(
  participantId: string,
  responses: BookResponses,
  stepId: string,
  done = true,
): Promise<BookResponses> {
  const next = done ? markBookStepDone(responses, stepId) : undoBookStepDone(responses, stepId);
  await saveBookResponses(participantId, next);
  return next;
}

export async function saveBookResponses(participantId: string, responses: BookResponses): Promise<void> {
  const { data: existing, error: readError } = await supabase.from("program_responses")
    .select("id").eq("participant_id", participantId).maybeSingle();
  if (readError) throw readError;
  const values = { responses, auto_saved_at: new Date().toISOString() };
  if (existing) {
    const { error } = await supabase.from("program_responses").update(values).eq("id", existing.id);
    if (error) throw error;
  } else {
    const { error } = await supabase.from("program_responses").insert({ participant_id: participantId, ...values });
    if (error) throw error;
  }
}