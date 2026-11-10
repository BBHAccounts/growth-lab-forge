import { useEffect, useState } from "react";
import { Play } from "lucide-react";
import { getBookMediaSignedUrl } from "@/lib/book-api";

export function BookPoster({ path, small = false }: { path?: string; small?: boolean }) {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    let active = true; setUrl(null);
    if (path) getBookMediaSignedUrl(path).then(value => { if (active) setUrl(value); }).catch(() => {});
    return () => { active = false; };
  }, [path]);
  return <div className={`book-poster bg-primary text-primary-foreground ${small ? "book-poster-small" : "w-full"}`}>
    {url ? <img src={url} alt="" className="w-full h-full object-cover" onError={() => setUrl(null)} /> : <Play aria-hidden="true" className={`${small ? "h-4 w-4" : "h-7 w-7"} opacity-70`} strokeWidth={1.5} />}
  </div>;
}