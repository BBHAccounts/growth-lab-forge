import { ReactNode } from "react";
import glLogoDark from "@/assets/gl-logo-dark.svg";

interface ProgramLayoutProps {
  children: ReactNode;
  programName?: string;
}

export function ProgramLayout({ children, programName }: ProgramLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      {/* Minimal Header */}
      <header className="h-16 border-b border-border flex items-center px-6 bg-background">
        <div className="flex items-center gap-3">
          <img src={glLogoDark} alt="Growth Lab" className="w-10 h-10 rounded-xl" />
          <div>
            <h1 className="font-bold text-foreground">Growth Lab</h1>
            {programName && (
              <p className="text-xs text-muted-foreground">{programName}</p>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        {children}
      </main>

      {/* Footer */}
      <footer className="py-4 text-center border-t border-border">
        <p className="text-xs text-muted-foreground">© 2025 Beyond Billable Hours</p>
      </footer>
    </div>
  );
}
