import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

interface ConfidenceBarProps {
  confidence: number;
  verdict: "real" | "fake" | "uncertain";
  className?: string;
}

export function ConfidenceBar({ confidence, verdict, className }: ConfidenceBarProps) {
  const indicatorColor = {
    real: "bg-emerald-500",
    fake: "bg-red-500",
    uncertain: "bg-amber-500",
  }[verdict];

  return (
    <div className={cn("space-y-2", className)} data-testid="confidence-bar">
      <div className="flex justify-between text-sm font-medium">
        <span className="text-muted-foreground uppercase tracking-wider text-xs">AI Confidence</span>
        <span className="font-mono">{Math.round(confidence)}%</span>
      </div>
      <Progress 
        value={confidence} 
        className="h-2 bg-secondary"
        indicatorClassName={indicatorColor}
      />
    </div>
  );
}
