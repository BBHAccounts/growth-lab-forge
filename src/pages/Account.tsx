import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Save, LogOut } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
export default function Account() {
  const navigate = useNavigate();
  const [name, setName] = useState(""); const [firm, setFirm] = useState(""); const [email, setEmail] = useState(""); const [password, setPassword] = useState("");
  const [ready, setReady] = useState(false); const [busy, setBusy] = useState(false); const [message, setMessage] = useState("");
  useEffect(() => { let live = true; void (async () => {
    const { data: { user } } = await supabase.auth.getUser(); if (!user) return;
    const { data, error } = await supabase.from("profiles").select("full_name, firm_name").eq("user_id", user.id).maybeSingle();
    if (!live) return; if (error) { setMessage("We could not load your account."); return; }
    setName(data?.full_name ?? ""); setFirm(data?.firm_name ?? ""); setEmail(user.email ?? ""); setReady(true);
  })(); return () => { live = false; }; }, []);
  const save = async (e: React.FormEvent) => { e.preventDefault(); setBusy(true); setMessage("");
    const { data: { user } } = await supabase.auth.getUser(); if (!user) { setBusy(false); return; }
    const { error } = await supabase.from("profiles").update({ full_name: name.trim(), firm_name: firm.trim() }).eq("user_id", user.id);
    if (error) setMessage(error.message); else {
      const { error: authError } = await supabase.auth.updateUser({ ...(email !== user.email ? { email } : {}), ...(password ? { password } : {}), data: { full_name: name.trim() } });
      setMessage(authError ? authError.message : email !== user.email ? "Saved. Check your email to confirm the new address." : "Saved");
      if (!authError) setPassword("");
    } setBusy(false);
  };
  return <AppLayout><section className="max-w-3xl mx-auto px-6 py-12 space-y-6"><p className="book-eyebrow">Your account</p><h1>My account</h1>{!ready ? <p role="status">{message || "Loading your account"}</p> : <form onSubmit={save} className="book-card bg-card space-y-6">{[["account-name", "Name", name, setName, "text"], ["account-firm", "Law firm", firm, setFirm, "text"], ["account-email", "Email", email, setEmail, "email"], ["account-password", "New password", password, setPassword, "password"]].map(([id, label, value, setter, type]) => <div key={String(id)} className="space-y-2"><Label htmlFor={String(id)}>{String(label)}</Label><Input id={String(id)} type={String(type)} value={String(value)} onChange={e => (setter as (v: string) => void)(e.target.value)} required={type !== "password"} minLength={type === "password" ? 6 : undefined} autoComplete={type === "password" ? "new-password" : undefined} /></div>)}<p role="status">{message}</p><div className="flex flex-wrap gap-4"><Button type="submit" disabled={busy}><Save className="h-4 w-4" />Save</Button><Button type="button" variant="outline" onClick={async () => { const { error } = await supabase.auth.signOut(); if (error) setMessage(error.message); else navigate("/book/join"); }}><LogOut className="h-4 w-4" />Sign out</Button></div></form>}</section></AppLayout>;
}
