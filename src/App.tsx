import React, { useState, useEffect } from "react";
import { PageId, TelemetryData, Incident, ParkingStatus } from "./types";
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
import { doc, getDocFromServer, onSnapshot, setDoc } from "firebase/firestore";
import { db, handleFirestoreError, OperationType } from "./firebase";

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
    ],
    washroomOccupancy: 63,
    securityStatus: "NORMAL"
  });

  const [syncStatus, setSyncStatus] = useState<"FIREBASE" | "SYNCED" | "STANDALONE">("FIREBASE");
  const [toasts, setToasts] = useState<Array<{ id: string; title: string; message: string; severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL" }>>([]);

  const triggerToast = (title: string, message: string, severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL" = "LOW") => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, title, message, severity }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 6000);
  };

  // Custom unified state-management wrapper with Firebase transactional persistence
  const updateTelemetry = (updater: (prev: TelemetryData) => TelemetryData) => {
    setTelemetry((prev) => {
      const nextVal = updater(prev);
      if (syncStatus === "FIREBASE") {
        const docRef = doc(db, "telemetry", "current");
        setDoc(docRef, nextVal).catch((err) => {
          handleFirestoreError(err, OperationType.WRITE, "telemetry/current");
        });
      }
      return nextVal;
    });
  };

  // Fetch initial telemetry from REST server if available as a fallback
  const fetchOperationsFallback = async () => {
    if (syncStatus === "FIREBASE") return;
    try {
      const response = await fetch("/api/operations");
      if (response.ok) {
        const data = await response.json();
        setTelemetry((prev) => ({
          ...prev,
          ...data
        }));
        setSyncStatus("SYNCED");
      } else {
        setSyncStatus("STANDALONE");
      }
    } catch (e) {
      console.warn("Rest API not reachable. Falling back to sandbox.", e);
      setSyncStatus("STANDALONE");
    }
  };

  // Setup Firestore real-time listener updates
  useEffect(() => {
    let unsubscribe: () => void;

    async function initFirestoreSync() {
      const docRef = doc(db, "telemetry", "current");

      // Validate connection to Firestore initially per requirement (getDocFromServer)
      try {
        await getDocFromServer(docRef);
        console.log("Firestore telemetry connection tested and verified.");
      } catch (error) {
        if (error instanceof Error && error.message.includes("the client is offline")) {
          console.error("Please check your Firebase configuration. Client is offline.");
        }
      }

      // Establish live onSnapshot listener with custom error handling callbacks
      unsubscribe = onSnapshot(docRef, (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data() as TelemetryData;
          setTelemetry((prev) => {
            const prevIncidentIds = new Set(prev.activeIncidents.map(i => i.id));
            const newIncidents = (data.activeIncidents || []).filter((i: any) => !prevIncidentIds.has(i.id));
            
            if (newIncidents.length > 0) {
              newIncidents.forEach((i: any) => {
                triggerToast(
                  `🚨 CLOUD ALARM: ${i.type.replaceAll("_", " ")}`,
                  `[${i.section}] ${i.description}`,
                  i.severity
                );
              });
            }
            return data;
          });
          setSyncStatus("FIREBASE");
        } else {
          // If telemetry does not exist, bootstrap it in Firestore
          console.log("No cloud telemetry doc found. Bootstrapping initial state...");
          setDoc(docRef, telemetry)
            .then(() => {
              setSyncStatus("FIREBASE");
            })
            .catch((err) => {
              handleFirestoreError(err, OperationType.WRITE, "telemetry/current");
            });
        }
      }, (error) => {
        // ALWAYS handle onSnapshot error callbacks per rules
        handleFirestoreError(error, OperationType.GET, "telemetry/current");
        setSyncStatus("STANDALONE");
      });
    }

    initFirestoreSync();

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  // Periodic REST server backup synchronizer
  useEffect(() => {
    if (syncStatus === "FIREBASE") return;
    fetchOperationsFallback();
    const interval = setInterval(fetchOperationsFallback, 3000);
    return () => clearInterval(interval);
  }, [syncStatus]);

  // Combined background telemetry drift simulation (keeps charts & dashboard alive)
  useEffect(() => {
    const simInterval = setInterval(() => {
      updateTelemetry((prev) => {
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

        // Let parking drift
        const nextParkingStatus = { ...prev.parkingStatus };
        Object.keys(nextParkingStatus).forEach((key) => {
          const lot = nextParkingStatus[key as keyof ParkingStatus];
          const pDelta = Math.floor((Math.random() - 0.47) * 40);
          const nextFilled = Math.min(lot.capacity - 5, Math.max(100, lot.filled + pDelta));
          const ratio = nextFilled / lot.capacity;
          nextParkingStatus[key as keyof ParkingStatus] = {
            ...lot,
            filled: nextFilled,
            state: ratio > 0.95 ? "CRITICAL" : ratio > 0.82 ? "HIGH" : ratio > 0.5 ? "STABLE" : "OPEN"
          };
        });

        // Washroom occupancy drift
        const nextWashroom = Math.min(100, Math.max(10, (prev.washroomOccupancy || 63) + Math.floor((Math.random() - 0.5) * 6)));

        // Security level
        const hasHighAlert = prev.activeIncidents.some(i => i.severity === "HIGH" || i.severity === "CRITICAL");
        const nextSecurity = prev.evacuationLock || hasHighAlert ? "ALERT" : prev.activeIncidents.length > 2 ? "VIGILANT" : "NORMAL";

        // Randomly simulate warning alerts
        if (Math.random() > 0.85) {
          setTimeout(() => {
            const warningReservoir = [
              { title: "⚠️ GATE C PRESSURE IN FLUX", msg: "Gate C sensor tracking severe pedestrian surge bottlenecks. Access lanes restricted.", severity: "HIGH" },
              { title: "☕ DOUBLE ORDER SPIKE SEC-204", msg: "Mobile catering vendors deploying backup express kiosks inside Level 2 East Lobby.", severity: "MEDIUM" },
              { title: "⚡ GRID OPTIMIZATION DIRECTIVE", msg: "Dome HVAC shifted to eco-cooling status. Exterior temperature reads optimal.", severity: "LOW" },
              { title: "🔥 SAFETY DRILL ALERT", msg: "Response quad patrol dispatched for Section 106 fluid spill safety sweep.", severity: "MEDIUM" }
            ];
            const item = warningReservoir[Math.floor(Math.random() * warningReservoir.length)];
            triggerToast(item.title, item.msg, item.severity as any);
          }, 100);
        }

        return {
          ...prev,
          attendance: nextAttendance,
          gateLatencies: nextGates,
          queuePredictions: nextQueuePr,
          fanSentiment: nextSentiment,
          parkingStatus: nextParkingStatus,
          washroomOccupancy: nextWashroom,
          securityStatus: nextSecurity
        };
      });
    }, 4000);

    return () => clearInterval(simInterval);
  }, [syncStatus]);

  // Dispatch live incident handle (writes to Firestore synchronously)
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

    updateTelemetry((prev) => ({
      ...prev,
      activeIncidents: [newIncident, ...prev.activeIncidents]
    }));

    triggerToast(
      `🚨 DISPATCH SUCCESS: ${type.replaceAll("_", " ")}`,
      `[${section}] Patrol squad response active.`,
      severity
    );

    // Notify REST server for standard fallback log
    try {
      await fetch("/api/operations/incident", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, section, description, severity })
      });
    } catch (e) {
      console.log("Offline local incident simulation fallback logged successfully.");
    }
  };

  // Resolve / clear incident handle (writes to Firestore synchronously)
  const handleClearIncident = async (id: string) => {
    const target = telemetry.activeIncidents.find(i => i.id === id);
    
    updateTelemetry((prev) => ({
      ...prev,
      activeIncidents: prev.activeIncidents.filter(i => i.id !== id)
    }));

    if (target) {
      triggerToast(
        `✅ INCIDENT COMPLETED: ${target.type.replaceAll("_", " ")}`,
        `[${target.section}] Successfully resolved by droids.`,
        "LOW"
      );
    }

    try {
      await fetch("/api/operations/incident/clear", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id })
      });
    } catch (err) {
      console.log("Local incident removal synchronized.");
    }
  };

  // Update incident current status handle (writes to Firestore synchronously)
  const handleUpdateIncidentStatus = async (id: string, status: "DISPATCHED" | "IN_PROGRESS" | "RESOLVED") => {
    updateTelemetry((prev) => ({
      ...prev,
      activeIncidents: prev.activeIncidents.map(i => i.id === id ? { ...i, status } : i)
    }));

    const target = telemetry.activeIncidents.find(i => i.id === id);
    if (target) {
      triggerToast(
        `⚡ STATE DRIFT: ${target.type.replaceAll("_", " ")}`,
        `Progress shifted to: ${status}`,
        target.severity
      );
    }

    try {
      await fetch("/api/operations/incident/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status })
      });
    } catch (err) {
      console.log("Local incident state status synced.");
    }
  };

  // Evacuation lock toggle simulator trigger (writes to Firestore synchronously)
  const handleTriggerEvacuation = async (enabled: boolean) => {
    updateTelemetry((prev) => {
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

    triggerToast(
      "⚠️ COGNITIVE OVERRIDE SYSTEM",
      enabled ? "GLOBAL EMERGENCY EVAC DRILL ACTIVATED - WAYFINDING SIGNS ENGAGED" : "EVAC WATCH REMOVED. RETURNING NOMINAL PARAMETERS",
      enabled ? "CRITICAL" : "LOW"
    );

    try {
      await fetch("/api/operations/evacuate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled })
      });
    } catch (err) {
      console.log("Local evacuation state logged.");
    }
  };

  const activeIncidentsCount = telemetry.activeIncidents.filter(i => i.status !== "RESOLVED").length;

  return (
    <div className="flex flex-col min-h-screen bg-[#050508] text-slate-200 font-sans overflow-x-hidden antialiased">
      
      {/* Cyber overlay elements */}
      <div className="fixed inset-0 cyber-grid pointer-events-none z-0"></div>

      {/* Real-Time Floating Notification Toast Overlay */}
      <div className="fixed top-22 right-6 z-[9999] space-y-3 pointer-events-none w-80 sm:w-96">
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, x: 50, scale: 0.9, filter: "blur(4px)" }}
              animate={{ opacity: 1, x: 0, scale: 1, filter: "blur(0px)" }}
              exit={{ opacity: 0, x: 50, scale: 0.9, y: -20, filter: "blur(4px)" }}
              className={`pointer-events-auto p-4 rounded-xl border backdrop-blur-md shadow-2xl flex items-start gap-3 relative overflow-hidden bg-black/90 ${
                t.severity === "CRITICAL" ? "border-red-500 shadow-red-500/10" :
                t.severity === "HIGH" ? "border-orange-500 shadow-orange-500/10" :
                t.severity === "MEDIUM" ? "border-amber-500 shadow-amber-500/10" :
                "border-cyan-500 shadow-cyan-500/10"
              }`}
            >
              {/* Pulsing glow line */}
              <div className={`absolute top-0 left-0 w-1.5 h-full ${
                t.severity === "CRITICAL" ? "bg-red-500 animate-pulse" :
                t.severity === "HIGH" ? "bg-orange-500" :
                t.severity === "MEDIUM" ? "bg-amber-500" :
                "bg-cyan-400"
              }`} />
              
              <div className="flex-grow space-y-1">
                <div className="flex items-center justify-between">
                  <span className={`text-[10px] font-mono font-bold tracking-wider uppercase ${
                    t.severity === "CRITICAL" ? "text-red-400 font-bold" :
                    t.severity === "HIGH" ? "text-orange-400" :
                    t.severity === "MEDIUM" ? "text-amber-400" :
                    "text-cyan-400"
                  }`}>
                    {t.title}
                  </span>
                  <button 
                    onClick={() => setToasts((prev) => prev.filter((p) => p.id !== t.id))}
                    className="text-gray-500 hover:text-white text-xs font-mono select-none px-1"
                  >
                    ✕
                  </button>
                </div>
                <p className="text-white font-sans text-xs leading-relaxed font-semibold">
                  {t.message}
                </p>
                <div className="text-[9px] text-gray-500 font-mono mt-1">
                  Just Now • Live Operations Alert
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

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
              <span className="text-[11px] font-mono">
                {syncStatus === "FIREBASE" ? (
                  <span className="text-[#00f0ff] drop-shadow-[0_0_8px_rgba(0,240,255,0.4)] animate-pulse">
                    ● Real-Time Cloud Synced
                  </span>
                ) : syncStatus === "SYNCED" ? (
                  <span className="text-[#bc13fe]">
                    ● Local Server Synchronized
                  </span>
                ) : (
                  <span className="text-gray-500 font-sans">
                    ⚠️ Offline Sandbox State
                  </span>
                )}
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
                    setTelemetry={updateTelemetry} 
                  />
                )}

                {currentPage === "map" && (
                  <MapView 
                    telemetry={telemetry} 
                    onDispatchIncident={handleDispatchIncident} 
                  />
                )}

                {currentPage === "assistant" && (
                  <AssistantView telemetry={telemetry} />
                )}

                {currentPage === "emergency" && (
                  <EmergencyView 
                    telemetry={telemetry} 
                    onClearIncident={handleClearIncident}
                    onUpdateIncidentStatus={handleUpdateIncidentStatus}
                    onTriggerEvacuation={handleTriggerEvacuation}
                    onRefreshData={fetchOperationsFallback}
                  />
                )}

                {currentPage === "admin" && (
                  <AdminView 
                    telemetry={telemetry} 
                    setTelemetry={updateTelemetry}
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
