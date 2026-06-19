import { useParams, Link } from "wouter";
import { format } from "date-fns";
import { ArrowLeft, AlertCircle, CheckCircle2, HelpCircle, ExternalLink, Calendar, Link as LinkIcon, FileText, Activity } from "lucide-react";
import { useGetArticle, getGetArticleQueryKey } from "@workspace/api-client-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { VerdictBadge } from "@/components/article/VerdictBadge";
import { ConfidenceBar } from "@/components/article/ConfidenceBar";
import { Separator } from "@/components/ui/separator";

export function Result() {
  const params = useParams();
  const id = parseInt(params.id || "0", 10);

  const { data: article, isLoading, isError } = useGetArticle(id, {
    query: {
      enabled: !!id,
      queryKey: getGetArticleQueryKey(id)
    }
  });

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 space-y-6">
        <div className="relative">
          <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl animate-pulse" />
          <div className="h-12 w-12 rounded-full border-4 border-primary border-t-transparent animate-spin relative z-10" />
        </div>
        <p className="text-muted-foreground font-mono">Retrieving analysis record...</p>
      </div>
    );
  }

  if (isError || !article) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8">
        <Card className="max-w-md w-full text-center p-6 bg-destructive/10 border-destructive/20">
          <AlertCircle className="mx-auto h-12 w-12 text-destructive mb-4" />
          <h2 className="text-xl font-bold mb-2">Record Not Found</h2>
          <p className="text-muted-foreground mb-6">The analysis record you're looking for doesn't exist or has been removed.</p>
          <Link href="/">
            <Button variant="outline">Return Home</Button>
          </Link>
        </Card>
      </div>
    );
  }

  const VerdictIcon = {
    real: CheckCircle2,
    fake: AlertCircle,
    uncertain: HelpCircle
  }[article.verdict];

  const bannerColor = {
    real: "from-emerald-500/20 via-emerald-500/5 to-transparent border-emerald-500/30",
    fake: "from-red-500/20 via-red-500/5 to-transparent border-red-500/30",
    uncertain: "from-amber-500/20 via-amber-500/5 to-transparent border-amber-500/30"
  }[article.verdict];

  const textColor = {
    real: "text-emerald-400",
    fake: "text-red-400",
    uncertain: "text-amber-400"
  }[article.verdict];

  return (
    <div className="flex-1 w-full max-w-5xl mx-auto px-4 py-8 space-y-8">
      <div>
        <Link href="/">
          <Button variant="ghost" size="sm" className="gap-2 mb-6 -ml-3 text-muted-foreground">
            <ArrowLeft className="h-4 w-4" /> Back to Analysis
          </Button>
        </Link>
        
        {/* Verdict Banner */}
        <div className={`rounded-xl border bg-gradient-to-br p-8 md:p-12 mb-8 ${bannerColor}`}>
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <VerdictIcon className={`h-10 w-10 ${textColor}`} />
                <h1 className={`text-4xl md:text-5xl font-extrabold uppercase tracking-tight ${textColor}`}>
                  {article.verdict === 'real' ? 'Verified Real' : article.verdict === 'fake' ? 'Detected Fake' : 'Uncertain'}
                </h1>
              </div>
              <p className="text-lg text-foreground/80 max-w-2xl font-medium">
                {article.title}
              </p>
              <div className="flex flex-wrap items-center gap-4 text-sm font-mono text-muted-foreground">
                <span className="flex items-center gap-1.5"><Calendar className="h-4 w-4" /> {format(new Date(article.createdAt), "MMMM d, yyyy HH:mm")}</span>
                {article.source && <span className="flex items-center gap-1.5"><FileText className="h-4 w-4" /> {article.source}</span>}
                {article.url && (
                  <a href={article.url} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 hover:text-primary transition-colors">
                    <LinkIcon className="h-4 w-4" /> Source Link <ExternalLink className="h-3 w-3" />
                  </a>
                )}
                {article.adminOverride && (
                  <span className="text-primary bg-primary/10 px-2 py-0.5 rounded">Admin Overridden</span>
                )}
              </div>
            </div>
            
            <div className="w-full md:w-64 shrink-0 bg-background/40 backdrop-blur-md rounded-xl p-6 border border-border/50 shadow-xl">
              <div className="text-center mb-2">
                <div className="text-sm text-muted-foreground uppercase tracking-wider font-semibold">Confidence Score</div>
                <div className="text-4xl font-mono font-bold mt-1">{Math.round(article.confidence)}%</div>
              </div>
              <ConfidenceBar confidence={article.confidence} verdict={article.verdict} />
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          <div className="md:col-span-2 space-y-8">
            <section className="space-y-4">
              <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                <Activity className="h-5 w-5 text-primary" /> Intelligence Report
              </h2>
              <Card className="bg-card/30">
                <CardContent className="p-6 text-foreground/90 leading-relaxed text-lg whitespace-pre-wrap">
                  {article.explanation}
                </CardContent>
              </Card>
            </section>

            {article.indicators && (
              <section className="space-y-4">
                <h3 className="text-lg font-semibold text-muted-foreground uppercase tracking-wider text-sm">Key Indicators</h3>
                <div className="prose prose-invert prose-p:text-muted-foreground max-w-none">
                  <p>{article.indicators}</p>
                </div>
              </section>
            )}

            <Separator className="my-8" />

            <section className="space-y-4">
              <h3 className="text-lg font-semibold">Original Content</h3>
              <Card className="bg-muted/10 border-dashed">
                <CardContent className="p-6 text-sm text-muted-foreground whitespace-pre-wrap font-mono leading-relaxed">
                  {article.content}
                </CardContent>
              </Card>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
