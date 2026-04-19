"use client";
import React, { useState, useEffect } from "react";
import { Settings, CheckCircle, AlertCircle, Key, Globe, Cpu, User } from "lucide-react";

export default function SettingsPage() {
  const [form, setForm] = useState({
    twoCaptchaApiKey: '',
    deepSeekApiKey: '',
    geezekBaseUrl: '',
    defaultUsernamePrefix: '',
    proxyAddress: '',
    threadCount: 5,
  });
  const [status, setStatus] = useState({ hasTwoCaptcha: false, hasDeepSeek: false });
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/settings').then(r => r.json()).then(d => {
      setForm(f => ({
        ...f,
        geezekBaseUrl: d.geezekBaseUrl || '',
        defaultUsernamePrefix: d.defaultUsernamePrefix || '',
        proxyAddress: d.proxyAddress || '',
        threadCount: d.threadCount || 5,
      }));
      setStatus({ hasTwoCaptcha: d.hasTwoCaptcha, hasDeepSeek: d.hasDeepSeek });
      setLoading(false);
    });
  }, []);

  const save = async () => {
    const body: any = { ...form };
    // Don't overwrite existing keys if field is blank
    if (!body.twoCaptchaApiKey) delete body.twoCaptchaApiKey;
    if (!body.deepSeekApiKey) delete body.deepSeekApiKey;
    await fetch('/api/settings', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
    // Refetch status
    const d = await (await fetch('/api/settings')).json();
    setStatus({ hasTwoCaptcha: d.hasTwoCaptcha, hasDeepSeek: d.hasDeepSeek });
  };

  if (loading) return <div className="flex items-center justify-center h-screen text-neutral-400">Loading settings...</div>;

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 p-6 md:p-10">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-3 mb-10">
          <div className="w-10 h-10 rounded-xl bg-purple-600/20 flex items-center justify-center">
            <Settings className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Settings</h1>
            <p className="text-neutral-500 text-sm">Configure API keys and automation preferences</p>
          </div>
        </div>

        <div className="space-y-6">
          <Section title="API Keys" icon={<Key className="w-4 h-4 text-amber-400" />}>
            <Field label="2Captcha API Key" hint={status.hasTwoCaptcha ? '✅ Key is saved' : '⚠️ Not set'} hintColor={status.hasTwoCaptcha ? 'text-emerald-400' : 'text-amber-400'}>
              <input
                type="password" placeholder="Leave blank to keep existing key"
                className="input-field"
                value={form.twoCaptchaApiKey}
                onChange={e => setForm(f => ({ ...f, twoCaptchaApiKey: e.target.value }))}
              />
            </Field>
            <Field label="DeepSeek API Key" hint={status.hasDeepSeek ? '✅ Key is saved' : '⚠️ Not set'} hintColor={status.hasDeepSeek ? 'text-emerald-400' : 'text-amber-400'}>
              <input
                type="password" placeholder="Leave blank to keep existing key"
                className="input-field"
                value={form.deepSeekApiKey}
                onChange={e => setForm(f => ({ ...f, deepSeekApiKey: e.target.value }))}
              />
            </Field>
          </Section>

          <Section title="Email Provider" icon={<Globe className="w-4 h-4 text-blue-400" />}>
            <Field label="Geezek Base URL">
              <input type="url" className="input-field" value={form.geezekBaseUrl} onChange={e => setForm(f => ({ ...f, geezekBaseUrl: e.target.value }))} />
            </Field>
            <Field label="Default Username Prefix">
              <input type="text" className="input-field" value={form.defaultUsernamePrefix} onChange={e => setForm(f => ({ ...f, defaultUsernamePrefix: e.target.value }))} />
            </Field>
          </Section>

          <Section title="Automation" icon={<Cpu className="w-4 h-4 text-purple-400" />}>
            <Field label="Thread Count" hint="Parallel browser instances">
              <input type="number" min={1} max={20} className="input-field w-32" value={form.threadCount} onChange={e => setForm(f => ({ ...f, threadCount: parseInt(e.target.value) || 5 }))} />
            </Field>
            <Field label="Proxy Address" hint="Optional: http://user:pass@host:port">
              <input type="text" className="input-field" placeholder="Leave blank to disabled" value={form.proxyAddress} onChange={e => setForm(f => ({ ...f, proxyAddress: e.target.value }))} />
            </Field>
          </Section>

          <div className="flex items-center gap-4">
            <button
              onClick={save}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold transition-all shadow-lg hover:shadow-purple-500/25 hover:-translate-y-0.5"
            >
              Save Settings
            </button>
            {saved && (
              <div className="flex items-center gap-2 text-emerald-400 text-sm font-medium">
                <CheckCircle className="w-4 h-4" /> Settings saved!
              </div>
            )}
          </div>
        </div>
      </div>

      <style jsx>{`
        .input-field {
          width: 100%;
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 0.75rem;
          padding: 0.625rem 1rem;
          color: white;
          font-size: 0.875rem;
          outline: none;
          transition: border-color 0.2s;
        }
        .input-field:focus {
          border-color: rgba(168, 85, 247, 0.5);
        }
        .input-field::placeholder {
          color: #52525b;
        }
      `}</style>
    </div>
  );
}

function Section({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-neutral-800 bg-neutral-900/50 overflow-hidden">
      <div className="px-6 py-4 border-b border-neutral-800 flex items-center gap-2 bg-neutral-900/80">
        {icon}
        <h2 className="text-sm font-semibold text-neutral-200 uppercase tracking-wider">{title}</h2>
      </div>
      <div className="p-6 space-y-4">{children}</div>
    </div>
  );
}

function Field({ label, hint, hintColor = 'text-neutral-500', children }: { label: string; hint?: string; hintColor?: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <label className="text-sm font-medium text-neutral-300">{label}</label>
        {hint && <span className={`text-xs ${hintColor}`}>{hint}</span>}
      </div>
      {children}
    </div>
  );
}
