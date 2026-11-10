import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { BookLayout } from "@/components/book/BookLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { EmailCodeSignIn } from "@/components/book/EmailCodeSignIn";
import { safeAppReturn } from "@/lib/book-routing";
import { needsBookOnboarding } from "@/lib/book-entry";
export default function Auth() {
  const [params] = useSearchParams();
  const destination = safeAppReturn(params.get("returnTo") ?? sessionStorage.getItem("book-auth-return"));
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [recovery, setRecovery] = useState(new URLSearchParams(location.hash.slice(1)).get("type") === "recovery");
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
    }
    setBusy(false);
  };
  const returnUrl = new URL("/auth", window.location.origin); returnUrl.searchParams.set("returnTo", destination);
  return <BookLayout><section className="book-auth-page max-w-6xl mx-auto px-6 lg:px-10 py-12 lg:py-16 book-enter"><div className="space-y-6"><p className="book-eyebrow">The book, put into practice</p><h1 className="book-display text-5xl lg:text-7xl">Beyond<br />the <em className="book-gradient-word">Book.</em></h1><p className="text-lg max-w-lg">The companion to Beyond Billable Hours</p><p className="text-sm max-w-md leading-relaxed">Fifteen chapters. Forty-five short videos. Space to reflect, explore and put the book into practice.</p></div><div className="book-auth-form space-y-6"><p className="book-eyebrow">Your account</p><h2 className="book-display text-3xl">{recovery ? "Reset your password" : "Sign in or create your account"}</h2>{recovery ? <form onSubmit={submit} className="space-y-6"><Label htmlFor="auth-input">New password</Label><Input id="auth-input" type="password" value={password} onChange={e => setPassword(e.target.value)} minLength={6} required autoComplete="new-password" />{error && <p role="alert">{error}</p>}<Button disabled={busy} type="submit">Update password</Button></form> : <EmailCodeSignIn returnUrl={returnUrl.toString()} beforeSend={() => sessionStorage.setItem("book-auth-return", destination)} />}</div></section></BookLayout>;
}
