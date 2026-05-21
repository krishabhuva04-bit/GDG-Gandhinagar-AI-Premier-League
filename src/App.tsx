import React, { useState, useEffect } from "react";
import { PageId, TelemetryData, Incident } from "./types";
import Navbar from "./components/Navbar";
import HomeView from "./components/HomeView";
import DashboardView from "./components/DashboardView";
import MapView from "./components/MapView";
import AssistantView from "./components/AssistantView";
import EmergencyView from "./components/EmergencyView";
import AdminView from "./components/AdminView";
import { 
  ShieldAlert, 
  RefreshCw,
  Sparkles,
  Info
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export default function App() {
  const [currentPage, setCurrentPage] = useState<PageId>("home");
  
  // Primary operational state synced directly with server or client memory base fallback
  const [telemetry, setTelemetry] = useState<TelemetryData>({
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
    fanSentiment: [
      { id: "sent-1", user: "SpectatorX", text: "The stadium layout graphics are incredible. High contrast dome system!", sentiment: "POSITIVE", timestamp: "14:10" },
      { id: "sent-2", user: "Robbie_G", text: "Main entrance congestion is being managed beautifully. Good info on app.", sentiment: "POSITIVE", timestamp: "14:08" },
      { id: "sent-3", user: "Elena_C", text: "Gate C turnstiles are taking far too long. Fix the card readers please.", sentiment: "NEGATIVE", timestamp: "14:05" },
      { id: "sent-4", user: "GridSpecter", text: "Dome retracted layout today. Perfect thermal operations.", sentiment: "POSITIVE", timestamp: "14:01" },
      { id: "sent-5", user: "Nate_L", text: "VIP parking is filled up. Re-routing was slightly late.", sentiment: "NEUTRAL", timestamp: "13:58" }
    ],
    queuePredictions: [
      { id: "qp-1", name: "Gate C Lobby", currentQueue: 48, waitTime: 14, trend: "DOWN", capacityRate: 85 },
      { id: "qp-2", name: "Gate A Entry", currentQueue: 12, waitTime: 2, trend: "STEADY", capacityRate: 35 },
      { id: "qp-3", name: "Section 214 Concessions", currentQueue: 28, waitTime: 8, trend: "UP", capacityRate: 68 },
      { id: "qp-4", name: "North Deck Restrooms", currentQueue: 18, waitTime: 5, trend: "UP", capacityRate: 50 },
      { id: "qp-5", name: "VIP East Concourse", currentQueue: 5, waitTime: 1, trend: "DOWN", capacityRate: 15 }
    ],
    aiRecommendations: [
      { id: "rec-1", title: "Thermal Air-Conditioning Offload", category: "ENERGY", description: "Exterior humidity levels have dropped to 42%. Dome HVAC chillers can shift to lower natural cycles, conserving up to 15kW/hour.", impact: "Optimizes power grid draw gracefully", severity: "LOW", resolved: false },
      { id: "rec-2", title: "Route Crowds to Gate B Bypass", category: "CROWD", description: "Gate C experiencing 6.5 minutes check queues. Synchronize digital wayfinding signage around lower tier to advise Gate B.", impact: "Reduces congestion by up to 35%", severity: "HIGH", resolved: false },
      { id: "rec-3", title: "Neutralize Spill at Level 2 Sect 214", category: "SAFETY", description: "Slick floor hazard detected near exit gates. Active sweep droids dispatched, manual security sweep advised to seal perimeter.", impact: "Limits physical arena liability counts", severity: "MEDIUM", resolved: false },
      { id: "rec-4", title: "Express Buffet Deployment", category: "CONCESSIONS", description: "Double order densities tracked inside Northeast Lobby. Shift mobile support vendor droids to Express Checkout modes.", impact: "Cuts localized dining wait times by 4 mins", severity: "MEDIUM", resolved: false }
    ]
  });

  const [syncStatus, setSyncStatus] = useState<"SYNCED" | "STANDALONE">("SYNCED");

  // Fetch initial telemetry from Server if available
  const fetchOperations = async () => {
    try {
      const response = await fetch("/api/operations");
      if (response.ok) {
        const data = await response.json();
        setTelemetry((prev) => ({
          ...prev,
          attendance: data.attendance !== undefined ? data.attendance : prev.attendance,
          gateLatencies: data.gateLatencies || prev.gateLatencies,
          activeIncidents: data.activeIncidents || prev.activeIncidents,
          parkingStatus: data.parkingStatus || prev.parkingStatus,
          evacuationLock: data.evacuationLock !== undefined ? data.evacuationLock : prev.evacuationLock,
          fanSentiment: data.fanSentiment || prev.fanSentiment,
          queuePredictions: data.queuePredictions || prev.queuePredictions,
          aiRecommendations: data.aiRecommendations || prev.aiRecommendations
        }));
        setSyncStatus("SYNCED");
      } else {
        setSyncStatus("STANDALONE");
      }
    } catch (e) {
      console.warn("Backend API not reachable or static SPA mode active. Continuing with client simulated persistence: ", e);
      setSyncStatus("STANDALONE");
    }
  };

  useEffect(() => {
    fetchOperations();
    const syncInterval = setInterval(fetchOperations, 10000); // sync state every 10s
    return () => clearInterval(syncInterval);
  }, []);

  // Client-side simulation trigger for standalone fallback mode
  useEffect(() => {
    if (syncStatus !== "STANDALONE") return;

    const simInterval = setInterval(() => {
      setTelemetry((prev) => {
        // Attendance fluctuation
        const delta = Math.floor((Math.random() - 0.48) * 110);
        const nextAttendance = Math.min(prev.maxCapacity, Math.max(68000, prev.attendance + delta));

        // Let gate latencies drift
        const nextGates = { ...prev.gateLatencies };
        Object.keys(nextGates).forEach((gate) => {
          const change = parseFloat(((Math.random() - 0.5) * 0.3).toFixed(1));
          nextGates[gate] = Math.max(1.0, parseFloat((nextGates[gate] + change).toFixed(1)));
        });

        // Queue predictions drift
        const nextQueuePr = prev.queuePredictions.map((q) => {
          const qChange = Math.floor((Math.random() - 0.45) * 4);
          const nextQ = Math.max(2, q.currentQueue + qChange);
          return {
            ...q,
            currentQueue: nextQ,
            waitTime: Math.max(1, Math.round(nextQ * 0.3)),
            trend: (qChange > 0 ? "UP" : qChange < 0 ? "DOWN" : "STEADY") as any
          };
        });

        // Sentiment comments dynamic simulation
        let nextSentiment = [...prev.fanSentiment];
        if (Math.random() > 0.7) {
          const commentReservoir = [
            { user: "Sarah_K", text: "Pre-event catering inside VIP lounge is top shelf! Food is delightful! 🥐", sentiment: "POSITIVE" },
            { user: "Xavier_99", text: "Line at Gate C is finally clearing. Thanks for the navigation alerts!", sentiment: "POSITIVE" },
            { user: "StadiumGeek", text: "Dome is open tonight, lovely cool breeze. Great work StadiumX!", sentiment: "POSITIVE" },
            { user: "Marcus_D", text: "Cleanliness at level 2 sector 214 has improved quickly since cleanup was marked.", sentiment: "POSITIVE" },
            { user: "Gamer_Gal", text: "Wi-Fi is super fast. Screen synchronizations are 10/10.", sentiment: "POSITIVE" },
            { user: "David_H", text: "Long queue for merchandise stands are annoying. Can we have express checkout kiosks?", sentiment: "NEGATIVE" },
            { user: "Chloe_F", text: "Spilt soda in Section 106, needs cleanup before group slips.", sentiment: "NEGATIVE" },
            { user: "Dan44", text: "Egress routing signs on the ceiling are displaying clear directions.", sentiment: "POSITIVE" },
            { user: "Taylor_R", text: "Finding my seats was a breeze. Perfect grid coordinates.", sentiment: "POSITIVE" },
            { user: "Alex_P", text: "Standard hotdog stands ran out of napkins. Typical.", sentiment: "NEGATIVE" }
          ];
          const chosen = commentReservoir[Math.floor(Math.random() * commentReservoir.length)];
          const newComment = {
            id: `sent-${Date.now().toString().slice(-4)}`,
            user: chosen.user,
            text: chosen.text,
            sentiment: chosen.sentiment as any,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          };
          nextSentiment.unshift(newComment);
          if (nextSentiment.length > 20) nextSentiment.pop();
        }

        return {
          ...prev,
          attendance: nextAttendance,
          gateLatencies: nextGates,
          queuePredictions: nextQueuePr,
          fanSentiment: nextSentiment
        };
      });
    }, 4000);

    return () => clearInterval(simInterval);
  }, [syncStatus]);

  // Dispatch live incident handle (updates server API if possible, with client fallback)
  const handleDispatchIncident = async (
    type: string, 
    section: string, 
    description: string, 
    severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL"
  ) => {
    const newIncident: Incident = {
      id: `inc-${Date.now().toString().slice(-4)}`,
      type,
      section,
      description,
      status: "DISPATCHED",
      severity,
      timestamp: new Date().toISOString()
    };

    // Client update
    setTelemetry((prev) => ({
      ...prev,
      activeIncidents: [newIncident, ...prev.activeIncidents]
    }));

    // Server notify
    try {
      await fetch("/api/operations/incident", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, section, description, severity })
      });
    } catch (e) {
      console.log("Offline local incident simulation fallback success.");
    }
  };

  // Resolve / clear incident handle
  const handleClearIncident = async (id: string) => {
    setTelemetry((prev) => ({
      ...prev,
      activeIncidents: prev.activeIncidents.filter(i => i.id !== id)
    }));

    try {
      await fetch("/api/operations/incident/clear", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id })
      });
    } catch (err) {
      console.log("Local incident removal succeeded.");
    }
  };

  // Update incident current status handle
  const handleUpdateIncidentStatus = async (id: string, status: "DISPATCHED" | "IN_PROGRESS" | "RESOLVED") => {
    setTelemetry((prev) => ({
      ...prev,
      activeIncidents: prev.activeIncidents.map(i => i.id === id ? { ...i, status } : i)
    }));

    try {
      await fetch("/api/operations/incident/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status })
      });
    } catch (err) {
      console.log("Local incident state status modified.");
    }
  };

  // Evacuation lock toggle simulator trigger
  const handleTriggerEvacuation = async (enabled: boolean) => {
    setTelemetry((prev) => {
      let nextIncidents = [...prev.activeIncidents];
      if (enabled) {
        const evacIncident: Incident = {
          id: "evac-alarm",
          section: "ALL SECTIONS",
          type: "EVACUATION_ALERT",
          description: "GLOBAL STADIUM EVACUATION SIMULATION TRIGGERED FROM MANAGEMENT PORTAL",
          status: "TRIGGERED",
          severity: "CRITICAL",
          timestamp: new Date().toISOString(),
        };
        nextIncidents = [evacIncident, ...nextIncidents];
      } else {
        nextIncidents = nextIncidents.filter(i => i.id !== "evac-alarm");
      }

      return {
        ...prev,
        evacuationLock: enabled,
        activeIncidents: nextIncidents
      };
    });

    try {
      await fetch("/api/operations/evacuate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled })
      });
    } catch (err) {
      console.log("Local evacuation state activated.");
    }
  };

  const activeIncidentsCount = telemetry.activeIncidents.filter(i => i.status !== "RESOLVED").length;

  return (
    <div className="flex flex-col min-h-screen bg-[#050508] text-slate-200 font-sans overflow-x-hidden antialiased">
      
      {/* Cyber overlay elements */}
      <div className="fixed inset-0 cyber-grid pointer-events-none z-0"></div>

      {/* Modern responsive navbar */}
      <Navbar 
        currentPage={currentPage} 
        setCurrentPage={setCurrentPage} 
        incidentCount={activeIncidentsCount}
        evacuationLock={telemetry.evacuationLock}
      />

      {/* Main Structural Content Segment */}
      <div className="flex-1 flex flex-col md:pl-64 pt-18 z-10 relative">
        <main className="flex-grow p-6 sm:p-8 max-w-7xl w-full mx-auto space-y-8">
          
          {/* Dynamic breadcrumb subheader to match "Sleek Interface" spacing */}
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/5 pb-4">
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase font-bold tracking-widest text-[#00f0ff] bg-[#00f0ff]/10 border border-[#00f0ff]/25 px-2 py-0.5 rounded">
                Live Operations Link
              </span>
              <span className="text-[11px] text-gray-500 font-mono">
                {syncStatus === "SYNCED" ? "● Telemetry Synchronized" : "⚠️ Offline Sandbox State"}
              </span>
            </div>

            <div className="flex items-center space-x-4 text-[11px] font-mono">
              <span className="text-gray-400">ALERT SENSOR: <span className="text-indigo-400 font-bold">{telemetry.evacuationLock ? "EVAC WATCH" : "LOW"}</span></span>
              <span className="h-4 w-px bg-white/10 hidden sm:inline"></span>
              <span className="text-gray-400 hidden sm:inline">ATTENDANCE PRESSURE: <span className="text-[#bc13fe] font-bold">{((telemetry.attendance / telemetry.maxCapacity)*100).toFixed(1)}%</span></span>
            </div>
          </div>

          {/* Core Page Router switches */}
          <div className="relative">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentPage}
                initial={{ opacity: 0, y: 12, filter: "blur(4px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                exit={{ opacity: 0, y: -12, filter: "blur(4px)" }}
                transition={{ duration: 0.25, ease: "easeInOut" }}
              >
                {currentPage === "home" && (
                  <HomeView 
                    setCurrentPage={setCurrentPage} 
                    telemetry={telemetry} 
                  />
                )}

                {currentPage === "dashboard" && (
                  <DashboardView 
                    telemetry={telemetry} 
                    setTelemetry={setTelemetry} 
                  />
                )}

                {currentPage === "map" && (
                  <MapView 
                    telemetry={telemetry} 
                    onDispatchIncident={handleDispatchIncident} 
                  />
                )}

                {currentPage === "assistant" && (
                  <AssistantView />
                )}

                {currentPage === "emergency" && (
                  <EmergencyView 
                    telemetry={telemetry} 
                    onClearIncident={handleClearIncident}
                    onUpdateIncidentStatus={handleUpdateIncidentStatus}
                    onTriggerEvacuation={handleTriggerEvacuation}
                    onRefreshData={fetchOperations}
                  />
                )}

                {currentPage === "admin" && (
                  <AdminView 
                    telemetry={telemetry} 
                    setTelemetry={setTelemetry}
                    onDispatchIncident={handleDispatchIncident}
                    onTriggerEvacuation={handleTriggerEvacuation}
                  />
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </main>

        {/* Global Footer */}
        <footer className="border-t border-white/5 py-6 px-8 text-center text-xs font-mono text-gray-500 z-10">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
            <span>StadiumX AI Coordinated Arena Systems</span>
            <div className="flex space-x-4 text-gray-600">
              <a href="#privacy" className="hover:text-cyan-400">GRID SECURE v5.21</a>
              <span>/</span>
              <a href="#licensing" className="hover:text-cyan-400">FAILOVER LINK</a>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
