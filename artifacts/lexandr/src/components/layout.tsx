import { Link, useLocation } from "wouter";
import { Terminal, LayoutDashboard, FileText, Plus, Database, BrainCircuit } from "lucide-react";
import { cn } from "@/lib/utils";

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const [location] = useLocation();

  const navItems = [
    { href: "/", label: "Command Center", icon: LayoutDashboard },
    { href: "/research/new", label: "New Session", icon: Plus },
    { href: "/reports", label: "Intel Reports", icon: FileText },
  ];

  return (
    <div className="flex h-screen w-full bg-background text-foreground overflow-hidden font-sans selection:bg-primary/30">
      <aside className="w-64 flex-shrink-0 border-r border-border bg-card flex flex-col justify-between">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-10">
            <div className="w-8 h-8 rounded border border-primary/50 bg-primary/10 flex items-center justify-center">
              <BrainCircuit className="w-5 h-5 text-primary" />
            </div>
            <h1 className="font-mono font-bold tracking-widest text-lg text-primary">LEXANDR</h1>
          </div>
          
          <div className="space-y-1">
            <p className="text-xs font-mono text-muted-foreground uppercase tracking-wider mb-4 px-3">System Navigation</p>
            {navItems.map((item) => {
              const isActive = location === item.href || (item.href !== "/" && location.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 group",
                    isActive 
                      ? "bg-primary/10 text-primary border border-primary/20" 
                      : "text-muted-foreground hover:text-foreground hover:bg-white/5 border border-transparent"
                  )}
                >
                  <item.icon className={cn("w-4 h-4", isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground")} />
                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>
        
        <div className="p-4 border-t border-border/50">
          <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground px-2 py-2">
            <div className="w-2 h-2 rounded-full bg-primary animate-pulse shadow-[0_0_8px_var(--primary)]" />
            <span>SYSTEM ONLINE</span>
          </div>
        </div>
      </aside>
      
      <main className="flex-1 flex flex-col h-full overflow-hidden bg-background relative">
        
        <div className="flex-1 overflow-auto relative z-10 p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
