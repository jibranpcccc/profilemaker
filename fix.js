const fs = require('fs');
let code = fs.readFileSync('web-monitor/src/app/page.tsx', 'utf8');

const replacements = [
  { regex: /style={{[^}]*padding:'1\\.2rem 1\\.8rem', maxWidth:'1150px'[^}]*}}/g, replace: 'className="p-5 max-w-6xl mx-auto font-sans"' },
  { regex: /style={{[^}]*display:'flex', justifyContent:'space-between', alignItems:'flex-end'[^}]*}}/g, replace: 'className="flex justify-between items-end mb-4"' },
  { regex: /style={{[^}]*fontSize:'1\\.4rem', fontWeight:700, background:'linear-gradient[^}]*}}/g, replace: 'className="text-2xl font-bold bg-gradient-to-br from-white to-violet-400 bg-clip-text text-transparent m-0"' },
  { regex: /style={{[^}]*color:'#64748b', fontSize:'0\\.75rem', marginTop:'0\\.1rem'[^}]*}}/g, replace: 'className="text-slate-500 text-xs mt-0.5"' },
  { regex: /style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}/g, replace: 'className="flex gap-4 items-center"' },
  { regex: /style={{[^}]*padding:'0\\.4rem 0\\.8rem', fontSize:'0\\.75rem'[^}]*}}/g, replace: 'className="px-3 py-1.5 text-xs font-semibold border border-violet-500/50 rounded-lg cursor-pointer text-white bg-violet-500/15 flex items-center gap-1.5 hover:bg-violet-500/25 transition-colors"' },
  { regex: /style={{[^}]*display:'flex', background:'rgba\\(255,255,255,0\\.05\\)', borderRadius:'8px'[^}]*}}/g, replace: 'className="flex bg-white/5 rounded-lg overflow-hidden border border-white/10"' },
  { regex: /style={{[^}]*padding:'0\\.3rem 0\\.7rem', fontSize:'0\\.7rem', fontWeight:600, border:'none', cursor:'pointer'[^}]*}}/g, replace: 'className="px-3 py-1 text-xs font-semibold border-none cursor-pointer hover:bg-violet-500/20 transition-colors"' },
  { regex: /className="glass-card" style={{ borderRadius:'12px', padding:'1rem', marginBottom:'0\\.8rem' }}/g, replace: 'className="glass-card rounded-xl p-4 mb-3"' },
  { regex: /style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0\\.6rem', marginBottom:'0\\.6rem' }}/g, replace: 'className="grid grid-cols-2 gap-2.5 mb-2.5"' },
  { regex: /style={{ marginBottom:'0\\.6rem' }}/g, replace: 'className="mb-2.5"' },
  { regex: /style={{ color:'#64748b', fontWeight:400, textTransform:'none' }}/g, replace: 'className="text-slate-500 font-normal normal-case"' },
  { regex: /style={{ \\.\\.\\.inp, fontFamily:'monospace', fontSize:'0\\.78rem', lineHeight:'1\\.5', resize:'vertical' }}/g, replace: 'className="w-full p-2 bg-white/5 border border-white/10 rounded-lg text-white text-xs outline-none font-mono leading-relaxed resize-y"' },
  { regex: /style={{ width:'100%', padding:'0\\.5rem', background:'linear-gradient\\[\\^}\\]\\*}}/g, replace: 'className="w-full p-2 bg-gradient-to-br from-violet-600 to-violet-700 text-white rounded-lg cursor-pointer text-xs font-semibold flex items-center justify-center gap-1.5 hover:opacity-90 transition-opacity mb-2.5 disabled:opacity-70"' },
  { regex: /style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr 1fr', gap:'0\\.5rem', marginBottom:'0\\.5rem' }}/g, replace: 'className="grid grid-cols-4 gap-2 mb-2"' },
  { regex: /style={{\\.\\.\\.inp, color:'#a78bfa', background:'rgba\\(139,92,246,0\\.08\\)'}}/g, replace: 'className="w-full p-2 bg-violet-500/10 border border-white/10 rounded-lg text-violet-400 text-sm outline-none"' },
  { regex: /style={{marginBottom:'0\\.5rem'}}/g, replace: 'className="mb-2"' },
  { regex: /style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'0\\.5rem' }}/g, replace: 'className="flex justify-between items-center mb-2"' },
  { regex: /style={{ display:'flex', alignItems:'center', gap:'0\\.5rem' }}/g, replace: 'className="flex items-center gap-2"' },
  { regex: /style={{ fontSize:'0\\.9rem', fontWeight:700, margin:0 }}/g, replace: 'className="text-sm font-bold m-0"' },
  { regex: /style={{ display:'flex', gap:'0\\.4rem' }}/g, replace: 'className="flex gap-1.5"' },
  { regex: /style={{ padding:'0\\.2rem 0\\.4rem', fontSize:'0\\.65rem', background:'rgba\\(255,255,255,0\\.05\\)', color:'#94a3b8', border:'1px solid rgba\\(255,255,255,0\\.1\\)', borderRadius:'5px', cursor:'pointer' }}/g, replace: 'className="px-1.5 py-0.5 text-[10px] bg-white/5 text-slate-400 border border-white/10 rounded cursor-pointer hover:bg-white/10 transition-colors"' },
  { regex: /style={{ maxHeight:'200px', overflowY:'auto' }}/g, replace: 'className="max-h-52 overflow-y-auto"' },
  { regex: /style={{ display:'flex', alignItems:'center', gap:'0\\.5rem', padding:'0\\.35rem 0\\.4rem', borderBottom:'1px solid rgba\\(255,255,255,0\\.04\\)', fontSize:'0\\.76rem' }}/g, replace: 'className="flex items-center gap-2 px-1.5 py-1 border-b border-white/5 text-[11px] hover:bg-white/5 transition-colors"' },
  { regex: /style={{ fontWeight:600, width:'120px' }}/g, replace: 'className="font-semibold w-28 truncate"' },
  { regex: /style={{ color:'#64748b', flex:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', fontSize:'0\\.72rem' }}/g, replace: 'className="text-slate-500 flex-1 overflow-hidden text-ellipsis whitespace-nowrap text-[11px]"' },
  { regex: /style={{ background:'none', border:'none', cursor:'pointer', color:'#475569', padding:'2px' }}/g, replace: 'className="bg-transparent border-none cursor-pointer text-slate-600 p-0.5 hover:text-red-400 transition-colors"' },
  { regex: /style={{ borderRadius:'10px', padding:'0\\.7rem', marginBottom:'0\\.8rem' }}/g, replace: 'className="rounded-xl p-3 mb-3"' },
  { regex: /style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'0\\.4rem' }}/g, replace: 'className="flex justify-between items-center mb-1.5"' },
  { regex: /style={{ display:'flex', alignItems:'center', gap:'0\\.3rem' }}/g, replace: 'className="flex items-center gap-1"' },
  { regex: /style={{ fontWeight:600, fontSize:'0\\.8rem' }}/g, replace: 'className="font-semibold text-xs"' },
  { regex: /style={{ color:'#94a3b8', fontSize:'0\\.7rem' }}/g, replace: 'className="text-slate-400 text-[11px]"' },
  { regex: /style={{ width:'100%', height:'5px', background:'rgba\\(255,255,255,0\\.08\\)', borderRadius:'3px', overflow:'hidden' }}/g, replace: 'className="w-full h-1 bg-white/10 rounded-sm overflow-hidden"' },
  { regex: /style={{ display:'flex', gap:'1rem', marginTop:'0\\.3rem', fontSize:'0\\.7rem' }}/g, replace: 'className="flex gap-4 mt-1 text-[11px] font-medium"' },
  { regex: /style={{ display:'flex', gap:'0\\.3rem' }}/g, replace: 'className="flex gap-1"' },
  { regex: /style={{ maxHeight:'350px', overflowY:'auto' }}/g, replace: 'className="max-h-80 overflow-y-auto"' },
  { regex: /style={{ width:'100%', borderCollapse:'collapse', fontSize:'0\\.72rem' }}/g, replace: 'className="w-full border-collapse text-xs"' },
  { regex: /style={{ borderBottom:'1px solid rgba\\(255,255,255,0\\.08\\)', position:'sticky', top:0, background:'rgba\\(15,15,25,0\\.95\\)', backdropFilter:'blur\\(8px\\)' }}/g, replace: 'className="border-b border-white/10 sticky top-0 bg-slate-950/95 backdrop-blur-md z-10"' },
  { regex: /style={{ borderBottom:'1px solid rgba\\(255,255,255,0\\.04\\)' }}/g, replace: 'className="border-b border-white/5 hover:bg-white/5 transition-colors"' },
  { regex: /style={{ padding:'0\\.4rem 0\\.45rem', fontWeight:500, whiteSpace:'nowrap' }}/g, replace: 'className="p-1.5 font-medium whitespace-nowrap"' },
  { regex: /style={{ padding:'0\\.4rem 0\\.45rem' }}/g, replace: 'className="p-1.5"' },
  { regex: /style={{ color:'#a78bfa', textDecoration:'none', display:'flex', alignItems:'center', gap:'0\\.2rem' }}/g, replace: 'className="text-violet-400 no-underline flex items-center gap-1 hover:text-violet-300 transition-colors"' },
  { regex: /style={{ padding:'0\\.4rem 0\\.45rem', color:'#94a3b8', fontFamily:'monospace', fontSize:'0\\.7rem' }}/g, replace: 'className="p-1.5 text-slate-400 font-mono text-[11px]"' },
  { regex: /style={{ padding:'0\\.4rem 0\\.45rem', textAlign:'center' }}/g, replace: 'className="p-1.5 text-center"' },
  { regex: /style={{color:'#22c55e'}}/g, replace: 'className="text-green-500"' },
  { regex: /style={{color:'#475569'}}/g, replace: 'className="text-slate-500"' },
  { regex: /style={{color:'#ef4444'}}/g, replace: 'className="text-red-500"' },
  { regex: /style={{color:'#f59e0b'}}/g, replace: 'className="text-amber-500"' },
  { regex: /style={{ color:'#475569', textAlign:'center', padding:'2rem' }}/g, replace: 'className="text-slate-500 text-center p-8"' }
];

for (const rep of replacements) { code = code.replace(rep.regex, rep.replace); }

code = code.replace(/onMouseEnter=\{e=>e\\.currentTarget\\.style\\.background='rgba\\(255,255,255,0\\.03\\)'\}\\s*onMouseLeave=\{e=>e\\.currentTarget\\.style\\.background='transparent'\}/g, '');

fs.writeFileSync('web-monitor/src/app/page.tsx', code);
