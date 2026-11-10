import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Loader2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BookLayout } from "@/components/book/BookLayout";
import { useBookEntry } from "@/hooks/use-book-entry";
import { joinBookProgramme } from "@/lib/book-api";
import { bookDestination, bookMagicLinkReturn, clearBookEntry, rememberBookEntry, rememberBookVideo } from "@/lib/book-entry";
import { EmailCodeSignIn } from "@/components/book/EmailCodeSignIn";
import { useBookProgrammeCode } from "@/hooks/use-book-programme-code";
import bookCover from "@/assets/beyond-billable-hours-cover.png.asset.json";
import { shouldLeaveBookJoin } from "@/lib/book-routing";

export default function BookJoin() {
  const [params] = useSearchParams();
  const [code, setCode] = useState(() => {
    const returnTo = params.get("returnTo");
    if (returnTo) rememberBookVideo(localStorage, returnTo);
    return rememberBookEntry(localStorage, params.get("code"));
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const state = useBookEntry();
  const programmeCode = useBookProgrammeCode(state.user?.id, params.get("code"));
  const navigate = useNavigate();

  useEffect(() => {
    if (state.loading || state.error || !state.user || programmeCode.loading || programmeCode.error) return;
    if (shouldLeaveBookJoin(state.participant, programmeCode.matches)) { const destination = bookDestination(localStorage); clearBookEntry(localStorage); navigate(destination, { replace: true }); }
    else if (state.needsOnboarding) navigate("/onboarding?from=book", { replace: true });
  }, [state, navigate, programmeCode.loading, programmeCode.error, programmeCode.matches]);

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
        return;
      }
    } catch {
      setError(state.user
        ? "We could not find that code. Check the email from your firm or ask your learning and development team."
        : "We could not send your email. Please try again.");
    } finally { setBusy(false); }
  };

  const checking = state.loading || programmeCode.loading || (state.user && !state.error && !programmeCode.error && (shouldLeaveBookJoin(state.participant, programmeCode.matches) || state.needsOnboarding));
  return <BookLayout>
    <section className="book-join-page book-enter">
      <div className="book-join-intro space-y-5">
        <p className="book-eyebrow">The book, put into practice</p>
        <h1 className="book-display">Beyond the <em className="book-gradient-word">Book.</em></h1>
        <p className="text-lg font-medium">The companion to Beyond Billable Hours</p>
        <p className="text-sm leading-relaxed max-w-md">Fifteen chapters, three short videos each, one practical exercise per video.</p>
      </div>
      <figure className="book-join-feature">
        <img src={bookCover.url} width={511} height={767} alt="Beyond Billable Hours book cover by Barbara Koenen-Geerdink" fetchPriority="high" />
        <figcaption className="mt-6 space-y-2">
          <p className="book-eyebrow">Beyond Billable Hours</p>
          <p className="text-sm font-semibold">The Growth Accelerator for Lawyers</p>
          <p className="text-xs">Barbara Koenen-Geerdink</p>
        </figcaption>
      </figure>
      <div className="book-join-entry space-y-6">
        {checking ? <div role="status" aria-label="Checking your account"><Loader2 className="h-6 w-6 animate-spin" /></div>
          : state.error || programmeCode.error ? <p role="alert">{state.error || "We could not check this programme. Please try again."}</p>
          : state.user ? <>
            <div className="space-y-3"><p className="book-eyebrow">Your firm programme</p><h2 className="book-display text-3xl">Enter your access code</h2><p className="text-sm">Use the code from your organisation.</p></div>
            <form onSubmit={submit} className="space-y-5">
              <div className="space-y-3"><Label htmlFor="firm-code">Access code</Label><Input id="firm-code" value={code} onChange={e => setCode(e.target.value)} required autoComplete="off" className="h-12" /></div>
              {error && <p role="alert" className="text-sm">{error}</p>}
              <Button type="submit" disabled={busy} size="lg" className="w-full">{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}Join</Button>
            </form>
          </> : <>
            <div className="space-y-3"><p className="book-eyebrow">Your next chapter starts here</p><h2 className="book-display text-3xl">Sign in or create your account</h2></div>
            <EmailCodeSignIn returnUrl={bookMagicLinkReturn(window.location.origin, code, bookDestination(localStorage))} beforeSend={() => rememberBookEntry(localStorage, code)} />
          </>}
      </div>
    </section>
  </BookLayout>;
}
