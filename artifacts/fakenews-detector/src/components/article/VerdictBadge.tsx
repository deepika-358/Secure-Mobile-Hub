import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type Verdict = "real" | "fake" | "uncertain";

interface VerdictBadgeProps {
  verdict: Verdict;
  className?: string;
  size?: "default" | "lg";
}

export function VerdictBadge({ verdict, className, size = "default" }: VerdictBadgeProps) {
  const styles = {
    real: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
    fake: "bg-red-500/15 text-red-400 border-red-500/30",
    uncertain: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  };

  const labels = {
    real: "Verified Real",
    fake: "Detected Fake",
    uncertain: "Uncertain",
  };

  return (
    <Badge 
      variant="outline" 
      className={cn(
        "font-bold uppercase tracking-wider",
        styles[verdict],
        size === "lg" ? "text-sm px-4 py-1.5" : "text-xs px-2.5 py-0.5",
        className
      )}
      data-testid={`badge-verdict-${verdict}`}
    >
      {labels[verdict]}
    </Badge>
  );
}
