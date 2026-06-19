import { useState } from "react";
import { Search } from "lucide-react";
import { useListArticles } from "@workspace/api-client-react";

import { ArticleCard } from "@/components/article/ArticleCard";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";

export function History() {
  const [filterVerdict, setFilterVerdict] = useState<string>("all");
  const [search, setSearch] = useState("");

  const { data: articles, isLoading } = useListArticles({
    verdict: filterVerdict !== "all" ? filterVerdict : undefined,
    limit: 50,
  });

  const filteredArticles = articles?.filter(a => 
    a.title.toLowerCase().includes(search.toLowerCase()) || 
    a.content.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex-1 w-full max-w-7xl mx-auto px-4 py-8 space-y-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">Detection History</h1>
          <p className="text-muted-foreground">Browse the public ledger of analyzed articles and claims.</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search history..." 
              className="pl-9 bg-background"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Select value={filterVerdict} onValueChange={setFilterVerdict}>
            <SelectTrigger className="w-[140px] bg-background">
              <SelectValue placeholder="All Verdicts" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Verdicts</SelectItem>
              <SelectItem value="real">Verified Real</SelectItem>
              <SelectItem value="fake">Detected Fake</SelectItem>
              <SelectItem value="uncertain">Uncertain</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {isLoading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 9 }).map((_, i) => (
            <div key={i} className="flex flex-col space-y-3">
              <Skeleton className="h-48 w-full rounded-xl bg-card/40" />
            </div>
          ))}
        </div>
      ) : filteredArticles && filteredArticles.length > 0 ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredArticles.map(article => (
            <ArticleCard key={article.id} article={article} />
          ))}
        </div>
      ) : (
        <div className="text-center py-24 text-muted-foreground bg-card/10 rounded-xl border border-dashed border-border/50">
          <p className="text-lg font-medium text-foreground">No records found</p>
          <p className="mt-1 text-sm">Try adjusting your filters or search term.</p>
        </div>
      )}
    </div>
  );
}
