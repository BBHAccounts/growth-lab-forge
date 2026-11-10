import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { needsBookOnboarding } from "@/lib/book-entry";

export function useBookEntry() {
  const [state, setState] = useState<{ loading: boolean; user: User | null; member: boolean; participant: boolean; needsOnboarding: boolean; error: string | null }>({ loading: true, user: null, member: false, participant: false, needsOnboarding: false, error: null });
  useEffect(() => {
    let live = true;
    let version = 0;
    const check = async (user: User | null) => {
      const current = ++version;
      if (!user) {
        if (live) setState({ loading: false, user: null, member: false, participant: false, needsOnboarding: false, error: null });
        return;
      }
      const [membership, profile, role] = await Promise.all([
        supabase.rpc("is_book_participant", {}),
        supabase.from("profiles").select("full_name, firm_name").eq("user_id", user.id).maybeSingle(),
        supabase.rpc("has_role", { _user_id: user.id, _role: "admin" }),
      ]);
      if (!live || current !== version) return;
      setState({ loading: false, user, member: membership.data === true || role.data === true, participant: membership.data === true, needsOnboarding: role.data !== true && needsBookOnboarding(profile.data), error: membership.error || profile.error || role.error ? "We could not check your account. Please try again." : null });
    };
    supabase.auth.getSession().then(({ data, error }) => {
      if (error && live) setState(prev => ({ ...prev, loading: false, error: "We could not check your account. Please try again." }));
      else void check(data.session?.user ?? null);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      // Defer Cloud calls until the auth callback has released its lock.
      window.setTimeout(() => { if (live) void check(session?.user ?? null); }, 0);
    });
    return () => { live = false; subscription.unsubscribe(); };
  }, []);
  return state;
}