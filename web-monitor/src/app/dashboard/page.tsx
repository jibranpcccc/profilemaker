'use client';

import { useEffect, useState } from 'react';
import { Activity, CheckCircle2, XCircle, LayoutDashboard, Database, BarChart3, Clock, AlertTriangle, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

interface DashboardStats {
  global: { total: number; successful: number; failed: number; running: number };
  platforms: { name: string; attempts: number; successes: number; failures: number }[];
  rawSites: { platform: string; attempts: number; successes: number; failures: number }[];
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/dashboard/stats')
      .then(res => res.json())
      .then(data => {
        setStats(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to load stats', err);
        setLoading(false);
      });
  }, []);

  if (loading || !stats) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', color: '#a78bfa' }}>
        <Activity className="w-8 h-8 animate-pulse" />
      </div>
    );
  }

  const successRate = stats.global.total > 0 
    ? Math.round((stats.global.successful / stats.global.total) * 100) 
    : 0;

  const cardStyle: React.CSSProperties = {
    background: 'rgba(255, 255, 255, 0.03)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    borderRadius: '16px',
    padding: '1.5rem',
    backdropFilter: 'blur(12px)',
    boxShadow: '0 4px 24px -1px rgba(0,0,0,0.1)'
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto', fontFamily: 'var(--font-outfit),system-ui,sans-serif' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, background: 'linear-gradient(135deg,#fff,#a78bfa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', margin: 0, display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
            <LayoutDashboard className="w-7 h-7 text-violet-400" /> Success Rate Dashboard
          </h1>
          <p style={{ color: '#94a3b8', marginTop: '0.3rem', fontSize: '0.9rem' }}>Global historical metrics for Autonomous SEO Engine</p>
        </div>
        <Link href="/" style={{ padding: '0.5rem 1rem', background: 'rgba(255,255,255,0.05)', color: '#fff', borderRadius: '8px', textDecoration: 'none', fontSize: '0.8rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.4rem', border: '1px solid rgba(255,255,255,0.1)' }}>
          <ArrowLeft className="w-4 h-4" /> Back to Generator
        </Link>
      </div>

      {/* Global Overview Metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        <div style={cardStyle}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.8rem', color: '#a78bfa' }}>
            <Database className="w-5 h-5" /> <h3 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 600 }}>Total Handled</h3>
          </div>
          <div style={{ fontSize: '2.5rem', fontWeight: 800, color: '#fff' }}>{stats.global.total}</div>
        </div>

        <div style={cardStyle}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.8rem', color: '#22c55e' }}>
            <CheckCircle2 className="w-5 h-5" /> <h3 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 600 }}>Success Count</h3>
          </div>
          <div style={{ fontSize: '2.5rem', fontWeight: 800, color: '#fff' }}>{stats.global.successful}</div>
        </div>

        <div style={cardStyle}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.8rem', color: '#ef4444' }}>
            <XCircle className="w-5 h-5" /> <h3 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 600 }}>Failure Count</h3>
          </div>
          <div style={{ fontSize: '2.5rem', fontWeight: 800, color: '#fff' }}>{stats.global.failed}</div>
        </div>

        <div style={{ ...cardStyle, background: 'linear-gradient(135deg, rgba(139,92,246,0.15), rgba(34,197,94,0.15))' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.8rem', color: '#fff' }}>
            <BarChart3 className="w-5 h-5" /> <h3 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 600 }}>Global Success Rate</h3>
          </div>
          <div style={{ fontSize: '2.5rem', fontWeight: 800, color: '#fff' }}>{successRate}%</div>
        </div>
      </div>

      {/* Platform Breakdown */}
      <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#fff', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <Activity className="w-5 h-5 text-violet-400" /> Platform Infrastructure Details
      </h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        {stats.platforms.map((platform, idx) => {
          const rate = platform.attempts > 0 ? Math.round((platform.successes / platform.attempts) * 100) : 0;
          return (
            <div key={idx} style={cardStyle}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h4 style={{ margin: 0, color: '#e2e8f0', fontSize: '1rem', fontWeight: 600 }}>{platform.name}</h4>
                <span style={{ fontSize: '1.2rem', fontWeight: 700, color: rate > 70 ? '#22c55e' : rate > 40 ? '#f59e0b' : '#ef4444' }}>{rate}%</span>
              </div>
              
              <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.08)', borderRadius: '4px', overflow: 'hidden', marginBottom: '1rem' }}>
                <div style={{ height: '100%', width: \`\${rate}%\`, background: rate > 70 ? '#22c55e' : rate > 40 ? '#f59e0b' : '#ef4444', borderRadius: '4px' }} />
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                <span style={{ color: '#94a3b8' }}>Attempts: {platform.attempts}</span>
                <span style={{ color: '#22c55e' }}>✅ {platform.successes}</span>
                <span style={{ color: '#ef4444' }}>❌ {platform.failures}</span>
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
}
