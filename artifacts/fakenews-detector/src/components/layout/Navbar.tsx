import { Link, useLocation } from "wouter";
import { ShieldAlert, History, LayoutDashboard } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Navbar() {
  const [location] = useLocation();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary group-hover:bg-primary/20 transition-colors">
              <ShieldAlert className="h-5 w-5" />
            </div>
            <span className="font-bold tracking-tight text-lg hidden sm:inline-block">
              Veritas<span className="text-primary">AI</span>
            </span>
          </Link>

          <nav className="flex items-center gap-1 text-sm font-medium">
            <Link href="/history">
              <Button 
                variant={location === "/history" ? "secondary" : "ghost"} 
                size="sm" 
                className="gap-2"
                data-testid="link-history"
              >
                <History className="h-4 w-4" />
                History
              </Button>
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/admin">
            <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground" data-testid="link-admin">
              <LayoutDashboard className="h-4 w-4" />
              <span className="hidden sm:inline-block">Admin</span>
            </Button>
          </Link>
        </div>
      </div>
    </header>
  );
}
