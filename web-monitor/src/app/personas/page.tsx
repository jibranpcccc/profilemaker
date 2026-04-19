"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2, Cpu, User, RefreshCw, Key, Link as LinkIcon, Edit, Fingerprint, Sparkles, Play, Circle, CheckCircle2, Server, X } from "lucide-react";
import { useRouter } from "next/navigation";

type Persona = {
  Id: number;
  Name: string;
  FirstName: string;
  LastName: string;
  Username: string;
  Bio: string;
  WebsiteUrl: string;
  Email: string;
  Password: string;
  CreatedAt: string;
};

export default function PersonasPage() {
  const router = useRouter();
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [sites, setSites] = useState<any[]>([]);

  // Quick Campaign Launch Modal
  const [activePersonaForCampaign, setActivePersonaForCampaign] = useState<Persona | null>(null);
  const [campaignName, setCampaignName] = useState("");
  const [selectedSites, setSelectedSites] = useState<Set<number>>(new Set());
  const [isDeploying, setIsDeploying] = useState(false);

  // Auto-generate form state
  const [niche, setNiche] = useState("Technology & Software");
  const [website, setWebsite] = useState("https://example.com");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [res, sitesRes] = await Promise.all([
        fetch("/api/personas"),
        fetch("/api/sites")
      ]);
      const data = await res.json();
      const sData = await sitesRes.json();
      if (data.personas) setPersonas(data.personas);
      if (sData.data) {
        setSites(sData.data);
        // auto-select all by default for quick launch
        const allIds = new Set(sData.data.slice(0, 50).map((s: any) => s.Id));
        setSelectedSites(allIds as Set<number>);
      }
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const res = await fetch("/api/personas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "generate",
          niche,
          websiteUrl: website,
        }),
      });

      const data = await res.json();
      if (data.generated) {
        // Save it immediately
        await handleSave(data.generated);
      } else {
        alert(data.error || "Failed to generate");
      }
    } catch (e) {
      console.error(e);
    }
    setGenerating(false);
  };

  const handleSave = async (persona: any) => {
    setSaving(true);
    try {
      await fetch("/api/personas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "save", persona }),
      });
      await fetchData();
    } catch (e) {
      console.error(e);
    }
    setSaving(false);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this Persona?")) return;
    try {
      await fetch("/api/personas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "delete", id }),
      });
      await fetchData();
    } catch (e) {
      console.error(e);
    }
  };

  const handleLaunchCampaign = async () => {
    if (!campaignName || !activePersonaForCampaign || selectedSites.size === 0) return;
    setIsDeploying(true);
    try {
      // 1. Create the campaign with this persona
      const cRes = await fetch("/api/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create",
          name: campaignName,
          personaId: activePersonaForCampaign.Id,
          targetSites: Array.from(selectedSites),
        }),
      });
      const cData = await cRes.json();
      if (cData.success && cData.campaignId) {
        // 2. Start the engine
        await fetch('/api/run', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'start', campaignId: cData.campaignId }),
        });
        // 3. Navigate back to dashboard
        router.push('/dashboard');
      } else {
        alert(cData.error || "Failed to initialize campaign");
        setIsDeploying(false);
      }
    } catch (e) {
      console.error(e);
      alert("Error deploying campaign");
      setIsDeploying(false);
    }
  };

  const toggleSite = (id: number) => {
    const next = new Set(selectedSites);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedSites(next);
  };

  return (
    <div className="p-4 md:p-8 space-y-8 max-w-[1600px] mx-auto pb-32 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative z-10 bg-black/20 p-6 rounded-3xl border border-white/5 shadow-2xl backdrop-blur-xl">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-fuchsia-600/30 to-purple-600/10 flex items-center justify-center border border-fuchsia-500/30 shadow-[0_0_15px_rgba(192,38,211,0.2)]">
            <Fingerprint className="w-6 h-6 text-fuchsia-400" />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-white to-fuchsia-300 drop-shadow-sm">
              Identity Matrix
            </h1>
            <p className="text-neutral-400 text-sm font-semibold tracking-wide uppercase mt-1">Generate and manage synthetic personas for targeted runs.</p>
          </div>
        </div>
      </div>

      {/* Generator Card */}
      <div className="glass-panel border-white/10 rounded-3xl p-8 shadow-2xl relative overflow-hidden group">
        <div className="absolute inset-0 bg-gradient-to-br from-fuchsia-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-1000 z-0" />
        <div className="absolute top-0 right-0 p-8 opacity-10 blur-xl pointer-events-none z-0"><Cpu className="w-48 h-48 text-fuchsia-500"/></div>
        
        <h2 className="text-2xl font-extrabold flex items-center gap-3 mb-6 relative z-10 text-white tracking-tight">
          <span className="w-10 h-10 rounded-full bg-fuchsia-500/20 text-fuchsia-400 flex items-center justify-center border border-fuchsia-500/30 shadow-[0_0_15px_rgba(192,38,211,0.2)]"><Cpu className="w-5 h-5" /></span> 
          AI Persona Generation Engine
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6 relative z-10 items-end">
          <div className="glass-card p-4 rounded-2xl border-white/5 bg-black/40">
            <label className="block text-[11px] font-extrabold tracking-widest uppercase text-neutral-400 mb-2">Target Niche / Industry</label>
            <input
              type="text"
              value={niche}
              onChange={(e) => setNiche(e.target.value)}
              className="w-full bg-transparent border-b border-white/10 px-2 py-2 text-white outline-none focus:border-fuchsia-500 transition-colors font-medium"
              placeholder="e.g. SEO Agency, Real Estate"
            />
          </div>
          <div className="glass-card p-4 rounded-2xl border-white/5 bg-black/40">
            <label className="block text-[11px] font-extrabold tracking-widest uppercase text-neutral-400 mb-2">Target Backlink (Website)</label>
            <input
              type="text"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              className="w-full bg-transparent border-b border-white/10 px-2 py-2 text-white outline-none focus:border-fuchsia-500 transition-colors font-medium"
              placeholder="https://"
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={handleGenerate}
              disabled={generating}
              className="w-full bg-gradient-to-r from-fuchsia-600 to-purple-600 hover:from-fuchsia-500 hover:to-purple-500 text-white rounded-xl px-4 py-3 font-extrabold transition-all flex items-center justify-center gap-2 disabled:opacity-50 shadow-[0_0_20px_rgba(192,38,211,0.3)] hover:shadow-[0_0_25px_rgba(192,38,211,0.5)] border border-fuchsia-500/50"
            >
              {generating ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
              {generating ? "Synthesizing Identity..." : "Generate Identity"}
            </button>
          </div>
        </div>
      </div>

      {/* Persona Grid (ID Badge Style) */}
      {loading ? (
        <div className="flex flex-col items-center justify-center h-48 bg-black/20 rounded-3xl border border-white/5">
          <RefreshCw className="w-10 h-10 animate-spin text-fuchsia-500 opacity-50 mb-4" />
          <span className="text-sm font-semibold tracking-wider uppercase text-neutral-500">Decrypting Identities...</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 relative z-10">
          {personas.map((p) => (
            <div key={p.Id} className="glass-card bg-black/40 border border-white/10 rounded-3xl overflow-hidden hover:border-fuchsia-500/30 transition-all duration-500 flex flex-col shadow-2xl relative group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-fuchsia-500/10 blur-3xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"></div>
              
              <div className="p-6 border-b border-white/5 flex justify-between items-start relative z-10">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-fuchsia-500/20 to-purple-500/20 flex items-center justify-center border border-fuchsia-500/30 shadow-[0_0_15px_rgba(192,38,211,0.15)] group-hover:shadow-[0_0_20px_rgba(192,38,211,0.3)] transition-shadow">
                    <User className="w-6 h-6 text-fuchsia-400" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-white text-lg drop-shadow-sm">{p.Name || `${p.FirstName} ${p.LastName}`}</h3>
                    <div className="text-xs text-fuchsia-300 font-mono mt-0.5 tracking-wide">ID: @{p.Username}</div>
                  </div>
                </div>
                <button
                  onClick={() => handleDelete(p.Id)}
                  className="text-neutral-500 hover:text-rose-400 hover:bg-rose-500/10 p-2.5 rounded-xl transition-all border border-transparent hover:border-rose-500/30"
                  title="Purge Identity"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <div className="p-6 space-y-5 flex-1 relative z-10 flex flex-col bg-black/20">
                <div className="flex-1">
                  <div className="text-[10px] text-fuchsia-400/80 uppercase font-extrabold mb-2 tracking-widest">Synthetic Bio</div>
                  <p className="text-sm text-neutral-300 leading-relaxed font-medium italic border-l-2 border-fuchsia-500/30 pl-3 py-1">"{p.Bio}"</p>
                </div>
                
                <div className="space-y-3 pt-4 border-t border-white/5">
                  <div className="bg-white/5 p-3 rounded-xl border border-white/5 hover:border-white/10 transition-colors cursor-default">
                     <div className="text-[10px] font-extrabold tracking-widest text-neutral-500 uppercase mb-1">Target Payload</div>
                     <div className="flex items-center gap-2 text-sm text-white font-mono font-bold w-full overflow-hidden">
                       <LinkIcon className="w-4 h-4 text-fuchsia-500 shrink-0" />
                       <span className="truncate">{p.WebsiteUrl}</span>
                     </div>
                  </div>
                  
                  <button
                    onClick={() => {
                      setActivePersonaForCampaign(p);
                      setCampaignName(`Direct Backlinks - ${p.Name}`);
                    }}
                    className="w-full bg-gradient-to-r from-fuchsia-600/20 to-purple-600/20 hover:from-fuchsia-500 hover:to-purple-500 text-fuchsia-300 hover:text-white rounded-xl px-4 py-3 font-extrabold transition-all flex items-center justify-center gap-2 shadow-sm border border-fuchsia-500/30 hover:border-transparent mt-4"
                  >
                    <Play className="w-5 h-5" /> Execute Backlink Campaign
                  </button>
                </div>
              </div>
            </div>
          ))}

          {personas.length === 0 && (
            <div className="col-span-full py-20 text-center border border-dashed border-white/10 bg-black/20 rounded-3xl text-neutral-500 flex flex-col items-center">
              <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4"><Fingerprint className="w-8 h-8 opacity-50"/></div>
              <p className="font-bold tracking-wide">Database is empty.</p>
              <p className="text-sm mt-1">Utilize the AI Engine to synthesize authorization profiles.</p>
            </div>
          )}
        </div>
      )}

      {activePersonaForCampaign && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
          <div className="glass-panel border-white/10 rounded-3xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="p-8 border-b border-white/5 flex justify-between items-center bg-black/40 relative">
              <div className="absolute top-0 right-0 p-8 opacity-10 blur-xl pointer-events-none"><Server className="w-32 h-32 text-fuchsia-500"/></div>
              <h2 className="text-2xl font-extrabold text-white tracking-tight relative z-10">Direct Campaign Launch</h2>
              <button 
                onClick={() => setActivePersonaForCampaign(null)} 
                className="text-neutral-500 hover:text-rose-400 transition-colors bg-white/5 hover:bg-rose-500/10 p-2 rounded-full relative z-10"
              >
                <X className="w-6 h-6"/>
              </button>
            </div>
            
            <div className="p-8 flex-1 overflow-y-auto bg-black/20 space-y-6">
              <div className="p-4 glass-card rounded-2xl border border-fuchsia-500/30 bg-fuchsia-500/10 flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-fuchsia-500/20 flex items-center justify-center border border-fuchsia-500/50">
                  <User className="w-6 h-6 text-fuchsia-300" />
                </div>
                <div>
                  <div className="text-xs text-fuchsia-300 font-bold uppercase tracking-widest">Active Identity</div>
                  <div className="text-lg font-extrabold text-white">{activePersonaForCampaign.Name}</div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold tracking-wide uppercase text-neutral-400 mb-2">Campaign Designation</label>
                <input
                  type="text"
                  value={campaignName}
                  onChange={(e) => setCampaignName(e.target.value)}
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3.5 text-white outline-none focus:border-fuchsia-500/50 focus:ring-1 focus:ring-fuchsia-500/50 transition-all font-medium"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold tracking-wide uppercase text-neutral-400 mb-2">
                  Target Nodes <span className="text-fuchsia-400 text-xs ml-2">({selectedSites.size} queued)</span>
                </label>
                <div className="bg-black/50 border border-white/10 rounded-2xl overflow-hidden glass-panel">
                  <div className="max-h-48 overflow-y-auto p-2 scrollbar-thin scrollbar-thumb-fuchsia-500/20 scrollbar-track-transparent">
                    {sites.slice(0, 50).map(s => (
                      <div key={s.Id} onClick={() => toggleSite(s.Id)} className={`flex items-center gap-4 p-3 rounded-xl cursor-pointer transition-all ${selectedSites.has(s.Id) ? 'bg-fuchsia-500/10' : 'hover:bg-white/5'}`}>
                        {selectedSites.has(s.Id) ? <CheckCircle2 className="w-5 h-5 text-fuchsia-400" /> : <Circle className="w-5 h-5 text-neutral-600" />}
                        <span className="text-sm font-bold text-neutral-200">{s.SiteName}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-white/5 flex justify-end bg-black/60 relative z-10 gap-4">
              <button 
                onClick={() => setActivePersonaForCampaign(null)}
                className="px-6 py-3 rounded-xl text-neutral-400 font-bold hover:text-white transition-colors"
                disabled={isDeploying}
              >
                Cancel
              </button>
              <button 
                onClick={handleLaunchCampaign}
                disabled={selectedSites.size === 0 || !campaignName || isDeploying}
                className="px-8 py-3 bg-gradient-to-r from-fuchsia-600 to-purple-600 hover:from-fuchsia-500 hover:to-purple-500 text-white font-extrabold rounded-xl transition-all shadow-[0_0_20px_rgba(192,38,211,0.4)] disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isDeploying ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Server className="w-5 h-5" />}
                {isDeploying ? "Deploying Nodes..." : "Launch Campaign Tracker"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
