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
        <div className="w-12 h-12 rounded-sm border border-primary/50 bg-primary/10 flex items-center justify-center mb-6 animate-pulse shadow-[0_0_12px_rgba(208,188,255,0.2)]">
          <Fingerprint className="w-6 h-6 text-primary" />
        </div>
        <h2 className="text-xl font-display text-foreground uppercase tracking-[0.15em]">DECRYPTING INTEL...</h2>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="max-w-4xl mx-auto py-20 text-center border border-dashed border-destructive/50 rounded-sm bg-destructive/5">
        <h2 className="text-xl font-display text-destructive uppercase tracking-[0.15em] mb-2">ACCESS_DENIED</h2>
        <p className="text-muted-foreground font-sans">Report could not be retrieved or does not exist.</p>
        <Link href="/reports" className="text-primary mt-4 inline-block hover:underline font-display text-xs tracking-wider">
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
        className="inline-flex items-center gap-2 text-xs font-display tracking-wider text-muted-foreground hover:text-primary transition-colors mb-6 group"
      >
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
        BACK_TO_ARCHIVE
      </Link>

      <div className="glass-card rounded-sm overflow-hidden mb-8">
        <div className="border-b border-border/50 p-8 bg-gradient-to-b from-primary/5 to-transparent relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-5">
            <Fingerprint className="w-32 h-32 text-primary" />
          </div>

          <div className="flex flex-wrap items-center gap-3 mb-6 relative z-10">
            <span className="bg-primary/15 text-primary micro-border px-3 py-1 rounded-sm text-[10px] font-display tracking-[0.15em]">
              REPORT #{report.id}
            </span>
            <span className="glass-card text-foreground micro-border px-3 py-1 rounded-sm text-[10px] font-display tracking-[0.15em] uppercase">
              {report.domain}
            </span>
            <span className="text-[10px] text-muted-foreground font-display tracking-wider flex items-center gap-1.5 ml-auto">
              <Clock className="w-3.5 h-3.5" />
              {format(new Date(report.createdAt), "MMMM dd, yyyy HH:mm")}
            </span>
          </div>

          <h1 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-4 leading-tight relative z-10 tracking-[0.02em]">
            {report.topic}
          </h1>
        </div>

        <div className="p-8 space-y-12">
          {sections.map((section, idx) => (
            <div key={idx} className="space-y-4">
              <h2 className="flex items-center gap-3 text-sm font-display font-bold tracking-[0.1em] text-primary border-b border-border/30 pb-2 uppercase">
                <section.icon className="w-4 h-4 opacity-70" />
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
