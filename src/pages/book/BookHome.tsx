import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { BookLayout } from "@/components/book/BookLayout";
import { useBookEntry } from "@/hooks/use-book-entry";

export default function BookHome() {
  const state = useBookEntry();
  const navigate = useNavigate();
  useEffect(() => {
    if (!state.loading && !state.error && !state.member) navigate("/book/join", { replace: true });
  }, [state, navigate]);
  return <BookLayout><section className="max-w-5xl mx-auto px-6 md:px-10 py-16 md:py-24 book-enter">
    <p className="book-eyebrow mb-6">Beyond the Book</p>
    {state.loading ? <Loader2 role="status" aria-label="Checking your programme" className="h-6 w-6 animate-spin" /> : state.error ? <p role="alert">{state.error}</p> : state.member ?
      <h1 className="book-display text-4xl md:text-6xl max-w-2xl">Your path is being prepared</h1> : null}
  </section></BookLayout>;
}