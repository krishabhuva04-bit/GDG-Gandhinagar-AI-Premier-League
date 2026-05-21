import express from "express";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";
import { createServer as createViteServer } from "vite";

// Load environment variables
dotenv.config();

const app = express();
const PORT = 3000;

// Enable JSON body parsing
app.use(express.json());

// Initialize Google Gen AI
let aiClient: GoogleGenAI | null = null;
try {
  const apiKey = process.env.GEMINI_API_KEY;
  if (apiKey) {
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
    console.log("StadiumX AI: Gemini Gen AI client initialized successfully.");
  } else {
    console.warn("StadiumX AI: GEMINI_API_KEY is not defined. Falling back to operational simulation mode.");
  }
} catch (error) {
  console.error("StadiumX AI: Error initializing Gemini Gen AI Client:", error);
}

// Global simulated database state for operations
const activeOperations: any = {
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
  washroomOccupancy: 63,
  securityStatus: "NORMAL",
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
    { id: "rec-3", title: "Neutralize Spill at Sect 214", category: "SAFETY", description: "Slick floor hazard detected near exit gates. Active droids dispatched, manual security sweep advised to seal perimeter.", impact: "Limits physical arena liability counts", severity: "MEDIUM", resolved: false },
    { id: "rec-4", title: "Express Buffet Deployment", category: "CONCESSIONS", description: "Double order densities tracked inside Northeast Lobby. Shift mobile support vendor droids to Express Checkout modes.", impact: "Cuts localized dining wait times by 4 mins", severity: "MEDIUM", resolved: false }
  ]
};

// Automatic real-time simulation interval loop
setInterval(() => {
  // 1. Moderate crowd fluctuation check
  const delta = Math.floor((Math.random() - 0.48) * 120);
  activeOperations.attendance = Math.min(80000, Math.max(65000, activeOperations.attendance + delta));

  // 2. Gate latency drift
  if (activeOperations.gateLatencies) {
    Object.keys(activeOperations.gateLatencies).forEach((gate) => {
      const change = parseFloat(((Math.random() - 0.5) * 0.4).toFixed(1));
      activeOperations.gateLatencies[gate] = Math.max(1.0, parseFloat((activeOperations.gateLatencies[gate] + change).toFixed(1)));
    });
  }

  // 3. Queue predictions drift
  if (activeOperations.queuePredictions) {
    activeOperations.queuePredictions.forEach((q: any) => {
      const qChange = Math.floor((Math.random() - 0.46) * 4); // alternate up and down
      q.currentQueue = Math.max(2, q.currentQueue + qChange);
      q.waitTime = Math.max(1, Math.round(q.currentQueue * 0.3));
      q.trend = qChange > 0 ? "UP" : qChange < 0 ? "DOWN" : "STEADY";
    });
  }

  // 4. Randomly ingest a new fan comment
  if (Math.random() > 0.65 && activeOperations.fanSentiment) {
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
      sentiment: chosen.sentiment,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    activeOperations.fanSentiment.unshift(newComment);
    if (activeOperations.fanSentiment.length > 20) {
      activeOperations.fanSentiment.pop();
    }
  }

  // 5. Dynamic Parking spaces fluctuation
  if (activeOperations.parkingStatus) {
    Object.keys(activeOperations.parkingStatus).forEach((key) => {
      const p = activeOperations.parkingStatus[key];
      // Slow fluctuation rate (up to 15 cars filled or left)
      const pDelta = Math.floor((Math.random() - 0.47) * 40);
      p.filled = Math.min(p.capacity - 5, Math.max(100, p.filled + pDelta));
      const ratio = p.filled / p.capacity;
      p.state = ratio > 0.95 ? "CRITICAL" : ratio > 0.8 ? "HIGH" : ratio > 0.5 ? "STABLE" : "OPEN";
    });
  }

  // 6. Washroom occupancy & security status updates
  activeOperations.washroomOccupancy = Math.min(100, Math.max(10, (activeOperations.washroomOccupancy || 63) + Math.floor((Math.random() - 0.5) * 6)));
  
  const hasCriticalIncidents = activeOperations.activeIncidents.some((i: any) => i.severity === "HIGH" || i.severity === "CRITICAL");
  activeOperations.securityStatus = activeOperations.evacuationLock || hasCriticalIncidents ? "ALERT" : activeOperations.activeIncidents.length > 2 ? "VIGILANT" : "NORMAL";

  // 7. Occasionally trigger simulated active incidents (~9% chance every loop)
  if (Math.random() > 0.91 && activeOperations.activeIncidents.length < 5 && !activeOperations.evacuationLock) {
    const templates = [
      { section: "Gate A Entry", type: "TICKET_GATE_MALFUNCTION", description: "Bypass ticket reader RFID latency. Technicians dispatched.", severity: "MEDIUM" },
      { section: "Section 104 Main Deck", type: "DRONE_DEVIATION", description: "Food delivery flyer reporting stabilization drift. Support units notified.", severity: "LOW" },
      { section: "Level 2 East Concourse", type: "THERMAL_DISCREPANCY", description: "HVAC cooling node 42 sensor fluctuation. Eco cycle active.", severity: "LOW" },
      { section: "Concourse Sec 118", type: "MANDATORY_HAZARD", description: "Beverage spill reported in pedestrian access path. Dispatched cleaners.", severity: "MEDIUM" }
    ];
    const chosenIdx = Math.floor(Math.random() * templates.length);
    const chosen = templates[chosenIdx];
    activeOperations.activeIncidents.unshift({
      id: `sim-${Date.now().toString().slice(-3)}`,
      section: chosen.section,
      type: chosen.type,
      description: chosen.description,
      status: "DISPATCHED",
      severity: chosen.severity,
      timestamp: new Date().toISOString()
    });
  }

  // 8. Occasionally auto-resolve incidents (~15% chance if > 1 exists)
  if (Math.random() > 0.85 && activeOperations.activeIncidents.length > 1) {
    const candidateIdx = activeOperations.activeIncidents.findIndex((i: any) => i.id !== "evac-alarm" && i.id !== "inc-102");
    if (candidateIdx !== -1) {
      activeOperations.activeIncidents.splice(candidateIdx, 1);
    }
  }
}, 4000);

// --- API ROUTES ---

// Health & Config Check
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    geminiActive: !!aiClient,
  });
});

// Operations Data Fetch
app.get("/api/operations", (req, res) => {
  res.json(activeOperations);
});

// Action post endpoint to update simulation state from admin panel
app.post("/api/operations/incident", (req, res) => {
  const { type, section, description, severity } = req.body;
  if (!type || !section || !description) {
    return res.status(400).json({ error: "Missing required parameters: type, section, description, severity" });
  }

  const newIncident = {
    id: `inc-${Date.now().toString().slice(-4)}`,
    type,
    section,
    description,
    status: "DISPATCHED",
    severity: severity || "LOW",
    timestamp: new Date().toISOString(),
  };

  activeOperations.activeIncidents.unshift(newIncident);
  res.json({ success: true, incident: newIncident, incidents: activeOperations.activeIncidents });
});

// Action to update incident status
app.post("/api/operations/incident/update", (req, res) => {
  const { id, status } = req.body;
  const incident = activeOperations.activeIncidents.find((i) => i.id === id);
  if (!incident) {
    return res.status(404).json({ error: "Incident not found" });
  }
  incident.status = status;
  res.json({ success: true, incidents: activeOperations.activeIncidents });
});

// Action to clear incident
app.post("/api/operations/incident/clear", (req, res) => {
  const { id } = req.body;
  const index = activeOperations.activeIncidents.findIndex((i) => i.id === id);
  if (index === -1) {
    return res.status(404).json({ error: "Incident not found" });
  }
  activeOperations.activeIncidents.splice(index, 1);
  res.json({ success: true, incidents: activeOperations.activeIncidents });
});

// Set emergency evacuation simulation trigger
app.post("/api/operations/evacuate", (req, res) => {
  const { enabled } = req.body;
  activeOperations.evacuationLock = !!enabled;
  if (enabled) {
    // Add critical emergency incident
    const evacIncident = {
      id: "evac-alarm",
      section: "ALL SECTIONS",
      type: "EVACUATION_ALERT",
      description: "GLOBAL STADIUM EVACUATION SIMULATION TRIGGERED FROM MANAGEMENT PORTAL",
      status: "TRIGGERED",
      severity: "CRITICAL",
      timestamp: new Date().toISOString(),
    };
    // Ensure on top
    activeOperations.activeIncidents = [evacIncident, ...activeOperations.activeIncidents];
  } else {
    // Remove evac incidents
    activeOperations.activeIncidents = activeOperations.activeIncidents.filter(i => i.id !== "evac-alarm");
  }
  res.json({ success: true, state: activeOperations });
});

// AI Assistant Chat Route
function buildSystemInstruction(telemetry: any) {
  // Extract info safely
  const attendance = telemetry?.attendance ?? 76420;
  const maxCapacity = telemetry?.maxCapacity ?? 80000;
  const occupancyRate = ((attendance / maxCapacity) * 100).toFixed(1);
  const gateLatencies = telemetry?.gateLatencies ?? { A: 2.1, B: 3.5, C: 6.5, D: 1.8, E: 2.4, F: 4.0 };
  const washroomOccupancy = telemetry?.washroomOccupancy ?? 63;
  const securityStatus = telemetry?.securityStatus ?? "NORMAL";
  const evacuationLock = telemetry?.evacuationLock ?? false;
  
  // Format incidents
  const incidents = telemetry?.activeIncidents || [];
  const formattedIncidents = incidents.length > 0 
    ? incidents.map((inc: any, index: number) => `  ${index + 1}. [${inc.section}] ${inc.type}: ${inc.description} (Severity: ${inc.severity || "LOW"}, Status: ${inc.status})`).join("\n")
    : "  No active operational incidents listed.";

  // Format parking
  const parking = telemetry?.parkingStatus || {};
  const formattedParking = Object.entries(parking).map(([key, value]: [string, any]) => {
    const lotName = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
    return `  - ${lotName}: ${value.filled}/${value.capacity} filled (${((value.filled/value.capacity)*100).toFixed(1)}% capacity, State: ${value.state})`;
  }).join("\n");

  // Format queue predictions
  const queues = telemetry?.queuePredictions || [];
  const formattedQueues = queues.length > 0
    ? queues.map((q: any) => `  - ${q.name}: ${q.currentQueue} inline, wait: ${q.waitTime} mins (Trend: ${q.trend})`).join("\n")
    : "  - Nominal queue distribution.";

  return `
You are StadiumX AI, the state-of-the-art operant artificial intelligence powering StadiumX—an 80,000-seat futuristic mega-arena.
You speak as a futuristic command intelligence: cold, highly articulate, secure, supportive, and perfectly optimized for real-time responses.

Statically Defined Food Stalls Inside StadiumX:
- Mega-Bite Burgers: Sector 108 Main Deck. Highlights: Neon-burgers and custom fries. (Current density matches high concourse crowd. Line wait: ~12 mins).
- Gridiron Taco Hub: Sector 214 Lower Bowl. Highlights: Cyber-tacos and double loaded nachos. (Moderate crowd. Line wait: ~6 mins).
- Noodle Nexus: Sector 115 Main Deck. Highlights: Synthetic premium ramen bowls and matcha bubble teas. (Low crowd. Line wait: ~2 mins). Recommended for quick dining.
- Slick-Slice Pizza: Section 301 Upper Deck. Highlights: Giant wood-fired premium slices. (Low crowd. Line wait: ~3 mins).
- Pixel Donuts: Gate A Concourse. Highlights: Hot glaze cyber-donuts and premium nitro cold brew coffees. (High crowd. Line wait: ~10 mins).

CURRENT REAL-TIME CONTEXT TELEMETRY:
- GENERAL ATTENDANCE: ${attendance.toLocaleString()} of ${maxCapacity.toLocaleString()} seats filled (${occupancyRate}% seat density)
- SECURITY STATE LEVEL: ${securityStatus}
- SYSTEM EVACUATION DRILL LOCK: ${evacuationLock ? "ACTIVE (SIMULATED EMERGENCY TRIGGERED - INITIATE FULL REDIRECT DIRECTIVES CURRENTLY IN PLAN)" : "INACTIVE / NOMINAL"}
- WASHROOM OCCUPANCY INDEX: ${washroomOccupancy}% capacity filled overall

ACCESS GATES FEED (REAL-TIME LATENCY IN MINUTES):
${Object.entries(gateLatencies).map(([gate, value]) => `  - Gate ${gate}: ${value} mins wait`).join("\n")}

PARKING SECTORS STATS:
${formattedParking}

REAL-TIME CROWD QUEUE STATIONS:
${formattedQueues}

ACTIVE INCIDENTS GRID:
${formattedIncidents}

OPERATIONAL RESPONSE DIRECTIVES:
1. Speak in your futuristic StadiumX AI system command persona. Frame responses with elegant, technical markdown styling.
2. Formulate highly actionable responses. Recommend real-time solutions, emergency rerouting, wayfinding instructions, and food stalls based on current congestion.
3. Be highly precise. Quote the actual numbers/names from the telemetry parameters to justify your answers.
4. When predicting crowd congestion, look at real-time attendance, gate latencies (e.g. Gate C bottleneck), and queue metrics. Suggest alternative routes (e.g. bypass Gate C to Gate A or B).
5. Suggest optimal parking zones based on filled capacities (recommend West Express if North/VIP lots are near capacity).
6. Respect the emergency state. If evacuationLock is ACTIVE, issue clear evacuation scripts, tell people to stay calm, avoid bottlenecks, and quote alternative gates.
`;
}

app.post("/api/chat", async (req, res) => {
  const { message, chatHistory, telemetry } = req.body;
  if (!message) {
    return res.status(400).json({ error: "Message is required." });
  }

  const systemInstruction = buildSystemInstruction(telemetry);

  // Fallback operational guidance when GEMINI_API_KEY is not defined
  if (!aiClient) {
    const lowercaseMsg = message.toLowerCase();
    let reply = "";
    const attendance = telemetry?.attendance ?? 76420;
    const gateLatencies = telemetry?.gateLatencies ?? { A: 2.1, B: 3.5, C: 6.5, D: 1.8, E: 2.4, F: 4.0 };
    const parking = telemetry?.parkingStatus ?? {};
    const evacActive = telemetry?.evacuationLock ?? false;

    if (lowercaseMsg.includes("evac") || lowercaseMsg.includes("emergency") || lowercaseMsg.includes("danger") || lowercaseMsg.includes("fire")) {
      reply = `### 🚨 StadiumX AI Security Protocol Alert
Stadium state is under **Operational Emergency** status.

* **Global Evacuation State**: ${evacActive ? "ACTIVE (SIMULATION)" : "INACTIVE / NOMINAL"}.
* **Rerouting Directives**: Gate C is experiencing higher latencies (${gateLatencies.C ?? 6.5} mins). Egress crowds are diverted through **Gate A** and **Gate D** for rapid clearing.
* **Response Team Matrix**: Active droids are monitoring pathways.

*Command directive: Keep movement synchronized and proceed to nearest green wayfinding escape panels.*`;
    } else if (lowercaseMsg.includes("parking") || lowercaseMsg.includes("car") || lowercaseMsg.includes("lot")) {
      const westPct = parking.westExpress ? ((parking.westExpress.filled / parking.westExpress.capacity) * 100).toFixed(1) : "40.5";
      const northPct = parking.northLot ? ((parking.northLot.filled / parking.northLot.capacity) * 100).toFixed(1) : "98.2";
      reply = `### 🚗 Parking Matrix Analysis
* **North Lot**: **${northPct}% filled** (Critical Bottleneck). Display signals updated to: *REDIRECT TO WEST EXPRESS*.
* **West Express**: **${westPct}% filled** (Optimal Landing Zone). High vacancy.
* **South Garage**: Nominally functional.

*Operational Action*: Recommending dynamic variable message highway signage redirecting incoming westbound traffic to **West Express Parking** immediately.`;
    } else if (lowercaseMsg.includes("food") || lowercaseMsg.includes("eat") || lowercaseMsg.includes("stall") || lowercaseMsg.includes("burger") || lowercaseMsg.includes("grill") || lowercaseMsg.includes("dine") || lowercaseMsg.includes("snack") || lowercaseMsg.includes("concession")) {
      reply = `### 🍔 Food & Concession Matrix Recommendations
Based on live crowd density parameters, I recommend:
* **Noodle Nexus** (Sector 115): **LOW queue density**. Serve times under 2 minutes. Features gourmet synthetic ramen bowls.
* **Slick-Slice Pizza** (Section 301): Small queues (3 mins wait). Excellent prompt checkout.
* **Mega-Bite Burgers** (Sector 108): Currently **HIGH bottleneck risk** (wait ~12 mins). Suggest delaying access.`;
    } else if (lowercaseMsg.includes("map") || lowercaseMsg.includes("locate") || lowercaseMsg.includes("view") || lowercaseMsg.includes("navigation") || lowercaseMsg.includes("route")) {
      reply = `### 🗺️ StadiumX Navigational Matrix Enabled
I am tracking real-time crowd densities for all zones.
* **Gate C Access Corridor**: High bottleneck latency. Avoid.
* **Gate A Access Corridor**: **NOMINAL** wait times (${gateLatencies.A ?? 2.1} mins). Recommend tracking this entry path.
* **Upper Level Bowl**: Open flow patterns. Wait times are less than 90 seconds.`;
    } else {
      reply = `### 🌐 StadiumX AI Core Log
Access established. I am monitoring the mega-arena. Current telemetry shows **${attendance.toLocaleString()} fans** inside.

* **Crowd Flow**: Overall state is stable.
* **Gate Latencies**: Gate C wait is at **${gateLatencies.C ?? 6.5} mins**, while Gate A is at **${gateLatencies.A ?? 2.1} mins**. Rerouting is advised.
* **Active Alarms**: Tracking ${telemetry?.activeIncidents?.length ?? 0} active incident vectors.

Provide command queries regarding navigation, parking capacities, automated emergency systems, or dispatch grids. I am standing by.`;
    }

    reply += `\n\n*(Telemetry Simulation Mode - Active)*`;
    return res.json({ text: reply });
  }

  try {
    // Format conversation history for Gemini API is handled natively
    const response = await aiClient.models.generateContent({
      model: "gemini-3.5-flash",
      contents: message,
      config: {
        systemInstruction,
        temperature: 0.7,
      },
    });

    res.json({ text: response.text });
  } catch (error: any) {
    console.error("Gemini API call failed:", error);
    res.status(500).json({ error: "Failed to communicate with stadium intelligence core.", details: error.message });
  }
});


// Vite Dev Server Middleware or Static Production Build integration
async function integrateFrontend() {
  if (process.env.NODE_ENV !== "production") {
    console.log("Starting backend in development mode...");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log("Starting backend in production mode...");
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`StadiumX AI is running at http://localhost:${PORT}`);
  });
}

integrateFrontend().catch((err) => {
  console.error("Failed to start StadiumX AI Full-Stack Server:", err);
});
