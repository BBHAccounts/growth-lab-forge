import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookOpen, X, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useReadingReminder } from "@/hooks/use-reading-reminder";

export function ReadingReminderCard() {
  const { showReminder, loading, dismissReminder } = useReadingReminder();
  const navigate = useNavigate();

  if (loading || !showReminder) return null;

  return (
    <Card className="border-primary/20 bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 overflow-hidden">
      <CardContent className="p-4 sm:p-5">
        <div className="flex items-start gap-4">
          <div className="shrink-0 h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
            <BookOpen className="h-5 w-5 text-primary" />
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="h-4 w-4 text-primary" />
              <h3 className="font-semibold text-sm">Broaden Your Horizons</h3>
            </div>
            <p className="text-sm text-muted-foreground mb-3">
              Take 5 minutes to explore a relevant article and stay sharp on the latest growth strategies.
            </p>
            <Button 
              size="sm" 
              onClick={() => navigate("/insights-hub")}
              className="gap-2"
            >
              <BookOpen className="h-4 w-4" />
              Explore Insights
            </Button>
          </div>

          <button
            onClick={dismissReminder}
            className="shrink-0 p-1 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            aria-label="Dismiss reminder"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </CardContent>
    </Card>
  );
}
