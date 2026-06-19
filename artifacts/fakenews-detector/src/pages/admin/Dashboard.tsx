import { useEffect } from "react";
import { useLocation } from "wouter";
import { format } from "date-fns";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { LogOut, Activity, AlertTriangle, ShieldCheck, Database, Trash2, Edit2 } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

import { 
  useGetAdminMe, 
  useAdminLogout, 
  useGetStatsSummary, 
  useGetDailyStats, 
  useListArticles,
  useOverrideVerdict,
  useDeleteArticle,
  getListArticlesQueryKey,
  getGetStatsSummaryQueryKey,
  getGetDailyStatsQueryKey
} from "@workspace/api-client-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { VerdictBadge } from "@/components/article/VerdictBadge";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

export function AdminDashboard() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: admin, isLoading: isCheckingAuth, isError: authError } = useGetAdminMe();
  const logoutMutation = useAdminLogout();
  
  const { data: stats } = useGetStatsSummary();
  const { data: dailyStats } = useGetDailyStats();
  const { data: articles, isLoading: isArticlesLoading } = useListArticles({ limit: 100 });
  
  const overrideMutation = useOverrideVerdict();
  const deleteMutation = useDeleteArticle();

  useEffect(() => {
    if (authError && !isCheckingAuth) {
      setLocation("/admin");
    }
  }, [authError, isCheckingAuth, setLocation]);

  const handleLogout = () => {
    logoutMutation.mutate(undefined, {
      onSuccess: () => setLocation("/admin")
    });
  };

  const handleOverride = (id: number, newVerdict: "real" | "fake" | "uncertain") => {
    overrideMutation.mutate(
      { id, data: { verdict: newVerdict, explanation: "Manually overridden by administrator." } },
      {
        onSuccess: () => {
          toast({ title: "Verdict Updated", description: `Article ${id} updated to ${newVerdict}.` });
          queryClient.invalidateQueries({ queryKey: getListArticlesQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetStatsSummaryQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetDailyStatsQueryKey() });
        }
      }
    );
  };

  const handleDelete = (id: number) => {
    if (confirm("Are you sure you want to delete this record? This action cannot be undone.")) {
      deleteMutation.mutate(
        { id },
        {
          onSuccess: () => {
            toast({ title: "Record Deleted" });
            queryClient.invalidateQueries({ queryKey: getListArticlesQueryKey() });
            queryClient.invalidateQueries({ queryKey: getGetStatsSummaryQueryKey() });
            queryClient.invalidateQueries({ queryKey: getGetDailyStatsQueryKey() });
          }
        }
      );
    }
  };

  if (isCheckingAuth || authError) {
    return <div className="flex-1 flex items-center justify-center"><Activity className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="flex-1 w-full max-w-7xl mx-auto px-4 py-8 space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Command Center</h1>
          <p className="text-muted-foreground font-mono mt-1 text-sm">Session active: {admin?.username} [{admin?.role}]</p>
        </div>
        <Button variant="outline" size="sm" onClick={handleLogout} className="gap-2 shrink-0 border-border/50" data-testid="button-logout">
          <LogOut className="h-4 w-4" /> End Session
        </Button>
      </div>

      {/* Stats Summary */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-card/40 border-border/50 shadow-none">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Analyzed</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold font-mono">{stats?.total || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">+{stats?.todayCount || 0} today</p>
          </CardContent>
        </Card>
        
        <Card className="bg-card/40 border-border/50 shadow-none">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">Detected Fake</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold font-mono text-red-400">{stats?.fakePercent || 0}%</div>
            <p className="text-xs text-muted-foreground mt-1">{stats?.fake || 0} total records</p>
          </CardContent>
        </Card>

        <Card className="bg-card/40 border-border/50 shadow-none">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">Verified Real</CardTitle>
            <ShieldCheck className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold font-mono text-emerald-400">{stats?.realPercent || 0}%</div>
            <p className="text-xs text-muted-foreground mt-1">{stats?.real || 0} total records</p>
          </CardContent>
        </Card>

        <Card className="bg-card/40 border-border/50 shadow-none">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">Avg Confidence</CardTitle>
            <Activity className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold font-mono text-primary">{Math.round(stats?.avgConfidence || 0)}%</div>
            <p className="text-xs text-muted-foreground mt-1">Across all models</p>
          </CardContent>
        </Card>
      </div>

      {/* Chart */}
      <Card className="border-border/50 bg-card/20 shadow-none">
        <CardHeader>
          <CardTitle className="text-lg">Detection Volume (Last 30 Days)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] w-full">
            {dailyStats ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dailyStats} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="date" 
                    tickFormatter={(val) => format(new Date(val), "MMM d")} 
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis 
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip 
                    contentStyle={{ backgroundColor: "hsl(var(--card))", borderColor: "hsl(var(--border))", color: "hsl(var(--foreground))" }}
                    labelFormatter={(val) => format(new Date(val), "MMMM d, yyyy")}
                  />
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
                  <Bar dataKey="fake" name="Fake" stackId="a" fill="hsl(var(--destructive))" radius={[0, 0, 4, 4]} />
                  <Bar dataKey="uncertain" name="Uncertain" stackId="a" fill="hsl(38 92% 50%)" />
                  <Bar dataKey="real" name="Real" stackId="a" fill="hsl(160 84% 39%)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <Skeleton className="w-full h-full bg-card/40" />
            )}
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="border-border/50 bg-card/20 shadow-none overflow-hidden">
        <CardHeader className="border-b border-border/50 bg-card/40">
          <CardTitle className="text-lg">Recent Ledger Records</CardTitle>
        </CardHeader>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-border/50 hover:bg-transparent">
                <TableHead className="w-20 text-xs font-mono">ID</TableHead>
                <TableHead className="min-w-[300px]">Title</TableHead>
                <TableHead>Confidence</TableHead>
                <TableHead className="w-48">Verdict / Override</TableHead>
                <TableHead className="w-40">Date</TableHead>
                <TableHead className="w-16 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isArticlesLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Loading records...</TableCell>
                </TableRow>
              ) : articles && articles.length > 0 ? (
                articles.map((article) => (
                  <TableRow key={article.id} className="border-border/50 hover:bg-muted/10">
                    <TableCell className="font-mono text-xs text-muted-foreground">#{article.id}</TableCell>
                    <TableCell className="font-medium">
                      <span className="line-clamp-1">{article.title}</span>
                      {article.adminOverride && <span className="text-[10px] text-primary uppercase tracking-wider mt-1 block">Manual Override</span>}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="w-16 bg-muted h-1.5 rounded-full overflow-hidden">
                          <div 
                            className={`h-full ${article.verdict === 'real' ? 'bg-emerald-500' : article.verdict === 'fake' ? 'bg-red-500' : 'bg-amber-500'}`} 
                            style={{ width: `${article.confidence}%` }} 
                          />
                        </div>
                        <span className="text-xs font-mono">{Math.round(article.confidence)}%</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Select 
                        defaultValue={article.verdict} 
                        onValueChange={(val) => handleOverride(article.id, val as any)}
                        disabled={overrideMutation.isPending}
                      >
                        <SelectTrigger className="h-8 text-xs bg-background/50 border-border/50">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="real" className="text-emerald-400">Force Real</SelectItem>
                          <SelectItem value="fake" className="text-red-400">Force Fake</SelectItem>
                          <SelectItem value="uncertain" className="text-amber-400">Force Uncertain</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                      {format(new Date(article.createdAt), "MMM d, HH:mm")}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                        onClick={() => handleDelete(article.id)}
                        disabled={deleteMutation.isPending}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No records found.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}
