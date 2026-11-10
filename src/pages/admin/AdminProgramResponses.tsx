import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { BookProgramProgress } from "@/components/admin/BookProgramProgress";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { BookParticipantProgress } from "@/lib/book-admin";
export default function AdminProgramResponses() {
  const { programId } = useParams(); const navigate = useNavigate();
  const [name, setName] = useState(""); const [rows, setRows] = useState<BookParticipantProgress[]>([]); const [error, setError] = useState<string | null>(null); const [loading, setLoading] = useState(true);
  useEffect(() => { let live = true; void (async () => {
    if (!programId) return;
    const { data: programme, error } = await supabase.from("programs").select("name, is_book").eq("id", programId).single();
    if (!live) return;
    if (error || !programme?.is_book) { navigate("/admin/programs", { replace: true }); return; }
    setName(programme.name);
    const result = await supabase.rpc("book_programme_progress", { programme_id: programId });
    if (!live) return;
    if (result.error) setError("We could not load participant progress. Please try again."); else setRows(result.data ?? []);
    setLoading(false);
  })(); return () => { live = false; }; }, [programId, navigate]);
  return <AdminLayout><div className="space-y-6"><Button variant="ghost" onClick={() => navigate(`/admin/programs/${programId}`)}><ArrowLeft className="h-5 w-5" />Back to programme</Button><p className="book-eyebrow">Participant progress</p><h1>{name || "Progress"}</h1>{loading ? <div role="status" aria-label="Loading progress" className="h-64 rounded-xl bg-muted animate-pulse" /> : <BookProgramProgress rows={rows} error={error} />}</div></AdminLayout>;
}
