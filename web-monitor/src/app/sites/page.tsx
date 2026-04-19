"use client";
import React, { useState, useEffect, useCallback } from "react";
import { Globe, Search, RefreshCw, CheckCircle, XCircle, Clock, Activity, Filter, Server } from "lucide-react";

export default function SitesPage() {
  const [sites, setSites] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [uploadText, setUploadText] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  const fetchSites = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ search, status: statusFilter, page: String(page) });
    const res = await fetch(`/api/sites?${params}`);
    const data = await res.json();
    setSites(data.sites || []);
    setTotal(data.total || 0);
    setLoading(false);
  }, [search, statusFilter, page]);

  useEffect(() => { fetchSites(); }, [fetchSites]);

  const resetSite = async (taskId: number) => {
    await fetch('/api/sites', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ taskId }) });
    fetchSites();
  };

  const handleUpload = async () => {
    const urls = uploadText.split('\n').map(u => u.trim()).filter(u => u);
    if (!urls.length) return;
    setIsUploading(true);
    try {
      const res = await fetch('/api/sites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ urls })
      });
      const data = await res.json();
      alert(`Import complete!\nAdded: ${data.added}\nDuplicates Skipped: ${data.duplicates}`);
      setUploadText('');
      setIsUploadOpen(false);
      fetchSites();
    } catch (e) {
      alert('Error uploading URLs');
    }
    setIsUploading(false);
  };

  return (
    <div className="min-h-screen p-4 md:p-8 space-y-8 max-w-7xl mx-auto pb-32 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative z-10 bg-black/20 p-6 rounded-3xl border border-white/5 shadow-2xl backdrop-blur-xl">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-600/30 to-indigo-600/10 flex items-center justify-center border border-violet-500/30 shadow-[0_0_15px_rgba(139,92,246,0.2)]">
            <Globe className="w-6 h-6 text-violet-400" />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-white to-violet-300 drop-shadow-sm">Target Domains</h1>
            <p className="text-neutral-400 text-sm font-semibold tracking-wide uppercase mt-1">Database Scope: <span className="text-white drop-shadow-md">{total.toLocaleString()}</span> entries</p>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-violet-400 group-focus-within:text-white transition-colors z-10" />
            <input
              type="text" placeholder="Search domains..." value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              className="bg-black/40 border border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white outline-none focus:border-violet-500/50 focus:bg-black/60 focus:ring-2 focus:ring-violet-500/20 w-full md:w-64 transition-all"
            />
          </div>
          <select
            value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
            className="bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:border-violet-500/50 hover:border-violet-500/30 transition-all appearance-none pr-8 cursor-pointer relative"
          >
            <option value="">All Statuses</option>
            <option value="New">New</option>
            <option value="Running">Running</option>
            <option value="Completed">Completed</option>
            <option value="Failed">Failed</option>
          </select>
          <button onClick={() => setIsUploadOpen(true)} className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-700 hover:from-violet-500 hover:to-indigo-600 text-white font-bold tracking-wide text-sm transition-all shadow-[0_0_15px_rgba(139,92,246,0.3)] hover:shadow-[0_0_25px_rgba(139,92,246,0.5)] border border-violet-500/50 whitespace-nowrap">
            Import CSV Layer
          </button>
          <button onClick={fetchSites} className="p-2.5 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 text-neutral-400 hover:text-white transition-all hover:rotate-180 duration-500">
            <RefreshCw className="w-5 h-5" />
          </button>
        </div>
      </div>

      {isUploadOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md animate-in fade-in duration-300 px-4">
          <div className="glass-panel border-white/10 rounded-3xl w-full max-w-xl p-8 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-10 blur-xl pointer-events-none"><Server className="w-32 h-32 text-violet-500"/></div>
            <div className="flex justify-between items-center mb-6 relative z-10">
              <h2 className="text-2xl font-extrabold text-white tracking-tight">Data Ingestion</h2>
              <button onClick={() => setIsUploadOpen(false)} className="text-neutral-500 hover:text-rose-400 transition-colors p-2 rounded-full hover:bg-rose-500/10">
                <XCircle className="w-6 h-6" />
              </button>
            </div>
            <p className="text-sm text-neutral-400 mb-6 font-medium relative z-10">Paste raw URLs (one per line). The engine will autonomously canonicalize and deduplicate entries into the main table.</p>
            <textarea
              value={uploadText}
              onChange={e => setUploadText(e.target.value)}
              placeholder="https://example.com/register&#10;https://anotherexample.edu/wp-login.php?action=register"
              className="w-full h-48 bg-black/50 border border-white/10 rounded-xl p-4 text-sm text-violet-200 font-mono outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/50 resize-none mb-6 relative z-10"
            />
            <div className="flex justify-end gap-3 relative z-10">
              <button onClick={() => setIsUploadOpen(false)} className="px-5 py-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-white font-bold tracking-wide text-sm transition-all">Cancel</button>
              <button onClick={handleUpload} disabled={isUploading || !uploadText.trim()} className="px-5 py-2.5 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 disabled:opacity-50 text-white font-bold tracking-wide text-sm transition-all shadow-[0_0_15px_rgba(139,92,246,0.4)] border border-violet-500/50">
                {isUploading ? 'Ingesting Pipeline...' : 'Commit Layer'}
              </button>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center items-center py-32">
          <div className="relative">
            <div className="w-12 h-12 border-4 border-violet-500/20 border-t-violet-500 rounded-full animate-spin"></div>
            <div className="absolute inset-0 bg-violet-500/20 blur-xl rounded-full"></div>
          </div>
        </div>
      ) : (
        <div className="glass-card rounded-3xl overflow-hidden border border-white/5 relative z-10">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-black/50 border-b border-white/5 text-neutral-400 text-left font-semibold tracking-wider uppercase text-[11px]">
                <tr>
                  <th className="px-6 py-4">Domain Infrastructure</th>
                  <th className="px-6 py-4 font-semibold text-xs tracking-wider uppercase">Execution State</th>
                  <th className="px-6 py-4 font-semibold text-xs tracking-wider uppercase">Progress Vector</th>
                  <th className="px-6 py-4 font-semibold text-xs tracking-wider uppercase">Security Layer</th>
                  <th className="px-6 py-4 font-semibold text-xs tracking-wider uppercase">Reliability Index</th>
                  <th className="px-6 py-4 font-semibold text-xs tracking-wider uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.02]">
                {sites.map(s => (
                  <tr key={s.Id} className="hover:bg-white/5 transition-colors group/row">
                    <td className="px-6 py-4">
                      <div className="font-extrabold text-white text-[13px]">{s.SiteName}</div>
                      <a href={s.SignupUrl} target="_blank" rel="noreferrer" className="text-[11px] font-mono text-violet-400/80 hover:text-violet-300 truncate max-w-xs block mt-1 transition-colors">{s.SignupUrl}</a>
                    </td>
                    <td className="px-6 py-4"><StatusBadge status={s.Status || 'New'} /></td>
                    <td className="px-6 py-4 text-neutral-400 text-xs max-w-[200px] truncate group-hover/row:text-neutral-300 transition-colors">{s.CurrentStep || '-'}</td>
                    <td className="px-6 py-4">
                      {s.CaptchaPresent ? (
                        <span className="bg-amber-500/10 text-amber-500 border border-amber-500/20 px-2 py-1 rounded text-[10px] font-extrabold tracking-widest uppercase">⚠ Blocked</span>
                      ) : (
                        <span className="text-emerald-500/60 font-semibold tracking-wider uppercase text-[10px]">Clear</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex-1 h-1.5 rounded-full bg-black/60 shadow-inner overflow-hidden border border-white/5 relative">
                          <div className="absolute inset-0 bg-white/5 backdrop-blur"></div>
                          <div
                            className={`h-full rounded-full shadow-[0_0_8px_currentColor] relative z-10 transition-all duration-1000 ${(s.ReliabilityScore||0) >= 80 ? 'bg-emerald-500 text-emerald-500' : (s.ReliabilityScore||0) >= 50 ? 'bg-amber-500 text-amber-500' : 'bg-rose-500 text-rose-500'}`}
                            style={{ width: `${s.ReliabilityScore || 0}%` }}
                          />
                        </div>
                        <span className="text-xs font-bold text-white w-7 drop-shadow-md">{s.ReliabilityScore || 0}<span className="text-neutral-500">%</span></span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {s.TaskId && s.Status === 'Failed' && (
                        <button
                          onClick={() => resetSite(s.TaskId)}
                          className="text-[11px] font-extrabold tracking-wider uppercase px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 text-neutral-400 hover:text-white transition-all focus:ring-2 focus:ring-white/20"
                        >
                          Re-Queue
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between mt-6 border-t border-white/5 pt-6 relative z-10 px-6 pb-6">
            <span className="text-xs font-semibold tracking-wider uppercase text-neutral-500">Page <span className="text-white">{page}</span> — Viewing <span className="text-white">{sites.length}</span> of {total.toLocaleString()} domains</span>
            <div className="flex gap-2">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="px-4 py-2 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-white/5 transition-all text-white font-bold">←</button>
              <button onClick={() => setPage(p => p + 1)} disabled={sites.length < 50} className="px-4 py-2 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-white/5 transition-all text-white font-bold">→</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const cfg: Record<string, string> = {
    Completed: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 shadow-[0_0_10px_rgba(52,211,153,0.1)]',
    Failed: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
    Running: 'bg-violet-500/10 text-violet-400 border-violet-500/30 shadow-[0_0_10px_rgba(139,92,246,0.1)] animate-pulse',
    New: 'bg-white/5 text-neutral-400 border-white/10',
  };
  const sc = cfg[status] || cfg['New'];
  return <span className={`px-3 py-1.5 rounded-lg text-[10px] font-extrabold tracking-widest uppercase border ${sc}`}>{status}</span>;
}
