import { useEffect } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, ArrowRight, Clock } from "lucide-react";
import { BookLayout } from "@/components/book/BookLayout";
import { Button } from "@/components/ui/button";
import { useModelLibrary } from "@/hooks/use-model-library";
import { linkedChapters } from "@/lib/model-library";
import NotFound from "./NotFound";

// Retains the original model detail content: overview, steps, outcomes and suggested actions.
export default function ModelDetail() {
  const { modelId } = useParams();
  const { entry, data = [], isLoading, error } = useModelLibrary();
  const navigate = useNavigate();
  useEffect(() => {
    if (!entry.loading && !entry.error && !entry.member) navigate(entry.user ? "/book/join" : `/auth?returnTo=${encodeURIComponent(`/book/library/${modelId}`)}`, { replace: true });
  }, [entry, modelId, navigate]);
  const model = data.find(model => model.id === modelId);
  if (!entry.loading && entry.member && !isLoading && !error && !model) return <NotFound />;
  const steps = Array.isArray(model?.steps) ? model.steps as unknown as { id: string; title: string; instruction: string }[] : [];
  return <BookLayout><section className="max-w-5xl mx-auto px-6 lg:px-10 py-10 space-y-8 book-enter">
    <Button asChild variant="ghost" className="px-0"><Link to="/book/library"><ArrowLeft className="h-4 w-4" />Back to the library</Link></Button>
    {entry.error || error ? <p role="alert">We could not load this model. Please try again.</p> : entry.loading || isLoading ? <div className="h-48 bg-muted rounded-xl animate-pulse" role="status" aria-label="Loading model" /> : entry.member && model ? <>
      <div className="space-y-6"><p className="book-eyebrow">Model library{linkedChapters(model.tags).map(n => ` · Chapter ${n}`).join("")}</p><h1 className="book-display text-4xl lg:text-5xl break-words">{model.name}</h1>{model.short_description && <p className="max-w-3xl leading-relaxed">{model.short_description}</p>}{model.time_estimate && <p className="text-sm flex gap-2 items-center"><Clock className="h-4 w-4" />{model.time_estimate}</p>}<Button asChild><Link to={`/book/library/${model.id}/workspace`}>Open workspace<ArrowRight className="h-4 w-4" /></Link></Button></div>
      {model.long_description && <section className="space-y-4"><p className="book-eyebrow">About this model</p><p className="whitespace-pre-line text-sm leading-relaxed">{model.long_description}</p></section>}
      {steps.length > 0 && <section className="space-y-6"><p className="book-eyebrow">The steps</p><ol className="space-y-6">{steps.map((step, i) => <li key={step.id ?? i} className="flex gap-4"><span className="text-sm font-semibold w-6 shrink-0">{i + 1}</span><div className="space-y-2"><h2 className="book-display text-2xl">{step.title}</h2><p className="text-sm leading-relaxed whitespace-pre-line">{step.instruction}</p></div></li>)}</ol></section>}
      {model.outcomes?.length ? <section className="space-y-4"><p className="book-eyebrow">Outcomes</p><ul className="list-disc pl-5 space-y-2 text-sm">{model.outcomes.map(outcome => <li key={outcome}>{outcome}</li>)}</ul></section> : null}
      {model.suggested_actions?.length ? <section className="space-y-4"><p className="book-eyebrow">Suggested actions</p><ul className="list-disc pl-5 space-y-2 text-sm">{model.suggested_actions.map(action => <li key={action}>{action}</li>)}</ul></section> : null}
    </> : null}
  </section></BookLayout>;
}