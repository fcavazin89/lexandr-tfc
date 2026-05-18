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
      <aside className="w-64 flex-shrink-0 border-r border-border bg-sidebar/80 backdrop-blur-xl flex flex-col justify-between">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-10">
            <div className="w-8 h-8 rounded-sm border border-primary/50 bg-primary/10 flex items-center justify-center shadow-[0_0_12px_rgba(208,188,255,0.2)]">
              <BrainCircuit className="w-5 h-5 text-primary" />
            </div>
            <h1 className="font-display font-bold tracking-[0.15em] text-lg text-primary">LEXANDR</h1>
          </div>
          
          <div className="space-y-1">
            <p className="text-[10px] font-display text-muted-foreground uppercase tracking-[0.2em] mb-4 px-3">System Navigation</p>
            {navItems.map((item) => {
              const isActive = location === item.href || (item.href !== "/" && location.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-sm text-sm transition-all duration-200 group",
                    isActive 
                      ? "glass text-primary micro-border" 
                      : "text-muted-foreground hover:text-foreground hover:bg-white/[0.03] micro-border border-transparent hover:border-white/[0.08]"
                  )}
                >
                  <item.icon className={cn("w-4 h-4", isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground")} />
                  <span className={cn(isActive && "font-display tracking-wider text-xs")}>{item.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
        
        <div className="p-4 border-t border-border/50">
          <div className="flex items-center gap-2 text-[10px] font-display tracking-widest text-muted-foreground px-2 py-2">
            <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse shadow-[0_0_8px_rgba(208,188,255,0.6)]" />
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
