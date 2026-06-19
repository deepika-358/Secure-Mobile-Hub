import { Link } from "wouter";
import { format } from "date-fns";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { VerdictBadge } from "./VerdictBadge";
import { Article } from "@workspace/api-client-react/src/generated/api.schemas";
import { Clock, ExternalLink } from "lucide-react";

interface ArticleCardProps {
  article: Article;
}

export function ArticleCard({ article }: ArticleCardProps) {
  return (
    <Link href={`/results/${article.id}`}>
      <Card className="flex flex-col h-full hover:border-primary/50 transition-colors cursor-pointer group bg-card/50 hover:bg-card/80 border-border/50">
        <CardHeader className="pb-3 flex flex-row items-start justify-between gap-4 space-y-0">
          <div className="space-y-1">
            <h3 className="font-semibold leading-tight line-clamp-2 group-hover:text-primary transition-colors">
              {article.title}
            </h3>
            {article.source && (
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <ExternalLink className="h-3 w-3" />
                {article.source}
              </p>
            )}
          </div>
          <VerdictBadge verdict={article.verdict} className="shrink-0" />
        </CardHeader>
        <CardContent className="flex-1 pb-4">
          <p className="text-sm text-muted-foreground line-clamp-3">
            {article.content}
          </p>
        </CardContent>
        <CardFooter className="pt-0 flex items-center justify-between text-xs text-muted-foreground font-mono">
          <div className="flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5" />
            {format(new Date(article.createdAt), "MMM d, yyyy")}
          </div>
          <div className="font-medium text-foreground">
            {Math.round(article.confidence)}% Conf.
          </div>
        </CardFooter>
      </Card>
    </Link>
  );
}
