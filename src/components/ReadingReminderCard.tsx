import { Circle, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useReadingReminder } from "@/hooks/use-reading-reminder";

export function ReadingReminderCard() {
  const { showReminder, loading } = useReadingReminder();
  const navigate = useNavigate();

  if (loading || !showReminder) return null;

  return (
    <li>
      <button
        onClick={() => navigate("/insights-hub")}
        className="w-full flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors group text-left"
      >
        <Circle className="h-4 w-4 text-muted-foreground shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">
            Take 5 min to read an insight
          </p>
          <p className="text-xs text-muted-foreground">Broaden your scope</p>
        </div>
        <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all shrink-0" />
      </button>
    </li>
  );
}
