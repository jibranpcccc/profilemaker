"use client";
import React, { useState, useEffect } from "react";
import { Shield, ExternalLink, CheckCircle, XCircle, Image, Copy } from "lucide-react";

export default function ProofsPage() {
  const [proofs, setProofs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState<number | null>(null);

  useEffect(() => {
    fetch('/api/proofs').then(r => r.json()).then(d => {
      setProofs(d.proofs || []);
      setLoading(false);
    });
  }, []);

  const copyToClipboard = (text: string, id: number) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  if (loading) return <div className="flex items-center justify-center h-screen text-neutral-400">Loading proofs...</div>;

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 p-6 md:p-10">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-10">
          <div className="w-10 h-10 rounded-xl bg-emerald-600/20 flex items-center justify-center">
            <Shield className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Proof of Backlinks</h1>
            <p className="text-neutral-500 text-sm">{proofs.length} completed profiles with backlinks</p>
          </div>
        </div>

        {proofs.length === 0 ? (
          <div className="text-center py-20 text-neutral-500">
            <Shield className="w-12 h-12 mx-auto mb-4 opacity-30" />
            <p className="text-lg">No proofs yet. Run the automation engine to generate profile backlinks.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {proofs.map((p) => (
              <div key={p.Id} className="rounded-2xl border border-neutral-800 bg-neutral-900/50 overflow-hidden hover:border-neutral-700 transition-all group">
                {/* Screenshot or placeholder */}
                <div className="h-32 bg-neutral-800 flex items-center justify-center relative overflow-hidden">
                  {p.hasScreenshot ? (
                    <img src={`/api/screenshot?path=${encodeURIComponent(p.ScreenshotPath)}`} alt="Profile Screenshot" className="w-full h-full object-cover object-top" />
                  ) : (
                    <Image className="w-8 h-8 text-neutral-600" />
                  )}
                  <div className="absolute top-2 right-2">
                    {p.WebsiteUrlAdded ? (
                      <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">✓ Backlink</span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-neutral-500/20 text-neutral-400 border border-neutral-500/30">No Backlink</span>
                    )}
                  </div>
                </div>

                <div className="p-4 space-y-3">
                  <div>
                    <div className="font-semibold text-white">{p.SiteName}</div>
                    <a href={p.SignupUrl} target="_blank" rel="noreferrer" className="text-xs text-blue-400 hover:text-blue-300 truncate block opacity-60 hover:opacity-100">{p.SignupUrl}</a>
                  </div>

                  {p.FinalProfileUrl && (
                    <a href={p.FinalProfileUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-xs text-emerald-400 hover:text-emerald-300 transition-colors">
                      <ExternalLink className="w-3 h-3" />
                      <span className="truncate">{p.FinalProfileUrl}</span>
                    </a>
                  )}

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <InfoItem label="Captured" value={p.CapturedAt ? new Date(p.CapturedAt).toLocaleDateString() : '-'} />
                    <InfoItem label="Backlink" value={p.Notes?.includes('INSERTED') ? '✅ Inserted' : '⚠️ Skipped'} />
                  </div>

                  {p.Notes && (
                    <button
                      onClick={() => copyToClipboard(p.Notes, p.Id)}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-xs text-neutral-400 hover:text-neutral-200 transition-all text-left"
                    >
                      <Copy className="w-3 h-3 shrink-0" />
                      <span className="truncate">{copied === p.Id ? '✅ Copied!' : p.Notes}</span>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-neutral-800/50 rounded-lg px-3 py-2">
      <div className="text-neutral-500 text-xs mb-0.5">{label}</div>
      <div className="text-neutral-200 font-medium text-xs">{value}</div>
    </div>
  );
}
