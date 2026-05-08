import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { format } from "date-fns";
import { Database, FileText, Activity, Terminal, ArrowRight } from "lucide-react";
import {
  getGetResearchStatsQueryOptions,
  getListResearchSessionsQueryOptions,
} from "@workspace/api-client-react";

export default function Dashboard() {
  const { data: stats } = useQuery(getGetResearchStatsQueryOptions());
  const { data: sessions } = useQuery(getListResearchSessionsQueryOptions());

  const recentSessions = sessions?.slice(0, 5) ?? [];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold font-mono tracking-tight text-foreground">COMMAND CENTER</h1>
          <p className="text-muted-foreground mt-1">Autonomous Deep Research Intelligence</p>
        </div>
        <Link
          href="/research/new"
          className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-sm font-medium hover:bg-primary/90 transition-colors font-mono text-sm"
        >
          <Terminal className="w-4 h-4" />
          &gt;_ INITIALIZE SESSION
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-card border border-border p-6 rounded-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Database className="w-16 h-16" />
          </div>
          <p className="text-sm font-mono text-muted-foreground mb-2">ACTIVE SESSIONS</p>
          <p className="text-4xl font-light text-foreground">{stats?.totalSessions ?? 0}</p>
        </div>

        <div className="bg-card border border-border p-6 rounded-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Activity className="w-16 h-16" />
          </div>
          <p className="text-sm font-mono text-muted-foreground mb-2">QUERIES PROCESSED</p>
          <p className="text-4xl font-light text-foreground">{stats?.totalMessages ?? 0}</p>
        </div>

        <div className="bg-card border border-border p-6 rounded-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <FileText className="w-16 h-16" />
          </div>
          <p className="text-sm font-mono text-muted-foreground mb-2">GENERATED REPORTS</p>
          <p className="text-4xl font-light text-foreground">{stats?.totalReports ?? 0}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
        <div className="col-span-2 space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-2">
            <h2 className="text-lg font-mono font-medium">RECENT SESSIONS</h2>
            <Link href="/research/new" className="text-sm text-primary hover:underline flex items-center gap-1 font-mono">
              New Session <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="space-y-2">
            {recentSessions.length === 0 ? (
              <div className="text-sm text-muted-foreground py-12 text-center border border-dashed border-border rounded-sm bg-card/50 font-mono">
                NO SESSIONS INITIALIZED. BEGIN YOUR RESEARCH PROTOCOL.
              </div>
            ) : (
              recentSessions.map((s) => (
                <Link key={s.id} href={`/research/${s.id}`}>
                  <div className="flex items-center justify-between bg-card border border-border hover:border-primary/50 px-4 py-3 rounded-sm cursor-pointer transition-all group">
                    <div>
                      <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">{s.topic}</p>
                      <p className="text-xs text-muted-foreground font-mono mt-1">
                        {s.domain} — {format(new Date(s.createdAt), "MMM dd, yyyy")}
                      </p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-muted-foreground opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div className="border-b border-border pb-2">
            <h2 className="text-lg font-mono font-medium">DOMAIN DISTRIBUTION</h2>
          </div>
          <div className="bg-card border border-border p-4 rounded-sm space-y-4">
            {stats?.sessionsByDomain && stats.sessionsByDomain.length > 0 ? (
              stats.sessionsByDomain.map((item, i) => {
                const total = stats.totalSessions || 1;
                const pct = Math.round((item.count / total) * 100);
                const opacity = Math.max(0.4, 1 - i * 0.2);
                return (
                  <div key={item.domain} className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">{item.domain}</span>
                      <span className="font-mono text-primary">{pct}%</span>
                    </div>
                    <div className="w-full bg-secondary h-1.5 rounded-full overflow-hidden">
                      <div className="bg-primary h-full" style={{ width: `${pct}%`, opacity }} />
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-xs text-muted-foreground font-mono text-center py-6">NO DOMAIN DATA YET</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
