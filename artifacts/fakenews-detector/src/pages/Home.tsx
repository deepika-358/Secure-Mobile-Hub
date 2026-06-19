import { useState } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { ShieldCheck, Activity, Link as LinkIcon, TextSelect, Newspaper } from "lucide-react";

import { useSubmitArticle, useGetRecentDetections } from "@workspace/api-client-react";
import { getListArticlesQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { ArticleCard } from "@/components/article/ArticleCard";

const formSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters").max(200),
  content: z.string().min(10, "Content is too short to analyze accurately"),
  url: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  source: z.string().optional(),
});

export function Home() {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const submitMutation = useSubmitArticle();
  
  const { data: recentArticles, isLoading: isLoadingRecent } = useGetRecentDetections({ limit: 6 });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      content: "",
      url: "",
      source: "",
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    submitMutation.mutate(
      {
        data: {
          title: values.title,
          content: values.content,
          url: values.url || undefined,
          source: values.source || undefined,
        },
      },
      {
        onSuccess: (data) => {
          queryClient.invalidateQueries({ queryKey: getListArticlesQueryKey() });
          setLocation(`/results/${data.id}`);
        },
      }
    );
  }

  return (
    <div className="flex-1 w-full max-w-7xl mx-auto px-4 py-8 md:py-16 space-y-24">
      {/* Hero Section */}
      <section className="grid lg:grid-cols-2 gap-12 lg:gap-8 items-start">
        <div className="space-y-8 max-w-xl pt-4">
          <div className="space-y-4">
            <div className="inline-flex items-center rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-sm text-primary font-medium">
              <Activity className="mr-2 h-4 w-4" />
              Advanced Neural Fact-Checking
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight text-foreground">
              Precision Truth <br />
              <span className="text-muted-foreground">in the Digital Age.</span>
            </h1>
            <p className="text-lg text-muted-foreground leading-relaxed">
              Verify claims instantly. Our intelligence engine analyzes linguistic patterns, cross-references sources, and exposes disinformation before it spreads.
            </p>
          </div>
          
          <div className="grid sm:grid-cols-2 gap-6 text-sm">
            <div className="flex gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-card border border-border/50">
                <ShieldCheck className="h-5 w-5 text-emerald-400" />
              </div>
              <div>
                <div className="font-semibold text-foreground">Military-Grade Analysis</div>
                <div className="text-muted-foreground mt-1">Evaluates syntactic markers of deception</div>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-card border border-border/50">
                <Newspaper className="h-5 w-5 text-blue-400" />
              </div>
              <div>
                <div className="font-semibold text-foreground">Source Intelligence</div>
                <div className="text-muted-foreground mt-1">Cross-references domain reputation</div>
              </div>
            </div>
          </div>
        </div>

        {/* Submission Form */}
        <Card className="border-border/50 bg-card/40 backdrop-blur-sm shadow-2xl relative overflow-hidden">
          {submitMutation.isPending && (
            <div className="absolute inset-0 z-50 bg-background/80 backdrop-blur-sm flex flex-col items-center justify-center space-y-6">
              <div className="relative">
                <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl animate-pulse" />
                <Activity className="h-12 w-12 text-primary animate-bounce relative z-10" />
              </div>
              <div className="text-center space-y-2">
                <h3 className="font-bold text-lg">Analyzing Content...</h3>
                <p className="text-sm text-muted-foreground font-mono">Running neural detection models</p>
              </div>
            </div>
          )}

          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <TextSelect className="h-5 w-5 text-primary" />
              Analyze Article
            </CardTitle>
            <CardDescription>
              Paste the headline and content to run a real-time verification.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Headline / Title</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. BREAKING: Major discovery in..." className="bg-background/50" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="content"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Article Text</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Paste the full body of the article here for most accurate analysis..." 
                          className="min-h-[140px] resize-none bg-background/50" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid sm:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="url"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-1.5">
                          <LinkIcon className="h-3.5 w-3.5" /> URL (Optional)
                        </FormLabel>
                        <FormControl>
                          <Input placeholder="https://..." className="bg-background/50" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="source"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Source Name (Optional)</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. The Daily Tribune" className="bg-background/50" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <Button type="submit" className="w-full h-12 text-base font-semibold" disabled={submitMutation.isPending} data-testid="button-submit-analysis">
                  Run Intelligence Scan
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </section>

      {/* Recent Detections */}
      <section className="space-y-8">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h2 className="text-2xl font-bold tracking-tight">Recent Detections</h2>
            <p className="text-sm text-muted-foreground">Latest articles processed by the community</p>
          </div>
        </div>

        {isLoadingRecent ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <Card key={i} className="h-48 animate-pulse bg-card/20" />
            ))}
          </div>
        ) : recentArticles && recentArticles.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {recentArticles.map(article => (
              <ArticleCard key={article.id} article={article} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-muted-foreground bg-card/20 rounded-xl border border-border/50">
            No recent detections found. Be the first to analyze an article.
          </div>
        )}
      </section>
    </div>
  );
}
