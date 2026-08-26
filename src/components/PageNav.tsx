import React from "react";
import { MessageSquare, LayoutDashboard, Cpu, Scale, TrendingUp } from "lucide-react";
import { getTranslation } from "../i18n";

export type PageId = "home" | "dashboard" | "twin" | "solutions" | "analytics";

interface PageNavProps {
  page: PageId;
  onNavigate: (page: PageId) => void;
  t: ReturnType<typeof getTranslation>;
}

/**
 * Top-level page navigation. "home" (the chat) is deliberately styled as
 * the lead item -- larger, brighter, first -- since it's the page most
 * people open first and the one the whole system gets evaluated through.
 * The other four are the operational views, visually secondary but still
 * one click away at all times.
 */
export const PageNav: React.FC<PageNavProps> = ({ page, onNavigate, t }) => {
  const n = t.nav;

  const items: { id: PageId; label: string; icon: React.ReactNode }[] = [
    { id: "dashboard", label: n.dashboard, icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: "twin", label: n.twin, icon: <Cpu className="w-4 h-4" /> },
    { id: "solutions", label: n.solutions, icon: <Scale className="w-4 h-4" /> },
    { id: "analytics", label: n.analytics, icon: <TrendingUp className="w-4 h-4" /> },
  ];

  return (
    <nav className="bg-slate-900/80 border-b border-slate-800 px-4 lg:px-8">
      <div className="max-w-7xl mx-auto flex items-center gap-1.5 py-2 overflow-x-auto scrollbar-none">
        <button
          id="nav-home"
          onClick={() => onNavigate("home")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold shrink-0 transition-all ${
            page === "home"
              ? "bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/25"
              : "bg-slate-800/80 text-emerald-300 hover:bg-slate-800 border border-emerald-800/50"
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          {n.home}
        </button>

        <span className="w-px h-6 bg-slate-800 mx-1 shrink-0" />

        {items.map((item) => (
          <button
            key={item.id}
            id={`nav-${item.id}`}
            onClick={() => onNavigate(item.id)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold shrink-0 transition-all ${
              page === item.id
                ? "bg-slate-800 text-white border border-slate-700"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
            }`}
          >
            {item.icon}
            {item.label}
          </button>
        ))}
      </div>
    </nav>
  );
};
