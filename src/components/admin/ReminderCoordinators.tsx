import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
export function ReminderCoordinators({ programmeId }: { programmeId: string }) {
  const [rows, setRows] = useState<{ user_id: string; name: string }[]>([]);
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const { toast } = useToast();
  const load = async () => {
    const { data, error } = await supabase.from("book_reminder_coordinators").select("user_id").eq("program_id", programmeId);
    if (error) throw error;
    const ids = (data ?? []).map(row => row.user_id);
    if (!ids.length) { setRows([]); return; }
    const profiles = await supabase.from("profiles").select("user_id, full_name, email").in("user_id", ids);
    if (profiles.error) throw profiles.error;
    setRows(ids.map(user_id => ({ user_id, name: profiles.data?.find(p => p.user_id === user_id)?.email || "Assigned coordinator" })));
  };
  useEffect(() => { void load().catch(() => setError("We could not load coordinators.")); }, [programmeId]);
  const assign = async () => {
    setBusy(true); setError("");
    try {
      const profile = await supabase.from("profiles").select("user_id").eq("email", email.trim().toLowerCase()).maybeSingle();
      if (profile.error || !profile.data) throw new Error("Ask this person to sign up first, then enter their account email.");
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Please sign in again.");
      const { error } = await supabase.from("book_reminder_coordinators").upsert({ program_id: programmeId, user_id: profile.data.user_id, assigned_by: user.id });
      if (error) throw error;
      await load(); setEmail(""); toast({ title: "Coordinator assigned" });
    } catch (error) { setError(error instanceof Error ? error.message : "We could not assign this coordinator."); }
    finally { setBusy(false); }
  };
  const remove = async (userId: string) => {
    setBusy(true); setError("");
    try {
      const { error } = await supabase.from("book_reminder_coordinators").delete().eq("program_id", programmeId).eq("user_id", userId);
      if (error) throw error;
      await load(); toast({ title: "Coordinator access removed" });
    } catch { setError("We could not remove coordinator access."); }
    finally { setBusy(false); }
  };
  return <section className="space-y-6 py-6"><header className="space-y-3"><p className="book-eyebrow">Firm access</p><h2 className="book-display text-3xl">Reminder coordinators</h2></header>
    <div className="flex flex-wrap items-end gap-4"><div className="space-y-2 flex-1"><Label htmlFor="coordinator-email">Coordinator account email</Label><Input id="coordinator-email" type="email" value={email} onChange={e => setEmail(e.target.value)} /></div><Button disabled={busy || !email.trim()} onClick={assign}>Assign coordinator</Button></div>
    {error && <p role="alert">{error}</p>}
    {rows.map(row => <div key={row.user_id} className="flex items-center justify-between gap-4"><span className="text-sm break-all">{row.name}</span><Switch aria-label={`Reminder access for ${row.name}`} checked disabled={busy} onCheckedChange={() => void remove(row.user_id)} /></div>)}
  </section>;
}
