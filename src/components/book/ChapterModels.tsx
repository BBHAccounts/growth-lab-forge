import { Link } from "react-router-dom";
import { useModelLibrary } from "@/hooks/use-model-library";
import { linkedChapters } from "@/lib/model-library";

export function ChapterModels({ chapter }: { chapter: number }) {
  const { data = [] } = useModelLibrary();
  const models = data.filter(model => linkedChapters(model.tags).includes(chapter));
  if (!models.length) return null;
  return <section className="mt-8 space-y-3"><p className="book-eyebrow">Models for this chapter</p>{models.map(model => <p key={model.id} className="text-sm"><Link className="underline underline-offset-4" to={`/book/library/${model.id}`}>{model.name}</Link></p>)}</section>;
}