import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Mail, Loader2 } from "lucide-react";
import { BookLayout } from "@/components/book/BookLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { sendMagicLink } from "@/lib/magic-link";
import { safeAppReturn } from "@/lib/book-routing";
import { needsBookOnboarding } from "@/lib/book-entry";
export default function Auth() {
  const [params] = useSearchParams();
  const destination = safeAppReturn(params.get("returnTo") ?? sessionStorage.getItem("book-auth-return"));
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [recovery, setRecovery] = useState(new URLSearchParams(location.hash.slice(1)).get("type") === "recovery");
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    let live = true;
    const check = async () => {
      const { data } = await supabase.auth.getSession();
      if (!live || !data.session || recovery) return;
      const { data: profile, error } = await supabase.from("profiles").select("full_name, firm_name").eq("user_id", data.session.user.id).maybeSingle();
      if (!live) return;
      if (error) { setError("We could not check your account. Please try again."); return; }
      sessionStorage.removeItem("book-auth-return");
      navigate(needsBookOnboarding(profile) ? `/onboarding?returnTo=${encodeURIComponent(destination)}` : destination, { replace: true });
    };
    void check();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") setRecovery(true);
      else window.setTimeout(() => { if (live) void check(); }, 0);
    });
    return () => { live = false; subscription.unsubscribe(); };
  }, [navigate, destination, recovery]);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setBusy(true); setError("");
    sessionStorage.setItem("book-auth-return", destination);
    if (recovery) {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) setError(error.message); else navigate(destination);
    } else {
      const url = new URL("/auth", window.location.origin); url.searchParams.set("returnTo", destination);
      const { error } = await sendMagicLink(email.trim(), url.toString());
      if (error) setError(error.message); else setSent(true);
    }
    setBusy(false);
  };
  return <BookLayout><section className="max-w-5xl mx-auto px-6 py-12 lg:py-16 space-y-6 book-enter"><p className="book-eyebrow">Beyond the Book</p><h1 className="book-display text-4xl">{recovery ? "Reset your password" : "Sign in or create your account"}</h1><p>The companion to Beyond Billable Hours</p><div className="book-card bg-card max-w-xl">{sent ? <div className="space-y-6" role="status"><Mail className="h-6 w-6" /><h2 className="book-display text-3xl">Check your email</h2><p>We have sent a sign-in link to {email}. Check your spam folder if it has not arrived.</p><Button variant="outline" onClick={() => setSent(false)}>Use another email</Button></div> : <form onSubmit={submit} className="space-y-6"><div className="space-y-2"><Label htmlFor="auth-input">{recovery ? "New password" : "Work email"}</Label><Input id="auth-input" type={recovery ? "password" : "email"} value={recovery ? password : email} onChange={e => recovery ? setPassword(e.target.value) : setEmail(e.target.value)} minLength={recovery ? 6 : undefined} required autoComplete={recovery ? "new-password" : "email"} /></div>{error && <p role="alert">{error}</p>}<Button disabled={busy} type="submit">{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}{recovery ? "Update password" : "Continue with email"}</Button></form>}</div></section></BookLayout>;
}
