'use client';

import { useState } from 'react';
import { 
  Sparkles, Copy, Check, Loader2, RefreshCw, 
  ShieldOff, Wind, VenetianMask, Scale, GitMerge, ChevronRight 
} from 'lucide-react';

interface Version {
  name: string;
  success: boolean;
  content: string;
}

const ALG_ICONS: Record<string, React.ReactNode> = {
  "blader/humanizer (Anti-Patterns)": <ShieldOff className="w-4 h-4" />,
  "OrbitWebTools/Humanize-AI (Natural Flow)": <Wind className="w-4 h-4" />,
  "StealthHumanizer (Ninja Mode)": <VenetianMask className="w-4 h-4" />,
  "enHumanizer_Bot (Perfect Meaning)": <Scale className="w-4 h-4" />,
  "DadaNanjesha (Synonyms & Transitions)": <GitMerge className="w-4 h-4" />
};

const ALG_COLORS: Record<string, string> = {
  "blader/humanizer (Anti-Patterns)": "from-blue-500 to-cyan-400",
  "OrbitWebTools/Humanize-AI (Natural Flow)": "from-teal-400 to-emerald-500",
  "StealthHumanizer (Ninja Mode)": "from-violet-500 to-fuchsia-500",
  "enHumanizer_Bot (Perfect Meaning)": "from-amber-400 to-orange-500",
  "DadaNanjesha (Synonyms & Transitions)": "from-rose-400 to-red-500"
};

export default function HumanizerPage() {
  const [content, setContent] = useState('');
  const [voiceSample, setVoiceSample] = useState('');
  const [versions, setVersions] = useState<Version[]>([]);
  const [generating, setGenerating] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [error, setError] = useState('');
  const [focused, setFocused] = useState(false);
  const [voiceFocused, setVoiceFocused] = useState(false);
  const [copiedAll, setCopiedAll] = useState(false);

  async function handleHumanize() {
    if (!content.trim()) return;
    setGenerating(true);
    setError('');
    
    // Initialize empty versions array to show skeletons
    const initialVersions = Array.from({ length: 5 }).map((_, i) => ({
      name: '',
      success: false,
      content: '',
      loading: true
    }));
    setVersions(initialVersions as any);

    try {
      const promises = [0, 1, 2, 3, 4].map(async (index) => {
        try {
          const res = await fetch('/api/humanize', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ content, versionIndex: index, voiceSample })
          });
          const data = await res.json();
          
          if (!res.ok || !data.success) {
            throw new Error(data.error || 'Failed');
          }
          
          // Update the specific version slot when it resolves
          setVersions(prev => {
            const updated = [...prev];
            updated[index] = { ...data.version, loading: false };
            return updated;
          });
        } catch (e: any) {
          // If a single one fails, it just fails that slot
          setVersions(prev => {
            const updated = [...prev];
            updated[index] = { name: 'Model ' + (index + 1), success: false, content: e.message, loading: false } as any;
            return updated;
          });
        }
      });
      
      await Promise.all(promises);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setGenerating(false);
    }
  }

  function handleCopy(text: string, index: number) {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  }

  function handleCopyAll() {
    const loadedVersions = versions.filter((v: any) => !v.loading && v.success);
    if (loadedVersions.length === 0) return;

    const allText = loadedVersions.map((v: any, i) => '=== VERSION ' + (i + 1) + ': ' + v.name + ' ===\n' + v.content + '\n').join('\n');
    navigator.clipboard.writeText(allText);
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2000);
  }

  return (
    <div className="min-h-screen relative overflow-hidden pb-20">
      {/* Background Ambience */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-violet-600/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-fuchsia-600/10 rounded-full blur-[150px] pointer-events-none" />

      <div className="relative z-10 px-6 pt-10 pb-16 max-w-7xl mx-auto font-sans">
        
        {/* Header Section */}
        <div className="flex flex-col items-center text-center mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-semibold text-violet-300 uppercase tracking-widest mb-6 shadow-xl backdrop-blur-md">
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI Evasion Engine</span>
          </div>
          
          <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white via-violet-100 to-violet-400 mb-4 drop-shadow-sm">
            Ultimate Humanizer v2
          </h1>
          <p className="text-neutral-400 max-w-2xl text-lg md:text-xl font-light">
            Deploy <span className="text-white font-medium">5 top-tier algorithms</span> simultaneously to guarantee your text bypasses GPTZero, Turnitin, and Originality.ai.
          </p>
        </div>

        {/* Input Section */}
        <div className="max-w-4xl mx-auto relative group">
          <div className={`absolute -inset-0.5 bg-gradient-to-r from-violet-500 to-fuchsia-500 rounded-2xl blur opacity-30 transition duration-500 group-hover:opacity-60 ${focused ? 'opacity-70 blur-md' : ''}`} />
          
          <div className="relative glass-card bg-[#0f0f13]/90 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-2xl flex flex-col">
            <div className="flex justify-between items-center mb-3">
              <label className="text-xs font-bold uppercase tracking-wider text-neutral-400 flex items-center gap-2">
                <ChevronRight className="w-4 h-4 text-violet-400" /> Original AI Content
              </label>
              <span className="text-xs font-mono text-neutral-500">{content.length} chars</span>
            </div>
            
            <textarea 
              value={content} 
              onChange={e=>setContent(e.target.value)}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              rows={6} 
              placeholder="Paste your robotic, AI-generated text here... Let's breathe some life into it." 
              className="w-full bg-transparent text-white placeholder-neutral-600 outline-none resize-y text-lg leading-relaxed font-light mb-6 transition-all"
              style={{ minHeight: '120px' }}
            />
            
            {error && (
              <div className="flex items-center gap-3 px-4 py-3 mb-6 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
                <ShieldOff className="w-4 h-4 flex-shrink-0" />
                <span><strong className="font-semibold text-red-300">Error:</strong> {error}</span>
              </div>
            )}

            <div className="flex justify-between items-center mb-3 pt-4 border-t border-white/5">
              <label className="text-xs font-bold uppercase tracking-wider text-neutral-400 flex items-center gap-2">
                <ChevronRight className="w-4 h-4 text-fuchsia-400" /> Voice Calibration Sample <span className="lowercase font-normal text-fuchsia-400/70 border border-fuchsia-400/20 rounded px-1.5 py-0.5">optional</span>
              </label>
              <span className="text-xs font-mono text-neutral-500">{voiceSample.length} chars</span>
            </div>
            
            <textarea 
              value={voiceSample} 
              onChange={e=>setVoiceSample(e.target.value)}
              onFocus={() => setVoiceFocused(true)}
              onBlur={() => setVoiceFocused(false)}
              rows={3} 
              placeholder="Paste a sample of your personal writing here. Blader (Version 1) will analyze your unique style, sentence length, and vocabulary and mimic it perfectly." 
              className="w-full bg-transparent text-white placeholder-neutral-600 outline-none resize-y text-sm leading-relaxed font-light mb-6 transition-all"
              style={{ minHeight: '60px' }}
            />

            <button 
              onClick={handleHumanize} 
              disabled={generating || !content.trim()}
              className="group relative w-full overflow-hidden rounded-xl font-semibold text-base py-4 transition-all duration-300 hover:shadow-[0_0_40px_rgba(139,92,246,0.4)] hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-none bg-gradient-to-r from-violet-600 via-fuchsia-600 to-violet-600 bg-[length:200%_auto] text-white"
              style={{
                backgroundSize: '200% auto',
                animation: generating ? 'gradient-shift 2s linear infinite' : 'none'
              }}
            >
              <div className="absolute inset-0 bg-white/20 transition-opacity opacity-0 group-hover:opacity-100 mix-blend-overlay" />
              <div className="relative flex items-center justify-center gap-2">
                {generating ? (
                  <Loader2 className="w-5 h-5 animate-spin data-generating" />
                ) : (
                  <RefreshCw className="w-5 h-5 transition-transform group-hover:rotate-180 duration-500" />
                )}
                <span className="tracking-wide">
                  {generating ? 'Running 5 Concurrent Models...' : 'Ignite Humanization Engine'}
                </span>
              </div>
            </button>
          </div>
        </div>

        {/* Results Section */}
        {(versions.length > 0 || generating) && (
          <div className="mt-16 relative">
            <div className="flex items-center gap-4 mb-6">
              <div className="h-px bg-gradient-to-r from-transparent via-white/20 to-transparent flex-1" />
              <h2 className="text-xl font-bold text-white/90 uppercase tracking-widest drop-shadow-md">
                Generation Results
              </h2>
              <div className="h-px bg-gradient-to-r from-transparent via-white/20 to-transparent flex-1" />
            </div>

            <div className="flex justify-center mb-8">
              <button 
                onClick={handleCopyAll}
                disabled={generating || versions.every((v: any) => v.loading)}
                className={`py-2.5 px-6 rounded-full font-medium text-sm transition-all duration-300 flex items-center gap-2 ${
                  copiedAll
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/50 shadow-[0_0_20px_rgba(16,185,129,0.3)]'
                    : 'bg-white/5 text-white border border-white/10 hover:bg-white/10 hover:shadow-[0_0_15px_rgba(255,255,255,0.05)]'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {copiedAll ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copiedAll ? 'All Versions Copied!' : 'Copy All 5 Versions Together'}
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {versions.map((ver: any, idx) => {
                if (ver.loading) {
                  return (
                    <div key={idx} className="glass-card bg-white/5 border border-white/5 rounded-2xl p-6 relative overflow-hidden flex flex-col min-h-[250px]">
                      <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/[0.05] to-transparent" />
                      <div className="flex items-center gap-3 mb-6">
                        <div className="w-8 h-8 rounded-full bg-white/10" />
                        <div className="h-4 w-32 bg-white/10 rounded-full" />
                      </div>
                      <div className="space-y-3 flex-1">
                        <div className="h-3 w-full bg-white/5 rounded-full" />
                        <div className="h-3 w-5/6 bg-white/5 rounded-full" />
                        <div className="h-3 w-4/6 bg-white/5 rounded-full" />
                      </div>
                      <div className="pt-4 border-t border-white/5 w-full">
                        <div className="h-8 w-full bg-white/5 rounded-lg" />
                      </div>
                    </div>
                  );
                }

                const gradient = ALG_COLORS[ver.name] || "from-neutral-400 to-neutral-500";
                const icon = ALG_ICONS[ver.name] || <Sparkles className="w-4 h-4" />;
                
                return (
                  <div key={idx} className="group relative glass-card bg-[#13141c]/80 backdrop-blur-md border border-white/10 rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-2xl hover:shadow-black/50 hover:border-white/20 flex flex-col hover:-translate-y-1">
                      
                      {/* Top Accent Line */}
                      <div className={`h-1 w-full bg-gradient-to-r ${gradient}`} />
                      
                      <div className="p-6 flex flex-col flex-1">
                        {/* Card Header */}
                        <div className="flex items-start justify-between mb-4 gap-2">
                          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gradient-to-r ${gradient} bg-opacity-10 text-white font-semibold text-sm shadow-sm truncate max-w-[80%]`}>
                            <div className="opacity-90">{icon}</div>
                            <span className="truncate">{ver.name.split(' ')[0]}</span>
                          </div>
                          {!ver.success && (
                            <span className="text-[10px] uppercase tracking-wider font-bold text-red-400 bg-red-400/10 px-2 py-1 rounded-md">Failed</span>
                          )}
                        </div>

                        {/* Subtitle */}
                        {ver.success && (
                          <div className="text-xs text-neutral-500 mb-3 font-medium uppercase tracking-wider pl-1">
                            {ver.name.substring(ver.name.indexOf('('))}
                          </div>
                        )}
                        
                        {/* Card Content */}
                        <div className={`flex-1 overflow-y-auto pr-2 custom-scrollbar ${ver.success ? 'text-neutral-300 font-light' : 'text-red-400 font-mono text-xs'} leading-relaxed text-[0.95rem]`} style={{ maxHeight: '240px' }}>
                          {ver.content}
                        </div>

                        {/* Card Footer */}
                        {ver.success && (
                          <div className="mt-5 pt-4 border-t border-white/10">
                            <button 
                              onClick={() => handleCopy(ver.content, idx)} 
                              className={`w-full py-2.5 px-4 rounded-xl font-medium text-sm transition-all duration-200 flex items-center justify-center gap-2 ${
                                copiedIndex === idx 
                                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.2)]' 
                                  : 'bg-white/5 text-neutral-300 border border-white/10 hover:bg-white/10 hover:text-white'
                              }`}
                            >
                              {copiedIndex === idx ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                              {copiedIndex === idx ? 'Copied to Clipboard!' : 'Copy This Version'}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}

            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes gradient-shift {
          0% { background-position: 0% 50%; }
          100% { background-position: 200% 50%; }
        }
        @keyframes shimmer {
          100% { transform: translateX(100%); }
        }
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: rgba(255,255,255,0.02); border-radius: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.2); }
      `}</style>
    </div>
  );
}
