import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { format } from "date-fns";
import { FileText, ArrowRight, Clock, Database } from "lucide-react";
import { getListResearchReportsQueryOptions } from "@workspace/api-client-react";

export default function Reports() {
  const { data: reports = [], isLoading } = useQuery(getListResearchReportsQueryOptions());

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold font-mono tracking-tight text-foreground">INTELLIGENCE REPORTS</h1>
        <p className="text-muted-foreground mt-2">Structured output from completed autonomous research sessions.</p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((n) => (
            <div key={n} className="bg-card border border-border p-6 rounded-sm h-48 animate-pulse" />
          ))}
        </div>
      ) : reports.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {reports.map((report) => (
            <Link key={report.id} href={`/reports/${report.id}`}>
              <div className="bg-card border border-border p-6 rounded-sm hover:border-primary/50 transition-all group cursor-pointer h-full flex flex-col relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                  <FileText className="w-24 h-24" />
                </div>

                <div className="flex items-start justify-between mb-4 relative z-10">
                  <span className="bg-primary/10 text-primary border border-primary/20 px-2.5 py-1 rounded-sm text-xs font-mono">
                    {report.domain}
                  </span>
                  <span className="text-xs text-muted-foreground font-mono flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {format(new Date(report.createdAt), "MMM dd, yyyy")}
                  </span>
                </div>

                <h2 className="text-lg font-bold text-foreground mb-4 line-clamp-2 relative z-10 group-hover:text-primary transition-colors">
                  {report.topic}
                </h2>

                {report.summary && (
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-4 relative z-10">{report.summary}</p>
                )}

                <div className="mt-auto pt-4 border-t border-border flex items-center justify-between text-sm font-mono text-muted-foreground group-hover:text-primary transition-colors relative z-10">
                  <span>VIEW_REPORT</span>
                  <ArrowRight className="w-4 h-4 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="py-20 text-center border border-dashed border-border rounded-sm bg-card/50 flex flex-col items-center justify-center">
          <Database className="w-12 h-12 text-muted-foreground opacity-30 mb-4" />
          <h3 className="text-lg font-mono font-medium text-foreground mb-2">NO REPORTS GENERATED</h3>
          <p className="text-muted-foreground mb-6">Complete a research session to generate a structured report.</p>
          <Link
            href="/research/new"
            className="bg-primary text-primary-foreground px-4 py-2 rounded-sm font-medium hover:bg-primary/90 transition-colors font-mono text-sm"
          >
            INITIALIZE SESSION
          </Link>
        </div>
      )}
    </div>
  );
}
