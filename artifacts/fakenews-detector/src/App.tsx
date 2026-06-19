import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import { Navbar } from "@/components/layout/Navbar";
import { Home } from "@/pages/Home";
import { Result } from "@/pages/Result";
import { History } from "@/pages/History";
import { AdminLogin } from "@/pages/admin/Login";
import { AdminDashboard } from "@/pages/admin/Dashboard";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <div className="min-h-[100dvh] flex flex-col bg-background text-foreground selection:bg-primary/30 selection:text-primary-foreground dark">
            <Navbar />
            <main className="flex-1 flex flex-col relative z-0">
              <Switch>
                <Route path="/" component={Home} />
                <Route path="/results/:id" component={Result} />
                <Route path="/history" component={History} />
                <Route path="/admin" component={AdminLogin} />
                <Route path="/admin/dashboard" component={AdminDashboard} />
                <Route component={NotFound} />
              </Switch>
            </main>
          </div>
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
