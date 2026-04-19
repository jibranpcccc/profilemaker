'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { Play, Square, ExternalLink, Download, Loader2, CheckCircle2, Sparkles, Copy, Check, Plus, Trash2, CheckSquare, Square as SquareIcon } from 'lucide-react';

interface WorkerState { status: 'idle' | 'running' | 'done'; totalSites: number; completed: number; failed: number; running: number; }
interface Profile { SiteName: string; FinalProfileUrl: string; WebsiteUrlAdded: number; Username: string; Email: string; Password: string; CapturedAt: string; CampaignId?: number; BacklinkStatus?: string; }
interface SavedIdentity {
  id: string; firstName: string; lastName: string; email: string; password: string;
  bio: string; url: string; keywords: string; status: 'queued' | 'running' | 'done' | 'failed';
  campaignId?: number; selected: boolean;
}

export default function HomePage() {
  const [inputMode, setInputMode] = useState<'simple' | 'bulk'>('simple');
  const [singleUrl, setSingleUrl] = useState('https://google.com');
  const [singleKeywords, setSingleKeywords] = useState('SEO specialist, digital marketing, web developer');
  const [urlInput, setUrlInput] = useState('https://google.com | SEO, digital marketing');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [bio, setBio] = useState('');
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [queue, setQueue] = useState<SavedIdentity[]>([]);
  const [batchRunning, setBatchRunning] = useState(false);
  const [workerState, setWorkerState] = useState<WorkerState | null>(null);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [showLiveOnly, setShowLiveOnly] = useState(false);
  const pollRef = useRef<NodeJS.Timeout | null>(null);
  const batchRef = useRef(false);
  const [isMounted, setIsMounted] = useState(false);

  // Load state
  useEffect(() => {
    setIsMounted(true);
    try { 
       const loadedQueue = JSON.parse(localStorage.getItem('profileQueue') || '[]'); 
       setQueue(loadedQueue);
    } catch {}
  }, []);

  // Persist queue
  useEffect(() => {
    if (isMounted) {
      localStorage.setItem('profileQueue', JSON.stringify(queue));
    }
  }, [queue, isMounted]);

  // Poll
  useEffect(() => {
    const poll = () => {
      fetch('/api/run').then(r => r.json()).then(setWorkerState).catch(() => {});
      fetch('/api/profiles').then(r => r.json()).then(d => { if (Array.isArray(d)) setProfiles(d); }).catch(() => {});
    };
    poll();
    pollRef.current = setInterval(poll, 3000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, []);

  async function generateIdentity() {
    setGenerating(true);
    const url = inputMode === 'simple' ? singleUrl : urlInput.split('\n')[0]?.split('|')[0]?.trim() || '';
    const keywords = inputMode === 'simple' ? singleKeywords : urlInput.split('\n')[0]?.split('|')[1]?.trim() || 'professional';
    try {
      const res = await fetch('/api/generate-identity', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ keywords, url }) });
      const data = await res.json();
      if (data.firstName) setFirstName(data.firstName);
      if (data.lastName) setLastName(data.lastName);
      if (data.email) setEmail(data.email);
      if (data.sitePassword) setPassword(data.sitePassword);
      if (data.bio) setBio(data.bio);
    } catch {
      setFirstName(['Alex','Jordan','Sam','Morgan','Taylor'][Math.floor(Math.random()*5)]);
      setLastName(['Walker','Bennett','Collins','Foster','Hayes'][Math.floor(Math.random()*5)]);
      setPassword(`Pass${Math.floor(Math.random()*9000)+1000}!Mx`);
      setBio(`Professional. Visit ${url}`);
    }
    setGenerating(false);
  }

  function addToQueue() {
    if (!firstName || !lastName || !bio) return;
    const url = inputMode === 'simple' ? singleUrl : urlInput.split('\n')[0]?.split('|')[0]?.trim() || '';
    const keywords = inputMode === 'simple' ? singleKeywords : urlInput.split('\n')[0]?.split('|')[1]?.trim() || '';
    setQueue(q => [...q, {
      id: Date.now().toString(), firstName, lastName, email, password, bio, url, keywords,
      status: 'queued', selected: true
    }]);
    setFirstName(''); setLastName(''); setEmail(''); setPassword(''); setBio('');
  }

  function removeFromQueue(id: string) { setQueue(q => q.filter(x => x.id !== id)); }
  function toggleSelect(id: string) { setQueue(q => q.map(x => x.id === id ? { ...x, selected: !x.selected } : x)); }
  function selectAll() { const allSelected = queue.every(x => x.selected); setQueue(q => q.map(x => ({ ...x, selected: !allSelected }))); }

  // Run a single identity
  async function runSingle(identity: SavedIdentity): Promise<boolean> {
    setQueue(q => q.map(x => x.id === identity.id ? { ...x, status: 'running' } : x));
    try {
      const res = await fetch('/api/run-simple', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: identity.url, keywords: identity.keywords, firstName: identity.firstName, lastName: identity.lastName, bio: identity.bio })
      });
      if (!res.ok) { setQueue(q => q.map(x => x.id === identity.id ? { ...x, status: 'failed' } : x)); return false; }
      const data = await res.json();
      setQueue(q => q.map(x => x.id === identity.id ? { ...x, campaignId: data.campaignId, status: 'running' } : x));
      // Wait for completion
      while (true) {
        await new Promise(r => setTimeout(r, 5000));
        const st = await fetch('/api/run').then(r => r.json());
        if (st.status !== 'running') break;
        if (batchRef.current === false) break; // stopped
      }
      setQueue(q => q.map(x => x.id === identity.id ? { ...x, status: 'done' } : x));
      return true;
    } catch {
      setQueue(q => q.map(x => x.id === identity.id ? { ...x, status: 'failed' } : x));
      return false;
    }
  }

  // Batch run selected
  async function runSelected() {
    const selected = queue.filter(x => x.selected && x.status !== 'done');
    if (selected.length === 0) return;
    setBatchRunning(true);
    batchRef.current = true;
    for (const identity of selected) {
      if (!batchRef.current) break;
      await runSingle(identity);
      await new Promise(r => setTimeout(r, 2000)); // 2s between runs
    }
    setBatchRunning(false);
    batchRef.current = false;
  }

  function stopAll() {
    batchRef.current = false;
    fetch('/api/run', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'stop' }) }).catch(() => {});
    setBatchRunning(false);
  }

  function exportCSV() {
    const header = 'Site,Profile URL,Username,Email,Password,Status,Backlink Added\n';
    const rows = displayedProfiles.map(p => `"${p.SiteName}","${p.FinalProfileUrl}","${p.Username}","${p.Email}","${p.Password}","${(p.BacklinkStatus||'').includes('HIDDEN') ? 'Private' : 'Live'}","${p.WebsiteUrlAdded?'YES':'NO'}"`).join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `verified_profiles_${Date.now()}.csv`; a.click();
  }

  function copyAll() {
    const text = displayedProfiles.map(p => `${p.SiteName} | ${p.FinalProfileUrl} | ${p.Username} | ${p.Password} | ${(p.BacklinkStatus||'').includes('HIDDEN') ? 'Private' : 'Live'}`).join('\n');
    navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000);
  }

  const isRunning = workerState?.status === 'running';
  const progress = workerState && workerState.totalSites > 0 ? Math.round(((workerState.completed + workerState.failed) / workerState.totalSites) * 100) : 0;
  const selectedCount = queue.filter(x => x.selected && x.status !== 'done').length;

  const activeSelectedCampaignIds = queue.filter(q => q.selected && q.campaignId).map(q => q.campaignId);
  const displayedProfiles = (activeSelectedCampaignIds.length > 0 
    ? profiles.filter(p => p.CampaignId && activeSelectedCampaignIds.includes(p.CampaignId))
    : profiles).filter(p => showLiveOnly ? (!p.BacklinkStatus || !p.BacklinkStatus.includes('HIDDEN')) : true);

  const inp: React.CSSProperties = { width:'100%', padding:'0.5rem 0.75rem', background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:'10px', color:'#fff', fontSize:'0.85rem', outline:'none' };
  const lbl: React.CSSProperties = { display:'block', fontSize:'0.68rem', color:'#94a3b8', marginBottom:'0.25rem', fontWeight:600, textTransform:'uppercase' as const, letterSpacing:'0.05em' };

  return (
    <div style={{ padding:'1.2rem 1.8rem', maxWidth:'1150px', margin:'0 auto', fontFamily:'var(--font-outfit),system-ui,sans-serif' }}>


      {/* Header */}
      <div style={{ marginBottom:'1rem', display:'flex', justifyContent:'space-between', alignItems:'flex-end' }}>
        <div>
          <h1 style={{ fontSize:'1.4rem', fontWeight:700, background:'linear-gradient(135deg,#fff,#a78bfa)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', margin:0 }}>Profile Maker</h1>
          <p style={{ color:'#64748b', fontSize:'0.75rem', marginTop:'0.1rem' }}>Generate identities → Add to queue → Run all at once</p>
        </div>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <button onClick={() => window.location.href = '/dashboard'} style={{ padding:'0.4rem 0.8rem', fontSize:'0.75rem', fontWeight:600, border:'1px solid rgba(139,92,246,0.5)', borderRadius:'8px', cursor:'pointer', color:'#fff', background:'rgba(139,92,246,0.15)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            📊 Dashboard
          </button>
          <div style={{ display:'flex', background:'rgba(255,255,255,0.05)', borderRadius:'8px', overflow:'hidden', border:'1px solid rgba(255,255,255,0.08)' }}>
            <button onClick={()=>setInputMode('simple')} style={{ padding:'0.3rem 0.7rem', fontSize:'0.7rem', fontWeight:600, border:'none', cursor:'pointer', color:inputMode==='simple'?'#fff':'#64748b', background:inputMode==='simple'?'rgba(139,92,246,0.3)':'transparent' }}>Simple</button>
            <button onClick={()=>setInputMode('bulk')} style={{ padding:'0.3rem 0.7rem', fontSize:'0.7rem', fontWeight:600, border:'none', cursor:'pointer', color:inputMode==='bulk'?'#fff':'#64748b', background:inputMode==='bulk'?'rgba(139,92,246,0.3)':'transparent' }}>Bulk</button>
          </div>
        </div>
      </div>

      {/* INPUT */}
      <div className="glass-card" style={{ borderRadius:'12px', padding:'1rem', marginBottom:'0.8rem' }}>
        {inputMode === 'simple' ? (
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0.6rem', marginBottom:'0.6rem' }}>
            <div><label style={lbl}>Backlink URL</label><input type="url" value={singleUrl} onChange={e=>setSingleUrl(e.target.value)} style={inp} /></div>
            <div><label style={lbl}>Keywords</label><input value={singleKeywords} onChange={e=>setSingleKeywords(e.target.value)} style={inp} /></div>
          </div>
        ) : (
          <div style={{ marginBottom:'0.6rem' }}>
            <label style={lbl}>URLs & Keywords <span style={{ color:'#64748b', fontWeight:400, textTransform:'none' }}>— one per line: url | keywords</span></label>
            <textarea value={urlInput} onChange={e=>setUrlInput(e.target.value)} rows={3} placeholder={`https://site1.com | SEO\nhttps://site2.com | marketing`} style={{ ...inp, fontFamily:'monospace', fontSize:'0.78rem', lineHeight:'1.5', resize:'vertical' }} />
          </div>
        )}

        <button onClick={generateIdentity} disabled={generating}
          style={{ width:'100%', padding:'0.5rem', background:'linear-gradient(135deg,#7c3aed,#6d28d9)', color:'#fff', border:'none', borderRadius:'10px', cursor:'pointer', fontSize:'0.78rem', fontWeight:600, display:'flex', alignItems:'center', justifyContent:'center', gap:'0.4rem', opacity:generating?0.7:1, marginBottom:'0.6rem' }}>
          {generating ? <Loader2 className="w-3.5 h-3.5" style={{animation:'spin 1s linear infinite'}}/> : <Sparkles className="w-3.5 h-3.5"/>}
          {generating ? 'Generating...' : 'Auto-Generate Identity & Bio'}
        </button>

        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr 1fr', gap:'0.5rem', marginBottom:'0.5rem' }}>
          <div><label style={lbl}>First Name</label><input value={firstName} onChange={e=>setFirstName(e.target.value)} placeholder="Alex" style={inp}/></div>
          <div><label style={lbl}>Last Name</label><input value={lastName} onChange={e=>setLastName(e.target.value)} placeholder="Walker" style={inp}/></div>
          <div><label style={lbl}>Email</label><input value={email} readOnly style={{...inp, color:'#a78bfa', background:'rgba(139,92,246,0.08)'}}/></div>
          <div><label style={lbl}>Password</label><input value={password} readOnly style={{...inp, color:'#a78bfa', background:'rgba(139,92,246,0.08)', fontFamily:'monospace', fontSize:'0.78rem'}}/></div>
        </div>
        <div style={{ marginBottom:'0.5rem' }}><label style={lbl}>Bio</label><textarea value={bio} onChange={e=>setBio(e.target.value)} rows={2} style={{...inp, resize:'vertical', lineHeight:1.4}}/></div>

        <button onClick={addToQueue} disabled={!firstName || !lastName || !bio}
          style={{ width:'100%', padding:'0.5rem', background:firstName&&lastName&&bio ? 'rgba(34,197,94,0.15)' : '#1e293b', color:firstName&&lastName&&bio ? '#22c55e' : '#475569', border:`1px solid ${firstName&&lastName&&bio ? 'rgba(34,197,94,0.3)' : 'rgba(255,255,255,0.05)'}`, borderRadius:'10px', cursor:firstName&&lastName&&bio?'pointer':'not-allowed', fontSize:'0.78rem', fontWeight:600, display:'flex', alignItems:'center', justifyContent:'center', gap:'0.3rem' }}>
          <Plus className="w-3.5 h-3.5"/> Add to Queue
        </button>
      </div>

      {/* QUEUE */}
      {queue.length > 0 && (
        <div className="glass-card" style={{ borderRadius:'12px', padding:'0.8rem', marginBottom:'0.8rem' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'0.5rem' }}>
            <div style={{ display:'flex', alignItems:'center', gap:'0.5rem' }}>
              <h2 style={{ fontSize:'0.9rem', fontWeight:700, margin:0 }}>Queue ({queue.length})</h2>
              <button onClick={selectAll} style={{ padding:'0.2rem 0.4rem', fontSize:'0.65rem', background:'rgba(255,255,255,0.05)', color:'#94a3b8', border:'1px solid rgba(255,255,255,0.1)', borderRadius:'5px', cursor:'pointer' }}>
                {queue.every(x=>x.selected) ? 'Deselect All' : 'Select All'}
              </button>
            </div>
            <div style={{ display:'flex', gap:'0.4rem' }}>
              <button onClick={runSelected} disabled={selectedCount===0 || batchRunning}
                style={{ padding:'0.35rem 0.8rem', background:selectedCount>0 && !batchRunning ? 'linear-gradient(135deg,#22c55e,#16a34a)' : '#374151', color:'#fff', border:'none', borderRadius:'8px', cursor:selectedCount>0 && !batchRunning?'pointer':'not-allowed', fontSize:'0.72rem', fontWeight:700, display:'flex', alignItems:'center', gap:'0.25rem', boxShadow:selectedCount>0&&!batchRunning?'0 2px 12px rgba(34,197,94,0.25)':'none' }}>
                <Play className="w-3.5 h-3.5"/> Run {selectedCount > 0 ? `(${selectedCount})` : ''}
              </button>
              <button onClick={stopAll} disabled={!batchRunning && !isRunning}
                style={{ padding:'0.35rem 0.8rem', background:batchRunning||isRunning ? '#ef4444' : '#374151', color:'#fff', border:'none', borderRadius:'8px', cursor:batchRunning||isRunning?'pointer':'not-allowed', fontSize:'0.72rem', fontWeight:700, display:'flex', alignItems:'center', gap:'0.25rem' }}>
                <Square className="w-3.5 h-3.5"/> Stop
              </button>
            </div>
          </div>

          <div style={{ maxHeight:'200px', overflowY:'auto' }}>
            {queue.map(q => (
              <div key={q.id} style={{ display:'flex', alignItems:'center', gap:'0.5rem', padding:'0.35rem 0.4rem', borderBottom:'1px solid rgba(255,255,255,0.04)', fontSize:'0.76rem' }}
                onMouseEnter={e=>e.currentTarget.style.background='rgba(255,255,255,0.03)'} onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                <button onClick={()=>toggleSelect(q.id)} style={{ background:'none', border:'none', cursor:'pointer', padding:0, color:q.selected?'#8b5cf6':'#475569' }}>
                  {q.selected ? <CheckSquare className="w-4 h-4"/> : <SquareIcon className="w-4 h-4"/>}
                </button>
                <span style={{ fontWeight:600, width:'120px' }}>{q.firstName} {q.lastName}</span>
                <span style={{ color:'#64748b', flex:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', fontSize:'0.72rem' }}>{q.url} — {q.keywords}</span>
                <span style={{
                  padding:'0.15rem 0.4rem', borderRadius:'4px', fontSize:'0.65rem', fontWeight:600,
                  background: q.status==='done'?'rgba(34,197,94,0.15)' : q.status==='running'?'rgba(139,92,246,0.15)' : q.status==='failed'?'rgba(239,68,68,0.15)' : 'rgba(255,255,255,0.05)',
                  color: q.status==='done'?'#22c55e' : q.status==='running'?'#a78bfa' : q.status==='failed'?'#ef4444' : '#64748b',
                }}>{q.status === 'running' ? '⏳ Running...' : q.status === 'done' ? '✅ Done' : q.status === 'failed' ? '❌ Failed' : '⏸ Queued'}</span>
                <button onClick={()=>removeFromQueue(q.id)} style={{ background:'none', border:'none', cursor:'pointer', color:'#475569', padding:'2px' }}><Trash2 className="w-3.5 h-3.5"/></button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* PROGRESS */}
      {(isRunning || workerState?.status === 'done') && workerState && (
        <div className="glass-card" style={{ borderRadius:'10px', padding:'0.7rem', marginBottom:'0.8rem' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'0.4rem' }}>
            <div style={{ display:'flex', alignItems:'center', gap:'0.3rem' }}>
              {isRunning ? <Loader2 className="w-3.5 h-3.5 text-violet-400" style={{animation:'spin 1s linear infinite'}}/> : <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400"/>}
              <span style={{ fontWeight:600, fontSize:'0.8rem' }}>{isRunning ? 'Running...' : 'Completed'}</span>
            </div>
            <span style={{ color:'#94a3b8', fontSize:'0.7rem' }}>{workerState.completed+workerState.failed}/{workerState.totalSites}</span>
          </div>
          <div style={{ width:'100%', height:'5px', background:'rgba(255,255,255,0.08)', borderRadius:'3px', overflow:'hidden' }}>
            <div style={{ height:'100%', width:`${progress}%`, background:'linear-gradient(90deg,#22c55e,#8b5cf6)', borderRadius:'3px', transition:'width 0.5s' }}/>
          </div>
          <div style={{ display:'flex', gap:'1rem', marginTop:'0.3rem', fontSize:'0.7rem' }}>
            <span style={{color:'#22c55e'}}>✅ {workerState.completed}</span>
            <span style={{color:'#ef4444'}}>❌ {workerState.failed}</span>
            {isRunning && <span style={{color:'#f59e0b'}}>⏳ {workerState.running}</span>}
          </div>
        </div>
      )}

      {/* RESULTS */}
      {displayedProfiles.length > 0 && (
        <div className="glass-card" style={{ borderRadius:'12px', padding:'0.8rem' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'0.5rem' }}>
            <h2 style={{ fontSize:'0.9rem', fontWeight:700, margin:0 }}>{activeSelectedCampaignIds.length > 0 ? `Selected Run Profiles (${displayedProfiles.length})` : `All Profiles (${displayedProfiles.length})`}</h2>
            <div style={{ display:'flex', gap:'0.3rem' }}>
              <button 
                onClick={() => setShowLiveOnly(!showLiveOnly)} 
                style={{ padding:'0.3rem 0.6rem', background:showLiveOnly?'rgba(34,197,94,0.15)':'rgba(255,255,255,0.05)', color:showLiveOnly?'#22c55e':'#94a3b8', border:`1px solid ${showLiveOnly?'rgba(34,197,94,0.3)':'rgba(255,255,255,0.1)'}`, borderRadius:'6px', cursor:'pointer', fontSize:'0.68rem', fontWeight:600, display:'flex', alignItems:'center', gap:'0.2rem' }}>
                {showLiveOnly ? <Check className="w-3 h-3"/> : null} 100% Live Only
              </button>
              <button onClick={copyAll} style={{ padding:'0.3rem 0.6rem', background:'rgba(255,255,255,0.05)', color:copied?'#22c55e':'#94a3b8', border:'1px solid rgba(255,255,255,0.1)', borderRadius:'6px', cursor:'pointer', fontSize:'0.68rem', fontWeight:600, display:'flex', alignItems:'center', gap:'0.2rem' }}>
                {copied ? <Check className="w-3 h-3"/> : <Copy className="w-3 h-3"/>} {copied?'Copied':'Copy'}
              </button>
              <button onClick={exportCSV} style={{ padding:'0.3rem 0.6rem', background:'rgba(139,92,246,0.15)', color:'#a78bfa', border:'1px solid rgba(139,92,246,0.2)', borderRadius:'6px', cursor:'pointer', fontSize:'0.68rem', fontWeight:600, display:'flex', alignItems:'center', gap:'0.2rem' }}>
                <Download className="w-3 h-3"/> CSV
              </button>
            </div>
          </div>
          <div style={{ maxHeight:'350px', overflowY:'auto' }}>
            <table style={{ width:'100%', borderCollapse:'collapse', fontSize:'0.72rem' }}>
              <thead>
                <tr style={{ borderBottom:'1px solid rgba(255,255,255,0.08)', position:'sticky', top:0, background:'rgba(15,15,25,0.95)', backdropFilter:'blur(8px)' }}>
                  {['Site','Profile URL','Username','Password','Status','🔗'].map(h=>(
                    <th key={h} style={{ textAlign:h==='🔗'?'center':'left', padding:'0.4rem 0.45rem', color:'#64748b', fontWeight:600, fontSize:'0.63rem', textTransform:'uppercase', letterSpacing:'0.04em' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {displayedProfiles.map((p,i) => (
                  <tr key={i} style={{ borderBottom:'1px solid rgba(255,255,255,0.04)' }}
                    onMouseEnter={e=>e.currentTarget.style.background='rgba(255,255,255,0.03)'} onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                    <td style={{ padding:'0.4rem 0.45rem', fontWeight:500, whiteSpace:'nowrap' }}>{p.SiteName}</td>
                    <td style={{ padding:'0.4rem 0.45rem' }}>
                      <a href={p.FinalProfileUrl} target="_blank" rel="noopener noreferrer" style={{ color:'#a78bfa', textDecoration:'none', display:'flex', alignItems:'center', gap:'0.2rem' }}>
                        {p.FinalProfileUrl?.substring(0,42)}{(p.FinalProfileUrl?.length||0)>42?'...':''} <ExternalLink className="w-2.5 h-2.5 flex-shrink-0"/>
                      </a>
                    </td>
                    <td style={{ padding:'0.4rem 0.45rem', color:'#94a3b8', fontFamily:'monospace', fontSize:'0.7rem' }}>{p.Username||'—'}</td>
                    <td style={{ padding:'0.4rem 0.45rem', color:'#94a3b8', fontFamily:'monospace', fontSize:'0.7rem' }}>{p.Password||'—'}</td>
                    <td style={{ padding:'0.4rem 0.45rem', fontSize:'0.65rem', fontWeight:600, color:(p.BacklinkStatus||'').includes('HIDDEN')?'#ef4444':'#22c55e' }}>
                      {(p.BacklinkStatus||'').includes('HIDDEN') ? 'Private' : 'Live'}
                    </td>
                    <td style={{ padding:'0.4rem 0.45rem', textAlign:'center' }}>{p.WebsiteUrlAdded ? <span style={{color:'#22c55e'}}>✅</span> : <span style={{color:'#475569'}}>—</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <style jsx>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
