import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { type BookResponses, type BookStep } from "@/lib/book";
import { type PathChapter } from "@/lib/book-path";

export interface BookPathData {
  programmeId: string;
  participantId: string;
  userId: string;
  name: string;
  sequential: boolean;
  chapters: PathChapter[];
  responses: BookResponses;
}

export function useBookPath(userId: string | undefined) {
  const [data, setData] = useState<BookPathData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    let active = true;
    if (!userId) return () => { active = false; };
    const load = async () => {
      setLoading(true);
      try {
        const membership = await supabase.from("program_participants")
          .select("id, name, program_id, programs!inner(id, is_book, status, sequential)")
          .eq("user_id", userId).eq("programs.is_book", true).eq("programs.status", "active")
          .order("created_at", { ascending: false }).limit(1).maybeSingle();
        if (membership.error) throw membership.error;
        const member = membership.data;
        if (!member) throw new Error("No active book programme");
        const [links, responses] = await Promise.all([
          supabase.from("program_models").select("order_index, deadline, models(id, name, steps)").eq("program_id", member.program_id).order("order_index"),
          supabase.from("program_responses").select("responses").eq("participant_id", member.id).order("updated_at", { ascending: false }).limit(1).maybeSingle(),
        ]);
        if (links.error) throw links.error;
        if (responses.error) throw responses.error;
        const chapters = (links.data ?? []).flatMap(link => link.models ? [{ id: link.models.id, name: link.models.name, order_index: link.order_index, deadline: link.deadline, steps: Array.isArray(link.models.steps) ? link.models.steps as unknown as BookStep[] : [] }] : []);
        if (active) { setData({ programmeId: member.program_id, participantId: member.id, userId, name: member.name ?? "", sequential: member.programs.sequential !== false, chapters, responses: responses.data?.responses as BookResponses ?? {} }); setError(null); }
      } catch { if (active) setError("We could not load your path. Please try again."); }
      finally { if (active) setLoading(false); }
    };
    void load();
    const refresh = () => { if (document.visibilityState === "visible") void load(); };
    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", refresh);
    return () => { active = false; window.removeEventListener("focus", refresh); document.removeEventListener("visibilitychange", refresh); };
  }, [userId]);
  return { data, loading, error };
}