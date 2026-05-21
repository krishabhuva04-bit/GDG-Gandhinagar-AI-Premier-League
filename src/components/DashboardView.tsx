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
  CheckCircle2,
  Utensils,
  Bath,
  Shield
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

  // Dynamic recommenders pre-computations
  const gateEntries = Object.entries(telemetry.gateLatencies || {});
  const fastestGate = gateEntries.length > 0
    ? gateEntries.reduce((min, cur) => (cur[1] < min[1] ? cur : min), ["A", 99])
    : ["A", 3.0];
  const fastestGateName = fastestGate[0];
  const fastestGateTime = fastestGate[1];

  const leastBusyConcession = (telemetry.queuePredictions || []).reduce(
    (min, cur) => (cur.waitTime < min.waitTime ? cur : min),
    telemetry.queuePredictions?.[0] || { name: "Northeast Lobby Food Truck", waitTime: 5 }
  );

  const parkingEntries = Object.entries(telemetry.parkingStatus || {});
  const leastBusyParking = parkingEntries.length > 0
    ? parkingEntries.reduce((min, cur) => {
        const curRatio = cur[1].filled / cur[1].capacity;
        const minRatio = min[1].filled / min[1].capacity;
        return curRatio < minRatio ? cur : min;
      }, parkingEntries[0])
    : ["westExpress", { filled: 1200, capacity: 3500, state: "NOMINAL" }];

  const leastBusyParkingKey = leastBusyParking[0];
  const leastBusyParkingLabel = leastBusyParkingKey === "northLot" ? "North Lot Landing" :
                               leastBusyParkingKey === "southGarage" ? "South Multi-Levels" :
                               leastBusyParkingKey === "vipEast" ? "VIP Dedicated East" :
                               "West Express Link";
  const leastBusyParkingOpenPct = Math.round(100 - (leastBusyParking[1].filled / leastBusyParking[1].capacity) * 100);

  // Dynamic calculated telemetry states according to user guidelines
  const gateACrowd = Math.min(99, Math.max(10, Math.round(78 + ((telemetry.gateLatencies.A - 2.1) * 7))));
  const gateBCrowd = Math.min(99, Math.max(10, Math.round(42 + ((telemetry.gateLatencies.B - 3.5) * 6))));
  const foodCourtWait = Math.max(1, Math.round(9 + ((telemetry.queuePredictions[2]?.waitTime - 8 || 0) * 1)));
  const parkingAvailable = Math.max(1, Math.round(134 + ((1420 - telemetry.parkingStatus.westExpress.filled) / 3)));
  const washroomOccupancy = telemetry.washroomOccupancy || 63;
  const securityStatus = telemetry.securityStatus || "NORMAL";

  // Dynamic live activity log state
  const [activityLogs, setActivityLogs] = useState<Array<{ id: string; time: string; msg: string; type: "SUCCESS" | "WARNING" | "INFO" | "SECURITY" }>>([
    { id: "log-1", time: new Date(Date.now() - 15000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }), msg: "Turnstiles at Gate A calibrated to optimal flow rate.", type: "SUCCESS" },
    { id: "log-2", time: new Date(Date.now() - 11000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }), msg: "West Express parking routing matrix fully verified.", type: "INFO" },
    { id: "log-3", time: new Date(Date.now() - 7000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }), msg: "Sensor grid telemetry sync established over secure MQTT bridge.", type: "SUCCESS" },
    { id: "log-4", time: new Date(Date.now() - 3000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }), msg: "Security patrol drones shifted to sector scan mode.", type: "SECURITY" },
  ]);

  // Append logs on telemetry changes (auto-update simulation triggered)
  React.useEffect(() => {
    const currentTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const logTemplates = [
      { msg: `Gate A crowd buffer shifted. Throughput capacity: ${gateACrowd}% index.`, type: "INFO" },
      { msg: `Gate B flow rate shifted to ${gateBCrowd}% capacity.`, type: "INFO" },
      { msg: `Food Court queue predictions updated. Localized wait times at ${foodCourtWait} mins.`, type: "SUCCESS" },
      { msg: `Parking grid available slots recalculated. Available: ${parkingAvailable} aggregate spaces.`, type: "SUCCESS" },
      { msg: `Restroom telemetry update. Occupancy status at ${washroomOccupancy}%.`, type: "INFO" },
      { msg: `Defensive network security state verified: Status ${securityStatus}.`, type: "SECURITY" },
    ];
    
    const selected = logTemplates[Math.floor(Math.random() * logTemplates.length)];
    setActivityLogs(prev => [
      {
        id: `log-${Date.now()}`,
        time: currentTime,
        msg: selected.msg,
        type: selected.type as any
      },
      ...prev.slice(0, 15) // Keep last 15 elements
    ]);
  }, [telemetry]);

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

      {/* Real-time IoT Gateway Operations Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8" id="iot-telemetry-gateway">
        {/* Left Side: 6 IoT Telemetry Micro Cells */}
        <div className="xl:col-span-2 glass-panel p-6 rounded-3xl border border-white/10 space-y-6 relative overflow-hidden flex flex-col justify-between shadow-[0_0_30px_rgba(0,240,255,0.03)]">
          <div className="absolute top-0 right-0 h-44 w-44 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-cyan-500/5 via-transparent to-transparent pointer-events-none"></div>
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-4">
            <div>
              <div className="flex items-center space-x-2">
                <span className="h-2 w-2 bg-[#00f0ff] rounded-full animate-ping"></span>
                <span className="h-2 w-2 bg-[#00f0ff] rounded-full absolute"></span>
                <h3 className="font-sans font-bold text-lg text-white">IoT Live Gate & Operational Matrix</h3>
              </div>
              <p className="text-gray-400 text-xs font-mono mt-0.5">Physical sensor array monitors matching target digital twin coordinates</p>
            </div>
            <div className="flex items-center space-x-2 text-[10px] font-mono text-cyan-400 bg-cyan-400/10 border border-cyan-400/20 px-2.5 py-1 rounded-full animate-pulse self-start sm:self-auto">
              <span>ACTIVE BRIDGE REFRESH: 3.5S</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {/* Card 1: Gate A Crowd */}
            <motion.div 
              layoutId="sensor-gate-a"
              whileHover={{ y: -3, borderColor: "rgba(0,240,255,0.3)" }}
              className="p-4 bg-cyber-dark/40 border border-white/5 rounded-2xl relative overflow-hidden group transition duration-300"
            >
              <div className="flex justify-between items-start text-xs font-mono">
                <span className="text-gray-500 uppercase tracking-wider">Gate A Entrance</span>
                <TrendingUp className="w-3.5 h-3.5 text-amber-500" />
              </div>
              <div className="mt-2.5 flex items-baseline justify-between">
                <span className="text-2xl font-mono font-bold text-white">
                  <AnimatedCounter value={gateACrowd} suffix="%" />
                </span>
                <span className="text-[10px] font-mono bg-amber-500/10 text-amber-400 border border-amber-500/20 px-1.5 py-0.5 rounded">
                  HEAVY
                </span>
              </div>
              <div className="w-full bg-gray-900 h-1.5 rounded-full mt-3 overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${gateACrowd}%` }}
                  transition={{ type: "spring", stiffness: 100 }}
                  className="bg-gradient-to-r from-amber-500 to-orange-500 h-full rounded-full"
                ></motion.div>
              </div>
            </motion.div>

            {/* Card 2: Gate B Crowd */}
            <motion.div 
              layoutId="sensor-gate-b"
              whileHover={{ y: -3, borderColor: "rgba(0,240,255,0.3)" }}
              className="p-4 bg-cyber-dark/40 border border-white/5 rounded-2xl relative overflow-hidden group transition duration-300"
            >
              <div className="flex justify-between items-start text-xs font-mono">
                <span className="text-gray-500 uppercase tracking-wider">Gate B Entrance</span>
                <TrendingDown className="w-3.5 h-3.5 text-emerald-400" />
              </div>
              <div className="mt-2.5 flex items-baseline justify-between">
                <span className="text-2xl font-mono font-bold text-white">
                  <AnimatedCounter value={gateBCrowd} suffix="%" />
                </span>
                <span className="text-[10px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-1.5 py-0.5 rounded">
                  MODERATE
                </span>
              </div>
              <div className="w-full bg-gray-900 h-1.5 rounded-full mt-3 overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${gateBCrowd}%` }}
                  transition={{ type: "spring", stiffness: 100 }}
                  className="bg-gradient-to-r from-emerald-500 to-cyan-500 h-full rounded-full"
                ></motion.div>
              </div>
            </motion.div>

            {/* Card 3: Food Court Wait */}
            <motion.div 
              layoutId="sensor-food-court"
              whileHover={{ y: -3, borderColor: "rgba(0,240,255,0.3)" }}
              className="p-4 bg-cyber-dark/40 border border-white/5 rounded-2xl relative overflow-hidden group transition duration-300"
            >
              <div className="flex justify-between items-start text-xs font-mono">
                <span className="text-gray-500 uppercase tracking-wider flex items-center gap-1">
                  <Utensils className="w-3 h-3 text-cyan-400" />
                  <span>Food Court Wait</span>
                </span>
                <Clock className="w-3.5 h-3.5 text-yellow-400 animate-pulse" />
              </div>
              <div className="mt-2.5 flex items-baseline justify-between">
                <span className="text-2xl font-mono font-bold text-white">
                  <AnimatedCounter value={foodCourtWait} suffix=" mins" />
                </span>
                <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                  foodCourtWait > 12 ? "bg-rose-500/10 text-rose-400 border border-rose-500/20" : "bg-cyan-500/10 text-cyan-400 border border-cyan-400/20"
                }`}>
                  {foodCourtWait > 12 ? "CONGESTED" : "STEADY"}
                </span>
              </div>
              <div className="w-full bg-gray-900 h-1.5 rounded-full mt-3 overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(100, foodCourtWait * 6)}%` }}
                  transition={{ type: "spring", stiffness: 100 }}
                  className="bg-yellow-500 h-full rounded-full"
                ></motion.div>
              </div>
            </motion.div>

            {/* Card 4: Parking Available */}
            <motion.div 
              layoutId="sensor-parking"
              whileHover={{ y: -3, borderColor: "rgba(0,240,255,0.3)" }}
              className="p-4 bg-cyber-dark/40 border border-white/5 rounded-2xl relative overflow-hidden group transition duration-300"
            >
              <div className="flex justify-between items-start text-xs font-mono">
                <span className="text-gray-500 uppercase tracking-wider flex items-center gap-1">
                  <Car className="w-3 h-3 text-cyan-400" />
                  <span>Available Parking</span>
                </span>
                <TrendingUp className="w-3.5 h-3.5 text-[#00f0ff]" />
              </div>
              <div className="mt-2.5 flex items-baseline justify-between">
                <span className="text-2xl font-mono font-bold text-white">
                  <AnimatedCounter value={parkingAvailable} />
                  <span className="text-[10px] text-gray-500 ml-1 font-sans">spots</span>
                </span>
                <span className="text-[10px] font-mono bg-cyan-500/10 text-cyan-400 border border-cyan-400/20 px-1.5 py-0.5 rounded">
                  OPEN
                </span>
              </div>
              <div className="w-full bg-gray-900 h-1.5 rounded-full mt-3 overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(100, (parkingAvailable / 200) * 100)}%` }}
                  transition={{ type: "spring", stiffness: 100 }}
                  className="bg-[#00f0ff] h-full rounded-full"
                ></motion.div>
              </div>
            </motion.div>

            {/* Card 5: Washroom Occupancy */}
            <motion.div 
              layoutId="sensor-washroom"
              whileHover={{ y: -3, borderColor: "rgba(0,240,255,0.3)" }}
              className="p-4 bg-cyber-dark/40 border border-white/5 rounded-2xl relative overflow-hidden group transition duration-300"
            >
              <div className="flex justify-between items-start text-[11px] font-mono">
                <span className="text-gray-500 uppercase tracking-wider flex items-center gap-1">
                  <Bath className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Washroom Occupancy</span>
                </span>
                <TrendingDown className="w-3.5 h-3.5 text-violet-400" />
              </div>
              <div className="mt-2.5 flex items-baseline justify-between">
                <span className="text-2xl font-mono font-bold text-white">
                  <AnimatedCounter value={washroomOccupancy} suffix="%" />
                </span>
                <span className="text-[10px] font-mono bg-[#bc13fe]/10 text-[#bc13fe] border border-[#bc13fe]/20 px-1.5 py-0.5 rounded">
                  {washroomOccupancy > 75 ? "CRITICAL" : "STABLE"}
                </span>
              </div>
              <div className="w-full bg-gray-900 h-1.5 rounded-full mt-3 overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${washroomOccupancy}%` }}
                  transition={{ type: "spring", stiffness: 100 }}
                  className="bg-gradient-to-r from-[#bc13fe] to-indigo-500 h-full rounded-full"
                ></motion.div>
              </div>
            </motion.div>

            {/* Card 6: Security Status */}
            <motion.div 
              layoutId="sensor-security"
              whileHover={{ y: -3, borderColor: "rgba(0,240,255,0.3)" }}
              className="p-4 bg-cyber-dark/40 border border-white/5 rounded-2xl relative overflow-hidden group transition duration-300"
            >
              <div className="flex justify-between items-start text-xs font-mono">
                <span className="text-gray-500 uppercase tracking-wider flex items-center gap-1">
                  <Shield className="w-3 h-3 text-cyan-400" />
                  <span>Security Status</span>
                </span>
                <span className={`w-2 h-2 rounded-full absolute right-4 top-4 ${
                  securityStatus === "ALERT" ? "bg-red-500 animate-ping" : securityStatus === "VIGILANT" ? "bg-yellow-500 animate-pulse" : "bg-emerald-500 animate-pulse"
                }`}></span>
              </div>
              <div className="mt-2.5 flex items-baseline justify-between">
                <span className={`text-xl font-mono font-bold uppercase ${
                  securityStatus === "ALERT" ? "text-red-400 animate-pulse" : securityStatus === "VIGILANT" ? "text-yellow-400" : "text-white"
                }`}>
                  {securityStatus}
                </span>
                <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded uppercase font-bold ${
                  securityStatus === "ALERT" ? "bg-red-500/20 text-red-400 border border-red-500/30" :
                  securityStatus === "VIGILANT" ? "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30" :
                  "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                }`}>
                  {securityStatus === "ALERT" ? "TACTICAL" : securityStatus === "VIGILANT" ? "HIGH GUARD" : "OPTIMAL"}
                </span>
              </div>
              <div className="w-full bg-gray-900 h-1.5 rounded-full mt-3 overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: securityStatus === "ALERT" ? 100 : securityStatus === "VIGILANT" ? 65 : 30 }}
                  transition={{ type: "spring", stiffness: 100 }}
                  className={`h-full rounded-full ${
                    securityStatus === "ALERT" ? "bg-red-500" : securityStatus === "VIGILANT" ? "bg-yellow-500" : "bg-emerald-500"
                  }`}
                ></motion.div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Right Side: Log Stream */}
        <div className="xl:col-span-1 glass-panel p-6 rounded-3xl border border-white/10 flex flex-col justify-between shadow-[0_0_30px_rgba(0,240,255,0.02)]">
          <div className="flex items-center justify-between border-b border-white/5 pb-4">
            <div className="flex items-center space-x-2">
              <span className="h-1.5 w-1.5 bg-emerald-500 rounded-full animate-ping"></span>
              <span className="font-sans font-bold text-base text-white">Live Activity Stream</span>
            </div>
            <span className="text-[9px] font-mono text-gray-500 text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-indigo-400">MONITOR BRIDGE ACTIVE</span>
          </div>

          {/* Logs feed with AnimatePresence */}
          <div className="my-4 h-56 overflow-y-auto pr-1 scrollbar-thin space-y-2.5 flex flex-col justify-start">
            <AnimatePresence initial={false}>
              {activityLogs.map((log) => {
                const borderColour = log.type === "SUCCESS" ? "border-emerald-500/20 bg-emerald-950/5" :
                                     log.type === "WARNING" ? "border-amber-500/20 bg-amber-950/5" :
                                     log.type === "SECURITY" ? "border-red-500/20 bg-red-950/5" : "border-white/5 bg-white/[0.01]";
                const textColour = log.type === "SUCCESS" ? "text-emerald-400" :
                                   log.type === "WARNING" ? "text-amber-400" :
                                   log.type === "SECURITY" ? "text-red-400" : "text-cyan-400";
                return (
                  <motion.div
                    key={log.id}
                    initial={{ opacity: 0, scale: 0.95, y: -8 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ type: "spring", stiffness: 150, damping: 15 }}
                    className={`p-2.5 rounded-xl border ${borderColour} text-[10px] font-mono leading-relaxed`}
                  >
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-[9px] text-gray-500 font-bold">{log.time}</span>
                      <span className={`text-[8px] tracking-wider font-extrabold px-1 rounded ${textColour} bg-white/[0.04] uppercase`}>
                        {log.type}
                      </span>
                    </div>
                    <div className="text-gray-300">{log.msg}</div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>

          <div className="border-t border-white/5 pt-3.5 flex items-center justify-between text-[10px] font-mono text-gray-500">
            <span>Grid state: SECURE TLS 1.3</span>
            <span>Logs: {activityLogs.length} stream buffer</span>
          </div>
        </div>
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

      {/* Dynamic Crowd Surge & Smart Fan Recommendations Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Module A: Live Crowd Surge Prediction Model */}
        <div className="glass-panel p-6 rounded-3xl border border-white/10 space-y-5 relative overflow-hidden flex flex-col justify-between">
          <div className="absolute right-0 top-0 h-40 w-40 bg-gradient-to-br from-neon-purple/5 to-transparent blur-2xl pointer-events-none"></div>
          
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <h3 className="font-sans font-bold text-lg text-white flex items-center gap-2">
                <Flame className="w-5 h-5 text-rose-500 animate-pulse" />
                <span>AI Crowd Surge Prediction Model</span>
              </h3>
              <span className="px-2 py-0.5 rounded bg-rose-500/10 text-rose-400 text-[9px] font-mono font-bold border border-rose-500/25 animate-pulse">
                PREDICTIVE AI ACTIVE
              </span>
            </div>
            <p className="text-gray-400 text-xs font-mono">
              Neural simulation model projecting pedestrian bottleneck and crowd turbulence indexes for the next 15 minutes.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 my-2">
            <div className="p-4 bg-black/40 border border-white/5 rounded-2xl text-center flex flex-col justify-center">
              <span className="text-[10px] text-gray-400 font-mono uppercase block">GLOBAL TURBULENCE WEIGHT</span>
              <span className="text-2xl font-mono font-extrabold text-white mt-1">
                <AnimatedCounter value={Math.round((telemetry.attendance / telemetry.maxCapacity) * 85 + (telemetry.activeIncidents.length * 5))} />%
              </span>
              <span className="text-[10px] text-rose-400 font-mono block mt-1">
                {telemetry.attendance > 75000 ? "⚠️ SEVERE OVERLOAD POTENTIAL" : "● HIGH PEDESTRIAN PRESSURE"}
              </span>
            </div>

            <div className="p-4 bg-black/40 border border-white/5 rounded-2xl text-center flex flex-col justify-center">
              <span className="text-[10px] text-gray-400 font-mono uppercase block">CRITICAL OVERCROWD RISK</span>
              <span className="text-2xl font-mono font-extrabold text-[#bc13fe] mt-1">
                <AnimatedCounter value={telemetry.attendance > 78000 ? 92 : telemetry.attendance > 74000 ? 76 : 48} />%
              </span>
              <span className="text-[10px] text-purple-400 font-mono block mt-1">
                Exponential Model Projections
              </span>
            </div>
          </div>

          <div className="space-y-3">
            <span className="text-[10px] text-gray-400 font-mono tracking-wider uppercase block">HIGH-RISK ARENA CHOKEPOINTS:</span>
            
            {/* Gate C chokepoint */}
            <div className="p-3 bg-white/5 border border-white/5 rounded-xl flex items-center justify-between text-xs font-mono">
              <div className="flex items-center gap-2.5">
                <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping"></div>
                <span className="text-white font-bold">Gate C Entrance Lobby</span>
              </div>
              <div className="text-right">
                <span className="text-red-400 font-bold block">94.2% Probability</span>
                <span className="text-[10px] text-gray-400 block">Surge window: +5 mins</span>
              </div>
            </div>

            {/* Level 2 Sect 214 */}
            <div className="p-3 bg-white/5 border border-white/5 rounded-xl flex items-center justify-between text-xs font-mono font-semibold">
              <div className="flex items-center gap-2.5">
                <div className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse"></div>
                <span className="text-white font-bold">Concourse Sec 214 Outer Ring</span>
              </div>
              <div className="text-right">
                <span className="text-amber-400 font-bold block">
                  <AnimatedCounter value={telemetry.activeIncidents.some(i => i.section.includes("214")) ? 82 : 45} />% Probability
                </span>
                <span className="text-[10px] text-gray-400 block">Surge window: +12 mins</span>
              </div>
            </div>

            {/* VIP East Concourse */}
            <div className="p-3 bg-white/5 border border-white/5 rounded-xl flex items-center justify-between text-xs font-mono font-semibold">
              <div className="flex items-center gap-2.5">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500"></div>
                <span className="text-white font-medium">VIP East Concourse Deck</span>
              </div>
              <div className="text-right">
                <span className="text-emerald-400 font-bold block">12.5% Probability</span>
                <span className="text-[10px] text-gray-400 block">Surge window: STABLE NOMINAL</span>
              </div>
            </div>
          </div>
        </div>

        {/* Module B: Dynamic AI Fan Optimizer & Recommendations */}
        <div className="glass-panel p-6 rounded-3xl border border-white/10 space-y-5 relative overflow-hidden flex flex-col justify-between">
          <div className="absolute left-0 bottom-0 h-40 w-40 bg-gradient-to-tr from-cyan-500/5 to-transparent blur-2xl pointer-events-none"></div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <h3 className="font-sans font-bold text-lg text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-cyan-400 animate-pulse" />
                <span>Smart Fan Recommendation Feed</span>
              </h3>
              <span className="px-2 py-0.5 rounded bg-cyan-400/10 text-cyan-400 text-[9px] font-mono font-bold border border-cyan-400/25">
                DYNAMIC SIGNAL PATH: OPEN
              </span>
            </div>
            <p className="text-gray-400 text-xs font-mono">
              Automated spectator guidance directives formulated based on current lobby queue sizes and parking telemetry grids.
            </p>
          </div>

          {/* Core Dynamic Recommenders */}
          <div className="space-y-4 my-2">
            
            {/* 1. Best Gate Option */}
            <div className="p-3.5 bg-black/45 border border-white/5 rounded-2xl space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-[10px] text-cyan-400 font-mono uppercase tracking-wider block font-bold">🚪 OPTIMAL INGRESS/EGRESS ACCESS</span>
                <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 text-[9px] font-mono font-bold">Fastest Response</span>
              </div>
              <div className="flex items-center justify-between text-xs font-mono">
                <div>
                  <span className="text-white font-extrabold text-sm block">
                    Gate {fastestGateName} Bypass
                  </span>
                  <span className="text-gray-400 text-[10px]">Recommended over congested Gate C bottleneck corridors</span>
                </div>
                <div className="text-right text-emerald-400 font-bold font-mono">
                  Wait: {fastestGateTime} mins
                </div>
              </div>
            </div>

            {/* 2. Ideal Restroom / Concessions Stand */}
            <div className="p-3.5 bg-black/45 border border-white/5 rounded-2xl space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-[10px] text-[#bc13fe] font-mono uppercase tracking-wider block font-bold">🍔 CONCESSIONS & DINING OPTIMIZER</span>
                <span className="px-2 py-0.5 rounded bg-[#bc13fe]/10 text-purple-300 text-[9px] font-mono font-bold">Minimum Wait</span>
              </div>
              <div className="flex items-center justify-between text-xs font-mono">
                <div>
                  <span className="text-white font-extrabold text-sm block">
                    {leastBusyConcession.name}
                  </span>
                  <span className="text-gray-400 text-[10px]">Real-time queue tracking matches express droid dispatching</span>
                </div>
                <div className="text-right text-purple-400 font-bold font-mono">
                  Wait: {leastBusyConcession.waitTime} mins
                </div>
              </div>
            </div>

            {/* 3. Parking Option */}
            <div className="p-3.5 bg-black/45 border border-white/5 rounded-2xl space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-[10px] text-amber-500 font-mono uppercase tracking-wider block font-bold">🚘 HIGHWAY VARIABLE ROUTING TARGET</span>
                <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 text-[9px] font-mono font-bold">Low Congestion Zone</span>
              </div>
              <div className="flex items-center justify-between text-xs font-mono">
                <div>
                  <span className="text-white font-extrabold text-sm block font-sans">
                    {leastBusyParkingLabel}
                  </span>
                  <span className="text-gray-400 text-[10px]">Divert incoming motorists instantly to prevent ingress lockups</span>
                </div>
                <div className="text-right text-amber-400 font-bold font-mono">
                  Open: {leastBusyParkingOpenPct}% slots
                </div>
              </div>
            </div>

          </div>
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
