import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
export default function AdminOverview() {
  const [stats, setStats] = useState<number[] | null>(null); const [error, setError] = useState(false);
  useEffect(() => { let live = true; void Promise.all([
    supabase.from("programs").select("id", { count: "exact", head: true }).eq("is_book", true),
    supabase.from("program_participants").select("id, programs!inner(is_book)", { count: "exact", head: true }).eq("programs.is_book", true),
    supabase.from("models").select("id", { count: "exact", head: true }),
  ]).then(results => { if (live) { setError(results.some(r => Boolean(r.error))); setStats(results.map(r => r.count ?? 0)); } }); return () => { live = false; }; }, []);
  return <AdminLayout><section className="space-y-6"><p className="book-eyebrow">Beyond the Book admin</p><h1>Overview</h1>{error ? <p role="alert">We could not load the overview. Please try again.</p> : <div className="grid sm:grid-cols-3 gap-6">{["Book programmes", "Participants", "Models"].map((label, i) => <Card key={label}><CardContent className="p-8 space-y-4"><p className="book-eyebrow">{label}</p><p className="text-3xl font-semibold">{stats ? stats[i] : "..."}</p></CardContent></Card>)}</div>}</section></AdminLayout>;
}
