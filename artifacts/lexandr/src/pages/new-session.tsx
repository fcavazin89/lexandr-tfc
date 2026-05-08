import { useState } from "react";
import { useLocation } from "wouter";
import { Terminal, Database } from "lucide-react";
import { useCreateResearchSession } from "@workspace/api-client-react";

export default function NewSession() {
  const [, setLocation] = useLocation();
  const createSession = useCreateResearchSession();

  const [topic, setTopic] = useState("");
  const [domain, setDomain] = useState("Web3");
  const [description, setDescription] = useState("");

  const domains = [
    "Web3", "DeFi", "DAO Governance", "Tokenomics", "Creator Economy", 
    "AI/ML", "DeFi Protocol", "Business Strategy", "Market Analysis", 
    "Technical Architecture", "Other"
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic) return;

    createSession.mutate(
      { data: { topic, domain, description } },
      {
        onSuccess: (session) => {
          setLocation(`/research/${session.id}`);
        },
      }
    );
  };

  return (
    <div className="max-w-3xl mx-auto py-8 animate-in fade-in duration-500">
      <div className="mb-8">
        <h1 className="text-3xl font-bold font-mono tracking-tight text-foreground">INITIALIZE SESSION</h1>
        <p className="text-muted-foreground mt-2">Define parameters for the autonomous research protocol.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8 bg-card border border-border p-8 rounded-sm">
        <div className="space-y-2">
          <label className="text-sm font-mono text-muted-foreground uppercase">Research Topic</label>
          <input 
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="e.g. Zero-Knowledge Proofs in DAO Governance"
            className="w-full bg-background border border-border rounded-sm px-4 py-3 text-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all font-mono"
            required
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-mono text-muted-foreground uppercase">Primary Domain</label>
          <div className="relative">
            <select
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              className="w-full bg-background border border-border rounded-sm px-4 py-3 text-foreground appearance-none focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all font-mono"
            >
              {domains.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
            <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none">
              <Database className="w-4 h-4 text-muted-foreground" />
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-mono text-muted-foreground uppercase">Context & Parameters (Optional)</label>
          <textarea 
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Provide specific constraints, focus areas, or initial hypotheses..."
            className="w-full bg-background border border-border rounded-sm px-4 py-3 text-foreground min-h-[120px] focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all font-mono resize-y"
          />
        </div>

        <div className="pt-4 flex items-center justify-end">
          <button 
            type="submit"
            disabled={createSession.isPending || !topic}
            className="flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-sm font-medium hover:bg-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {createSession.isPending ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                INITIALIZING...
              </span>
            ) : (
              <>
                <Terminal className="w-4 h-4" />
                COMMENCE RESEARCH
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
