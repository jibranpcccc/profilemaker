"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Zap, Settings, Sparkles } from "lucide-react";

const LINKS = [
  { href: "/", label: "Profile Maker", icon: Zap },
  { href: "/humanizer", label: "Humanizer", icon: Sparkles },
  { href: "/settings", label: "Settings", icon: Settings },
];

export default function SideNav() {
  const pathname = usePathname();
  return (
    <aside className="fixed left-0 top-0 h-full w-16 md:w-48 glass-panel border-r border-white/5 flex flex-col py-6 z-50">
      <div className="px-4 mb-8 flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-700 flex items-center justify-center flex-shrink-0 shadow-[0_0_20px_rgba(139,92,246,0.4)] animate-pulse-glow">
          <Zap className="w-5 h-5 text-white" />
        </div>
        <span className="hidden md:block text-sm font-bold text-white tracking-tight">
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-white to-neutral-400">Profile</span>
          <br />
          <span className="text-violet-400 font-medium text-xs">Maker</span>
        </span>
      </div>
      <nav className="flex-1 px-3 space-y-2">
        {LINKS.map(({ href, label, icon: Icon }) => {
          const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <Link key={href} href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200
                ${active
                  ? "bg-violet-600/20 text-white border border-violet-500/20"
                  : "text-neutral-400 hover:text-white hover:bg-white/5 border border-transparent"
                }`}>
              <Icon className={`w-4 h-4 ${active ? "text-violet-400" : "text-neutral-500"}`} />
              <span className="hidden md:block text-sm font-medium">{label}</span>
            </Link>
          );
        })}
      </nav>
      <div className="px-4 hidden md:flex items-center gap-2 mt-auto pt-4 border-t border-white/5">
        <div className="w-2 h-2 rounded-full bg-emerald-500" />
        <span className="text-[10px] text-neutral-500 uppercase tracking-wider">Engine Ready</span>
      </div>
    </aside>
  );
}
