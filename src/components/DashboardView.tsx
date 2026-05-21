import React, { useState } from "react";
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  BarChart, 
  Bar, 
  Cell, 
  PieChart, 
  Pie,
  LineChart,
  Line
} from "recharts";
import { 
  Users, 
  Clock, 
  Activity, 
  Compass, 
  CheckCircle, 
  Flame, 
  RefreshCw, 
  Lock, 
  Unlock,
  Building,
  ArrowUpRight,
  TrendingUp,
  TrendingDown,
  Sparkles,
  MessageSquare,
  ThumbsUp,
  ThumbsDown,
  AlertTriangle,
  Zap,
  Info,
  Car,
  ChevronDown,
  ChevronUp,
  Sliders,
  CheckCircle2
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { TelemetryData, AIRecommendation } from "../types";
import Skeleton from "./Skeleton";
import AnimatedCounter from "./AnimatedCounter";

interface DashboardViewProps {
  telemetry: TelemetryData;
  setTelemetry: React.Dispatch<React.SetStateAction<TelemetryData>>;
}

export default function DashboardView({ telemetry, setTelemetry }: DashboardViewProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [expandedCardId, setExpandedCardId] = useState<string | null>(null);
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);

  // Dynamic simulation button: fluctuate live statistics randomly to prove actions work
  const handleSimulateFluctuations = () => {
    setIsLoading(true);
    setTimeout(() => {
      setTelemetry((prev) => {
        const deltaAtt = Math.floor((Math.random() - 0.3) * 600); 
        const nextAtt = Math.min(prev.maxCapacity, Math.max(70000, prev.attendance + deltaAtt));
        
        const nextGLa = { ...prev.gateLatencies };
        Object.keys(nextGLa).forEach((gate) => {
          const shift = (Math.random() - 0.5) * 1.2;
          nextGLa[gate] = Math.max(1, parseFloat((nextGLa[gate] + shift).toFixed(1)));
        });

        const nextParking = { ...prev.parkingStatus };
        nextParking.northLot.filled = Math.min(5000, nextParking.northLot.filled + Math.floor((Math.random() - 0.2) * 50));
        nextParking.southGarage.filled = Math.min(8000, nextParking.southGarage.filled + Math.floor((Math.random() - 0.4) * 80));
        nextParking.vipEast.filled = Math.min(1500, nextParking.vipEast.filled + Math.floor((Math.random() - 0.5) * 15));
        nextParking.westExpress.filled = Math.min(3500, nextParking.westExpress.filled + Math.floor((Math.random() - 0.1) * 60));

        // Slightly update wait predictions as well
        const nextQueuePr = prev.queuePredictions.map((qp) => {
          const deltaQ = Math.floor((Math.random() - 0.4) * 4);
          const nextQ = Math.max(2, qp.currentQueue + deltaQ);
          return {
            ...qp,
            currentQueue: nextQ,
            waitTime: Math.max(1, Math.round(nextQ * 0.3)),
            trend: (deltaQ > 0 ? "UP" : deltaQ < 0 ? "DOWN" : "STEADY") as any
          };
        });

        return {
          ...prev,
          attendance: nextAtt,
          gateLatencies: nextGLa,
          parkingStatus: nextParking,
          queuePredictions: nextQueuePr
        };
      });
      setIsLoading(false);
    }, 900);
  };

  const handleToggleCard = (id: string) => {
    setExpandedCardId(expandedCardId === id ? null : id);
  };

  const handleExecuteOverride = (recId: string) => {
    // Simulate executing an AI recommended action
    setTelemetry(prev => ({
      ...prev,
      aiRecommendations: prev.aiRecommendations.map(rec => 
        rec.id === recId ? { ...rec, resolved: !rec.resolved } : rec
      )
    }));
  };

  // Recharts structured simulated crowd density flow segment
  const crowdHistorySegments = [
    { time: "16:00", activeCrowd: 32000, maxAcceptable: 55000, flowIndex: 82 },
    { time: "16:30", activeCrowd: 48000, maxAcceptable: 62000, flowIndex: 78 },
    { time: "17:00", activeCrowd: 64000, maxAcceptable: 70000, flowIndex: 85 },
    { time: "17:30", activeCrowd: 72000, maxAcceptable: 75000, flowIndex: 91 },
    { time: "18:00", activeCrowd: 76420, maxAcceptable: 80000, flowIndex: 94 },
    { time: "18:30", activeCrowd: 75800, maxAcceptable: 80000, flowIndex: 92 },
    { time: "19:00", activeCrowd: 76210, maxAcceptable: 80000, flowIndex: 95 },
  ];

  // Sentiment ratio calculations
  const comments = telemetry.fanSentiment || [];
  const positiveComments = comments.filter(c => c.sentiment === "POSITIVE");
  const negativeComments = comments.filter(c => c.sentiment === "NEGATIVE");
  const neutralComments = comments.filter(c => c.sentiment === "NEUTRAL");
  const totalCommentsCount = comments.length || 1;
  const sentimentScore = Math.round(((positiveComments.length + neutralComments.length * 0.5) / totalCommentsCount) * 100);

  const sentimentChartData = [
    { name: "Positive Comments", value: positiveComments.length, color: "#10b981" },
    { name: "Neutral Feedback", value: neutralComments.length, color: "#94a3b8" },
    { name: "Negative Grievances", value: negativeComments.length, color: "#f43f5e" }
  ];

  // Latency gate wait points bar chart map
  const gateLatencyData = Object.entries(telemetry.gateLatencies).map(([gate, latency]) => ({
    name: `Gate ${gate}`,
    latency: latency,
    congested: latency > 5 ? 1 : 0
  }));

  // Aggregate parking indices variables
  const totalParkingCap = 
    telemetry.parkingStatus.northLot.capacity + 
    telemetry.parkingStatus.southGarage.capacity + 
    telemetry.parkingStatus.vipEast.capacity + 
    telemetry.parkingStatus.westExpress.capacity;

  const totalParkingFilled = 
    telemetry.parkingStatus.northLot.filled + 
    telemetry.parkingStatus.southGarage.filled + 
    telemetry.parkingStatus.vipEast.filled + 
    telemetry.parkingStatus.westExpress.filled;

  const parkingPercentage = ((totalParkingFilled / totalParkingCap) * 100).toFixed(1);

  if (isLoading) {
    return (
      <div className="space-y-8" id="dashboard-view-root">
        {/* Sleek dashboard top subheader */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/5 pb-4">
          <div>
            <h1 className="text-3xl font-bold font-sans tracking-tight text-white flex items-center gap-2.5">
              <Activity className="w-8 h-8 text-cyan-400 animate-spin" />
              <span>Calibrating Neural Grid...</span>
            </h1>
            <p className="text-gray-400 text-sm mt-0.5">
              Synchronizing active telemetry with Edge Gate relays and IoT network nodes.
            </p>
          </div>
          <button
            disabled
            className="px-5 py-2.5 bg-black border border-cyan-500/25 text-gray-500 text-xs font-mono font-bold rounded-xl flex items-center gap-2"
          >
            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            <span>CALIBRATING NODES...</span>
          </button>
        </div>

        {/* Futuristic Bento Analytics Grid Skeletons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="glass-panel p-5 rounded-2xl space-y-3">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-8 w-32" />
            <Skeleton className="h-3 w-40" />
            <Skeleton className="h-1.5 w-full mt-2" />
          </div>
          <div className="glass-panel p-5 rounded-2xl space-y-3">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-8 w-28" />
            <Skeleton className="h-3 w-36" />
            <Skeleton className="h-3 w-44" />
          </div>
          <div className="glass-panel p-5 rounded-2xl space-y-3">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-8 w-24" />
            <Skeleton className="h-3 w-40" />
            <Skeleton className="h-1.5 w-full mt-2" />
          </div>
          <div className="glass-panel p-5 rounded-2xl space-y-3">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-8 w-36" />
            <Skeleton className="h-3 w-28" />
            <Skeleton className="h-3 w-32" />
          </div>
        </div>

        {/* Main Column Grid Loading */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="glass-panel p-6 rounded-3xl lg:col-span-8 space-y-4">
            <div className="flex justify-between">
              <div className="space-y-2">
                <Skeleton className="h-5 w-48" />
                <Skeleton className="h-3.5 w-72" />
              </div>
              <Skeleton className="h-4 w-36" />
            </div>
            <Skeleton className="h-64 w-full rounded-2xl" />
          </div>

          <div className="glass-panel p-6 rounded-3xl lg:col-span-4 space-y-4">
            <div className="space-y-2">
              <Skeleton className="h-5 w-36" />
              <Skeleton className="h-3.5 w-48" />
            </div>
            <Skeleton className="h-48 w-full rounded-2xl" />
            <Skeleton className="h-20 w-full rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8" id="dashboard-view-root">
      
      {/* Sleek dashboard top subheader */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/5 pb-4">
        <div>
          <h1 className="text-3xl font-bold font-sans tracking-tight text-white flex items-center gap-2.5">
            <Activity className="w-8 h-8 text-cyan-400 animate-pulse" />
            <span>Neural Operations Control</span>
          </h1>
          <p className="text-gray-400 text-sm mt-0.5">
            StadiumX Core cognitive system displaying synchronized real-time crowd, sentiment, and queue dynamics.
          </p>
        </div>

        <button
          onClick={handleSimulateFluctuations}
          disabled={isLoading}
          id="btn-simulate-telemetry"
          className="relative group px-5 py-2.5 bg-black border border-cyan-500/30 text-cyan-400 text-xs font-mono font-bold rounded-xl transition-all duration-300 hover:neon-border-blue hover:text-white cursor-pointer disabled:opacity-40 overflow-hidden"
        >
          {/* Subtle neon glowing accent backing */}
          <span className="absolute inset-0 bg-cyan-400/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
          <span className="relative flex items-center gap-2">
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
            <span>{isLoading ? "CALIBRATING IoT NODES..." : "SIMULATE COGNITIVE FLUX"}</span>
          </span>
        </button>
      </div>

      {/* Futuristic Bento Analytics Grid with beautiful glowing hovers */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Metric 1: Crowd Density Card */}
        <div 
          className={`glass-panel p-5 rounded-2xl relative overflow-hidden transition-all duration-500 ${
            hoveredCard === "crowd" 
              ? "border-[#00f0ff]/80 shadow-[0_0_20px_rgba(0,240,255,0.15)] bg-cyan-950/5" 
              : "border-white/10"
          }`}
          onMouseEnter={() => setHoveredCard("crowd")}
          onMouseLeave={() => setHoveredCard(null)}
        >
          <div className="absolute right-3 top-3 opacity-10">
            <Users className="w-12 h-12 text-neon-blue" />
          </div>
          <span className="text-[10px] font-mono text-cyan-400 font-semibold tracking-wider block">CROWD FLOW</span>
          <div className="text-3xl font-bold font-mono text-white mt-1">
            <AnimatedCounter value={telemetry.attendance} />
          </div>
          <div className="text-xs text-gray-400 mt-1 flex justify-between">
            <span>Occupancy Ratio:</span>
            <span className="text-white font-semibold">
              {((telemetry.attendance / telemetry.maxCapacity)*100).toFixed(1)}%
            </span>
          </div>
          <div className="w-full bg-gray-950 h-1.5 rounded-full mt-3 overflow-hidden border border-white/5">
            <div 
              className="bg-gradient-to-r from-neon-blue to-neon-purple h-full rounded-full transition-all duration-500" 
              style={{ width: `${(telemetry.attendance/telemetry.maxCapacity)*100}%` }}
            ></div>
          </div>
        </div>

        {/* Metric 2: Smart Queue wait time */}
        <div 
          className={`glass-panel p-5 rounded-2xl relative overflow-hidden transition-all duration-500 ${
            hoveredCard === "latencies" 
              ? "border-[#bc13fe]/80 shadow-[0_0_20px_rgba(188,19,254,0.15)] bg-purple-950/5" 
              : "border-white/10"
          }`}
          onMouseEnter={() => setHoveredCard("latencies")}
          onMouseLeave={() => setHoveredCard(null)}
        >
          <div className="absolute right-3 top-3 opacity-10">
            <Clock className="w-12 h-12 text-neon-purple" />
          </div>
          <span className="text-[10px] font-mono text-neon-purple font-semibold tracking-wider block">INGRESS LATENCY</span>
          <div className="text-3xl font-bold font-mono text-white mt-1 flex items-baseline gap-1">
            <AnimatedCounter value={parseFloat((Object.values(telemetry.gateLatencies).reduce((a, b) => a + b, 0) / 6).toFixed(1))} decimals={1} />
            <span className="text-xs text-gray-400 font-mono">mins</span>
          </div>
          <div className="text-xs text-gray-400 mt-1 flex justify-between">
            <span>Critical Spotwait:</span>
            <span className="text-red-400 font-bold animate-pulse">Gate C</span>
          </div>
          <div className="flex items-center space-x-1.5 text-[10px] text-amber-400 font-mono mt-3">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400 animate-bounce" />
            <span>Sector 214 sensor anomalies active</span>
          </div>
        </div>

        {/* Metric 3: Live Fan Sentiment */}
        <div 
          className={`glass-panel p-5 rounded-2xl relative overflow-hidden transition-all duration-500 ${
            hoveredCard === "sentiment" 
              ? "border-emerald-500/80 shadow-[0_0_20px_rgba(16,185,129,0.15)] bg-emerald-950/5" 
              : "border-white/10"
          }`}
          onMouseEnter={() => setHoveredCard("sentiment")}
          onMouseLeave={() => setHoveredCard(null)}
        >
          <div className="absolute right-3 top-3 opacity-10">
            <MessageSquare className="w-12 h-12 text-emerald-400" />
          </div>
          <span className="text-[10px] font-mono text-emerald-400 font-semibold tracking-wider block">FAN SENTIMENT</span>
          <div className="text-3xl font-bold font-mono text-white mt-1 flex items-baseline gap-0.5">
            <AnimatedCounter value={sentimentScore} />
            <span className="text-gray-400 font-sans text-lg">%</span>
          </div>
          <div className="text-xs text-gray-400 mt-1 flex justify-between">
            <span>Positive / Neutral / Negative:</span>
            <span className="text-white font-mono">{positiveComments.length}/{neutralComments.length}/{negativeComments.length}</span>
          </div>
          
          <div className="w-full h-1.5 flex mt-3 rounded-full overflow-hidden">
            <div className="bg-emerald-500" style={{ width: `${(positiveComments.length/totalCommentsCount)*100}%` }}></div>
            <div className="bg-slate-500" style={{ width: `${(neutralComments.length/totalCommentsCount)*100}%` }}></div>
            <div className="bg-rose-500" style={{ width: `${(negativeComments.length/totalCommentsCount)*100}%` }}></div>
          </div>
        </div>

        {/* Metric 4: Defense & Integrity status */}
        <div 
          className={`glass-panel p-5 rounded-2xl relative overflow-hidden transition-all duration-500 ${
            hoveredCard === "incidents" 
              ? "border-rose-500/80 shadow-[0_0_20px_rgba(244,63,94,0.15)] bg-rose-950/5" 
              : "border-white/10"
          }`}
          onMouseEnter={() => setHoveredCard("incidents")}
          onMouseLeave={() => setHoveredCard(null)}
        >
          <div className="absolute right-3 top-3 opacity-10">
            <Flame className="w-12 h-12 text-rose-500" />
          </div>
          <span className="text-[10px] font-mono text-rose-400 font-semibold tracking-wider block">DISPATCH MATRIX</span>
          <div className={`text-3xl font-bold font-mono mt-1 ${telemetry.evacuationLock ? "text-red-500 animate-pulse" : "text-amber-400"}`}>
            {telemetry.evacuationLock ? "EVACUATION DRILL" : `${telemetry.activeIncidents.length} EVENTS`}
          </div>
          <div className="text-xs text-gray-400 mt-1 flex justify-between">
            <span>Sim Sandbox Level:</span>
            <span className="text-emerald-400 font-bold">1</span>
          </div>
          <div className="flex items-center gap-1.5 text-[10px] font-mono text-gray-400 mt-3">
            {telemetry.evacuationLock ? <Lock className="w-3.5 h-3.5 text-red-500" /> : <Unlock className="w-3.5 h-3.5 text-emerald-500" />}
            <span>Locks Fail-Open configured</span>
          </div>
        </div>
      </div>

      {/* Main Column Grid: Crowds & Sentiments */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Animated Crowd Density Flow Area Chart */}
        <div className="glass-panel p-6 rounded-3xl lg:col-span-8 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
              <div>
                <h3 className="font-sans font-bold text-lg text-white">Live Crowd Density & Stream</h3>
                <p className="text-gray-400 text-xs font-mono">Statistical active occupancy overlay segmenting flow metrics</p>
              </div>
              <div className="flex items-center space-x-4 text-[10px] font-mono">
                <span className="flex items-center space-x-1">
                  <span className="w-2 h-2 bg-cyan-400 rounded-full"></span>
                  <span className="text-gray-300">Active Spectators</span>
                </span>
                <span className="flex items-center space-x-1">
                  <span className="w-2 h-2 bg-[#bc13fe] rounded-full"></span>
                  <span className="text-gray-300">Max Grid Capacity</span>
                </span>
              </div>
            </div>

            <div className="h-72 w-full mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={crowdHistorySegments}>
                  <defs>
                    <linearGradient id="glowActive" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#00f0ff" stopOpacity={0.45}/>
                      <stop offset="95%" stopColor="#00f0ff" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="glowMax" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#bc13fe" stopOpacity={0.25}/>
                      <stop offset="95%" stopColor="#bc13fe" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="time" stroke="#4b5563" fontSize={11} fontFamily="JetBrains Mono" dy={8} />
                  <YAxis stroke="#4b5563" fontSize={11} fontFamily="JetBrains Mono" dx={-8} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: "#0c0d14", borderColor: "#00f0ff", borderRadius: 12, padding: 12 }}
                    labelStyle={{ color: "#fff", fontFamily: "Space Grotesk", fontWeight: "bold" }}
                    itemStyle={{ fontFamily: "JetBrains Mono", fontSize: 11 }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="activeCrowd" 
                    stroke="#00f0ff" 
                    strokeWidth={2.5} 
                    fillOpacity={1} 
                    fill="url(#glowActive)" 
                    name="Spectators inside" 
                    isAnimationActive={true}
                    animationDuration={1200}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="maxAcceptable" 
                    stroke="#bc13fe" 
                    strokeWidth={1.5} 
                    strokeDasharray="4 4" 
                    fillOpacity={1} 
                    fill="url(#glowMax)" 
                    name="Safe Cap Limit" 
                    isAnimationActive={true}
                    animationDuration={1500}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="p-3.5 bg-cyan-950/20 border border-cyan-500/10 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between text-xs font-mono text-cyan-200 mt-6 gap-2">
            <span className="flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-cyan-400 animate-pulse" />
              <span>Predictive Flow Verdict: Attendance levels will plateau during pre-encore segments.</span>
            </span>
            <span className="text-cyan-400 font-bold uppercase tracking-wider text-[10px]">OPERATIONAL SAFETY CALIBRATED</span>
          </div>
        </div>

        {/* Real-Time Live Fan Sentiment Feedback Stream Widget */}
        <div className="glass-panel p-6 rounded-3xl lg:col-span-4 flex flex-col justify-between h-auto">
          <div className="space-y-4">
            <div>
              <h3 className="font-sans font-bold text-lg text-white">Live Fan Sentiment Feed</h3>
              <p className="text-gray-400 text-xs font-mono mb-2">Simulated live feedback stream from inside the arena</p>
            </div>

            <div className="relative h-48 rounded-xl bg-black/40 border border-white/5 overflow-hidden flex flex-col">
              <div className="flex-1 overflow-y-auto p-3 space-y-2.5 max-h-[192px] pr-1 scrollbar-thin">
                {comments.length === 0 ? (
                  <div className="text-center py-10 text-gray-500 font-mono text-xs">Waiting for fan comments...</div>
                ) : (
                  comments.map((comment) => (
                    <div key={comment.id} className="p-2.5 bg-white/5 rounded-xl border border-white/5 text-[11px] space-y-1">
                      <div className="flex items-center justify-between font-mono">
                        <span className="text-white font-bold">{comment.user}</span>
                        <div className="flex items-center gap-1.5">
                          <span className={`px-2 py-0.5 rounded text-[8px] font-bold ${
                            comment.sentiment === "POSITIVE" ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/20" :
                            comment.sentiment === "NEGATIVE" ? "bg-rose-500/20 text-rose-400 border border-rose-500/20" :
                            "bg-slate-500/20 text-slate-300 border border-slate-500/20"
                          }`}>
                            {comment.sentiment}
                          </span>
                          <span className="text-[9px] text-gray-500">{comment.timestamp}</span>
                        </div>
                      </div>
                      <p className="text-slate-300 font-sans text-xs leading-relaxed">
                        {comment.text}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
            
            {/* Sentiment breakdown gauge statistics */}
            <div className="h-28 flex items-center justify-center relative bg-black/20 rounded-xl border border-white/5">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={sentimentChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={28}
                    outerRadius={42}
                    paddingAngle={3}
                    dataKey="value"
                    isAnimationActive={true}
                  >
                    {sentimentChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: "#0c0d14", borderColor: "#10b981", borderRadius: 8 }}
                    itemStyle={{ fontFamily: "JetBrains Mono", fontSize: 11, color: "#fff" }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute text-center mt-0">
                <span className="text-[8px] font-mono text-gray-500 block">SCORE</span>
                <span className="text-sm font-bold text-emerald-400 font-mono">
                  +{sentimentScore}%
                </span>
              </div>
            </div>

            {/* Micro indicators */}
            <div className="grid grid-cols-3 gap-2 text-center text-[10px] font-mono">
              <div className="p-1.5 bg-[#10b981]/5 border border-[#10b981]/15 rounded-lg text-[#10b981]">
                <ThumbsUp className="w-3.5 h-3.5 mx-auto mb-0.5" />
                <span>Happy: {positiveComments.length}</span>
              </div>
              <div className="p-1.5 bg-slate-500/5 border border-slate-500/15 rounded-lg text-slate-400">
                <Info className="w-3.5 h-3.5 mx-auto mb-0.5" />
                <span>Neutral: {neutralComments.length}</span>
              </div>
              <div className="p-1.5 bg-rose-500/5 border border-rose-500/15 rounded-lg text-[#f43f5e]">
                <ThumbsDown className="w-3.5 h-3.5 mx-auto mb-0.5" />
                <span>Sad: {negativeComments.length}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Queue wait predictions & Interactive predictor module */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Predictive Queue Monitoring Dashboard */}
        <div className="glass-panel p-6 rounded-3xl lg:col-span-6 space-y-5">
          <div className="border-b border-white/10 pb-4">
            <h3 className="font-sans font-bold text-lg text-white">Zone Queue & Latency Breakdown</h3>
            <p className="text-gray-400 text-xs font-mono">Mathematical estimates for current crowd waiting queues</p>
          </div>

          <div className="space-y-4">
            {telemetry.queuePredictions.map((pred) => {
              const isHigh = pred.capacityRate > 75;
              const isLow = pred.capacityRate < 40;
              const progressColor = isHigh ? "bg-red-500" : isLow ? "bg-emerald-500" : "bg-cyan-400";
              const glowColor = isHigh ? "shadow-[0_0_8px_#f43f5e]" : isLow ? "shadow-[0_0_8px_#10b981]" : "shadow-[0_0_8px_#06b6d4]";

              return (
                <div key={pred.id} className="p-3.5 bg-black/40 border border-white/5 rounded-2xl relative overflow-hidden group hover:border-white/15 transition-all duration-300">
                  <div className="flex justify-between items-start font-mono text-xs">
                    <div>
                      <span className="text-white font-bold block">{pred.name}</span>
                      <span className="text-gray-500 text-[10px]">Headcount size: {pred.currentQueue} fans queued</span>
                    </div>

                    <div className="text-right">
                      <span className="text-white font-bold text-sm block">{pred.waitTime} min wait</span>
                      <div className="flex items-center justify-end gap-1 text-[10px] text-gray-400 mt-0.5">
                        {pred.trend === "UP" ? (
                          <TrendingUp className="w-3 h-3 text-red-400 animate-pulse" />
                        ) : pred.trend === "DOWN" ? (
                          <TrendingDown className="w-3 h-3 text-emerald-400 animate-pulse" />
                        ) : (
                          <span className="text-gray-500">→</span>
                        )}
                        <span className={pred.trend === "UP" ? "text-red-400" : pred.trend === "DOWN" ? "text-emerald-400" : "text-gray-400"}>
                          {pred.trend}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Progress density overlay line */}
                  <div className="w-full bg-gray-950 h-2 rounded-full mt-3 overflow-hidden border border-white/5 relative">
                    <div 
                      className={`h-full rounded-full transition-all duration-700 ease-out ${progressColor} ${glowColor}`}
                      style={{ width: `${pred.capacityRate}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Gate Latencies dynamic bars Recharts visualization */}
        <div className="glass-panel p-6 rounded-3xl lg:col-span-6 space-y-4">
          <div className="border-b border-white/10 pb-4">
            <h3 className="font-sans font-bold text-lg text-white">Physical Turnstile Pressure</h3>
            <p className="text-gray-400 text-xs font-mono">Live processing latencies mapping current sensor throughput ratios</p>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={gateLatencyData}>
                <XAxis dataKey="name" stroke="#4b5563" fontSize={11} fontFamily="JetBrains Mono" dy={8} />
                <YAxis stroke="#4b5563" fontSize={11} fontFamily="JetBrains Mono" dx={-8} />
                <Tooltip 
                  contentStyle={{ backgroundColor: "#0c0d14", borderColor: "#bc13fe", borderRadius: 12 }}
                  itemStyle={{ fontFamily: "JetBrains Mono", fontSize: 11, color: "#fff" }}
                />
                <Bar dataKey="latency" radius={[8, 8, 0, 0]} isAnimationActive={true} animationDuration={1000}>
                  {gateLatencyData.map((entry, index) => {
                    const color = entry.latency > 6 ? "#f43f5e" : entry.latency > 3 ? "#eab308" : "#00f0ff";
                    return <Cell key={`cell-${index}`} fill={color} />;
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-3 gap-2 pt-2 border-t border-white/5 text-[10px] font-mono text-center">
            <span className="text-[#00f0ff] font-bold">● Low (1-3 mins)</span>
            <span className="text-[#eab308] font-bold animate-pulse">● Warning (3-6 mins)</span>
            <span className="text-[#f43f5e] font-bold animate-pulse">● Critical (&gt;6 mins)</span>
          </div>
        </div>
      </div>

      {/* AI Smart Operations Recommendations Module (Featuring Expandable Insight Cards) */}
      <div className="glass-panel p-6 rounded-3xl space-y-6">
        <div>
          <div className="flex justify-between items-center pb-4 border-b border-white/10">
            <div>
              <h3 className="font-sans font-bold text-lg text-white font-sans flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-yellow-400 animate-spin" />
                <span>Smart AI Recommendations Console</span>
              </h3>
              <p className="text-gray-400 text-xs font-mono">
                Real-time, neural suggestion logs responding dynamically to sensor bottlenecks. Click card to audit override controls.
              </p>
            </div>
          </div>
        </div>

        {/* List of recommendations as beautiful interactive expandable boxes */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {telemetry.aiRecommendations.map((rec) => {
            const isExpanded = expandedCardId === rec.id;
            let iconColor = "text-cyan-400 bg-cyan-950/40 border border-cyan-500/25";
            if (rec.category === "ENERGY") {
              iconColor = "text-emerald-400 bg-emerald-950/40 border border-emerald-500/25";
            } else if (rec.category === "SAFETY") {
              iconColor = "text-red-400 bg-red-950/40 border border-red-500/25";
            } else if (rec.category === "CONCESSIONS") {
              iconColor = "text-amber-400 bg-amber-950/40 border border-amber-500/25";
            }

            return (
              <div 
                key={rec.id}
                className={`p-4 bg-white/5 border rounded-2xl transition-all duration-300 relative overflow-hidden group hover:bg-white/10 ${
                  rec.resolved 
                    ? "border-emerald-500/30 bg-emerald-950/5 opacity-80" 
                    : isExpanded 
                    ? "border-cyan-500/50 shadow-[0_0_15px_rgba(0,240,255,0.1)]" 
                    : "border-white/5"
                }`}
              >
                {/* Visual neon color tags */}
                <div className="flex justify-between items-center mb-3">
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-0.5 rounded text-[8px] font-mono tracking-widest font-bold uppercase ${iconColor}`}>
                      {rec.category}
                    </span>
                    <span className={`px-1.5 py-0.5 rounded text-[8px] font-mono font-semibold ${
                      rec.severity === "HIGH" ? "text-red-400 bg-red-950/25" :
                      rec.severity === "MEDIUM" ? "text-amber-400 bg-amber-950/25" :
                      "text-cyan-400 bg-cyan-950/25"
                    }`}>
                      {rec.severity} PRIOR
                    </span>
                  </div>

                  <button
                    onClick={() => handleToggleCard(rec.id)}
                    className="p-1 text-gray-500 hover:text-white rounded-lg transition"
                  >
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                </div>

                <div className="cursor-pointer" onClick={() => handleToggleCard(rec.id)}>
                  <h4 className={`text-sm font-sans font-bold text-white transition-colors duration-200 ${rec.resolved ? "line-through text-slate-500" : "group-hover:text-cyan-400"}`}>
                    {rec.title}
                  </h4>
                  <p className="text-slate-300 text-xs font-sans mt-1 leading-relaxed line-clamp-2">
                    {rec.description}
                  </p>
                </div>

                {/* Expanded Details section */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div 
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25 }}
                      className="mt-4 pt-4 border-t border-white/5 space-y-3 overflow-hidden text-xs"
                    >
                      <div className="bg-black/30 p-2.5 rounded-xl border border-white/5 text-[11px] font-mono text-slate-300 leading-relaxed">
                        <span className="text-cyan-400 font-bold block mb-1">Impact projection index:</span>
                        {rec.impact}
                      </div>

                      <div className="flex items-center justify-between text-[11px] font-mono">
                        <span className="text-gray-500">OVERRIDE LINK STATUS</span>
                        <span className={rec.resolved ? "text-emerald-400 font-bold" : "text-amber-500"}>
                          {rec.resolved ? "DEPLOYED" : "ON STANDBY"}
                        </span>
                      </div>

                      <button
                        onClick={() => handleExecuteOverride(rec.id)}
                        className={`w-full py-2 font-mono font-bold text-[10px] uppercase rounded-lg transition cursor-pointer tracking-wider flex items-center justify-center gap-1.5 ${
                          rec.resolved 
                            ? "bg-slate-800 hover:bg-slate-700 text-gray-400 border border-white/5" 
                            : "bg-cyan-500 hover:bg-cyan-400 text-black shadow-md shadow-cyan-500/10"
                        }`}
                      >
                        {rec.resolved ? (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Rollback System Change</span>
                          </>
                        ) : (
                          <>
                            <Zap className="w-3.5 h-3.5 animate-pulse" />
                            <span>Authorize Override Script</span>
                          </>
                        )}
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>

      {/* Futuristic Occupancy Detail Bento Area for Parking Locations */}
      <div className="glass-panel p-6 rounded-3xl space-y-6">
        <div>
          <h3 className="font-sans font-bold text-lg text-white">Arena Vehicle Landing Zone Dashboard</h3>
          <p className="text-gray-400 text-xs font-mono">Simulated physical occupancy allocation maps inside parking coordinates</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 font-mono text-xs">
          {Object.entries(telemetry.parkingStatus).map(([key, zone]) => {
            const label = key === "northLot" ? "North Lot Landing" : key === "southGarage" ? "South Multi-Levels" : key === "vipEast" ? "VIP Dedicated East" : "West Express Link";
            const ratio = ((zone.filled / zone.capacity) * 100);
            
            let barColor = "bg-[#00f0ff]";
            let textColor = "text-cyan-400";
            if (ratio > 90) {
              barColor = "bg-rose-500";
              textColor = "text-rose-400";
            } else if (ratio > 75) {
              barColor = "bg-amber-400";
              textColor = "text-amber-400";
            }

            return (
              <div key={key} className="p-4 bg-black/45 border border-white/5 rounded-2xl flex flex-col justify-between">
                <div>
                  <span className="text-[10px] text-gray-500 uppercase font-bold tracking-widest block font-mono">PARKING INDEX</span>
                  <span className="text-white font-bold text-[13px] block mt-1 font-sans">{label}</span>
                  
                  <div className="flex items-baseline gap-2 mt-2.5">
                    <span className="text-xl font-bold font-mono text-white">
                      <AnimatedCounter value={zone.filled} />
                    </span>
                    <span className="text-gray-500 text-xs">/ {zone.capacity.toLocaleString()}</span>
                  </div>
                </div>

                <div className="space-y-2 mt-4">
                  <div className="flex justify-between items-center text-[10px]">
                    <span className="text-gray-400">Availability ratio:</span>
                    <span className={`${textColor} font-bold`}>{ratio.toFixed(1)}% Fill</span>
                  </div>
                  
                  <div className="w-full bg-gray-950 h-2 rounded-full overflow-hidden border border-white/5">
                    <div 
                      className={`h-full rounded-full ${barColor}`} 
                      style={{ width: `${ratio}%` }}
                    ></div>
                  </div>

                  <span className={`text-[9px] uppercase tracking-wider font-bold block ${textColor} mt-1 text-right`}>
                    ● {zone.state}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}
