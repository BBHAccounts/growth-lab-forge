import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useBookAudience() {
  const [userId, setUserId] = useState<string | null | undefined>(undefined);
  const cache = useQueryClient();
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setUserId(data.session?.user.id ?? null));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserId(session?.user.id ?? null);
      void cache.invalidateQueries({ queryKey: ["book-audience"] });
    });
    return () => subscription.unsubscribe();
  }, [cache]);
  const query = useQuery({
    queryKey: ["book-audience", userId], enabled: Boolean(userId),
    queryFn: async () => {
      if (!userId) return { member: false, admin: false };
      const [role, participants] = await Promise.all([
        supabase.rpc("has_role", { _user_id: userId, _role: "admin" }),
        supabase.from("program_participants").select("programs!inner(is_book, status)").eq("user_id", userId),
      ]);
      if (role.error || participants.error) throw role.error || participants.error;
      const programmes = (participants.data ?? []).map(p => p.programs);
      const admin = role.data === true;
      return { admin, member: programmes.some(p => p.is_book && p.status === "active") };
    },
  });
  return { member: query.data?.member ?? false, admin: query.data?.admin ?? false, loading: userId === undefined || (Boolean(userId) && query.isLoading), error: query.error };
}