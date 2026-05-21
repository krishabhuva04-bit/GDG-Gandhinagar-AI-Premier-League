import React, { useState } from "react";
import { 
  ShieldAlert, 
  Wifi, 
  Users, 
  MapPin, 
  Radio, 
  Play, 
  Square, 
  CheckCircle2, 
  Zap, 
  Crosshair,
  Volume2,
  Bell,
  RefreshCw
} from "lucide-react";
import { TelemetryData, Incident } from "../types";

interface EmergencyViewProps {
  telemetry: TelemetryData;
  onClearIncident: (id: string) => void;
  onUpdateIncidentStatus: (id: string, status: "DISPATCHED" | "IN_PROGRESS" | "RESOLVED") => void;
  onTriggerEvacuation: (enabled: boolean) => void;
  onRefreshData: () => void;
}

export default function EmergencyView({ 
  telemetry, 
  onClearIncident, 
  onUpdateIncidentStatus, 
  onTriggerEvacuation,
  onRefreshData
}: EmergencyViewProps) {
  const [broadcastingText, setBroadcastingText] = useState("EMERGENCY DRILL TRIGGERED: PLEASE EGRESS IMMEDIATELY.");
  const [dronesDeployCount, setDronesDeployCount] = useState(8);

  const activeIncidents = telemetry.activeIncidents.filter(i => i.status !== "RESOLVED");

  // Mock safety checkpoints
  const checkpoints = [
    { zone: "Gate 1", status: "Nominal", throughput: "120/min" },
    { zone: "Gate C Turnstiles", status: "Critical Bottleneck", throughput: "20/min" },
    { zone: "Gate 4 Bypass", status: "Evacuation Ready", throughput: "0/min" },
    { zone: "Gate F Tunnel", status: "Nominal", throughput: "95/min" },
  ];

  return (
    <div className="space-y-8" id="stadium-emergency-view">
      {/* Upper Status indicators */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-sans tracking-wide text-white">
            Emergency Dispatch Center
          </h1>
          <p className="text-gray-400 text-sm">
            Arena crisis simulation, droid surveillance tracks, and PA system controls.
          </p>
        </div>

        <button
          onClick={onRefreshData}
          className="p-2 px-4 bg-white/5 border border-white/10 hover:border-white/20 text-xs font-mono font-bold text-white rounded-xl cursor-pointer transition flex items-center gap-1.5"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Synchronize Incident Feed</span>
        </button>
      </div>

      {/* Evacuation Control Center (High-Impact Row) */}
      <div className={`glass-panel rounded-3xl p-6 border transition-all duration-500 relative overflow-hidden ${
        telemetry.evacuationLock 
          ? "neon-border-purple bg-red-950/20 shadow-[0_0_30px_rgba(239,68,68,0.15)]" 
          : "border-white/10"
      }`}>
        {/* Absolute ambient lights */}
        <div className="absolute right-0 top-0 w-1/3 h-full bg-radial-gradient from-rose-500/10 to-transparent pointer-events-none" />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
          <div className="lg:col-span-8 space-y-4">
            <div className="inline-flex items-center space-x-2 bg-red-500/10 border border-red-500/30 text-rose-400 font-mono text-xs px-3 py-1.5 rounded-full tracking-widest uppercase">
              <Zap className="w-3.5 h-3.5 animate-bounce" />
              <span>FAIL-SAFE OPERATIONS SIMULATOR</span>
            </div>
            
            <h2 className="text-2xl font-bold text-white font-sans">
              Global Arena Evacuation Trigger
            </h2>
            
            <p className="text-slate-300 text-xs leading-relaxed max-w-2xl">
              Activating stadium evacuation unlocks the perimeter exit lanes, signals wayfinding signage with automated arrow guides, and broadcasts priority audio alarms. Recommended only during scheduled exercises or critical physical hazards.
            </p>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <input
                type="text"
                value={broadcastingText}
                onChange={(e) => setBroadcastingText(e.target.value)}
                placeholder="Broadcast instruction alert..."
                disabled={!telemetry.evacuationLock}
                className="bg-black/60 border border-white/10 text-xs text-white rounded-xl px-4 py-3 sm:w-80 disabled:opacity-50 text-gray-300"
              />
              <span className="text-[10px] text-gray-500 font-mono">
                PA DEPLOY LINK: ACTIVE
              </span>
            </div>
          </div>

          <div className="lg:col-span-4 flex flex-col items-center justify-center p-4 bg-black/40 border border-white/5 rounded-2xl">
            {telemetry.evacuationLock ? (
              <div className="text-center space-y-4 w-full">
                <div className="flex justify-center">
                  <span className="absolute animate-ping inline-flex h-12 w-12 rounded-full bg-rose-400 opacity-30"></span>
                  <div className="h-16 w-16 rounded-full bg-rose-600 flex items-center justify-center border border-white text-white">
                    <ShieldAlert className="w-8 h-8 animate-spin" />
                  </div>
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] font-mono font-bold text-red-400 uppercase tracking-widest">SIRENS DRILL ON</span>
                  <h4 className="text-white font-bold text-sm">Egress Signs Overridden</h4>
                </div>
                <button
                  onClick={() => onTriggerEvacuation(false)}
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-mono font-bold text-xs rounded-xl tracking-wider uppercase transition shadow-md cursor-pointer"
                  id="btn-trigger-evac-cancel"
                >
                  Terminate Evacuation Drill
                </button>
              </div>
            ) : (
              <div className="text-center space-y-4 w-full">
                <div className="h-16 w-16 mx-auto rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-gray-400">
                  <Bell className="w-7 h-7" />
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] font-mono font-bold text-gray-500 uppercase tracking-widest">STANDBY STATUS</span>
                  <h4 className="text-white font-bold text-sm">System Ready</h4>
                </div>
                <button
                  onClick={() => onTriggerEvacuation(true)}
                  className="w-full py-2.5 bg-gradient-to-r from-red-600 to-rose-600 hover:opacity-90 text-white font-mono font-bold text-xs rounded-xl tracking-wider uppercase transition shadow-md cursor-pointer"
                  id="btn-trigger-evac-start"
                >
                  Initiate Evacuation Drill
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Grid: Incident Handling Center and Tactical Maps */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Incident Resolution Feed */}
        <div className="lg:col-span-8 bg-black/40 border border-white/10 rounded-3xl p-6 flex flex-col justify-between">
          <div className="space-y-6">
            <div className="border-b border-white/10 pb-4 flex justify-between items-center">
              <div>
                <h3 className="font-sans font-bold text-lg text-white">Active Incident Log (Simulator Hub)</h3>
                <p className="text-gray-400 text-xs font-mono">Dispatched assets on operational safety grids</p>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                {activeIncidents.length} IN PROGRESS
              </span>
            </div>

            <div className="space-y-4 max-h-[360px] overflow-y-auto pr-1">
              {activeIncidents.length === 0 ? (
                <div className="text-center py-16 text-gray-500 text-xs font-mono space-y-2">
                  <div>✅ CLEAR SHEET: No ongoing incidents tracked.</div>
                  <button 
                    onClick={onRefreshData}
                    className="text-cyan-400 hover:underline hover:text-cyan-300"
                  >
                    Force query updates
                  </button>
                </div>
              ) : (
                activeIncidents.map((incident) => (
                  <div 
                    key={incident.id}
                    className={`p-4 bg-white/5 border rounded-2xl text-xs font-mono space-y-3 transition-colors ${
                      incident.severity === "CRITICAL" ? "border-red-500/30 bg-red-950/10" : "border-white/5"
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/5 pb-2.5">
                      <div className="flex items-center space-x-2.5">
                        <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                          incident.severity === "CRITICAL" ? "bg-red-500/20 text-red-400 border border-red-500/30" :
                          incident.severity === "HIGH" ? "bg-orange-500/20 text-orange-400 border border-orange-500/30" :
                          incident.severity === "MEDIUM" ? "bg-amber-500/20 text-amber-400 border border-amber-500/30" :
                          "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30"
                        }`}>
                          {incident.severity}
                        </span>
                        <span className="text-white font-bold">{incident.type}</span>
                        <span className="text-[9px] text-gray-500">{incident.id}</span>
                      </div>
                      
                      <div className="text-[10px] text-gray-400">
                        🌐 {incident.section}
                      </div>
                    </div>

                    <p className="text-xs text-slate-300 font-sans leading-relaxed">
                      {incident.description}
                    </p>

                    <div className="flex items-center justify-between pt-2 border-t border-white/5 text-[10px]">
                      <div className="flex items-center space-x-1">
                        <span className="text-gray-500">STATUS:</span>
                        <span className="text-cyan-300 font-bold">{incident.status}</span>
                      </div>

                      {/* Interactive incident status triggers */}
                      <div className="flex items-center space-x-2">
                        {incident.status === "DISPATCHED" && (
                          <button
                            onClick={() => onUpdateIncidentStatus(incident.id, "IN_PROGRESS")}
                            className="p-1 px-2.5 bg-amber-500/25 hover:bg-amber-500/40 border border-amber-500/30 text-amber-300 rounded cursor-pointer transition text-[9px] tracking-wide"
                          >
                            Mark: In Progress
                          </button>
                        )}
                        <button
                          onClick={() => onClearIncident(incident.id)}
                          className="p-1 px-2.5 bg-emerald-500/25 hover:bg-emerald-500/40 border border-emerald-500/30 text-emerald-300 rounded cursor-pointer transition text-[9px] tracking-wide flex items-center gap-1"
                        >
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Clear Incident</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="border-t border-white/10 pt-4 mt-6 text-2xs text-gray-500 font-mono flex items-center justify-between">
            <span>DISPATCH NETWORK FEED DIRECTLY TIED TO HOST DB</span>
            <span>SIMULATION LEVEL 1</span>
          </div>
        </div>

        {/* Tactical Info Panel and Drone list */}
        <div className="lg:col-span-4 bg-white/5 border border-white/10 rounded-3xl p-6 space-y-6 flex flex-col justify-between">
          <div className="space-y-6">
            <div className="border-b border-white/10 pb-4">
              <h3 className="font-sans font-bold text-lg text-white">Visual Drone Surveillance</h3>
              <p className="text-gray-400 text-xs">Simulated optical droid statuses</p>
            </div>

            {/* Simulated live visual drone feed container */}
            <div className="relative h-44 rounded-2xl bg-black border border-white/15 overflow-hidden flex items-center justify-center group">
              <div className="absolute inset-0 opacity-15 pointer-events-none" style={{ backgroundImage: "linear-gradient(rgba(0,240,255,0.06) 1px, transparent 1px)", backgroundSize: "100% 6px" }}></div>
              <div className="absolute top-2 left-2 z-10 flex items-center space-x-1.5 bg-black/60 px-2 py-0.5 rounded border border-white/10 text-[9px] font-mono text-rose-500">
                <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse"></span>
                <span>CAM-08 WEST CONCOURSE</span>
              </div>
              
              <div className="text-center font-mono space-y-2 z-10 group-hover:scale-102 transition duration-300">
                <Crosshair className="w-10 h-10 text-cyan-400 mx-auto animate-pulse" />
                <div className="text-2xs text-gray-400">FPS: 60 | COMPRESSION: H.266</div>
                <div className="text-2xs text-gray-500">COORDINATES: Area 24 Gates Link</div>
              </div>
            </div>

            {/* Standby gates checklist */}
            <div className="space-y-3.5">
              <h4 className="text-xs font-mono font-bold text-white uppercase">Sector Bypass Statuses</h4>
              <div className="space-y-2 font-mono text-xs">
                {checkpoints.map((p, index) => (
                  <div key={index} className="flex justify-between items-center p-2.5 bg-black/35 rounded-xl border border-white/5 text-[11px]">
                    <span className="text-slate-300">{p.zone}</span>
                    <div className="flex items-center space-x-2">
                      <span className="text-gray-500">{p.throughput}</span>
                      <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                        p.status.includes("Critical") ? "bg-red-500/10 text-red-400" : "bg-emerald-500/10 text-emerald-400"
                      }`}>
                        {p.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Drones controller adjuster */}
          <div className="bg-black/30 border border-white/10 rounded-2xl p-4 text-xs font-mono space-y-3">
            <div className="flex justify-between items-center text-[11px]">
              <span className="text-gray-400">DRONES ASSIGNED</span>
              <span className="text-white font-bold">{dronesDeployCount} / 12 DEPLOYED</span>
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setDronesDeployCount(Math.max(1, dronesDeployCount - 1))}
                className="flex-1 py-1 px-2.5 bg-white/5 border border-white/10 hover:bg-white/10 rounded text-center"
              >
                Recall Drone
              </button>
              <button 
                onClick={() => setDronesDeployCount(Math.min(12, dronesDeployCount + 1))}
                className="flex-1 py-1 px-2.5 bg-white/5 border border-white/10 hover:bg-white/10 rounded text-center text-cyan-300"
              >
                Launch Drone
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
