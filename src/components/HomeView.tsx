import React from "react";
import { 
  Building, 
  MapPin, 
  Users, 
  ShieldCheck, 
  Sparkles, 
  TrendingUp, 
  Compass, 
  HelpCircle, 
  Settings, 
  ArrowRight,
  Gauge,
  Thermometer,
  ShieldAlert,
  Cpu
} from "lucide-react";
import { PageId, TelemetryData } from "../types";
import { motion } from "motion/react";
import AnimatedCounter from "./AnimatedCounter";

interface HomeViewProps {
  setCurrentPage: (page: PageId) => void;
  telemetry: TelemetryData;
}

export default function HomeView({ setCurrentPage, telemetry }: HomeViewProps) {
  // Compute key stats
  const occupancyPercentage = (telemetry.attendance / telemetry.maxCapacity) * 100;
  const activeIncidentsCount = telemetry.activeIncidents.filter(i => i.status !== "RESOLVED").length;

  // Stagger variants for rendering lists beautifully
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100, damping: 15 } }
  };

  return (
    <div className="space-y-10" id="home-view-container">
      {/* Dynamic EVACUTION WATCH Banner if active */}
      {telemetry.evacuationLock && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="p-4 bg-red-600/20 border border-red-500 rounded-xl flex items-center justify-between animate-pulse neon-border-purple shadow-lg"
        >
          <div className="flex items-center space-x-3 text-red-400">
            <ShieldAlert className="w-8 h-8 animate-spin" />
            <div>
              <h3 className="font-mono font-bold text-base tracking-wider uppercase text-white">
                STADIUM EVACUATION DRILL IN PROGRESS
              </h3>
              <p className="text-xs text-red-300">
                All visual signs have pivoted. Gates are in fail-safe egress configuration. Live Map overridden.
              </p>
            </div>
          </div>
          <button 
            onClick={() => setCurrentPage("emergency")}
            className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white font-mono text-xs font-bold rounded-lg transition shadow-md cursor-pointer"
          >
            DISPATCH TERMINAL
          </button>
        </motion.div>
      )}

      {/* Hero Header Segment */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="relative overflow-hidden glass-panel rounded-3xl p-8 sm:p-12 border border-cyan-500/15 shadow-[0_0_50px_rgba(0,240,255,0.05)]"
      >
        {/* Dynamic decorative backdrop grids */}
        <div className="absolute right-0 top-0 h-full w-1/2 opacity-25 pointer-events-none bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-neon-purple/70 via-cyan-900/10 to-transparent"></div>
        
        <div className="relative z-10 max-w-3xl space-y-6">
          <div className="inline-flex items-center space-x-2 bg-neon-blue/10 border border-neon-blue/30 text-neon-blue font-mono text-xs px-3 py-1.5 rounded-full tracking-widest uppercase">
            <Sparkles className="w-3.5 h-3.5 animate-pulse" />
            <span>AI-POWERED ORCHESTRATION</span>
          </div>
          
          <h1 className="text-4xl sm:text-6xl font-bold tracking-tight text-white font-sans leading-tight">
            The Future of <br className="hidden sm:inline" />
            Mega-Arena <span className="text-transparent bg-clip-text bg-gradient-to-r from-neon-blue via-violet-400 to-neon-purple neon-glow-blue">Operations</span>
          </h1>
          
          <p className="text-gray-300 text-base sm:text-lg font-sans leading-relaxed">
            StadiumX AI integrates deep crowd dynamics, automated wayfinding overrides, real-time parking grids, and instant tactical dispatches into a cohesive, glassmorphic operations console.
          </p>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-4">
            <motion.button
              whileHover={{ scale: 1.03, boxShadow: "0 0 25px rgba(0, 240, 255, 0.45)" }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setCurrentPage("dashboard")}
              className="px-6 py-3 cursor-pointer bg-gradient-to-r from-neon-blue to-cyan-500 font-bold font-sans text-sm tracking-wide text-cyber-dark rounded-xl transition duration-300 flex items-center justify-center gap-2 group"
              id="cta-launch-dashboard"
            >
              <span>Launch Operations Dashboard</span>
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.03, border: "1px solid #00f0ff" }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setCurrentPage("map")}
              className="px-6 py-3 cursor-pointer bg-cyber-card border border-cyan-500/30 text-white font-bold font-sans text-sm tracking-wide rounded-xl transition duration-300 flex items-center justify-center gap-2"
              id="cta-open-map"
            >
              <span>View Interactive Map</span>
              <Compass className="w-4 h-4 text-neon-blue" />
            </motion.button>
          </div>
        </div>
      </motion.div>

      {/* Primary Telemetry Grid */}
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
      >
        {/* Attendance dial card */}
        <motion.div 
          variants={itemVariants}
          whileHover={{ y: -5, boxShadow: "0 0 30px rgba(0,240,255,0.15)" }}
          className="glass-panel p-6 rounded-2xl flex items-center space-x-4 border-l-4 border-l-neon-blue transition-all duration-300"
        >
          <div className="p-3.5 bg-neon-blue/10 rounded-xl text-neon-blue shadow-[0_0_10px_rgba(0,240,255,0.1)]">
            <Users className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <span className="text-[10px] font-mono text-gray-500 uppercase tracking-widest block font-bold">ATTENDANCE PRESSURE</span>
            <div className="flex items-baseline space-x-2 mt-1">
              <span className="text-2xl font-bold font-mono text-white">
                <AnimatedCounter value={telemetry.attendance} />
              </span>
              <span className="text-xs text-emerald-400 font-mono">
                <AnimatedCounter value={occupancyPercentage} decimals={1} suffix="%" />
              </span>
            </div>
            <span className="text-[10px] font-mono text-gray-400">vs 80,000 Capacity Limit</span>
          </div>
        </motion.div>

        {/* Incidents Card */}
        <motion.div 
          variants={itemVariants}
          whileHover={{ y: -5, boxShadow: activeIncidentsCount > 0 ? "0 0 30px rgba(244,63,94,0.15)" : "0 0 30px rgba(16,185,129,0.15)" }}
          className={`glass-panel p-6 rounded-2xl flex items-center space-x-4 border-l-4 transition-all duration-300 ${
            activeIncidentsCount > 0 ? "border-l-rose-500" : "border-l-emerald-500"
          }`}
        >
          <div className={`p-3.5 rounded-xl transition ${
            activeIncidentsCount > 0 ? "bg-rose-500/10 text-rose-400 animate-pulse shadow-[0_0_10px_rgba(244,63,94,0.2)]" : "bg-emerald-500/10 text-emerald-400"
          }`}>
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] font-mono text-gray-500 uppercase tracking-widest block font-bold">INCIDENT DISPATCHES</span>
            <div className="flex items-baseline space-x-2 mt-1">
              <span className="text-2xl font-bold font-mono text-white">
                <AnimatedCounter value={activeIncidentsCount} />
              </span>
              <span className="text-xs font-mono text-gray-400">ACTIVE</span>
            </div>
            <span className="text-[10px] font-mono text-gray-400">
              <AnimatedCounter value={telemetry.activeIncidents.filter(i => i.status === "RESOLVED").length} /> Resolved Logs
            </span>
          </div>
        </motion.div>

        {/* Global Latency Meter */}
        <motion.div 
          variants={itemVariants}
          whileHover={{ y: -5, boxShadow: "0 0 30px rgba(188,19,254,0.15)" }}
          className="glass-panel p-6 rounded-2xl flex items-center space-x-4 border-l-4 border-l-neon-purple transition-all duration-300"
        >
          <div className="p-3.5 bg-neon-purple/10 rounded-xl text-neon-purple shadow-[0_0_10px_rgba(188,19,254,0.1)]">
            <Gauge className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] font-mono text-gray-500 uppercase tracking-widest block font-bold">GATE SPEED INDEX</span>
            <div className="flex items-baseline space-x-2 mt-1">
              <span className="text-2xl font-bold font-mono text-white">
                <AnimatedCounter value={2.4} decimals={1} suffix=" mins" />
              </span>
              <span className="text-xs text-indigo-400 font-mono">NOMINAL</span>
            </div>
            <span className="text-[10px] font-mono text-gray-400">Gate C anomaly: 6.5m</span>
          </div>
        </motion.div>

        {/* Server Temp/Weather Indicator */}
        <motion.div 
          variants={itemVariants}
          whileHover={{ y: -5, boxShadow: "0 0 30px rgba(245,158,11,0.15)" }}
          className="glass-panel p-6 rounded-2xl flex items-center space-x-4 border-l-4 border-l-amber-500 transition-all duration-300"
        >
          <div className="p-3.5 bg-amber-500/10 rounded-xl text-amber-500">
            <Thermometer className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] font-mono text-gray-500 uppercase tracking-widest block font-bold">ROOF & DOME CLIMATE</span>
            <div className="flex items-baseline space-x-2 mt-1">
              <span className="text-2xl font-bold font-mono text-white">OPEN</span>
              <span className="text-xs text-amber-400 font-mono">72°F</span>
            </div>
            <span className="text-[10px] font-mono text-gray-400">Air Flow: Excellent</span>
          </div>
        </motion.div>
      </motion.div>

      {/* Feature Deep Dive Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Core Capabilities */}
        <div className="lg:col-span-2 space-y-6">
          <h2 className="text-2xl font-bold tracking-wide text-white">
            System Operations Core Modules
          </h2>
          
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="grid grid-cols-1 sm:grid-cols-2 gap-6"
          >
            {/* Dynamic AI Assistant Card */}
            <motion.div 
              variants={itemVariants}
              whileHover={{ y: -6, scale: 1.01, border: "1px solid rgba(188,19,254,0.3)" }}
              className="glass-panel p-6 rounded-2xl space-y-4 group transition duration-300"
            >
              <div className="h-10 w-10 rounded-xl bg-neon-purple/10 border border-neon-purple/20 flex items-center justify-center text-neon-purple">
                <Cpu className="w-5 h-5 shadow-lg" />
              </div>
              <h3 className="text-lg font-bold text-white group-hover:text-neon-purple transition-colors">
                AI Cognitive Core
              </h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                Interact with the central StadiumX AI command module. Query real-time metrics, draft custom PA evacuation text, or get emergency routing solutions based on active sector pressure.
              </p>
              <button 
                onClick={() => setCurrentPage("assistant")}
                className="inline-flex items-center space-x-1.5 text-xs text-neon-purple font-mono font-bold uppercase hover:underline cursor-pointer"
              >
                <span>Initialize Core Link</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </motion.div>

            {/* Smart Wayfinding Card */}
            <motion.div 
              variants={itemVariants}
              whileHover={{ y: -6, scale: 1.01, border: "1px solid rgba(0,240,255,0.3)" }}
              className="glass-panel p-6 rounded-2xl space-y-4 group transition duration-300"
            >
              <div className="h-10 w-10 rounded-xl bg-neon-blue/10 border border-neon-blue/20 flex items-center justify-center text-neon-blue">
                <MapPin className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-white group-hover:text-neon-blue transition-colors">
                Dynamic Wayfinding Overrides
              </h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                Connect display screens with crowd flows. Instantly override directions towards under-utilized gates or trigger flash safety routes. Perfect for emergency control.
              </p>
              <button 
                onClick={() => setCurrentPage("map")}
                className="inline-flex items-center space-x-1.5 text-xs text-neon-blue font-mono font-bold uppercase hover:underline cursor-pointer"
              >
                <span>Override Grid Vision</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </motion.div>

            {/* Parking Logic Card */}
            <motion.div 
              variants={itemVariants}
              whileHover={{ y: -6, scale: 1.01, border: "1px solid rgba(245,158,11,0.3)" }}
              className="glass-panel p-6 rounded-2xl space-y-4 group transition duration-300"
            >
              <div className="h-10 w-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500">
                <TrendingUp className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-white group-hover:text-amber-400 transition-colors">
                Parking Intelligence Grids
              </h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                Predict queue rates at North/South garages. Stream live occupancy updates to motorists' mobile applications before they approach the venue to prevent pre-gate lockups.
              </p>
              <button 
                onClick={() => setCurrentPage("dashboard")}
                className="inline-flex items-center space-x-1.5 text-xs text-amber-500 font-mono font-bold uppercase hover:underline cursor-pointer"
              >
                <span>Inspect Parking Stats</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </motion.div>

            {/* Emergency and evacuation card */}
            <motion.div 
              variants={itemVariants}
              whileHover={{ y: -6, scale: 1.01, border: "1px solid rgba(244,63,94,0.3)" }}
              className="glass-panel p-6 rounded-2xl space-y-4 group transition duration-300"
            >
              <div className="h-10 w-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-white group-hover:text-rose-400 transition-colors">
                Tactical Safety Grid
              </h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                Stadium safety is absolute. The Emergency coordination console gives operators direct control over alarms, lockouts, drone surveillance grids, and incident dispatch channels.
              </p>
              <button 
                onClick={() => setCurrentPage("emergency")}
                className="inline-flex items-center space-x-1.5 text-xs text-rose-400 font-mono font-bold uppercase hover:underline cursor-pointer"
              >
                <span>Trigger Dispatch Console</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </motion.div>
          </motion.div>
        </div>

        {/* Live Incident Alert Feed Side-car */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="glass-panel p-6 rounded-3xl border border-neon-blue/15 flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between border-b border-gray-900 pb-4 mb-4">
              <div className="flex items-center space-x-2 text-white font-bold font-sans">
                <Compass className="w-5 h-5 text-neon-blue animate-spin" style={{ animationDuration: "12s" }} />
                <span>Live Feed Logs</span>
              </div>
              <span className="text-[10px] font-mono text-cyan-400 bg-cyan-400/10 border border-cyan-400/30 px-2 py-0.5 rounded-full animate-pulse">
                REAL TIME
              </span>
            </div>

            <div className="space-y-4 max-h-[300px] overflow-y-auto pr-1 scrollbar-thin">
              {telemetry.activeIncidents.length === 0 ? (
                <div className="text-center py-10 text-gray-500 text-xs font-mono">
                  All systems operating nominally.<br />
                  No reports logged on dispatch.
                </div>
              ) : (
                telemetry.activeIncidents.map((incident) => (
                  <motion.div 
                    layoutId={`incident-card-${incident.id}`}
                    key={incident.id} 
                    className="p-3 bg-cyber-dark/60 rounded-xl border border-gray-800 text-xs font-mono space-y-1 hover:border-cyan-500/25 transition duration-300"
                  >
                    <div className="flex items-center justify-between">
                      <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                        incident.severity === "CRITICAL" ? "bg-red-500/20 text-red-400 border border-red-500/40" :
                        incident.severity === "HIGH" ? "bg-orange-500/20 text-orange-400 border border-orange-500/40" :
                        incident.severity === "MEDIUM" ? "bg-amber-500/20 text-amber-400 border border-amber-500/40" :
                        "bg-cyan-500/20 text-cyan-400 border border-cyan-500/40"
                      }`}>
                        {incident.severity}
                      </span>
                      <span className="text-[9px] text-gray-500">
                        {incident.id}
                      </span>
                    </div>
                    <div className="text-white font-medium">{incident.type}</div>
                    <div className="text-gray-400 text-[10px]">{incident.description}</div>
                    <div className="flex items-center justify-between text-[9px] text-gray-500 pt-1 border-t border-gray-900/40">
                      <span>📌 {incident.section}</span>
                      <span className="text-cyan-400 block font-bold animate-pulse">{incident.status}</span>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </div>

          <div className="pt-6 border-t border-gray-900/60 mt-4">
            <button
              onClick={() => setCurrentPage("admin")}
              className="w-full py-2.5 bg-cyber-card hover:bg-neon-blue/10 border border-cyan-400/25 hover:border-cyan-400 text-center font-mono font-bold text-xs tracking-wider text-cyan-400 rounded-lg transition overflow-hidden relative group cursor-pointer"
              id="cta-sim-incident"
            >
              <span className="absolute inset-x-0 bottom-0 top-0 bg-cyan-400/5 origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-300"></span>
              <span className="relative">LAUNCH SIMULATOR CONSOLE</span>
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
