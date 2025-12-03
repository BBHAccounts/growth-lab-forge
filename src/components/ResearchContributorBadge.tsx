import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Award, Info } from "lucide-react";

interface ResearchContributorBadgeProps {
  showInfo?: boolean;
  size?: "sm" | "default";
}

export function ResearchContributorBadge({ showInfo = false, size = "default" }: ResearchContributorBadgeProps) {
  const badge = (
    <Badge 
      className={`bg-gradient-to-r from-chart-4 to-chart-5 text-white border-0 ${
        size === "sm" ? "text-xs px-2 py-0.5" : "px-3 py-1"
      }`}
    >
      <Award className={size === "sm" ? "h-3 w-3 mr-1" : "h-4 w-4 mr-1.5"} />
      Research Contributor
    </Badge>
  );

  if (!showInfo) return badge;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          {badge}
        </TooltipTrigger>
        <TooltipContent className="max-w-xs">
          <p className="text-sm">
            Research Contributors complete at least 1 research study per month and unlock exclusive insights and toolbox models.
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export function ResearchContributorInfo() {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <button className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <Info className="h-4 w-4" />
            <span>Become a Contributor</span>
          </button>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-sm p-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Award className="h-5 w-5 text-chart-4" />
              <span className="font-semibold">Research Contributor Program</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Contribute to at least 1 research study per month to earn your badge and unlock:
            </p>
            <ul className="text-sm space-y-1 text-muted-foreground">
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-chart-4" />
                Exclusive industry insights
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-chart-4" />
                Premium toolbox models
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-chart-4" />
                Early access to research findings
              </li>
            </ul>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
