import React, { useState } from "react";
import { 
  Sliders, 
  Plus, 
  HelpCircle, 
  Users, 
  BarChart2, 
  Radio, 
  ShieldAlert, 
  Zap,
  RotateCcw,
  Check
} from "lucide-react";
import { TelemetryData } from "../types";

interface AdminViewProps {
  telemetry: TelemetryData;
  setTelemetry: React.Dispatch<React.SetStateAction<TelemetryData>>;
  onDispatchIncident: (type: string, section: string, description: string, severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL") => void;
  onTriggerEvacuation: (enabled: boolean) => void;
}

export default function AdminView({ 
  telemetry, 
  setTelemetry, 
  onDispatchIncident,
  onTriggerEvacuation
}: AdminViewProps) {
  // New incident inputs
  const [incType, setIncType] = useState("CROWD_CONGESTION");
  const [incSection, setIncSection] = useState("Gate C Exterior");
  const [incSeverity, setIncSeverity] = useState<"LOW" | "MEDIUM" | "HIGH" | "CRITICAL">("MEDIUM");
  const [incDesc, setIncDesc] = useState("Turnstile sensor anomalies restricting flow density.");
  const [newPostLogged, setNewPostLogged] = useState(false);

  // Manual values modifiers
  const handleAttendanceSlider = (val: number) => {
    setTelemetry(prev => ({
      ...prev,
      attendance: val
    }));
  };

  const handleGateLatencySlider = (gate: string, val: number) => {
    setTelemetry(prev => ({
      ...prev,
      gateLatencies: {
        ...prev.gateLatencies,
        [gate]: val
      }
    }));
  };

  const handleSubmitIncident = (e: React.FormEvent) => {
    e.preventDefault();
    if (!incType || !incSection || !incDesc) return;
    onDispatchIncident(incType, incSection, incDesc, incSeverity);
    
    setNewPostLogged(true);
    setTimeout(() => setNewPostLogged(false), 3000);
    
    // Clear description
    setIncDesc("");
  };

  const handleResetTelemetry = () => {
    if (window.confirm("Reset all arena simulation telemetry to initial template?")) {
      setTelemetry({
        attendance: 76420,
        maxCapacity: 80000,
        gateLatencies: { A: 2.1, B: 3.5, C: 6.5, D: 1.8, E: 2.4, F: 4.0 },
        activeIncidents: [
          {
            id: "inc-101",
            section: "Concourse Sec 214",
            type: "MANDATORY_HAZARD",
            description: "Minor liquid spill hazard on high-traffic walk-path",
            status: "DISPATCHED",
            severity: "LOW",
            timestamp: new Date().toISOString(),
          },
          {
            id: "inc-102",
            section: "Gate Gate C Exterior",
            type: "CROWD_CONGESTION",
            description: "Severe pedestrian bottleneck due to turned-stile sensor drift",
            status: "IN_PROGRESS",
            severity: "MEDIUM",
            timestamp: new Date().toISOString(),
          }
        ],
        parkingStatus: {
          northLot: { capacity: 5000, filled: 4910, state: "CRITICAL" },
          southGarage: { capacity: 8000, filled: 6560, state: "STABLE" },
          vipEast: { capacity: 1500, filled: 1365, state: "HIGH" },
          westExpress: { capacity: 3500, filled: 1420, state: "OPEN" },
        },
        evacuationLock: false,
      });
    }
  };

  return (
    <div className="space-y-8" id="stadium-admin-view">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-sans tracking-wide text-white">
            Simulation Controller
          </h1>
          <p className="text-gray-400 text-sm">
            Tweak mathematical models, simulate incident reports, and calibrate sensors.
          </p>
        </div>

        <button
          onClick={handleResetTelemetry}
          className="p-2.5 px-4 bg-white/5 border border-white/10 hover:border-white/20 hover:bg-white/10 rounded-xl cursor-pointer text-xs font-mono font-bold text-gray-300 flex items-center gap-1.5 transition"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset Arena Metrics</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Math Models adjustments - Gate latency & attendance sliders */}
        <div className="lg:col-span-7 bg-black/40 border border-white/10 rounded-3xl p-6 space-y-6">
          <div className="border-b border-white/10 pb-4 flex items-center justify-between">
            <div>
              <h3 className="font-sans font-bold text-lg text-white">Grid Mathematical Modifiers</h3>
              <p className="text-gray-400 text-xs">Simulate physical stress directly to live charts</p>
            </div>
            <Sliders className="w-5 h-5 text-cyan-400" />
          </div>

          <div className="space-y-6">
            {/* Live attendance sliders */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs font-mono text-gray-300">
                <span className="flex items-center space-x-1.5">
                  <Users className="w-4 h-4 text-cyan-400" />
                  <span>Interactive Headcount</span>
                </span>
                <span className="text-white font-bold">{telemetry.attendance.toLocaleString()} / 80,000 Fans</span>
              </div>
              <input 
                type="range"
                min="10000"
                max="80000"
                step="500"
                value={telemetry.attendance}
                onChange={(e) => handleAttendanceSlider(Number(e.target.value))}
                className="w-full h-1.5 bg-gray-900 rounded-lg appearance-none cursor-pointer accent-cyan-400"
              />
              <div className="flex justify-between text-[10px] text-gray-500 font-mono">
                <span>10,000 fans (Closed/Practice)</span>
                <span>80,000 fans (Full capacity maximum)</span>
              </div>
            </div>

            {/* Ingress wait times custom sliders */}
            <div className="space-y-4 pt-4 border-t border-white/5">
              <h4 className="text-xs font-mono font-bold text-white uppercase tracking-wider flex items-center space-x-1.5">
                <BarChart2 className="w-4 h-4 text-neon-purple" />
                <span>Adjust Gate Latency Coordinates (minutes)</span>
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {Object.entries(telemetry.gateLatencies).map(([gate, latency]) => (
                  <div key={gate} className="bg-white/5 p-3.5 rounded-2xl border border-white/5 space-y-2">
                    <div className="flex justify-between text-xs font-mono">
                      <span className="text-gray-300 font-bold">Gate {gate}</span>
                      <span className={latency > 5 ? "text-red-400 font-bold animate-pulse" : "text-cyan-400"}>
                        {latency} min Wait
                      </span>
                    </div>
                    <input 
                      type="range"
                      min="1.0"
                      max="15.0"
                      step="0.1"
                      value={latency}
                      onChange={(e) => handleGateLatencySlider(gate, Number(e.target.value))}
                      className="w-full h-1 bg-gray-950 rounded-lg appearance-none cursor-pointer accent-neon-purple"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Dispatch generator trigger form */}
        <div className="lg:col-span-5 bg-white/5 border border-white/10 rounded-3xl p-6 flex flex-col justify-between">
          <div>
            <div className="border-b border-white/10 pb-4 flex items-center justify-between">
              <div>
                <h3 className="font-sans font-bold text-lg text-white">Inject Artificial Incident</h3>
                <p className="text-gray-400 text-xs">Instantly log active dispatches securely to DB</p>
              </div>
              <Plus className="w-5 h-5 text-neon-purple animate-pulse" />
            </div>

            <form onSubmit={handleSubmitIncident} className="space-y-4 mt-6">
              {/* Type selection */}
              <div>
                <label className="text-[10px] text-gray-400 font-mono tracking-wider block mb-1">INCIDENT CATEGORY</label>
                <select
                  value={incType}
                  onChange={(e) => setIncType(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-neon-purple transition"
                >
                  <option value="CROWD_CONGESTION">CROWD_CONGESTION</option>
                  <option value="MANDATORY_HAZARD">MANDATORY_HAZARD</option>
                  <option value="DEVICE_MALFUNCTION">DEVICE_MALFUNCTION</option>
                  <option value="SECURITY_INTEGRITY">SECURITY_INTEGRITY</option>
                  <option value="MEDICAL_DISPATCH">MEDICAL_DISPATCH</option>
                </select>
              </div>

              {/* Coordinates Section */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-gray-400 font-mono tracking-wider block mb-1">TARGET COORIDINATE</label>
                  <input
                    type="text"
                    value={incSection}
                    onChange={(e) => setIncSection(e.target.value)}
                    required
                    placeholder="e.g. Section 202"
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-neon-purple transition"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-gray-400 font-mono tracking-wider block mb-1">SEVERITY LEVEL</label>
                  <select
                    value={incSeverity}
                    onChange={(e) => setIncSeverity(e.target.value as any)}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-neon-purple transition"
                  >
                    <option value="LOW">LOW</option>
                    <option value="MEDIUM">MEDIUM</option>
                    <option value="HIGH">HIGH</option>
                    <option value="CRITICAL">CRITICAL</option>
                  </select>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="text-[10px] text-gray-400 font-mono tracking-wider block mb-1">INCIDENT DETAILS</label>
                <textarea
                  value={incDesc}
                  onChange={(e) => setIncDesc(e.target.value)}
                  required
                  placeholder="Detail operations instructions..."
                  rows={3}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-neon-purple transition"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-gradient-to-r from-cyan-600 to-blue-600 hover:opacity-90 font-bold text-white text-xs tracking-wider rounded-xl transition cursor-pointer flex items-center justify-center gap-2"
              >
                <span>Dispatch Artificial Event</span>
                <Plus className="w-4 h-4" />
              </button>
            </form>
          </div>

          {newPostLogged && (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-center gap-2 mt-4 text-emerald-400 text-xs font-mono animate-fade-in animate-pulse">
              <Check className="w-4 h-4 text-emerald-400" />
              <span>Event dispatched safely to live telemetry!</span>
            </div>
          )}

          <div className="text-[10px] text-gray-500 font-mono text-center mt-6">
            *Injected events propagate immediately across the Dashboard and live Map.*
          </div>
        </div>
      </div>
    </div>
  );
}
