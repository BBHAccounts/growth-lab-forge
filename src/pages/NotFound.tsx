import { Link } from "react-router-dom";
import { BookLayout } from "@/components/book/BookLayout";
import { Button } from "@/components/ui/button";
export default function NotFound() {
  return <BookLayout><section className="max-w-5xl mx-auto px-6 py-16 space-y-6"><p className="book-eyebrow">Page not found</p><h1>This page is not available</h1><Button asChild><Link to="/book">Go to your path</Link></Button></section></BookLayout>;
}
