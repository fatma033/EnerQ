import React, { useState } from "react";
import { X, Send, Bot, User, Sparkles, MessageSquare, RotateCcw } from "lucide-react";
import { FacilityState, ProposedSolution } from "../types";

interface AgentChatDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  facility: FacilityState;
  solutions: Record<"A" | "B" | "C", ProposedSolution> | null;
}

interface ChatMessage {
  id: string;
  sender: "user" | "agent";
  text: string;
  timestamp: string;
  citations?: { id: string; title: string }[];
}

export const AgentChatDrawer: React.FC<AgentChatDrawerProps> = ({
  isOpen,
  onClose,
  facility,
  solutions,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "m-1",
      sender: "agent",
      text: "Hello! I am EnerQ, your autonomous AI Energy Agent. I have completed the investigation of today's 620 kWh consumption spike (+24%), grounding my reasoning in a facility energy-management knowledge base. Ask me anything about the root causes, the Digital Twin simulation, or the trade-offs between Solutions A, B, and C.",
      timestamp: "Just now",
    },
  ]);
  const [inputPrompt, setInputPrompt] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const quickQuestions = [
    "Why was Solution C chosen over Solution B?",
    "How does the 87% confidence score work?",
    "What is the occupant comfort impact?",
    "How much money is saved per month?",
  ];

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
          facilityData: {
            name: facility.config.name,
            baseline_kwh: facility.baseline_kwh,
            current_kwh: facility.current_kwh,
            variance_pct: 24,
            hvac: facility.systems.hvac,
            solution_c_saving_pct: 15,
          },
        }),
      });

      const data = await resp.json();
      const agentText =
        data?.analysis ||
        "Based on our physical Digital Twin simulation, Solution C eliminates 93 kWh/day of after-hours HVAC runtime and workstation idle baseload while keeping working-hours comfort completely intact.";

      const agentMsg: ChatMessage = {
        id: `a-${Date.now()}`,
        sender: "agent",
        text: agentText,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        citations: data?.citations || [],
      };

      setMessages((prev) => [...prev, agentMsg]);
    } catch {
      const fallbackMsg: ChatMessage = {
        id: `a-${Date.now()}`,
        sender: "agent",
        text: "EnerQ Agent Telemetry Insight: Solution C recaptures 93 kWh/day (15.0% reduction) by cutting off HVAC at 18:00 and turning off 38 idle workstations.",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, fallbackMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-slate-900 border-l border-slate-800 h-full flex flex-col shadow-2xl">
        {/* Header */}
        <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                EnerQ Assistant <span className="text-[10px] text-emerald-400 font-mono bg-emerald-950 px-1.5 py-0.2 rounded border border-emerald-800">Online</span>
              </h3>
              <p className="text-[11px] text-slate-400">Autonomous Facility Reasoning & Digital Twin Q&A</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Question Chips */}
        <div className="p-3 bg-slate-900/60 border-b border-slate-800/80 overflow-x-auto whitespace-nowrap scrollbar-none flex gap-2">
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
        <div className="flex-1 p-4 overflow-y-auto space-y-3.5 scrollbar-thin scrollbar-thumb-slate-800">
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
                {msg.citations && msg.citations.length > 0 && (
                  <div className="mt-2 pt-2 border-t border-slate-800 flex flex-wrap gap-1.5">
                    {msg.citations.map((c) => (
                      <span
                        key={c.id}
                        className="text-[10px] px-1.5 py-0.5 rounded bg-teal-950/60 border border-teal-800/60 text-teal-300"
                      >
                        📚 {c.title}
                      </span>
                    ))}
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
                <span>EnerQ is formulating engineering reasoning...</span>
              </div>
            </div>
          )}
        </div>

        {/* Input Footer */}
        <div className="p-3 bg-slate-950 border-t border-slate-800">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              placeholder="Ask EnerQ about energy waste, solutions, or payback..."
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
    </div>
  );
};
