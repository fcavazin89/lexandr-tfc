import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import {
  ArrowLeft, Clock, AlertTriangle, Lightbulb, Target,
  BookOpen, BarChart3, Fingerprint, FileText,
} from "lucide-react";
import { format } from "date-fns";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { getGetResearchReportQueryOptions } from "@workspace/api-client-react";

export default function ReportDetail() {
  const { id } = useParams();
  const reportId = parseInt(id || "0", 10);

  const { data: report, isLoading, error } = useQuery({
    ...getGetResearchReportQueryOptions(reportId),
    enabled: !!reportId,
  });

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto py-20 flex flex-col items-center justify-center">
        <div className="w-12 h-12 rounded border border-primary/50 bg-primary/10 flex items-center justify-center mb-6 animate-pulse">
          <Fingerprint className="w-6 h-6 text-primary" />
        </div>
        <h2 className="text-xl font-mono text-foreground uppercase tracking-widest">DECRYPTING INTEL...</h2>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="max-w-4xl mx-auto py-20 text-center border border-dashed border-destructive/50 rounded-sm bg-destructive/5">
        <h2 className="text-xl font-mono text-destructive uppercase tracking-widest mb-2">ACCESS_DENIED</h2>
        <p className="text-muted-foreground">Report could not be retrieved or does not exist.</p>
        <Link href="/reports" className="text-primary mt-4 inline-block hover:underline font-mono text-sm">
          RETURN_TO_ARCHIVE
        </Link>
      </div>
    );
  }

  const sections = [
    { title: "EXECUTIVE SUMMARY", content: report.summary, icon: Target },
    { title: "SCIENTIFIC BASIS", content: report.scientificBasis, icon: BookOpen },
    { title: "MARKET ANALYSIS", content: report.marketAnalysis, icon: BarChart3 },
    { title: "STRATEGIC INSIGHTS", content: report.strategicInsights, icon: Lightbulb },
    { title: "TECHNICAL RECOMMENDATIONS", content: report.technicalRecommendations, icon: Target },
    { title: "RISK ANALYSIS", content: report.riskAnalysis, icon: AlertTriangle },
    { title: "FRAMEWORKS", content: report.frameworks, icon: BookOpen },
    { title: "SOURCES", content: report.sources, icon: FileText },
  ].filter((s) => !!s.content);

  return (
    <div className="max-w-5xl mx-auto pb-12 animate-in fade-in duration-500">
      <Link
        href="/reports"
        className="inline-flex items-center gap-2 text-sm font-mono text-muted-foreground hover:text-primary transition-colors mb-6 group"
      >
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
        BACK_TO_ARCHIVE
      </Link>

      <div className="bg-card border border-border rounded-sm overflow-hidden mb-8">
        <div className="border-b border-border p-8 bg-secondary/30 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-5">
            <Fingerprint className="w-32 h-32" />
          </div>

          <div className="flex flex-wrap items-center gap-3 mb-6 relative z-10">
            <span className="bg-primary/20 text-primary border border-primary/30 px-3 py-1 rounded-sm text-xs font-mono tracking-widest">
              REPORT #{report.id}
            </span>
            <span className="bg-card text-foreground border border-border px-3 py-1 rounded-sm text-xs font-mono tracking-widest uppercase">
              {report.domain}
            </span>
            <span className="text-xs text-muted-foreground font-mono flex items-center gap-1.5 ml-auto">
              <Clock className="w-3.5 h-3.5" />
              {format(new Date(report.createdAt), "MMMM dd, yyyy HH:mm")}
            </span>
          </div>

          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4 leading-tight relative z-10">
            {report.topic}
          </h1>
        </div>

        <div className="p-8 space-y-12">
          {sections.map((section, idx) => (
            <div key={idx} className="space-y-4">
              <h2 className="flex items-center gap-3 text-lg font-mono font-bold tracking-widest text-primary border-b border-border/50 pb-2 uppercase">
                <section.icon className="w-5 h-5 opacity-70" />
                {section.title}
              </h2>
              <div className="prose prose-invert max-w-none prose-p:text-muted-foreground prose-headings:text-foreground prose-a:text-primary font-sans">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{section.content!}</ReactMarkdown>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
