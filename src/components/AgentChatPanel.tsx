import React, { useState } from "react";
import { Send, Bot, User, ArrowRight } from "lucide-react";
import { FacilityState, ProposedSolution } from "../types";
import { getTranslation, Language } from "../i18n";

export type ChatPageId = "dashboard" | "twin" | "solutions" | "analytics";

interface AgentChatPanelProps {
  facility: FacilityState;
  solutions: Record<"A" | "B" | "C", ProposedSolution> | null;
  t: ReturnType<typeof getTranslation>;
  language: Language;
  /** Navigates to the given page — for "twin" with a scenario, also reveals
   *  that scenario there. Same handler the Solutions comparison cards use,
   *  so acting on a chat suggestion behaves identically to clicking there. */
  onNavigate: (page: ChatPageId, scenario?: "A" | "B" | "C") => void;
  /** "page": fills its container, no header chrome (used on the Home page).
   *  "compact": adds its own header bar (used in tighter contexts). */
  variant?: "page" | "compact";
}

interface ChatMessage {
  id: string;
  sender: "user" | "agent";
  text: string;
  timestamp: string;
  citations?: { id: string; title: string; snippet: string }[];
  suggestedNav?: { page: ChatPageId; scenario?: "A" | "B" | "C" };
}

/** Matches "Solution C" / "Option A" / "الحل C" etc. regardless of language --
 *  the solution letters themselves stay Latin A/B/C in both. Deliberately
 *  requires the solution/option word next to the letter so a question like
 *  "problem in zone A" doesn't get misread as naming Option A. */
function detectScenarioMention(text: string): "A" | "B" | "C" | null {
  const m = text.match(/(solution|option|scenario|الحل|الخيار|السيناريو)\s*[:\-]?\s*([abc])\b/i);
  return m ? (m[2].toUpperCase() as "A" | "B" | "C") : null;
}

/** Figures out which page (if any) would actually show what's being asked
 *  about, so the reply can offer a one-click way there instead of leaving
 *  the user to go find it themselves. Checked in this order because a
 *  named solution letter is the most specific signal available. */
function detectSuggestedNav(text: string): { page: ChatPageId; scenario?: "A" | "B" | "C" } | null {
  const scenario = detectScenarioMention(text);
  if (scenario) return { page: "twin", scenario };
  const q = text.toLowerCase();
  if (/\btwin\b|simulat|توأم|محاكا/.test(q)) return { page: "twin" };
  if (/compare|solutions matrix|candidate|قارن|مصفوفة|الحلول المرشحة/.test(q)) return { page: "solutions" };
  if (/chart|curve|24.?hour|load profile|analytics|منحنى|رسم بياني|٢٤ ساعة/.test(q)) return { page: "analytics" };
  if (/anomaly|recommend|dashboard|report|لوحة|توصية|شذوذ|تقرير/.test(q)) return { page: "dashboard" };
  return null;
}

export const AgentChatPanel: React.FC<AgentChatPanelProps> = ({
  facility,
  solutions,
  t,
  language,
  onNavigate,
  variant = "page",
}) => {
  const c = t.chat;
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "m-1",
      sender: "agent",
      text: c.greeting,
      timestamp: c.justNow,
    },
  ]);
  const [inputPrompt, setInputPrompt] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  // Which citation badge (by "<messageId>:<citationId>") currently has its
  // source excerpt expanded open beneath the message -- badges looked like
  // buttons but did nothing when clicked, so this is what clicking now does.
  const [openCitation, setOpenCitation] = useState<string | null>(null);

  const quickQuestions = c.quickQuestions;

  const handleSendMessage = async (textToSend?: string) => {
    const query = textToSend || inputPrompt.trim();
    if (!query || isLoading) return;

    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      sender: "user",
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputPrompt("");
    setIsLoading(true);

    try {
      const resp = await fetch("/api/agent/reason", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userPrompt: query,
          language,
          facilityData: {
            name: facility.config.name,
            baseline_kwh: facility.baseline_kwh,
            current_kwh: facility.current_kwh,
            variance_pct: Number((((facility.current_kwh - facility.baseline_kwh) / facility.baseline_kwh) * 100).toFixed(1)),
            hvac: facility.systems.hvac,
            working_hours: facility.config.working_hours,
            solution_a_saving_pct: solutions?.A.estimated_saving_pct,
            solution_b_saving_pct: solutions?.B.estimated_saving_pct,
            solution_c_saving_pct: solutions?.C.estimated_saving_pct,
          },
        }),
      });

      const data = await resp.json();
      const agentText: string =
        data?.analysis ||
        c.fallbackReply(solutions?.C.estimated_saving_kwh ?? "—");

      const agentMsg: ChatMessage = {
        id: `a-${Date.now()}`,
        sender: "agent",
        text: agentText,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        citations: data?.citations || [],
        suggestedNav: detectSuggestedNav(query) || detectSuggestedNav(agentText) || undefined,
      };

      setMessages((prev) => [...prev, agentMsg]);
    } catch {
      const fallbackMsg: ChatMessage = {
        id: `a-${Date.now()}`,
        sender: "agent",
        text: c.networkErrorReply,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, fallbackMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const pageLabel: Record<ChatPageId, string> = {
    dashboard: c.navDashboard,
    twin: c.navTwin,
    solutions: c.navSolutions,
    analytics: c.navAnalytics,
  };

  return (
    <div className={`flex flex-col h-full ${variant === "compact" ? "bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden" : ""}`}>
      {variant === "compact" && (
        <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
              {c.title} <span className="text-[10px] text-emerald-400 font-mono bg-emerald-950 px-1.5 py-0.2 rounded border border-emerald-800">{c.online}</span>
            </h3>
            <p className="text-[11px] text-slate-400">{c.subtitle}</p>
          </div>
        </div>
      )}

      {/* Quick Question Chips */}
      <div className="p-3 bg-slate-900/60 border-b border-slate-800/80 overflow-x-auto whitespace-nowrap scrollbar-none flex gap-2 shrink-0">
        {quickQuestions.map((q, idx) => (
          <button
            key={idx}
            onClick={() => handleSendMessage(q)}
            disabled={isLoading}
            className="text-[11px] px-2.5 py-1 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors shrink-0"
          >
            {q}
          </button>
        ))}
      </div>

      {/* Messages List */}
      <div className="flex-1 p-4 overflow-y-auto space-y-3.5 scrollbar-thin scrollbar-thumb-slate-800 min-h-0">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex gap-2.5 ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
          >
            {msg.sender === "agent" && (
              <div className="w-7 h-7 rounded-lg bg-emerald-950 text-emerald-400 border border-emerald-800 flex items-center justify-center shrink-0 mt-0.5">
                <Bot className="w-4 h-4" />
              </div>
            )}

            <div
              className={`p-3 rounded-2xl max-w-[85%] text-xs leading-relaxed ${
                msg.sender === "user"
                  ? "bg-teal-600 text-white rounded-br-none"
                  : "bg-slate-950 border border-slate-800 text-slate-200 rounded-bl-none"
              }`}
            >
              <div className="whitespace-pre-line">{msg.text}</div>
              {msg.suggestedNav && (
                <button
                  onClick={() => onNavigate(msg.suggestedNav!.page, msg.suggestedNav!.scenario)}
                  className="mt-2 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold bg-emerald-500 hover:bg-emerald-400 text-slate-950 transition-colors cursor-pointer"
                >
                  <span>
                    {msg.suggestedNav.scenario ? c.showInTwin(msg.suggestedNav.scenario) : pageLabel[msg.suggestedNav.page]}
                  </span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              )}
              {msg.citations && msg.citations.length > 0 && (
                <div className="mt-2 pt-2 border-t border-slate-800 flex flex-col gap-1.5">
                  <div className="flex flex-wrap gap-1.5">
                    {msg.citations.map((cite) => {
                      const key = `${msg.id}:${cite.id}`;
                      const isOpen = openCitation === key;
                      return (
                        <button
                          key={cite.id}
                          type="button"
                          onClick={() => setOpenCitation(isOpen ? null : key)}
                          aria-expanded={isOpen}
                          className={`text-[10px] px-1.5 py-0.5 rounded border transition-colors cursor-pointer ${
                            isOpen
                              ? "bg-teal-800/70 border-teal-600 text-teal-100"
                              : "bg-teal-950/60 border-teal-800/60 text-teal-300 hover:bg-teal-900/70 hover:text-teal-200"
                          }`}
                        >
                          📚 {cite.title}
                        </button>
                      );
                    })}
                  </div>
                  {msg.citations.map((cite) => {
                    const key = `${msg.id}:${cite.id}`;
                    if (openCitation !== key) return null;
                    return (
                      <div
                        key={cite.id}
                        className="text-[11px] text-slate-300 bg-teal-950/30 border border-teal-800/40 rounded-lg p-2 leading-relaxed"
                      >
                        {cite.snippet}
                      </div>
                    );
                  })}
                </div>
              )}
              <div
                className={`text-[10px] mt-1.5 text-right ${
                  msg.sender === "user" ? "text-teal-200" : "text-slate-500"
                }`}
              >
                {msg.timestamp}
              </div>
            </div>

            {msg.sender === "user" && (
              <div className="w-7 h-7 rounded-lg bg-teal-900 text-white flex items-center justify-center shrink-0 mt-0.5">
                <User className="w-4 h-4" />
              </div>
            )}
          </div>
        ))}

        {isLoading && (
          <div className="flex gap-2.5 items-center text-xs text-slate-400">
            <div className="w-7 h-7 rounded-lg bg-emerald-950 text-emerald-400 border border-emerald-800 flex items-center justify-center shrink-0">
              <Bot className="w-4 h-4" />
            </div>
            <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span>{c.thinkingReply}</span>
            </div>
          </div>
        )}
      </div>

      {/* Input Footer */}
      <div className="p-3 bg-slate-950 border-t border-slate-800 shrink-0">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            placeholder={c.placeholder}
            value={inputPrompt}
            onChange={(e) => setInputPrompt(e.target.value)}
            className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-teal-500"
          />
          <button
            type="submit"
            disabled={!inputPrompt.trim() || isLoading}
            className="p-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 disabled:opacity-40 transition-all cursor-pointer"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
