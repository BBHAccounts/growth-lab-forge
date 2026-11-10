import { useEffect, type ReactNode } from "react";
import bbhLogo from "@/assets/bbh-logo.jpg";

export function BookLayout({ children }: { children: ReactNode }) {
  useEffect(() => {
    const fonts = document.createElement("link");
    fonts.rel = "stylesheet";
    fonts.href = "https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=Raleway:wght@400;500;600;700&display=swap";
    document.head.appendChild(fonts);
    return () => fonts.remove();
  }, []);

  return <div className="theme-book min-h-screen bg-background text-foreground flex flex-col">
    <header className="bg-primary text-primary-foreground">
      <div className="max-w-5xl mx-auto px-6 md:px-10 py-6 flex items-center gap-3">
        <span className="text-sm font-semibold">Beyond Billable Hours</span>
      </div>
    </header>
    <main className="flex-1">{children}</main>
    <footer className="max-w-5xl w-full mx-auto px-6 md:px-10 py-8 text-xs font-medium text-foreground flex items-center gap-3">
      <img src={bbhLogo} alt="Beyond Billable Hours" className="w-8 h-8 object-contain" />
      <span>A product of Beyond Billable Hours</span>
    </footer>
  </div>;
}