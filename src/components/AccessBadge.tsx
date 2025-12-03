import { Award, Lock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface AccessBadgeProps {
  accessLevel: string | null | undefined;
  size?: "sm" | "default";
}

export function AccessBadge({ accessLevel, size = "default" }: AccessBadgeProps) {
  if (!accessLevel || accessLevel === "all" || accessLevel === "public" || accessLevel === "registered") {
    return null;
  }

  const isSmall = size === "sm";
  const iconClass = isSmall ? "h-3 w-3" : "h-3.5 w-3.5";

  if (accessLevel === "research_contributor") {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge className={`bg-secondary hover:bg-secondary/90 text-secondary-foreground gap-1 ${isSmall ? "text-[10px] px-1.5 py-0" : "text-xs"}`}>
              <Award className={iconClass} />
              Contributors
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <p>Available to Research Contributors only</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  if (accessLevel === "request_only") {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge variant="outline" className={`gap-1 border-amber-500/50 text-amber-600 dark:text-amber-400 ${isSmall ? "text-[10px] px-1.5 py-0" : "text-xs"}`}>
              <Lock className={iconClass} />
              On Request
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <p>Available on request only</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  if (accessLevel === "client") {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge variant="outline" className={`gap-1 border-primary/50 ${isSmall ? "text-[10px] px-1.5 py-0" : "text-xs"}`}>
              <Lock className={iconClass} />
              Clients
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <p>Available to clients only</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return null;
}
