import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowRight, Check, Lock, Loader2 } from "lucide-react";
import { BookLayout } from "@/components/book/BookLayout";
import { BookVideoPlayer } from "@/components/book/BookVideoPlayer";
import { FieldAssistant } from "@/components/FieldAssistant";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useBookEntry } from "@/hooks/use-book-entry";
import { useBookPath, type BookPathData } from "@/hooks/use-book-path";
import { useBookNotes } from "@/hooks/use-book-notes";
import { getBookDone, isBookChapterUnlocked, type BookStep } from "@/lib/book";
import { bookOpeningDate, type PathChapter } from "@/lib/book-path";
import { rememberBookVideo } from "@/lib/book-entry";
import { bookNoteField, followingBookStep } from "@/lib/book-video";
import { supabase } from "@/integrations/supabase/client";

function Exercise({ data, chapter, step }: { data: BookPathData; chapter: PathChapter; step: BookStep }) {
  if (data.preview) return <div className="book-card bg-card space-y-6"><p className="book-eyebrow">Your exercise</p><h2 className="book-display text-3xl">{step.exercise_title || step.title}</h2><p className="text-sm whitespace-pre-line">{step.instruction}</p>{step.keep && <div className="bg-secondary p-6 rounded-xl space-y-3"><p className="book-eyebrow">What to keep</p><p className="text-sm">{step.keep}</p></div>}<p className="text-xs">BBHTEST preview</p></div>;
  const field = bookNoteField(step.fields);
  // Book content has one existing textarea per exercise. Never invent an unrelated field.
  if (!field) return <p role="alert">This exercise is being prepared.</p>;
  return <ExerciseNotes data={data} chapter={chapter} step={step} field={field} />;
}

function ExerciseNotes({ data, chapter, step, field }: { data: BookPathData; chapter: PathChapter; step: BookStep; field: { id: string; label: string } }) {
  const notes = useBookNotes(data.userId, data.participantId, data.responses, field.id, step.id);
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [tools, setTools] = useState<{ id: string; name: string }[]>([]);
  const next = followingBookStep(data.chapters, step.id);
  const done = Boolean(getBookDone(notes.responses)[step.id]);
  useEffect(() => {
    let active = true;
    supabase.from("models").select("id, name").eq("status", "active").contains("tags", [`book-ch${chapter.order_index}`]).then(({ data }) => { if (active) setTools(data ?? []); });
    return () => { active = false; };
  }, [chapter.order_index]);
  const leave = async (to: string) => {
    if (busy) return; setBusy(true); setError("");
    try { await notes.flush(); navigate(to); }
    catch { setError("We could not save your notes. Please try again before continuing."); }
    finally { setBusy(false); }
  };
  const toggle = async () => {
    setBusy(true); setError("");
    try { await notes.toggleDone(); }
    catch { setError("We could not save this change. Your notes are kept on this device."); }
    finally { setBusy(false); }
  };
  return <div className="book-card bg-card text-card-foreground space-y-6">
    <div className="flex flex-wrap items-center justify-between gap-3"><p className="book-eyebrow">Your exercise</p><span className="text-xs">About 10 to 20 minutes</span></div>
    <h2 className="book-display text-3xl">{step.exercise_title || step.title}</h2>
    <p className="text-sm leading-relaxed whitespace-pre-line">{step.instruction}</p>
    {step.keep && <div className="rounded-xl bg-secondary text-secondary-foreground p-6 space-y-3"><p className="book-eyebrow">What to keep</p><p className="text-sm whitespace-pre-line">{step.keep}</p></div>}
    {tools.length > 0 && <div className="space-y-3"><p className="book-eyebrow">Models for this chapter</p>{tools.map(tool => <p key={tool.id} className="text-sm"><Link className="underline underline-offset-4 focus-visible:outline focus-visible:outline-2" to={`/book/library/${tool.id}`} onClick={e => { e.preventDefault(); void leave(`/book/library/${tool.id}`); }}>{tool.name}</Link></p>)}</div>}
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3"><label htmlFor={`notes-${field.id}`} className="book-eyebrow">Your notes</label><FieldAssistant book modelId={chapter.id} stepTitle={`Chapter ${chapter.order_index}: ${chapter.name}. ${step.title}`} stepInstruction={`${step.instruction}\nExercise: ${step.exercise_title ?? ""}\nWhat to keep: ${step.keep ?? ""}\nGive examples and prompts based on this exercise and chapter. Ask questions that help the lawyer think. Never write the answer for them. Use British English, no contractions, no dashes and no exclamation marks.`} fieldLabel={field.label} currentValue={notes.value} allProgress={notes.responses} /></div>
      <Textarea id={`notes-${field.id}`} value={notes.value} onChange={e => notes.edit(e.target.value)} className="min-h-48 rounded-2xl bg-background border-input leading-relaxed" />
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs"><p className="flex items-center gap-2"><Lock className="h-4 w-4 shrink-0" strokeWidth={1.5} />Private. Your firm does not see your notes.</p><span role="status" aria-live="polite">{notes.status}</span></div>
    </div>
    {error && <p role="alert" className="text-sm">{error}</p>}
    <div className="flex flex-wrap gap-3">
      <Button className="rounded-full min-h-11 px-6" onClick={toggle} disabled={busy} aria-pressed={done}>{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : done ? <Check className="h-4 w-4" /> : null}{done ? "Done" : "Mark as done"}</Button>
      <Button variant="outline" asChild className="rounded-full min-h-11 h-auto whitespace-normal text-left px-6 py-3 max-w-full"><Link to={next ? `/book/v/${next.id}` : "/book"} aria-disabled={busy} onClick={e => { e.preventDefault(); void leave(next ? `/book/v/${next.id}` : "/book"); }}>{next ? `Next: ${next.title}` : "Back to your path"}<ArrowRight className="h-4 w-4 shrink-0" /></Link></Button>
    </div>
  </div>;
}

export default function BookVideo() {
  const { stepId = "" } = useParams();
  return <BookVideoScreen key={stepId} stepId={stepId} />;
}

function BookVideoScreen({ stepId }: { stepId: string }) {
  const state = useBookEntry();
  const { data, loading, error } = useBookPath(state.user?.id);
  const navigate = useNavigate();
  useEffect(() => {
    if (!state.loading && !state.error && !state.member) {
      const target = `/book/v/${stepId}`; rememberBookVideo(localStorage, target);
      navigate(`/book/join?returnTo=${encodeURIComponent(target)}`, { replace: true });
    }
  }, [state, navigate, stepId]);
  const chapter = data?.chapters.find(ch => ch.steps.some(step => step.id === stepId));
  const step = chapter?.steps.find(step => step.id === stepId);
  const unlocked = chapter && data && isBookChapterUnlocked(chapter, data.chapters, data.responses, data.sequential);
  return <BookLayout video>
    {state.loading || (state.member && loading) ? <div className="max-w-7xl mx-auto p-6 space-y-6" role="status" aria-label="Loading your exercise"><div className="h-24 rounded-xl bg-muted animate-pulse" /><div className="h-96 rounded-xl bg-muted animate-pulse" /></div> : state.error || error ? <section className="max-w-3xl mx-auto p-6"><p role="alert">{state.error || error}</p><Button className="rounded-full mt-6" onClick={() => window.location.reload()}>Try again</Button></section> : state.member && data ? !chapter || !step ? <section className="max-w-3xl mx-auto p-6"><h1 className="book-display text-3xl">We could not find this video</h1><Button asChild variant="outline" className="rounded-full mt-6"><Link to="/book">Back to your path</Link></Button></section> : !unlocked ? <section className="max-w-3xl mx-auto px-6 py-12"><div className="book-card bg-card space-y-6"><Lock className="h-6 w-6" /><p className="book-eyebrow">Chapter {chapter.order_index}</p><h1 className="book-display text-3xl">{chapter.deadline ? `This chapter opens on ${bookOpeningDate(chapter.deadline)}` : "This chapter opens when you finish the one before it"}</h1><Button asChild className="rounded-full"><Link to="/book">Back to your path</Link></Button></div></section> : <>
      <section className="max-w-7xl mx-auto px-6 lg:px-10 py-8 book-enter"><p className="book-eyebrow mb-4">Chapter {chapter.order_index} · Video {String.fromCharCode(65 + chapter.steps.indexOf(step))} of 3</p><h1 className="book-display text-4xl lg:text-5xl max-w-4xl break-words">{step.title}</h1></section>
      <div className="book-exercise-grid max-w-7xl mx-auto lg:px-10 lg:pb-12">
        <section aria-label="Chapter video" className="bg-primary book-dot-grid px-6 py-8 lg:rounded-xl lg:self-start"><BookVideoPlayer key={step.id} step={step} /></section>
        <section aria-label="Exercise and notes" className="px-6 py-8 lg:p-0"><Exercise key={`${data.participantId}:${step.id}`} data={data} chapter={chapter} step={step} /></section>
      </div>
    </> : null}
  </BookLayout>;
}