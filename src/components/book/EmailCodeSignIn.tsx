import { useState } from "react";
import { Mail, ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { supabase } from "@/integrations/supabase/client";
import { validEmailCode } from "@/lib/email-code";

export function EmailCodeSignIn({ returnUrl, beforeSend }: { returnUrl: string; beforeSend?: () => void }) {
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [resendAt, setResendAt] = useState(0);
  const send = async () => {
    setBusy(true); setError(""); beforeSend?.();
    try {
      const { error } = await supabase.auth.signInWithOtp({ email: email.trim(), options: { shouldCreateUser: true, emailRedirectTo: returnUrl } });
      if (error) throw error;
      setSent(true); setCode(""); setResendAt(Date.now() + 60000);
    } catch { setError("We could not send your code. Please try again shortly."); }
    finally { setBusy(false); }
  };
  const verify = async () => {
    if (!validEmailCode(code)) return;
    setBusy(true); setError("");
    try {
      const { error } = await supabase.auth.verifyOtp({ email: email.trim(), token: code, type: "email" });
      if (error) throw error;
    } catch { setError("That code is not valid or has expired. Check your email or request a new code."); }
    finally { setBusy(false); }
  };
  return <form className="space-y-6" onSubmit={e => { e.preventDefault(); void (sent ? verify() : send()); }}>
    {sent ? <><div className="space-y-3"><p className="book-eyebrow">Check your email</p><h2 className="book-display text-3xl">Your sign-in code</h2><p className="text-sm">Enter the six-digit code sent to {email}. Check your spam folder if it has not arrived.</p></div><Label htmlFor="email-otp">Email code</Label><InputOTP id="email-otp" aria-label="Six-digit email code" maxLength={6} pattern="^[0-9]+$" value={code} onChange={setCode} autoComplete="one-time-code"><InputOTPGroup className="gap-2">{Array.from({ length: 6 }, (_, i) => <InputOTPSlot key={i} index={i} className="book-otp-slot" />)}</InputOTPGroup></InputOTP></> : <div className="space-y-3"><Label htmlFor="email-code-address">Work email</Label><Input id="email-code-address" type="email" value={email} onChange={e => setEmail(e.target.value)} autoComplete="email" placeholder="you@lawfirm.com" required className="h-12" /></div>}
    {error && <p role="alert" className="text-sm">{error}</p>}
    <Button type="submit" size="lg" disabled={busy || (sent && !validEmailCode(code))} className="w-full">{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : sent ? <ArrowRight className="h-4 w-4" /> : <Mail className="h-4 w-4" />}{sent ? "Verify and continue" : "Send sign-in code"}</Button>
    {sent && <div className="flex flex-wrap gap-2"><Button type="button" variant="ghost" onClick={() => { setSent(false); setError(""); }}>Use another email</Button><Button type="button" variant="ghost" disabled={busy} onClick={() => { if (Date.now() < resendAt) { setError("Please wait a minute before requesting another code."); return; } void send(); }}>Resend code</Button></div>}
  </form>;
}