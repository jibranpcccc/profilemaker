"use client";

import { useEffect, useState } from "react";
import { Plus, Play, Trash2, Server, Globe, User, CheckCircle2, Circle, Download, X, RefreshCw } from "lucide-react";
import Link from 'next/link';
import { useRouter } from "next/navigation";

export default function CampaignsPage() {
  const router = useRouter();
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [personas, setPersonas] = useState<any[]>([]);
  const [sites, setSites] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Wizard state
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [step, setStep] = useState(1);
  const [campaignName, setCampaignName] = useState("");
  const [targetUrl, setTargetUrl] = useState("");
  const [targetKeywords, setTargetKeywords] = useState("");
  const [selectedSites, setSelectedSites] = useState<Set<number>>(new Set());
  const [isInitializing, setIsInitializing] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [campRes, persRes, sitesRes] = await Promise.all([
        fetch("/api/campaigns").then((res) => res.json()),
        fetch("/api/personas").then((res) => res.json()),
        fetch("/api/sites").then((res) => res.json()),
      ]);
      setCampaigns(campRes.campaigns || []);
      setPersonas(persRes.personas || []);
      setSites(sitesRes.data || []);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const toggleSite = (id: number) => {
    const next = new Set(selectedSites);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedSites(next);
  };

  const handleCreateCampaign = async () => {
    if (!campaignName || !targetUrl || !targetKeywords || selectedSites.size === 0) return;
    setIsInitializing(true);
    try {
      const res = await fetch("/api/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create_with_auto_persona",
          name: campaignName,
          targetUrl,
          keywords: targetKeywords,
          targetSites: Array.from(selectedSites),
        }),
      });
      const data = await res.json();
      if (data.success) {
        setIsWizardOpen(false);
        setStep(1);
        setCampaignName("");
        setTargetUrl("");
        setTargetKeywords("");
        setSelectedSites(new Set());
        fetchData();
        // Option to auto-start? 
      } else {
        alert(data.error || "Failed to initialize campaign.");
      }
    } catch (e) {
      console.error(e);
      alert("Error initializing campaign.");
    }
    setIsInitializing(false);
  };

  const startEngine = async (campaignId: number) => {
    try {
      await fetch('/api/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'start', campaignId }),
      });
      router.push('/dashboard');
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="p-4 md:p-8 space-y-8 max-w-[1600px] mx-auto pb-32 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative z-10 bg-black/20 p-6 rounded-3xl border border-white/5 shadow-2xl backdrop-blur-xl">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-600/30 to-indigo-600/10 flex items-center justify-center border border-violet-500/30 shadow-[0_0_15px_rgba(139,92,246,0.2)]">
            <Server className="w-6 h-6 text-violet-400" />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-white to-violet-300 drop-shadow-sm">
              Execution Campaigns
            </h1>
            <p className="text-neutral-400 text-sm font-semibold tracking-wide uppercase mt-1">Group targets and personas to orchestrate SEO runs</p>
          </div>
        </div>
        <button
          onClick={() => setIsWizardOpen(true)}
          className="bg-gradient-to-br from-violet-600 to-indigo-700 hover:from-violet-500 hover:to-indigo-600 text-white rounded-xl px-5 py-2.5 font-bold tracking-wide text-sm transition-all focus:ring-2 focus:ring-violet-500 focus:outline-none flex items-center gap-2 shadow-[0_0_20px_rgba(139,92,246,0.4)] relative group overflow-hidden border border-violet-500/50"
        >
          <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
          <Plus className="w-5 h-5 relative z-10" /> <span className="relative z-10">Deploy Strategy</span>
        </button>
      </div>

      {isWizardOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
          <div className="glass-panel border-white/10 rounded-3xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="p-8 border-b border-white/5 flex justify-between items-center bg-black/40 relative">
              <div className="absolute top-0 right-0 p-8 opacity-10 blur-xl pointer-events-none"><Server className="w-32 h-32 text-violet-500"/></div>
              <h2 className="text-3xl font-extrabold text-white tracking-tight relative z-10">Strategy Builder <span className="text-violet-400 font-light">| Step {step} of 3</span></h2>
              <button onClick={() => setIsWizardOpen(false)} className="text-neutral-500 hover:text-rose-400 transition-colors bg-white/5 hover:bg-rose-500/10 p-2 rounded-full relative z-10"><X className="w-6 h-6"/></button>
            </div>
            
            <div className="p-8 flex-1 overflow-y-auto bg-black/20">
              {step === 1 && (
                <div className="space-y-6 animate-in slide-in-from-right-4 duration-500">
                  <h3 className="text-xl font-bold text-white flex items-center gap-3"><span className="w-8 h-8 rounded-full bg-violet-600/20 text-violet-400 flex items-center justify-center border border-violet-500/30">1</span> Campaign Parameters</h3>
                  <div className="p-6 glass-card rounded-2xl border border-white/5">
                    <label className="block text-sm font-semibold tracking-wide uppercase text-neutral-400 mb-3">Internal Designation</label>
                    <input
                      type="text"
                      value={campaignName}
                      onChange={(e) => setCampaignName(e.target.value)}
                      className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3.5 text-white outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/50 transition-all font-medium text-lg"
                      placeholder="e.g. Project Phoenix - Core Tier"
                    />
                  </div>
                </div>
              )}
              {step === 2 && (
                <div className="space-y-6 animate-in slide-in-from-right-4 duration-500">
                  <h3 className="text-xl font-bold text-white flex items-center justify-between">
                    <span className="flex items-center gap-3"><span className="w-8 h-8 rounded-full bg-violet-600/20 text-violet-400 flex items-center justify-center border border-violet-500/30">2</span> Target Payloads & Niche Strategy</span>
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="p-6 glass-card rounded-2xl border border-white/5 bg-black/40">
                      <label className="block text-[11px] font-extrabold tracking-widest uppercase text-neutral-400 mb-2">Backlink Destination (URL)</label>
                      <input
                        type="url"
                        value={targetUrl}
                        onChange={(e) => setTargetUrl(e.target.value)}
                        className="w-full bg-transparent border-b border-white/10 px-2 py-3 text-white outline-none focus:border-violet-500 transition-colors font-medium text-lg placeholder:text-white/20"
                        placeholder="https://yourwebsite.com"
                      />
                    </div>
                    <div className="p-6 glass-card rounded-2xl border border-white/5 bg-black/40">
                      <label className="block text-[11px] font-extrabold tracking-widest uppercase text-neutral-400 mb-2">Keywords / Target Niche</label>
                      <input
                        type="text"
                        value={targetKeywords}
                        onChange={(e) => setTargetKeywords(e.target.value)}
                        className="w-full bg-transparent border-b border-white/10 px-2 py-3 text-white outline-none focus:border-violet-500 transition-colors font-medium text-lg placeholder:text-white/20"
                        placeholder="e.g. SEO Services, Real Estate"
                      />
                    </div>
                    <div className="col-span-1 md:col-span-2 mt-2 p-6 rounded-2xl bg-violet-500/10 border border-violet-500/20">
                      <p className="text-sm font-medium text-violet-300">
                        A unique synthetic identity will be automatically generated by the AI Engine specific to this campaign's target payload.
                      </p>
                    </div>
                  </div>
                </div>
              )}
              {step === 3 && (
                <div className="space-y-6 animate-in slide-in-from-right-4 duration-500">
                  <h3 className="text-xl font-bold text-white flex items-center justify-between">
                    <span className="flex items-center gap-3"><span className="w-8 h-8 rounded-full bg-violet-600/20 text-violet-400 flex items-center justify-center border border-violet-500/30">3</span> Target Selection</span>
                    <span className="text-xs font-bold tracking-wider text-violet-300 bg-violet-500/10 px-3 py-1.5 rounded-lg border border-violet-500/20">{selectedSites.size} queued</span>
                  </h3>
                  <div className="bg-black/50 border border-white/10 rounded-2xl overflow-hidden glass-panel relative z-10">
                    <div className="max-h-64 overflow-y-auto p-2 scrollbar-thin scrollbar-thumb-violet-500/20 scrollbar-track-transparent">
                      {sites.slice(0, 50).map(s => (
                        <div key={s.Id} onClick={() => toggleSite(s.Id)} className={`flex items-center gap-4 p-3 rounded-xl cursor-pointer transition-all ${selectedSites.has(s.Id) ? 'bg-violet-500/10' : 'hover:bg-white/5'}`}>
                          {selectedSites.has(s.Id) ? <CheckCircle2 className="w-5 h-5 text-violet-400" /> : <Circle className="w-5 h-5 text-neutral-600" />}
                          <span className="text-sm font-bold text-neutral-200">{s.SiteName}</span>
                        </div>
                      ))}
                      <div className="text-xs font-semibold text-neutral-500 text-center py-4 uppercase tracking-widest">Displaying Top 50 Nodes</div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="p-6 border-t border-white/5 flex justify-between bg-black/60 relative z-10">
              <button 
                onClick={() => setStep(step - 1)} 
                disabled={step === 1}
                className="px-6 py-3 rounded-xl text-neutral-400 font-bold hover:text-white disabled:opacity-30 disabled:hover:text-neutral-400 transition-colors"
              >
                Back
              </button>
              {step < 3 ? (
                <button 
                  onClick={() => setStep(step + 1)}
                  disabled={(step === 1 && !campaignName) || (step === 2 && (!targetUrl || !targetKeywords))}
                  className="px-8 py-3 bg-white hover:bg-neutral-200 focus:ring-2 focus:ring-white/50 text-black font-extrabold rounded-xl disabled:opacity-50 transition-all shadow-[0_0_15px_rgba(255,255,255,0.4)]"
                >
                  Proceed
                </button>
              ) : (
                <button 
                  onClick={handleCreateCampaign}
                  disabled={selectedSites.size === 0 || isInitializing}
                  className="px-8 py-3 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-extrabold rounded-xl transition-all shadow-[0_0_20px_rgba(139,92,246,0.4)] disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isInitializing ? <RefreshCw className="w-5 h-5 animate-spin" /> : null}
                  {isInitializing ? "Synthesizing AI Engine..." : "Initialize Campaign"}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Campaigns List (Trading Card Style) */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 relative z-10">
        {loading ? (
          <div className="p-16 text-center text-neutral-500 col-span-full glass-card rounded-3xl border-white/5 flex flex-col items-center">
            <Server className="w-10 h-10 animate-pulse mb-4 text-violet-500 opacity-50" />
            <span className="font-semibold tracking-wider text-sm uppercase">Loading strategies...</span>
          </div>
        ) : campaigns.length === 0 ? (
          <div className="p-16 text-center text-neutral-500 border border-dashed border-white/10 bg-black/20 rounded-3xl col-span-full font-semibold tracking-wide flex flex-col items-center justify-center">
            <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4"><Plus className="w-8 h-8 text-neutral-600"/></div>
            No campaigns found. Deploy a new strategy to begin.
          </div>
        ) : (
          campaigns.map(c => (
            <div key={c.Id} className="glass-card bg-black/40 border border-white/10 p-6 md:p-8 rounded-3xl flex flex-col justify-between gap-6 shadow-xl relative overflow-hidden group hover:border-violet-500/30 transition-all duration-500">
              <div className="absolute top-0 right-0 w-32 h-32 bg-violet-500/10 blur-3xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"></div>
              <div>
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-2xl font-extrabold font-sans text-white drop-shadow-sm">{c.Name}</h3>
                  <span className={`px-3 py-1 rounded-lg text-[10px] font-extrabold tracking-widest uppercase border ${c.Status === 'Running' ? 'bg-violet-500/10 text-violet-400 border-violet-500/30 shadow-[0_0_10px_rgba(139,92,246,0.15)] animate-pulse' : 'bg-white/5 text-neutral-400 border-white/10'}`}>
                    {c.Status}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-4 text-sm font-semibold text-neutral-400">
                  <span className="flex items-center gap-1.5"><User className="w-4 h-4 text-neutral-500" /> {c.PersonaName || 'Orphaned Identity'}</span>
                  <span className="w-1 h-1 rounded-full bg-neutral-700"></span>
                  <span className="flex items-center gap-1.5"><Globe className="w-4 h-4 text-neutral-500" /> Target Nodes Queued</span>
                </div>
              </div>
              
              <div className="flex flex-wrap items-center gap-3 pt-6 border-t border-white/5">
                <a
                  href={`/api/campaigns/${c.Id}/export`}
                  download
                  className="p-3 rounded-xl bg-violet-600/10 text-violet-400 border border-violet-500/20 hover:bg-violet-600/20 hover:text-violet-300 transition-all flex items-center justify-center shadow-[0_0_10px_rgba(139,92,246,0.1)] group/dl"
                  title="Export Database CSV"
                >
                  <Download className="w-5 h-5 group-hover/dl:-translate-y-0.5 transition-transform" />
                </a>
                <button
                  onClick={async () => {
                    if(confirm('Delete campaign?')) {
                      await fetch('/api/campaigns', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ action: 'delete', id: c.Id }) });
                      fetchData();
                    }
                  }}
                  className="p-3 rounded-xl bg-white/5 text-neutral-400 hover:text-rose-400 hover:bg-rose-500/10 border border-white/5 hover:border-rose-500/30 transition-all flex items-center justify-center"
                  title="Purge Strategy"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
                <div className="flex-1 min-w-[200px]">
                  <button
                    onClick={() => startEngine(c.Id)}
                    className="w-full flex items-center justify-center gap-2 bg-white hover:bg-neutral-200 text-black font-extrabold px-6 py-3 rounded-xl transition-all shadow-[0_0_15px_rgba(255,255,255,0.2)] focus:ring-4 focus:ring-white/20"
                  >
                    <Play className="w-5 h-5 fill-black" /> Execute Command
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
