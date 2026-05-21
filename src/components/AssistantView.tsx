import React, { useState, useRef, useEffect } from "react";
import { 
  Send, 
  Cpu, 
  Sparkles, 
  Trash2, 
  ArrowRight, 
  ShieldAlert, 
  Compass, 
  Activity, 
  Terminal,
  FileText,
  Bookmark
} from "lucide-react";

interface Message {
  id: string;
  sender: "user" | "stadiumx";
  text: string;
  timestamp: string;
}

export default function AssistantView() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      sender: "stadiumx",
      text: "### 🌐 StadiumX AI Core Log\nAccess established. I am monitoring the mega-arena. Current telemetry shows **76,420 fans** inside.\n\n* **Crowd Flow**: Balanced. Pedestrian pressure at Gate C turnstiles is being resolved.\n* **Incident Alert**: Hazard cleanup active in Section 214.\n* **Roof Status**: Dome retracted (Open). Perfect meteorological indices.\n\nProvide command queries regarding navigation, parking capacities, automated emergency systems, or dispatch grids. I am standing by.",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }
  ]);
  const [inputVal, setInputVal] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const suggestionPrompts = [
    { title: "Generate PA Script", query: "Draft a high-priority evacuation PA system voice script for Gate C bottlenecks.", icon: ShieldAlert },
    { title: "Parking Distribution", query: "What is the parking matrix right now? Recommend routing strategies.", icon: Compass },
    { title: "Sector 214 Safety", query: "Draft an action summary for the Concourse Level 2 Sect 214 fluid spill hazard.", icon: FileText },
  ];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const handleSendMessage = async (customText?: string) => {
    const textToSend = customText || inputVal;
    if (!textToSend.trim() || loading) return;

    const userMsg: Message = {
      id: `usr-${Date.now()}`,
      sender: "user",
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!customText) setInputVal("");
    setLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: textToSend }),
      });
      const data = await response.json();

      const botMsg: Message = {
        id: `bot-${Date.now()}`,
        sender: "stadiumx",
        text: data.text || "Connection glitch timed out. Emergency local telemetry simulated instead.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, botMsg]);
    } catch (err) {
      console.error("AI Core query error:", err);
      // Simulated response if API route fails
      const fallbackMsg: Message = {
        id: `bot-fallback-${Date.now()}`,
        sender: "stadiumx",
        text: `### ⚠️ Connection Diagnostic Drift\nDirect link to physical cloud core disrupted. Simulating localized operational directive:\n\n* **Primary Suggestion**: Gate C bottlenecks resolved via alternate door activations.\n* **Local Action**: Standby for standard telemetry telemetry update.\n\n*Command terminal standing by offline.*`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, fallbackMsg]);
    } finally {
      setLoading(false);
    }
  };

  const clearChat = () => {
    if (window.confirm("Confirm deletion of AI diagnostic chat logs?")) {
      setMessages([
        {
          id: "welcome-fresh",
          sender: "stadiumx",
          text: "### 🌐 StadiumX AI Core Log Reset Complete.\nOperational sensors normal. Suggest queries or override scripts.",
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        }
      ]);
    }
  };

  // Convert markdown-ish to beautiful HTML
  const formatText = (text: string) => {
    return text.split("\n").map((line, index) => {
      // Headers
      if (line.startsWith("### ")) {
        return <h3 key={index} className="text-white font-bold text-sm tracking-wide mt-3 mb-1 font-mono uppercase text-neon-blue">{line.substring(4)}</h3>;
      }
      if (line.startsWith("## ")) {
        return <h2 key={index} className="text-white font-bold text-base tracking-wide mt-4 mb-2 font-mono text-neon-purple">{line.substring(3)}</h2>;
      }
      // Bullet points
      if (line.startsWith("* ") || line.startsWith("- ")) {
        const payload = line.substring(2);
        // Look for bold highlights
        return (
          <li key={index} className="ml-4 list-disc text-slate-300 text-xs leading-relaxed my-1">
            {renderBoldText(payload)}
          </li>
        );
      }
      // Standard paragraph
      return line.trim() ? (
        <p key={index} className="text-xs text-slate-300 leading-relaxed my-1.5">
          {renderBoldText(line)}
        </p>
      ) : <div key={index} className="h-2" />;
    });
  };

  // Helper helper to format standard bold stars **text**
  const renderBoldText = (text: string) => {
    const parts = text.split(/\*\*(.*?)\*\*/g);
    return parts.map((part, index) => {
      if (index % 2 === 1) {
        return <strong key={index} className="text-white font-semibold font-mono">{part}</strong>;
      }
      return part;
    });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8" id="stadium-ai-assistant">
      {/* Main Command Intelligence Panel */}
      <div className="lg:col-span-8 bg-black/40 border border-white/10 rounded-3xl flex flex-col justify-between h-[640px] relative overflow-hidden">
        
        {/* Gridi background */}
        <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: "radial-gradient(#bc13fe 0.5px, transparent 0.5px)", backgroundSize: "20px 20px" }}></div>
        
        {/* Header toolbar */}
        <div className="p-4 bg-cyber-dark/45 border-b border-white/10 flex items-center justify-between relative z-10">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-neon-purple/10 border border-neon-purple/20 flex items-center justify-center text-neon-purple shadow-[0_0_12px_rgba(188,19,254,0.15)]">
              <Cpu className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-white font-bold text-sm tracking-wide">StadiumX AI Core</span>
                <span className="px-1.5 py-0.5 rounded bg-cyan-400/10 text-cyan-400 text-[9px] uppercase font-bold tracking-widest border border-cyan-400/20">
                  COGNITIVE LINK: ACTIVE
                </span>
              </div>
              <span className="text-[10px] text-gray-400 font-mono">Powered by Gemini 3.5 Flash Operations Module</span>
            </div>
          </div>

          <button 
            onClick={clearChat}
            className="p-2 border border-white/10 rounded-lg text-gray-400 hover:text-red-400 hover:border-red-500/30 transition cursor-pointer"
            title="Purge chat log memory grid"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>

        {/* Message Flows */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5 relative z-10">
          {messages.map((msg) => (
            <div 
              key={msg.id} 
              className={`flex items-start gap-4 ${msg.sender === "user" ? "flex-row-reverse" : ""}`}
            >
              {/* Avatar indicator */}
              <div className={`p-2.5 rounded-xl border flex-shrink-0 font-mono text-[10px] font-bold ${
                msg.sender === "user" 
                  ? "bg-white/5 border-white/20 text-white" 
                  : "bg-neon-purple/10 border-neon-purple/20 text-neon-purple"
              }`}>
                {msg.sender === "user" ? "OP" : "SX"}
              </div>

              {/* Text Bubble */}
              <div className={`rounded-2xl p-4 max-w-[85%] text-xs font-sans ${
                msg.sender === "user" 
                  ? "bg-gradient-to-br from-cyan-950/40 to-blue-950/40 text-slate-100 border border-cyan-500/20" 
                  : "bg-white/5 backdrop-blur-xl border border-white/10"
              }`}>
                {formatText(msg.text)}
                <div className="text-[9px] text-gray-500 font-mono mt-2 text-right">
                  {msg.timestamp}
                </div>
              </div>
            </div>
          ))}

          {/* Prompting animation loader */}
          {loading && (
            <div className="flex items-start gap-4">
              <div className="p-2.5 rounded-xl bg-neon-purple/10 border border-neon-purple/20 text-neon-purple font-mono text-[10px]">
                SX
              </div>
              <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                <div className="flex space-x-2">
                  <div className="w-2 h-2 bg-neon-purple rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-neon-purple rounded-full animate-bounce [animation-delay:0.2s]"></div>
                  <div className="w-2 h-2 bg-neon-purple rounded-full animate-bounce [animation-delay:0.4s]"></div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Console Input Bar */}
        <div className="p-4 bg-cyber-dark/45 border-t border-white/10 relative z-10">
          <form 
            onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }}
            className="flex items-center gap-3"
          >
            <input 
              type="text" 
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              placeholder="Inject tactical queries into intelligence grid..." 
              className="flex-1 bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-neon-purple focus:shadow-[0_0_10px_rgba(188,19,254,0.15)] transition"
            />
            <button 
              type="submit"
              disabled={loading || !inputVal.trim()}
              className="p-3 bg-gradient-to-r from-cyan-600 to-blue-600 hover:opacity-90 disabled:opacity-40 text-white rounded-xl transition cursor-pointer flex-shrink-0"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>

      {/* Suggestion Prompts Sidebar */}
      <div className="lg:col-span-4 space-y-6">
        <div className="glass-panel p-6 rounded-3xl border border-white/10 space-y-4">
          <div className="border-b border-white/10 pb-4">
            <h3 className="font-sans font-bold text-white text-base">Quick Directives</h3>
            <p className="text-gray-400 text-xs">Inject pre-processed prompt packages instantly</p>
          </div>

          <div className="space-y-3">
            {suggestionPrompts.map((p, idx) => {
              const Icon = p.icon;
              return (
                <button
                  key={idx}
                  onClick={() => handleSendMessage(p.query)}
                  className="w-full text-left p-3.5 bg-white/5 border border-white/10 hover:border-neon-purple/40 hover:bg-white/10 rounded-2xl transition group flex items-start space-x-3 cursor-pointer"
                >
                  <div className="p-2 bg-white/5 rounded-lg border border-white/10 text-gray-400 group-hover:text-neon-purple group-hover:border-neon-purple/20 transition-colors flex-shrink-0">
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-sans font-bold text-white text-xs group-hover:text-neon-purple block mb-0.5 transition-colors">
                      {p.title}
                    </span>
                    <span className="text-[11px] text-gray-400 leading-relaxed block overflow-hidden line-clamp-2">
                      {p.query}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Cognitive Context telemetry readout card */}
        <div className="glass-panel p-6 rounded-3xl border border-white/10 space-y-4">
          <div className="border-b border-white/10 pb-3">
            <h3 className="font-sans font-bold text-white text-xs uppercase tracking-wider">AI Memory State</h3>
          </div>
          <div className="space-y-3 text-xs font-mono">
            <div className="flex justify-between items-center text-[11px]">
              <span className="text-gray-400">CONTEXT TOKEN POOL</span>
              <span className="text-white">128K / 1.0M</span>
            </div>
            <div className="flex justify-between items-center text-[11px]">
              <span className="text-gray-400">LATENCY TO DISPATCH</span>
              <span className="text-cyan-400">0.9 seconds</span>
            </div>
            <div className="flex justify-between items-center text-[11px]">
              <span className="text-gray-400">PA OVERRIDE LINK</span>
              <span className="text-emerald-400 font-bold">SECURED</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
