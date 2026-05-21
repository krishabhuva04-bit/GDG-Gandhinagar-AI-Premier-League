import React, { useState } from "react";
import { 
  Compass, 
  Layers, 
  MapPin, 
  ZoomIn, 
  ZoomOut, 
  Eye, 
  ShieldAlert, 
  Info,
  CheckCircle2,
  TrendingUp,
  Sliders,
  Maximize2,
  Activity,
  Flame,
  Zap,
  Sparkles,
  Radio,
  Users,
  AlertTriangle
} from "lucide-react";
import { TelemetryData, Incident } from "../types";
import { motion, AnimatePresence } from "motion/react";
import AnimatedCounter from "./AnimatedCounter";

interface MapViewProps {
  telemetry: TelemetryData;
  onDispatchIncident: (type: string, section: string, description: string, severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL") => void;
}

export default function MapView({ telemetry, onDispatchIncident }: MapViewProps) {
  const [viewMode, setViewMode] = useState<"2D" | "3D">("2D");
  const [activeLayer, setActiveLayer] = useState<"density" | "emergency" | "concessions">("density");
  const [selectedSection, setSelectedSection] = useState<string | null>(null);
  const [zoomLevel, setZoomLevel] = useState<number>(100);

  // New interactive crowd heatmap states
  const [simulationMode, setSimulationMode] = useState<"NORMAL" | "CONCERT_RUSH" | "EVAC_DRILL" | "RAIN_DELAY">("NORMAL");
  const [selectedHotspotId, setSelectedHotspotId] = useState<string>("hs-gate-c");
  const [customHotspotTemp, setCustomHotspotTemp] = useState<Record<string, number>>({});
  const [activeActionId, setActiveActionId] = useState<string | null>(null);
  const [actionSuccessMessage, setActionSuccessMessage] = useState<string | null>(null);

  // Define Hotspot descriptions and parameters
  const hotspotsData = [
    {
      id: "hs-gate-c",
      name: "Gate C Ingress Tunnel",
      location: "Level 1 Northwest Portal",
      zone: "Northwest",
      baseHeadcount: 1450,
      description: "Primary entrance flow for general admission ticketholders. Turnstile latency at 6.5 minutes is causing pedestrian backup past the security perimeter limit."
    },
    {
      id: "hs-east-plaza",
      name: "East Concourse Walkway",
      location: "Level 2 Transit Zone",
      zone: "East",
      baseHeadcount: 980,
      description: "Wide pedestrian artery between major seating blocks. High transit speed makes this an optimal zone for digital redirection signages."
    },
    {
      id: "hs-north-deck-d",
      name: "North Deck D Concourse",
      location: "Level 3 Seating Corridor",
      zone: "North",
      baseHeadcount: 420,
      description: "Low-density corridor leading to upper tiers. Air quality indices are pristine and queue congestion is historical nominal."
    },
    {
      id: "hs-sec-214",
      name: "Sect 214 Concessions Peak",
      location: "Level 2 Northeast Loop",
      zone: "Northeast",
      baseHeadcount: 1220,
      description: "High-density ordering lanes for the central burger & snack stands. High transaction wait times of 8 minutes are feeding spillover crowd directly into egress walking paths."
    },
    {
      id: "hs-vip-entry",
      name: "VIP Dedicated East Lounge",
      location: "Level 1 Club Entryway",
      zone: "East",
      baseHeadcount: 310,
      description: "Card-validator gated executive corridor. Highly private, quiet and currently experiencing excellent low flow metrics."
    }
  ];

  // Base scenarios parameters mapping
  const scenarioRatios: Record<string, Record<string, number>> = {
    NORMAL: {
      "hs-gate-c": 82,
      "hs-east-plaza": 45,
      "hs-north-deck-d": 30,
      "hs-sec-214": 65,
      "hs-vip-entry": 22
    },
    CONCERT_RUSH: {
      "hs-gate-c": 98,
      "hs-east-plaza": 80,
      "hs-north-deck-d": 62,
      "hs-sec-214": 92,
      "hs-vip-entry": 55
    },
    EVAC_DRILL: {
      "hs-gate-c": 50,
      "hs-east-plaza": 95,
      "hs-north-deck-d": 88,
      "hs-sec-214": 15,
      "hs-vip-entry": 10
    },
    RAIN_DELAY: {
      "hs-gate-c": 22,
      "hs-east-plaza": 18,
      "hs-north-deck-d": 92,
      "hs-sec-214": 96,
      "hs-vip-entry": 78
    }
  };

  const getHotspotDensity = (id: string): number => {
    if (customHotspotTemp[id] !== undefined) {
      return customHotspotTemp[id];
    }
    return scenarioRatios[simulationMode][id] || 40;
  };

  const handleSliderChange = (id: string, value: number) => {
    setCustomHotspotTemp(prev => ({ ...prev, [id]: value }));
  };

  const handleTriggerAction = (id: string, name: string) => {
    setActiveActionId(id);
    setActionSuccessMessage(null);
    setTimeout(() => {
      onDispatchIncident(
        "TERRAIN_HEATMAP_OVERRIDE",
        name,
        `AI cognitive pathing triggered wayfinding override at hotspot: ${name}. Re-routing signs to Gate B/F bypass.`,
        "HIGH"
      );
      setActionSuccessMessage(`Successfully deployed wayfinding override signals to ${name}. Signs optimized!`);
      setActiveActionId(null);
      
      // Auto close message after 5 seconds
      setTimeout(() => {
        setActionSuccessMessage(null);
      }, 5000);
    }, 1200);
  };

  // Base ratios for each block to represent organic stadium distributions
  const baseRatios: Record<string, number> = {
    "North Deck A": 1.15,
    "North Concourse B": 0.45,
    "East Block A": 0.92,
    "East Block B": 1.02,
    "South Deck A": 0.62,
    "South Deck B": 0.85,
    "West Block A": 1.13,
    "West Block B": 0.53
  };

  const currentGeneralRate = telemetry.attendance / telemetry.maxCapacity;

  // Seating blocks configuration for stadium visualization
  const seatBlocks = [
    { id: "North Deck A", x: 120, y: 50, w: 160, h: 40, maxDensity: 95, currentDensity: Math.min(99, Math.round(currentGeneralRate * 100 * baseRatios["North Deck A"])), color: "text-red-400" },
    { id: "North Concourse B", x: 290, y: 50, w: 160, h: 40, maxDensity: 80, currentDensity: Math.min(99, Math.round(currentGeneralRate * 100 * baseRatios["North Concourse B"])), color: "text-green-400" },
    { id: "East Block A", x: 460, y: 100, w: 40, h: 160, maxDensity: 90, currentDensity: Math.min(99, Math.round(currentGeneralRate * 100 * baseRatios["East Block A"])), color: "text-amber-400" },
    { id: "East Block B", x: 460, y: 270, w: 40, h: 160, maxDensity: 90, currentDensity: Math.min(99, Math.round(currentGeneralRate * 100 * baseRatios["East Block B"])), color: "text-orange-400" },
    { id: "South Deck A", x: 120, y: 440, w: 160, h: 40, maxDensity: 95, currentDensity: Math.min(99, Math.round(currentGeneralRate * 100 * baseRatios["South Deck A"])), color: "text-green-400" },
    { id: "South Deck B", x: 290, y: 440, w: 160, h: 40, maxDensity: 80, currentDensity: Math.min(99, Math.round(currentGeneralRate * 100 * baseRatios["South Deck B"])), color: "text-amber-400" },
    { id: "West Block A", x: 70, y: 100, w: 40, h: 160, maxDensity: 85, currentDensity: Math.min(99, Math.round(currentGeneralRate * 100 * baseRatios["West Block A"])), color: "text-red-400" },
    { id: "West Block B", x: 70, y: 270, w: 40, h: 160, maxDensity: 85, currentDensity: Math.min(99, Math.round(currentGeneralRate * 100 * baseRatios["West Block B"])), color: "text-green-400" },
  ];

  // Specific high density crowd heatpoints
  const heatpoints = [
    { x: 90, y: 180, size: 48, intensity: "CRITICAL", label: "Gate C Entry Bottleneck" },
    { x: 340, y: 280, size: 60, intensity: "NOMINAL", label: "Field Mainstage Egress" },
    { x: 200, y: 120, size: 36, intensity: "HIGH", label: "Section 214 Concourse" },
    { x: 140, y: 450, size: 28, intensity: "LOW", label: "Gate B Access" },
  ];

  const handleBlockClick = (blockName: string) => {
    setSelectedSection(blockName);
  };

  return (
    <div className="space-y-8" id="stadium-map-view">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-sans tracking-wide text-white">
            Live Operations Map
          </h1>
          <p className="text-gray-400 text-sm">
            High-fidelity density projections with telemetry layer toggles.
          </p>
        </div>

        {/* View selection controls */}
        <div className="flex items-center space-x-2 bg-white/5 border border-white/10 rounded-xl p-1 text-xs font-mono">
          <button
            onClick={() => setViewMode("2D")}
            className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
              viewMode === "2D" ? "bg-cyan-500 text-black font-bold" : "text-gray-400 hover:text-white"
            }`}
          >
            Tactical 2D
          </button>
          <button
            onClick={() => setViewMode("3D")}
            className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
              viewMode === "3D" ? "bg-purple-600 text-white font-bold" : "text-gray-400 hover:text-white"
            }`}
          >
            Orthogonal 3D
          </button>
        </div>
      </div>

      {/* Primary Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* The Interactive Stadium Map Core */}
        <div className="lg:col-span-8 bg-black/40 border border-white/10 rounded-3xl relative overflow-hidden flex flex-col justify-between">
          
          {/* Cyber dots decorative background */}
          <div className="absolute inset-0 opacity-15 pointer-events-none" style={{ backgroundImage: "radial-gradient(#22d4bf 0.5px, transparent 0.5px)", backgroundSize: "20px 20px" }}></div>

          {/* Scanner sweep line */}
          <div className="absolute left-0 w-full h-0.5 scanner-line pointer-events-none z-10" />

          {/* Upper Info Overlays */}
          <div className="relative z-10 p-6 flex flex-wrap gap-2 justify-between items-start">
            <div>
              <span className="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-400 text-[10px] uppercase font-bold tracking-widest border border-cyan-500/30">
                ACTIVE MAP OVERLAY
              </span>
              <h2 className="text-white font-bold text-lg mt-1 font-sans">
                {activeLayer === "density" ? "Live Density Heatmap" : activeLayer === "emergency" ? "Emergency Matrix" : "Concession Queue Metrics"}
              </h2>
            </div>

            {/* Map layers toggler */}
            <div className="flex items-center space-x-2 bg-cyber-card/90 border border-white/10 p-1.5 rounded-xl z-20">
              <button
                onClick={() => { setActiveLayer("density"); setSelectedSection(null); }}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-mono tracking-wide cursor-pointer transition ${
                  activeLayer === "density" ? "bg-cyan-500/20 text-cyan-400 border border-cyan-400/30" : "text-gray-400 hover:text-white"
                }`}
              >
                <Compass className="w-3.5 h-3.5" />
                <span>Density</span>
              </button>
              <button
                onClick={() => { setActiveLayer("emergency"); setSelectedSection(null); }}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-mono tracking-wide cursor-pointer transition ${
                  activeLayer === "emergency" ? "bg-rose-500/20 text-rose-400 border border-rose-500/30" : "text-gray-400 hover:text-white"
                }`}
              >
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>Hazards</span>
              </button>
            </div>
          </div>

          {/* Stadium Digital Blueprint Container */}
          <div 
            className="w-full flex items-center justify-center p-4 sm:p-12 overflow-hidden relative"
            style={{ minHeight: "440px" }}
          >
            {/* 3D Transform simulation */}
            <div 
              className="relative w-full max-w-[580px] h-[480px] border border-white/5 rounded-[60px] flex items-center justify-center transition-all duration-700 ease-out"
              style={{ 
                transform: viewMode === "3D" ? "rotateX(60deg) rotateZ(-25deg) scale3d(0.95, 0.95, 1)" : "none",
                perspective: "1000px"
              }}
            >
              {/* Outer Outer stadium ring */}
              <div className="absolute inset-2 border-[6px] border-white/5 rounded-[80px]" />

              {/* Inner Walkway & Security perimeter limit */}
              <div className="absolute inset-10 border-2 border-dashed border-cyan-500/20 rounded-[70px]" />

              {/* Central Playing Field (Futuristic Grid Core) */}
              <div className="absolute w-[240px] h-[140px] border-2 border-cyan-500/30 bg-cyan-950/20 rounded-[50px] flex flex-col items-center justify-center p-3 text-center overflow-hidden">
                <div className="absolute inset-2 bg-gradient-to-br from-cyan-500/10 to-transparent blur-md"></div>
                <span className="font-mono text-[9px] text-cyan-500 tracking-widest uppercase">STADIUMX FIELD</span>
                <span className="text-white font-bold text-xs">MAIN SPECTATOR STAGE</span>
                <span className="text-[9px] text-gray-400 font-mono mt-1">SENSORS CALIBRATED</span>
              </div>

              {/* Seating Block SVGs */}
              {seatBlocks.map((block) => {
                const isSelected = selectedSection === block.id;
                let densityColor = "bg-emerald-500/25 border-emerald-500/40";
                let badgeColor = "bg-emerald-400";
                
                if (block.currentDensity > 85) {
                  densityColor = "bg-red-500/30 border-red-500/60 animate-pulse";
                  badgeColor = "bg-red-500 shadow-[0_0_8px_#ef4444]";
                } else if (block.currentDensity > 65) {
                  densityColor = "bg-amber-500/30 border-amber-500/50";
                  badgeColor = "bg-amber-400 shadow-[0_0_8px_#f59e0b]";
                }

                return (
                  <motion.button
                    key={block.id}
                    onClick={() => handleBlockClick(block.id)}
                    style={{
                      position: "absolute",
                      left: `${block.x}px`,
                      top: `${block.y}px`,
                      width: `${block.w}px`,
                      height: `${block.h}px`,
                    }}
                    whileHover={{ scale: 1.04 }}
                    whileTap={{ scale: 0.97 }}
                    className={`rounded-lg border text-left p-1.5 cursor-pointer font-sans select-none flex flex-col justify-between transition-all ${
                      isSelected 
                        ? "border-neon-blue bg-neon-blue/10 scale-105 shadow-[0_0_15px_rgba(0,240,255,0.25)] z-20" 
                        : `${densityColor} hover:border-white/45`
                    }`}
                  >
                    <div className="flex justify-between items-center w-full">
                      <span className="text-[8px] text-white font-bold truncate tracking-tight">{block.id}</span>
                      <span className={`w-1.5 h-1.5 rounded-full ${badgeColor}`}></span>
                    </div>
                    <span className="text-[10px] font-mono text-white font-semibold">
                      <AnimatedCounter value={block.currentDensity} />%
                    </span>
                  </motion.button>
                );
              })}

              {/* Heat overlay dots (activated on density layer) */}
              {activeLayer === "density" && heatpoints.map((pt, index) => {
                const color = pt.intensity === "CRITICAL" ? "rgba(239, 68, 68, 0.45)" : pt.intensity === "HIGH" ? "rgba(245, 158, 11, 0.35)" : "rgba(34, 211, 238, 0.25)";
                const border = pt.intensity === "CRITICAL" ? "rgba(239, 68, 68, 0.7)" : pt.intensity === "HIGH" ? "rgba(245, 158, 11, 0.6)" : "rgba(34, 211, 238, 0.5)";
                return (
                  <div
                    key={index}
                    style={{
                      position: "absolute",
                      left: `${pt.x}px`,
                      top: `${pt.y}px`,
                      width: `${pt.size}px`,
                      height: `${pt.size}px`,
                      backgroundColor: color,
                      borderColor: border,
                    }}
                    className="rounded-full border-2 border-dashed flex items-center justify-center p-1.5 backdrop-blur-xs animate-pulse select-none pointer-events-none"
                    title={pt.label}
                  >
                    <div className="w-2.5 h-2.5 rounded-full bg-white opacity-80" />
                  </div>
                );
              })}

              {/* Incidents Overlays (activated on Emergency Layer) */}
              {activeLayer === "emergency" && telemetry.activeIncidents.map((inc) => {
                // Find a close section coordinates matching section description
                const matchingBlock = seatBlocks.find(b => inc.section.toLowerCase().includes(b.id.substring(0, 5).toLowerCase()));
                const left = matchingBlock ? matchingBlock.x + 20 : (inc.id.includes("101") ? 220 : 130);
                const top = matchingBlock ? matchingBlock.y + 10 : (inc.id.includes("101") ? 180 : 380);

                return (
                  <div 
                    key={inc.id}
                    style={{ position: "absolute", left: `${left}px`, top: `${top}px` }}
                    className="z-30 group"
                  >
                    <div className="relative flex items-center justify-center cursor-pointer">
                      <span className="absolute animate-ping inline-flex h-7 w-7 rounded-full bg-rose-400 opacity-75"></span>
                      <div className="relative p-1.5 bg-rose-600 rounded-full border border-white text-white shadow-lg">
                        <ShieldAlert className="w-4 h-4 animate-bounce" />
                      </div>
                    </div>
                    {/* Tooltip hovering overlay */}
                    <div className="absolute bottom-9 left-1/2 transform -translate-x-1/2 w-48 bg-cyber-dark/95 border border-red-500 rounded-lg p-2.5 shadow-xl text-[10px] font-mono pointer-events-none opacity-90">
                      <div className="text-red-400 font-bold">{inc.type}</div>
                      <div className="text-white mt-0.5 font-sans leading-tight">{inc.description}</div>
                      <div className="text-gray-500 mt-1">{inc.section}</div>
                    </div>
                  </div>
                );
              })}

            </div>
          </div>

          {/* Lower interactive Map stats strip */}
          <div className="p-4 bg-black/50 border-t border-white/10 rounded-b-3xl flex flex-col sm:flex-row items-center justify-between text-xs font-mono text-gray-400 gap-4">
            <div className="flex items-center space-x-4">
              <span className="flex items-center space-x-1.5">
                <span className="w-2 h-2 rounded bg-emerald-500"></span>
                <span>Normal (&lt;65%)</span>
              </span>
              <span className="flex items-center space-x-1.5">
                <span className="w-2 h-2 rounded bg-amber-500 animate-pulse"></span>
                <span>Approaching Limit (65-85%)</span>
              </span>
              <span className="flex items-center space-x-1.5">
                <span className="w-2 h-2 rounded bg-red-500 animate-ping"></span>
                <span>Critical (&gt;85%)</span>
              </span>
            </div>

            {/* Scale operations buttons */}
            <div className="flex items-center space-x-2">
              <button 
                onClick={() => setZoomLevel(Math.min(150, zoomLevel + 10))}
                className="p-1 px-2.5 bg-white/5 border border-white/10 hover:border-white/20 hover:bg-white/10 text-white rounded transition"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
              <button 
                onClick={() => setZoomLevel(Math.max(50, zoomLevel - 10))}
                className="p-1 px-2.5 bg-white/5 border border-white/10 hover:border-white/20 hover:bg-white/10 text-white rounded transition"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <span className="text-[10px] text-gray-500">{zoomLevel}% scale</span>
            </div>
          </div>
        </div>

        {/* Floating Sidepane showing Sector analytics */}
        <div className="lg:col-span-4 bg-white/5 border border-white/10 rounded-3xl p-6 space-y-6 flex flex-col justify-between">
          <div className="space-y-6">
            <div className="border-b border-white/10 pb-4">
              <h3 className="font-sans font-bold text-lg text-white">Zone Inspector</h3>
              <p className="text-gray-400 text-xs">Analyze localized pedestrian densities</p>
            </div>

            {selectedSection ? (
              <div className="space-y-5 animate-fade-in text-sm text-gray-300">
                <div className="flex justify-between items-center bg-white/5 border border-white/10 p-3 rounded-xl">
                  <div className="font-sans">
                    <span className="text-[10px] text-gray-500 font-mono uppercase tracking-widest block">SECTOR INDEX</span>
                    <span className="text-white font-bold text-base">{selectedSection}</span>
                  </div>
                  <button 
                    onClick={() => setSelectedSection(null)} 
                    className="text-xs text-cyan-400 font-mono hover:underline"
                  >
                    Clear Select
                  </button>
                </div>

                <div className="space-y-4">
                  {/* Local info variables */}
                  <div>
                    <div className="flex justify-between text-xs text-gray-400 mb-1">
                      <span>Live Occupancy Ratio:</span>
                      <span className="text-white font-semibold">
                        {seatBlocks.find(b => b.id === selectedSection)?.currentDensity}%
                      </span>
                    </div>
                    <div className="w-full bg-black/60 h-2 rounded-full overflow-hidden border border-white/5">
                      <div 
                        className="bg-gradient-to-r from-cyan-400 to-purple-500 h-full rounded-full" 
                        style={{ width: `${seatBlocks.find(b => b.id === selectedSection)?.currentDensity}%` }}
                      ></div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="bg-black/20 p-2.5 rounded-xl border border-white/5 font-mono">
                      <span className="text-gray-500 text-[10px] block">TEMP VALUE</span>
                      <span className="text-white font-bold">71.8°F</span>
                    </div>
                    <div className="bg-black/20 p-2.5 rounded-xl border border-white/5 font-mono">
                      <span className="text-gray-500 text-[10px] block">AIR QUALITY</span>
                      <span className="text-emerald-400 font-bold">EXCELLENT</span>
                    </div>
                  </div>

                  {/* Flow predictions */}
                  <div className="p-3 bg-cyan-950/20 rounded-xl border border-cyan-500/10 text-xs space-y-1">
                    <div className="font-bold text-cyan-300 flex items-center space-x-1">
                      <TrendingUp className="w-3.5 h-3.5" />
                      <span>Flow Clear Analytics</span>
                    </div>
                    <p className="text-cyan-100 text-[11px] leading-relaxed">
                      Expected egress clearing for {selectedSection} is approximately **18 minutes**. No immediate exit lane blockage.
                    </p>
                  </div>
                </div>

                {/* Dispatch hazard from this block trigger */}
                <div className="pt-4 border-t border-white/10 space-y-2">
                  <h4 className="text-xs font-mono font-bold text-white uppercase">Surgical Dispatch</h4>
                  <div className="flex gap-2">
                    <button
                      onClick={() => onDispatchIncident(
                        "CONGESTION_PRESSURE", 
                        selectedSection, 
                        `Manual crowd routing triggered via Live Map inspect pane for ${selectedSection}`, 
                        "MEDIUM"
                      )}
                      className="flex-1 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:opacity-90 text-white font-mono text-[10px] font-bold rounded-lg uppercase tracking-wider transition"
                    >
                      Audit Flow
                    </button>
                    <button
                      onClick={() => onDispatchIncident(
                        "INSPECTION_SWEEP", 
                        selectedSection, 
                        `Clean droids requested for sanitizing in ${selectedSection}`, 
                        "LOW"
                      )}
                      className="flex-1 py-2 bg-cyber-card border border-white/10 hover:border-white/20 text-white font-mono text-[10px] rounded-lg uppercase tracking-wider transition"
                    >
                      Dispatch Cleaner
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-10 space-y-4">
                <div className="w-10 h-10 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 mx-auto flex items-center justify-center animate-pulse">
                  <Info className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-white text-sm font-bold font-sans">No Section Highlighted</h4>
                  <p className="text-gray-400 text-xs max-w-xs mx-auto">
                    Click any highlighted seating coordinate or hazard on the stadium layout blueprint to inspect localized metrics.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Core Telemetry Health Gauge bar */}
          <div className="bg-black/30 border border-white/10 rounded-2xl p-4 text-xs font-mono space-y-3">
            <span className="text-[10px] text-gray-500 uppercase tracking-wider font-bold">SYSTEM OVERWRITE DIRECTIVE</span>
            <div className="flex justify-between items-center text-[11px]">
              <span className="text-gray-300">WAYFINDING SCREENS</span>
              <span className="text-cyan-400 font-bold">AUTO REROUTING ON</span>
            </div>
            <div className="text-gray-400 text-[10px] leading-relaxed">
              *Visual signages automatically update messages twice an hour depending on sector bottlenecks.*
            </div>
          </div>
        </div>
      </div>

      {/* BRAND NEW SECTION: THERMAL FLOW & CROWD HEATMAP SEGMENT */}
      <div className="glass-panel p-6 rounded-3xl space-y-6 mt-8" id="crowd-heatmap-section">
        <div className="border-b border-white/5 pb-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-cyan-400 font-mono text-xs font-bold uppercase tracking-wider">
              <Radio className="w-4 h-4 text-cyan-400 animate-pulse" />
              <span>COGNITIVE THERMAL PROJECTIONS</span>
            </div>
            <h2 className="text-2xl font-sans font-bold text-white flex items-center gap-2 mt-1">
              <Flame className="w-6 h-6 text-orange-500 animate-pulse" />
              <span>Interactive Crowd Heatmap Control Panel</span>
            </h2>
            <p className="text-xs text-gray-400">
              Interactive pedestrian hotspot dashboard. Toggle crowd models to predict flow, and manually override pressure variables.
            </p>
          </div>

          {/* Quick Scenario Toggles */}
          <div className="flex flex-wrap gap-1.5 bg-black/40 border border-white/5 p-1 rounded-xl text-[11px] font-mono">
            {(["NORMAL", "CONCERT_RUSH", "EVAC_DRILL", "RAIN_DELAY"] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => {
                  setSimulationMode(mode);
                  // Clear some manual overrides to demonstrate the preset nicely
                  setCustomHotspotTemp({});
                }}
                className={`px-3 py-1.5 rounded-lg font-medium transition cursor-pointer select-none ${
                  simulationMode === mode
                    ? "bg-cyan-500 text-black font-bold shadow-[0_0_10px_rgba(6,182,212,0.35)]"
                    : "text-gray-400 hover:text-white hover:bg-white/5"
                }`}
              >
                {mode.replace("_", " ")}
              </button>
            ))}
          </div>
        </div>

        {/* Dynamic Warning Notification if any critical density is matched */}
        {actionSuccessMessage && (
          <div className="p-3 bg-emerald-950/45 border border-emerald-500/20 text-emerald-400 rounded-xl text-xs font-mono flex items-center gap-2 animate-bounce">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{actionSuccessMessage}</span>
          </div>
        )}

        {/* Main interactive grid splitting controls & details */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Left list block: Active Hotspots */}
          <div className="lg:col-span-7 space-y-3">
            <span className="text-[10px] text-gray-400 font-mono uppercase tracking-wider block font-semibold">Active Pedestrian Hotspots</span>
            
            <div className="space-y-3">
              {hotspotsData.map((hotspot) => {
                const density = getHotspotDensity(hotspot.id);
                const isSelected = selectedHotspotId === hotspot.id;
                
                // Color mapping
                let statusColor = "text-emerald-400";
                let barColor = "bg-emerald-500";
                let labelText = "Nominal Flow";
                
                if (density > 85) {
                  statusColor = "text-rose-500 font-bold";
                  barColor = "bg-rose-500";
                  labelText = "CRITICAL CONGESTION";
                } else if (density > 60) {
                  statusColor = "text-amber-400 font-bold";
                  barColor = "bg-amber-500";
                  labelText = "HIGH DENSITY WARNING";
                } else if (density > 35) {
                  statusColor = "text-cyan-400";
                  barColor = "bg-cyan-400";
                  labelText = "Moderate Activity";
                }

                // Estimated headcounts based on density rating
                const calculatedHeadcount = Math.round(hotspot.baseHeadcount * (density / 100));

                return (
                  <div
                    key={hotspot.id}
                    onClick={() => setSelectedHotspotId(hotspot.id)}
                    className={`p-4 bg-black/20 border rounded-2xl cursor-pointer transition-all duration-300 relative overflow-hidden group ${
                      isSelected
                        ? "border-[#00f0ff]/80 shadow-[0_0_15px_rgba(0,240,255,0.08)] bg-cyan-950/10"
                        : "border-white/5 hover:border-white/15"
                    }`}
                  >
                    <div className="flex justify-between items-start gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-sans font-bold text-white group-hover:text-cyan-400 transition-colors">
                            {hotspot.name}
                          </h4>
                          <span className="text-[10px] font-mono text-gray-400 bg-white/5 px-2 py-0.5 rounded-lg">
                            {hotspot.zone}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 font-mono">
                          {hotspot.location}
                        </p>
                      </div>

                      {/* Animated Congestion Indicator Pulsing Dots */}
                      <div className="flex items-center space-x-2 shrink-0">
                        <div className="relative flex h-3.5 w-3.5">
                          <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                            density > 85 ? "bg-red-400" : density > 60 ? "bg-amber-400" : "bg-cyan-400"
                          }`}></span>
                          <span className={`relative inline-flex rounded-full h-3.5 w-3.5 ${
                            density > 85 ? "bg-red-500" : density > 60 ? "bg-amber-500" : "bg-cyan-400"
                          }`}></span>
                        </div>
                        <span className={`text-[10px] font-mono uppercase tracking-wider font-bold ${statusColor}`}>
                          <AnimatedCounter value={density} />%
                        </span>
                      </div>
                    </div>

                    {/* Progress details & flow indicators */}
                    <div className="mt-3.5 space-y-2">
                      <div className="flex justify-between text-[10px] font-mono text-gray-400">
                        <span className="flex items-center gap-1">Headcount: <AnimatedCounter value={calculatedHeadcount} /> / Max {hotspot.baseHeadcount.toLocaleString()}</span>
                        <span className={`${statusColor}`}>{labelText}</span>
                      </div>
                      
                      {/* Gradient fluid horizontal load indicator */}
                      <div className="h-2 w-full bg-gray-950 overflow-hidden rounded-full border border-white/5">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${barColor}`}
                          style={{ width: `${density}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right inspector detail block & interactive simulator */}
          <div className="lg:col-span-5 space-y-4">
            {(() => {
              const hotspot = hotspotsData.find((h) => h.id === selectedHotspotId) || hotspotsData[0];
              const density = getHotspotDensity(hotspot.id);
              
              let statusText = "Muted Flow";
              let statusBorder = "border-cyan-500/20";
              let statusBg = "bg-cyan-950/15";
              let descAlert = "";

              if (density > 85) {
                statusText = "CRITICAL LIMIT REACHED";
                statusBorder = "border-rose-500/30";
                statusBg = "bg-rose-950/20";
                descAlert = "Direct bottleneck recorded. Immediate automated signage redirection and support steward dispatch is strongly recommended.";
              } else if (density > 60) {
                statusText = "LOAD PRESSURE WARNING";
                statusBorder = "border-amber-500/30";
                statusBg = "bg-amber-950/20";
                descAlert = "Approaching maximum flow threshold. Keep monitoring turnstile latencies closely.";
              } else {
                statusText = "OPTIMAL SAFETY COMPLIANCE";
                statusBorder = "border-emerald-500/20";
                statusBg = "bg-emerald-950/10";
              }

              return (
                <div className="p-5 bg-white/5 border border-white/10 rounded-3xl space-y-5 h-full flex flex-col justify-between">
                  <div className="space-y-4">
                    <div className="border-b border-white/5 pb-3">
                      <span className="text-[10px] text-cyan-400 font-mono uppercase tracking-wider block">Hotspot Analyzer</span>
                      <h3 className="text-lg font-sans font-bold text-white mt-0.5">
                        {hotspot.name}
                      </h3>
                      <p className="text-xs text-gray-400 font-sans mt-0.5 leading-relaxed">
                        {hotspot.description}
                      </p>
                    </div>

                    {/* Simulation scenario info stats */}
                    <div className={`p-4 rounded-2xl border ${statusBorder} ${statusBg} text-xs font-mono space-y-2`}>
                      <div className="flex justify-between items-center text-[10px] tracking-wider uppercase font-bold text-gray-400">
                        <span>DIAGNOSTIC STATUS</span>
                        <span className={density > 85 ? "text-rose-500" : density > 60 ? "text-amber-400" : "text-emerald-400"}>
                          {statusText}
                        </span>
                      </div>                       <div className="flex justify-between text-[11px] text-gray-300">
                        <span>Expected Wait:</span>
                        <span className="text-white font-bold flex items-center gap-0.5">
                          <AnimatedCounter value={Math.round(density * 0.12)} /> mins
                        </span>
                      </div>
                      <div className="flex justify-between text-[11px] text-gray-300">
                        <span>Clearance Rate:</span>
                        <span className="text-white font-bold flex items-center gap-0.5">
                          ~<AnimatedCounter value={Math.round(300 / (density / 20 || 1))} /> fans/min
                        </span>
                      </div>
                      
                      {descAlert && (
                        <p className="text-[10px] text-gray-400 mt-2 italic border-t border-white/5 pt-1.5 leading-normal">
                          {descAlert}
                        </p>
                      )}
                    </div>

                    {/* Local Interactive Sliding Core Override */}
                    <div className="space-y-2">
                      <div className="flex justify-between items-center text-xs font-mono">
                        <span className="text-gray-300 flex items-center gap-1">
                          <Sliders className="w-3.5 h-3.5 text-cyan-400" />
                          <span>Modify Local Crowd Pressure:</span>
                        </span>
                        <span className="text-white font-bold flex items-center">
                          <AnimatedCounter value={density} />%
                        </span>
                      </div>
                      
                      <div className="relative group py-2">
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={density}
                          onChange={(e) => handleSliderChange(hotspot.id, parseInt(e.target.value))}
                          className="w-full h-1.5 bg-gray-900 rounded-lg appearance-none cursor-pointer accent-cyan-500 outline-none range-sm border border-white/5"
                        />
                        <div className="flex justify-between text-[8px] font-mono text-gray-500 mt-1">
                          <span>0% Empty</span>
                          <span>50% Mid</span>
                          <span>100% Extreme Heat</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Actions Block */}
                  <div className="pt-4 border-t border-white/5 space-y-2 text-xs">
                    <button
                      onClick={() => handleTriggerAction(hotspot.id, hotspot.name)}
                      disabled={activeActionId !== null}
                      className={`w-full py-2.5 bg-gradient-to-r from-cyan-500 to-blue-500 hover:opacity-95 text-black font-mono font-bold text-[10px] tracking-wider uppercase rounded-xl transition cursor-pointer flex items-center justify-center gap-2 ${
                        activeActionId === hotspot.id ? "opacity-50 pointer-events-none" : ""
                      }`}
                    >
                      {activeActionId === hotspot.id ? (
                        <>
                          <Activity className="w-4 h-4 text-black animate-spin" />
                          <span>PROPAGATING COGNITIVE PATTERNS...</span>
                        </>
                      ) : (
                        <>
                          <Zap className="w-4 h-4 text-black" />
                          <span>Authorize Signage Override</span>
                        </>
                      )}
                    </button>
                    
                    {customHotspotTemp[hotspot.id] !== undefined && (
                      <button
                        onClick={() => {
                          setCustomHotspotTemp((prev) => {
                            const next = { ...prev };
                            delete next[hotspot.id];
                            return next;
                          });
                        }}
                        className="w-full py-1.5 bg-white/5 border border-white/10 text-gray-300 font-mono text-[9px] uppercase tracking-wider rounded-lg transition hover:bg-white/10"
                      >
                        Reset Local Manual Override
                      </button>
                    )}
                  </div>
                </div>
              );
            })()}
          </div>

        </div>
      </div>
    </div>
  );
}
