import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

/** Checks only the signed-in user's own enrolments. A link code never grants access. */
export function useBookProgrammeCode(userId: string | undefined, code: string | null) {
  const [result, setResult] = useState<{ key: string; matches: boolean; error: boolean } | null>(null);
  const key = `${userId ?? ""}:${code ?? ""}`;
  useEffect(() => {
    let live = true;
    if (!userId || !code) return;
    void (async () => {
      const { data, error } = await supabase.from("program_participants")
        .select("programs!inner(is_book, status, join_code)")
        .eq("user_id", userId).eq("programs.is_book", true).eq("programs.status", "active");
      if (live) setResult({ key, matches: (data ?? []).some(row => row.programs.join_code?.toLowerCase() === code.trim().toLowerCase()), error: Boolean(error) });
    })();
    return () => { live = false; };
  }, [userId, code, key]);
  const needed = Boolean(userId && code);
  return { loading: needed && result?.key !== key, matches: !needed || (result?.key === key && result.matches), error: needed && result?.key === key && result.error };
}