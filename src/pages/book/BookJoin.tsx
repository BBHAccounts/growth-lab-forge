import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Loader2, Mail, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BookLayout } from "@/components/book/BookLayout";
import { useBookEntry } from "@/hooks/use-book-entry";
import { joinBookProgramme } from "@/lib/book-api";
import { bookDestination, bookMagicLinkReturn, clearBookEntry, rememberBookEntry, rememberBookVideo } from "@/lib/book-entry";
import { sendMagicLink } from "@/lib/magic-link";

export default function BookJoin() {
  const [params] = useSearchParams();
  const [code, setCode] = useState(() => {
    const returnTo = params.get("returnTo");
    if (returnTo) rememberBookVideo(localStorage, returnTo);
    return rememberBookEntry(localStorage, params.get("code"));
  });
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const state = useBookEntry();
  const navigate = useNavigate();

  useEffect(() => {
    if (state.loading || state.error || !state.user) return;
    if (state.member) { const destination = bookDestination(localStorage); clearBookEntry(localStorage); navigate(destination, { replace: true }); }
    else if (state.needsOnboarding) navigate("/onboarding?from=book", { replace: true });
  }, [state, navigate]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true); setError(null);
    rememberBookEntry(localStorage, code);
    try {
      if (state.user) {
        await joinBookProgramme(code.trim());
        const destination = bookDestination(localStorage);
        clearBookEntry(localStorage);
        navigate(destination, { replace: true });
      } else {
        const result = await sendMagicLink(email.trim(), bookMagicLinkReturn(window.location.origin, code, bookDestination(localStorage)));
        if (result.error) throw result.error;
        setSent(true);
      }
    } catch {
      setError(state.user
        ? "We could not find that code. Check the email from your firm or ask your learning and development team."
        : "We could not send your email. Please try again.");
    } finally { setBusy(false); }
  };

  const checking = state.loading || (state.user && !state.error && (state.member || state.needsOnboarding));
  return <BookLayout>
    <section className="bg-primary text-primary-foreground book-intro">
      <div className="max-w-5xl mx-auto px-6 md:px-10 py-12 md:py-16 book-enter">
        <p className="book-eyebrow mb-6">The book, put into practice</p>
        <h1 className="book-display text-5xl md:text-7xl mb-6">Beyond the Book</h1>
        <p className="text-xl md:text-2xl font-medium mb-4">The companion to Beyond Billable Hours</p>
        <p className="max-w-xl text-base leading-relaxed">Fifteen chapters, three short videos each, one practical exercise per video.</p>
      </div>
    </section>
    <section className="max-w-5xl mx-auto px-6 md:px-10 py-10 md:py-12 book-enter">
      <p className="book-eyebrow mb-4">{state.user ? "Your firm programme" : "Start with your email"}</p>
      {checking ? <div className="py-8" role="status" aria-label="Checking your account"><Loader2 className="h-6 w-6 animate-spin" /></div> :
        <div className="book-card max-w-xl">
          {state.error ? <p role="alert">{state.error}</p> : sent ? <div className="space-y-5" role="status">
            <Mail className="h-6 w-6 text-primary" />
            <h2 className="book-display text-3xl">Check your email</h2>
            <p className="text-sm leading-relaxed">We have sent a link to {email}. Open it to continue to Beyond the Book.</p>
            <Button variant="outline" className="rounded-full" onClick={() => setSent(false)}>Use another email</Button>
          </div> : <>
            <h2 className="book-display text-3xl mb-6">{state.user ? "Enter the access code from your firm" : "Sign in or create your account"}</h2>
            <form onSubmit={submit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor={state.user ? "firm-code" : "book-email"}>{state.user ? "Access code" : "Work email"}</Label>
                {state.user ? <Input id="firm-code" className="rounded-full h-12" value={code} onChange={e => setCode(e.target.value)} required autoComplete="off" /> :
                  <Input id="book-email" className="rounded-full h-12" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@lawfirm.com" required autoComplete="email" />}
              </div>
              {error && <p role="alert" className="text-sm leading-relaxed">{error}</p>}
              <Button type="submit" className="rounded-full h-12 px-8" disabled={busy}>
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : state.user ? <ArrowRight className="h-4 w-4" /> : <Mail className="h-4 w-4" />}
                {state.user ? "Join" : "Continue with email"}
              </Button>
            </form>
          </>}
        </div>}
    </section>
  </BookLayout>;
}