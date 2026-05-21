import React, { useState, useEffect, useRef } from "react";
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
  AlertTriangle,
  ArrowRight,
  Search,
  Navigation,
  CornerDownRight,
  HelpCircle,
  EyeOff
} from "lucide-react";
import { TelemetryData, Incident } from "../types";
import { motion, AnimatePresence } from "motion/react";
import AnimatedCounter from "./AnimatedCounter";

import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

interface MapViewProps {
  telemetry: TelemetryData;
  onDispatchIncident: (type: string, section: string, description: string, severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL") => void;
}

// Mapbox standard coordinates configuration centered around SoFi Stadium
const STADIUM_CENTER: [number, number] = [-118.3391, 33.9535];

const MAPBOX_STATIONS_COORDS: Record<string, [number, number]> = {
  "North Deck A": [-118.3395, 33.9543],
  "North Concourse B": [-118.3384, 33.9543],
  "East Block A": [-118.3378, 33.9538],
  "East Block B": [-118.3378, 33.9531],
  "South Deck A": [-118.3385, 33.9526],
  "South Deck B": [-118.3396, 33.9526],
  "West Block A": [-118.3403, 33.9531],
  "West Block B": [-118.3403, 33.9538],
  "Gate A (Main Entrance)": [-118.3411, 33.9545],
  "Gate B (South Egress)": [-118.3397, 33.9519],
  "Gate C (West Bottleneck)": [-118.3415, 33.9532],
  "Gate D (East Transit)": [-118.3368, 33.9536]
};

// SVG visual path mapping for the strategic digital isometric twin
const SVG_COORDS: Record<string, { x: number; y: number }> = {
  "North Deck A": { x: 195, y: 70 },
  "North Concourse B": { x: 375, y: 70 },
  "East Block A": { x: 480, y: 180 },
  "East Block B": { x: 480, y: 350 },
  "South Deck A": { x: 195, y: 460 },
  "South Deck B": { x: 375, y: 460 },
  "West Block A": { x: 90, y: 180 },
  "West Block B": { x: 90, y: 350 },
  // Gate Nodes
  "Gate A (Main Entrance)": { x: 285, y: 40 },
  "Gate B (South Egress)": { x: 285, y: 490 },
  "Gate C (West Bottleneck)": { x: 40, y: 265 },
  "Gate D (East Transit)": { x: 530, y: 265 }
};

export default function MapView({ telemetry, onDispatchIncident }: MapViewProps) {
  const [viewMode, setViewMode] = useState<"GEOGRAPHIC" | "STRATEGIC_2D" | "STRATEGIC_3D">("STRATEGIC_2D");
  const [activeLayer, setActiveLayer] = useState<"density" | "emergency" | "parking" | "concessions">("density");
  const [selectedSection, setSelectedSection] = useState<string | null>(null);
  const [zoomLevel, setZoomLevel] = useState<number>(100);

  // AI Routing state
  const [routeStart, setRouteStart] = useState<string>("North Deck A");
  const [routeEnd, setRouteEnd] = useState<string>("Gate B (South Egress)");
  const [routeActive, setRouteActive] = useState<boolean>(true);
  const [routeCalculationMessage, setRouteCalculationMessage] = useState<string>("");

  // Mapbox refs and validation
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const [mapboxToken, setMapboxToken] = useState<string>("");
  const [mapboxLoaded, setMapboxLoaded] = useState<boolean>(false);
  const [mapboxError, setMapboxError] = useState<string | null>(null);

  // Interactive crowd heatmap states
  const [simulationMode, setSimulationMode] = useState<"NORMAL" | "CONCERT_RUSH" | "EVAC_DRILL" | "RAIN_DELAY">("NORMAL");
  const [selectedHotspotId, setSelectedHotspotId] = useState<string>("hs-gate-c");
  const [customHotspotTemp, setCustomHotspotTemp] = useState<Record<string, number>>({});
  const [activeActionId, setActiveActionId] = useState<string | null>(null);
  const [actionSuccessMessage, setActionSuccessMessage] = useState<string | null>(null);

  const keyCheckPerformed = useRef(false);

  // Read Mapbox Secret Token on mount
  useEffect(() => {
    const token = (import.meta as any).env?.VITE_MAPBOX_ACCESS_TOKEN || "";
    setMapboxToken(token);
    if (!token && !keyCheckPerformed.current) {
      console.log("No client-side VITE_MAPBOX_ACCESS_TOKEN discovered. Activating StadiumX high-performance simulated geographic core.");
      keyCheckPerformed.current = true;
    }
  }, []);

  // Initialize and Update Mapbox GL instance
  useEffect(() => {
    if (viewMode !== "GEOGRAPHIC" || !mapboxToken || !mapContainerRef.current) {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        setMapboxLoaded(false);
      }
      return;
    }

    try {
      mapboxgl.accessToken = mapboxToken;
      
      const map = new mapboxgl.Map({
        container: mapContainerRef.current,
        style: "mapbox://styles/mapbox/dark-v11",
        center: STADIUM_CENTER,
        zoom: 16.2,
        pitch: 50,
        bearing: -15,
        antialias: true
      });

      mapRef.current = map;

      map.on("load", () => {
        setMapboxLoaded(true);
        setMapboxError(null);

        // Add 3D Volumetric Extrusion Layers for Buildings
        const layers = map.getStyle().layers;
        const labelLayerId = layers?.find(
          (layer) => layer.type === "symbol" && layer.layout?.["text-field"]
        )?.id;

        map.addLayer(
          {
            id: "3d-buildings",
            source: "composite",
            "source-layer": "building",
            filter: ["==", "extrude", "true"],
            type: "fill-extrusion",
            minzoom: 15,
            paint: {
              "fill-extrusion-color": "#111827",
              "fill-extrusion-height": [
                "interpolate",
                ["linear"],
                ["zoom"],
                15,
                0,
                15.05,
                ["get", "height"]
              ],
              "fill-extrusion-base": [
                "interpolate",
                ["linear"],
                ["zoom"],
                15,
                0,
                15.05,
                ["get", "min_height"]
              ],
              "fill-extrusion-opacity": 0.65
            }
          },
          labelLayerId
        );

        // Add animated heatmap source
        const heatmapData: any = {
          type: "FeatureCollection",
          features: Object.entries(MAPBOX_STATIONS_COORDS).map(([name, coords]) => {
            const density = getStationDensityValue(name);
            return {
              type: "Feature",
              properties: {
                title: name,
                density: density,
                weight: density / 100
              },
              geometry: {
                type: "Point",
                coordinates: coords
              }
            };
          })
        };

        map.addSource("crowd-density", {
          type: "geojson",
          data: heatmapData
        });

        // Heatmap layer
        map.addLayer({
          id: "crowd-heat",
          type: "heatmap",
          source: "crowd-density",
          maxzoom: 19,
          paint: {
            "heatmap-weight": ["get", "weight"],
            "heatmap-intensity": [
              "interpolate",
              ["linear"],
              ["zoom"],
              14,
              1,
              18,
              3
            ],
            "heatmap-color": [
              "interpolate",
              ["linear"],
              ["heatmap-value"],
              0,
              "rgba(5, 150, 105, 0)",
              0.2,
              "rgba(52, 211, 153, 0.25)",
              0.5,
              "rgba(245, 158, 11, 0.55)",
              0.8,
              "rgba(239, 68, 68, 0.75)",
              1,
              "rgba(219, 39, 119, 0.9)"
            ],
            "heatmap-radius": [
              "interpolate",
              ["linear"],
              ["zoom"],
              14,
              15,
              18,
              50
            ],
            "heatmap-opacity": 0.75
          }
        });

        // Add Route Line string source
        const sampleRouteCoords = [
          MAPBOX_STATIONS_COORDS[routeStart] || STADIUM_CENTER,
          STADIUM_CENTER,
          MAPBOX_STATIONS_COORDS[routeEnd] || STADIUM_CENTER
        ];

        map.addSource("glowing-route", {
          type: "geojson",
          data: {
            type: "Feature",
            properties: {},
            geometry: {
              type: "LineString",
              coordinates: sampleRouteCoords
            }
          }
        });

        // Glowing Core Route Line
        map.addLayer({
          id: "route-glow",
          type: "line",
          source: "glowing-route",
          layout: {
            "line-join": "round",
            "line-cap": "round"
          },
          paint: {
            "line-color": "#00f0ff",
            "line-width": 6,
            "line-blur": 3,
            "line-opacity": 0.8
          }
        });

        map.addLayer({
          id: "route-core",
          type: "line",
          source: "glowing-route",
          layout: {
            "line-join": "round",
            "line-cap": "round"
          },
          paint: {
            "line-color": "#ffffff",
            "line-width": 3,
            "line-opacity": 0.95
          }
        });

        // Add dynamic HTML markers for active incidents in mapbox view
        updateMapboxMarkers();
      });

    } catch (err: any) {
      console.error("Mapbox hardware rendering constraints triggered: ", err);
      setMapboxError("WebGL Context lost or invalid access token credentials.");
    }

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        setMapboxLoaded(false);
      }
    };
  }, [viewMode, mapboxToken]);

  // Synchronize route lines in Mapbox when route start/end selectors shift
  useEffect(() => {
    if (mapRef.current && mapboxLoaded) {
      const source = mapRef.current.getSource("glowing-route") as mapboxgl.GeoJSONSource;
      if (source) {
        const sampleRouteCoords = [
          MAPBOX_STATIONS_COORDS[routeStart] || STADIUM_CENTER,
          STADIUM_CENTER,
          MAPBOX_STATIONS_COORDS[routeEnd] || STADIUM_CENTER
        ];
        source.setData({
          type: "Feature",
          properties: {},
          geometry: {
            type: "LineString",
            coordinates: sampleRouteCoords
          }
        });
      }
    }
  }, [routeStart, routeEnd, mapboxLoaded]);

  // Handle active incident pins in Mapbox
  const mapboxMarkersRef = useRef<mapboxgl.Marker[]>([]);
  const updateMapboxMarkers = () => {
    if (!mapRef.current || !mapboxLoaded) return;

    // Clear existing
    mapboxMarkersRef.current.forEach(m => m.remove());
    mapboxMarkersRef.current = [];

    // Pins for incidents
    telemetry.activeIncidents.forEach((inc) => {
      // Pick custom coordinate based on section
      const matchingSection = Object.keys(MAPBOX_STATIONS_COORDS).find(k => inc.section.includes(k)) || "West Block A";
      const coords = MAPBOX_STATIONS_COORDS[matchingSection] || STADIUM_CENTER;

      // Custom DOM Element
      const el = document.createElement("div");
      el.className = "flex items-center justify-center cursor-pointer";
      el.innerHTML = `
        <div class="relative flex items-center justify-center">
          <span class="absolute animate-ping inline-flex h-8 w-8 rounded-full bg-rose-500 opacity-75"></span>
          <div class="relative p-2 bg-rose-600 rounded-full border border-white text-white shadow-lg">
            <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
          </div>
        </div>
      `;

      const popup = new mapboxgl.Popup({ offset: 25 }).setHTML(`
        <div class="bg-slate-900 text-white font-mono p-2 text-xs border border-rose-500 rounded-lg">
          <div class="text-rose-400 font-bold uppercase tracking-wider">${inc.type}</div>
          <p class="text-[11px] mt-1 font-sans text-slate-300">${inc.description}</p>
          <div class="text-[10px] text-gray-500 mt-1">${inc.section} • ${inc.status}</div>
        </div>
      `);

      const marker = new mapboxgl.Marker(el)
        .setLngLat(coords)
        .setPopup(popup)
        .addTo(mapRef.current!);

      mapboxMarkersRef.current.push(marker);
    });

    // Also place pins for major food stalls/concessions if active
    if (activeLayer === "concessions") {
      const stalls = [
        { name: "Mega-Bite Burgers", coords: [-118.3395, 33.9546], dish: "Neon-Burger" },
        { name: "Gridiron Taco Hub", coords: [-118.3375, 33.9530], dish: "Cyber-Tacos" },
        { name: "Noodle Nexus", coords: [-118.3405, 33.9535], dish: "Synthetic Ramen" },
        { name: "Slick-Slice Pizza", coords: [-118.3385, 33.9525], dish: "Wood-fired Slices" }
      ];

      stalls.forEach((st) => {
        const el = document.createElement("div");
        el.className = "flex items-center justify-center cursor-pointer";
        el.innerHTML = `
          <div class="p-1 px-2.5 bg-cyan-900/90 text-[10px] border border-cyan-400 rounded-xl text-cyan-300 font-mono shadow-[0_0_8px_rgba(0,240,255,0.4)]">
            🍔 ${st.name}
          </div>
        `;

        const popup = new mapboxgl.Popup({ offset: 15 }).setHTML(`
          <div class="bg-slate-950 p-2.5 text-xs text-white border border-cyan-400 rounded-xl font-mono">
           <h4 class="text-cyan-400 font-bold">${st.name}</h4>
           <p class="text-gray-400 text-[10px] my-1">Specialty: ${st.dish}</p>
           <span class="text-emerald-400 text-[9px]">Open • Serving Now</span>
          </div>
        `);

        const marker = new mapboxgl.Marker(el)
          .setLngLat(st.coords as [number, number])
          .setPopup(popup)
          .addTo(mapRef.current!);

        mapboxMarkersRef.current.push(marker);
      });
    }
  };

  // Synchronize layer selections into the active Mapbox View when layers shift
  useEffect(() => {
    updateMapboxMarkers();
    if (mapRef.current && mapboxLoaded) {
      if (activeLayer === "density") {
        if (mapRef.current.getLayer("crowd-heat")) mapRef.current.setLayoutProperty("crowd-heat", "visibility", "visible");
      } else {
        if (mapRef.current.getLayer("crowd-heat")) mapRef.current.setLayoutProperty("crowd-heat", "visibility", "none");
      }
    }
  }, [activeLayer, mapboxLoaded, telemetry.activeIncidents]);

  // Definition lists
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

  const getStationDensityValue = (stationName: string): number => {
    // Maps standard station identifiers to numerical density index
    if (stationName.includes("North Deck A")) return Math.round(currentGeneralRate * 120);
    if (stationName.includes("Gate C")) return getHotspotDensity("hs-gate-c");
    if (stationName.includes("East Block A")) return getHotspotDensity("hs-east-plaza");
    if (stationName.includes("West Block A")) return getHotspotDensity("hs-gate-c") - 15;
    return Math.round(currentGeneralRate * 100);
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
      
      // Auto close message after 5s
      setTimeout(() => {
        setActionSuccessMessage(null);
      }, 5000);
    }, 1200);
  };

  // Base ratios representing stadium density multiplier
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

  const currentGeneralRate = telemetry?.attendance / telemetry?.maxCapacity;

  // Seating blocks configurations
  const seatBlocks = [
    { id: "North Deck A", x: 190, y: 110, w: 90, h: 45, maxDensity: 95, currentDensity: Math.min(99, Math.round(currentGeneralRate * 100 * baseRatios["North Deck A"])), color: "text-red-400" },
    { id: "North Concourse B", x: 300, y: 110, w: 90, h: 45, maxDensity: 80, currentDensity: Math.min(99, Math.round(currentGeneralRate * 100 * baseRatios["North Concourse B"])), color: "text-green-400" },
    { id: "East Block A", x: 420, y: 170, w: 45, h: 90, maxDensity: 90, currentDensity: Math.min(99, Math.round(currentGeneralRate * 100 * baseRatios["East Block A"])), color: "text-amber-400" },
    { id: "East Block B", x: 420, y: 280, w: 45, h: 90, maxDensity: 90, currentDensity: Math.min(99, Math.round(currentGeneralRate * 100 * baseRatios["East Block B"])), color: "text-orange-400" },
    { id: "South Deck A", x: 190, y: 385, w: 90, h: 45, maxDensity: 95, currentDensity: Math.min(99, Math.round(currentGeneralRate * 100 * baseRatios["South Deck A"])), color: "text-green-400" },
    { id: "South Deck B", x: 300, y: 385, w: 90, h: 45, maxDensity: 80, currentDensity: Math.min(99, Math.round(currentGeneralRate * 100 * baseRatios["South Deck B"])), color: "text-amber-400" },
    { id: "West Block A", x: 115, y: 170, w: 45, h: 90, maxDensity: 85, currentDensity: Math.min(99, Math.round(currentGeneralRate * 100 * baseRatios["West Block A"])), color: "text-red-400" },
    { id: "West Block B", x: 115, y: 280, w: 45, h: 90, maxDensity: 85, currentDensity: Math.min(99, Math.round(currentGeneralRate * 100 * baseRatios["West Block B"])), color: "text-green-400" },
  ];

  // Specific high density crowd heatpoints for visualization
  const heatpoints = [
    { x: 115, y: 200, size: 45, intensity: "CRITICAL", label: "Gate C Entry Bottleneck" },
    { x: 260, y: 235, size: 70, intensity: "NOMINAL", label: "Field Mainstage Egress" },
    { x: 410, y: 210, size: 40, intensity: "HIGH", label: "East Plaza Corridor" },
    { x: 290, y: 395, size: 35, intensity: "LOW", label: "Gate B Access" },
  ];

  // Route guidance helper text computation
  useEffect(() => {
    let startPoint = routeStart;
    let endPoint = routeEnd;

    let textInstructions = `Departing from ${startPoint}. Route mapped directly to nearest high bandwidth transit target. Secure speed path calculation: 4.8 meters/second. `;
    if (telemetry?.evacuationLock) {
      textInstructions = `⚠️ EVACUATION MODE ACTIVE! Direct routing from ${startPoint} to ${endPoint} strictly forced along GREEN glowing fire-safe egress guidelines. Bypass all elevator shafts.`;
    } else if (routeStart.includes("West") || routeEnd.includes("Gate C")) {
      textInstructions += `Note: Delaying Gate C routing node due to turnstile backpressure. Recommended rerouting through western main corridors or bypassing West Block B. Estimated duration: 5.2 mins.`;
    } else {
      textInstructions += `No major operational hazards encountered with the routing vectors. Direct wayfinding signs enabled along Section blocks. Transit duration estimate: 2.5 mins.`;
    }
    setRouteCalculationMessage(textInstructions);
  }, [routeStart, routeEnd, telemetry?.evacuationLock]);

  const handleBlockClick = (blockName: string) => {
    setSelectedSection(blockName);
  };

  return (
    <div className="space-y-8" id="stadium-map-view">
      
      {/* Top Title Banner */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-cyan-400 font-mono text-xs font-bold uppercase tracking-widest">
            <Radio className="w-4 h-4 animate-pulse text-cyan-400" />
            <span>StadiumX Space Mapping Core</span>
          </div>
          <h1 className="text-3xl font-bold font-sans tracking-tight text-white mt-1">
            Mapbox Live Arena Interface
          </h1>
          <p className="text-gray-400 text-sm">
            Live geographic overlays, glowing evacuation guidelines, and smart route pathing vectors.
          </p>
        </div>

        {/* View Mode Selector Grid toggling Mapbox vs Tactical SVGs */}
        <div className="flex items-center space-x-2 bg-white/5 border border-white/10 rounded-xl p-1 text-xs font-mono">
          <button
            onClick={() => setViewMode("GEOGRAPHIC")}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center space-x-1.5 ${
              viewMode === "GEOGRAPHIC" ? "bg-cyan-500 text-black font-bold shadow-[0_0_12px_rgba(0,240,255,0.4)]" : "text-gray-400 hover:text-white"
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            <span>Mapbox GL Satellite</span>
          </button>
          <button
            onClick={() => setViewMode("STRATEGIC_2D")}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              viewMode === "STRATEGIC_2D" ? "bg-slate-700/80 text-white font-bold" : "text-gray-400 hover:text-white"
            }`}
          >
            Tactical SVG
          </button>
          <button
            onClick={() => setViewMode("STRATEGIC_3D")}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              viewMode === "STRATEGIC_3D" ? "bg-purple-600/85 text-white font-bold" : "text-gray-400 hover:text-white"
            }`}
          >
            Orthogonal Core
          </button>
        </div>
      </div>

      {/* Main double column container layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Side: Dynamic Map Viewport View */}
        <div className="lg:col-span-8 bg-[#090d16] border border-white/10 rounded-3xl relative overflow-hidden flex flex-col justify-between min-h-[560px]">
          
          {/* Cyber scanner lines decoration across map element */}
          <div className="absolute left-0 w-full h-1 backline-sweep pointer-events-none z-10 opacity-30" />
          
          {/* Top Layer & Status Bar */}
          <div className="p-4 bg-slate-950/80 border-b border-white/5 relative z-20 flex flex-wrap gap-3 items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className={`w-2.5 h-2.5 rounded-full ${viewMode === "GEOGRAPHIC" ? "bg-emerald-400" : "bg-cyan-400"} animate-pulse`}></span>
              <span className="text-[11px] font-mono font-semibold text-white tracking-wide uppercase">
                {viewMode === "GEOGRAPHIC" ? (
                  <>Mapbox Engine Active • SoFi Region</>
                ) : (
                  <>Tactical Digital Twin View</>
                )}
              </span>
            </div>

            {/* Quick telemetry layers selector */}
            <div className="flex items-center space-x-1.5 bg-[#000000]/60 border border-white/10 p-1 rounded-xl">
              <button
                onClick={() => setActiveLayer("density")}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-[10px] font-mono tracking-wider cursor-pointer transition ${
                  activeLayer === "density" ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 font-bold" : "text-gray-400 hover:text-white"
                }`}
              >
                <Flame className="w-3.5 h-3.5" />
                <span>Heatmap</span>
              </button>
              <button
                onClick={() => setActiveLayer("emergency")}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-[10px] font-mono tracking-wider cursor-pointer transition ${
                  activeLayer === "emergency" ? "bg-rose-500/20 text-rose-400 border border-rose-500/30 font-bold" : "text-gray-400 hover:text-white"
                }`}
              >
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>Hazards</span>
              </button>
              <button
                onClick={() => setActiveLayer("concessions")}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-[10px] font-mono tracking-wider cursor-pointer transition ${
                  activeLayer === "concessions" ? "bg-amber-500/20 text-amber-400 border border-amber-500/30 font-bold" : "text-gray-400 hover:text-white"
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Food Stalls</span>
              </button>
            </div>
          </div>

          {/* Actual Render Canvas for Map element */}
          <div className="relative flex-1 min-h-[460px] flex items-center justify-center bg-radial-cyber font-mono overflow-hidden">
            
            {/* GEOGRAPHIC VIEW: Real Mapbox Container */}
            <div 
              id="mapbox-viewport"
              ref={mapContainerRef}
              className={`absolute inset-0 transition-opacity duration-500 ${
                viewMode === "GEOGRAPHIC" ? "opacity-100 z-10" : "opacity-0 -z-10 pointer-events-none"
              }`}
            >
              {/* Mapbox Token warning if empty */}
              {!mapboxToken && (
                <div className="absolute inset-0 bg-slate-950/95 backdrop-blur-md flex flex-col items-center justify-center p-8 text-center z-20 space-y-4 font-mono">
                  <div className="w-12 h-12 bg-amber-500/10 border border-amber-500/30 rounded-full flex items-center justify-center text-amber-400 animate-pulse">
                    <AlertTriangle className="w-6 h-6" />
                  </div>
                  <div className="space-y-1.5 max-w-md">
                    <h3 className="text-white text-base font-bold">Mapbox Access Token Unconfigured</h3>
                    <p className="text-gray-400 text-xs leading-relaxed font-sans">
                      A real <span className="text-cyan-400">mapbox-gl</span> module is initialized inside. Build integrations request that you set your token in your workspace settings file under <code className="text-gray-200">VITE_MAPBOX_ACCESS_TOKEN</code>.
                    </p>
                  </div>
                  <div className="p-3 bg-white/5 border border-white/5 rounded-xl text-[10px] text-gray-500 inline-block font-mono">
                    *Defaulting to interactive satellite telemetry simulator module below.*
                  </div>
                  <button 
                    onClick={() => setViewMode("STRATEGIC_2D")}
                    className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 text-black text-xs font-bold rounded-xl cursor-pointer"
                  >
                    View Interactive Tactical Base Map
                  </button>
                </div>
              )}

              {mapboxError && (
                <div className="absolute inset-0 bg-red-950/90 backdrop-blur-md flex flex-col items-center justify-center p-8 text-center z-10 space-y-2 text-white">
                  <HelpCircle className="w-8 h-8 text-red-500" />
                  <h4 className="font-bold">WebGL Hardware Context Loss</h4>
                  <p className="text-xs text-red-100 max-w-sm font-sans">{mapboxError}</p>
                </div>
              )}
            </div>

            {/* STRATEGIC VIEW: Interactive Stadium Isometric Layout */}
            <div 
              className={`w-full h-full flex items-center justify-center p-4 transition-all duration-500 ${
                viewMode !== "GEOGRAPHIC" ? "opacity-100" : "opacity-0 pointer-events-none"
              }`}
            >
              <div 
                className="relative w-full max-w-[580px] h-[480px] border border-white/5 rounded-[50px] flex items-center justify-center transition-all duration-700 ease-out bg-slate-950/20"
                style={{ 
                  transform: viewMode === "STRATEGIC_3D" ? "rotateX(55deg) rotateZ(-20deg) scale3d(0.95, 0.95, 1)" : "none",
                  perspective: "1000px"
                }}
              >
                {/* Cyber grid lines blueprint */}
                <div className="absolute inset-0 opacity-10 pointer-events-none rounded-[50px]" style={{ backgroundImage: "radial-gradient(#00f0ff 0.5px, transparent 0.5px)", backgroundSize: "16px 16px" }}></div>

                {/* Outer concentric arena tracks */}
                <span className="absolute inset-4 border border-dashed border-cyan-500/10 rounded-[75px]" />
                <span className="absolute inset-12 border-2 border-white/5 rounded-[65px]" />

                {/* Main arena playing pitch (Center block) */}
                <div className="absolute w-[210px] h-[120px] bg-gradient-to-br from-cyan-950/30 to-slate-900 border-2 border-cyan-500/20 rounded-[45px] flex flex-col items-center justify-center p-3 text-center overflow-hidden shadow-[inset_0_0_12px_rgba(0,240,255,0.15)] z-10">
                  <span className="font-mono text-[9px] text-cyan-400 font-bold uppercase tracking-widest animate-pulse">STADIUMX ARENA</span>
                  <p className="text-white font-bold text-xs font-sans mt-0.5">SPECTATOR STAGE</p>
                  <span className="text-[8px] text-emerald-400 font-mono mt-0.5 uppercase tracking-wide bg-emerald-500/10 px-1 py-0.5 rounded border border-emerald-500/20">LIVE SPECTATORS</span>
                </div>

                {/* Smart Glowing Route Guidelines (Neon paths joining selections) */}
                {routeActive && (
                  <svg className="absolute inset-0 w-full h-full pointer-events-none z-15" style={{ filter: "drop-shadow(0 0 8px rgba(0, 240, 255, 0.6))" }}>
                    <defs>
                      <linearGradient id="glowing-neon" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#00f0ff" />
                        <stop offset="100%" stopColor="#bf5af2" />
                      </linearGradient>
                    </defs>
                    
                    {(() => {
                      const startPt = SVG_COORDS[routeStart];
                      const endPt = SVG_COORDS[routeEnd];
                      if (!startPt || !endPt) return null;

                      // Midpoint for dynamic curvature
                      const midX = (startPt.x + endPt.x) / 2 + (startPt.y < endPt.y ? -40 : 40);
                      const midY = (startPt.y + endPt.y) / 2 + (startPt.x < endPt.x ? 30 : -30);

                      const pathData = `M ${startPt.x} ${startPt.y} Q ${midX} ${midY} ${endPt.x} ${endPt.y}`;

                      return (
                        <>
                          {/* Underline pulse */}
                          <path 
                            d={pathData} 
                            fill="none" 
                            stroke="url(#glowing-neon)" 
                            strokeWidth="4" 
                            strokeLinecap="round" 
                            className="opacity-70"
                          />
                          <path 
                            d={pathData} 
                            fill="none" 
                            stroke="#ffffff" 
                            strokeWidth="2" 
                            strokeLinecap="round" 
                            strokeDasharray="6 12"
                            className="animate-route-flow"
                          />
                          {/* Moving route target dot */}
                          <circle r="4" fill="#ffffff" className="route-pulse-node">
                            <animateMotion 
                              dur="3s" 
                              repeatCount="indefinite" 
                              path={pathData}
                            />
                          </circle>
                        </>
                      );
                    })()}
                  </svg>
                )}

                {/* Clickable Seat Sector Blocks */}
                {seatBlocks.map((block) => {
                  const isSelected = selectedSection === block.id;

                  let densityColor = "bg-emerald-500/20 border-emerald-500/40 hover:bg-emerald-500/30 hover:border-emerald-500";
                  let indicatorLight = "bg-emerald-400 shadow-[0_0_8px_#10b981]";
                  
                  if (block.currentDensity > 85) {
                    densityColor = "bg-rose-500/25 border-rose-500/50 hover:bg-rose-500/35 hover:border-rose-400 animate-pulse";
                    indicatorLight = "bg-rose-500 shadow-[0_0_12px_#ef4444]";
                  } else if (block.currentDensity > 65) {
                    densityColor = "bg-amber-500/20 border-amber-500/40 hover:bg-amber-500/30 hover:border-amber-400";
                    indicatorLight = "bg-amber-400 shadow-[0_0_10px_#f59e0b]";
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
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.96 }}
                      className={`rounded-xl border font-sans select-none flex flex-col justify-between p-2 cursor-pointer transition-all ${
                        isSelected 
                          ? "border-cyan-400 bg-cyan-500/15 scale-105 shadow-[0_0_16px_rgba(0,240,255,0.35)] z-22" 
                          : `${densityColor}`
                      }`}
                    >
                      <div className="flex justify-between items-center w-full">
                        <span className="text-[8px] text-gray-200 font-bold truncate tracking-tight uppercase">{block.id.replace(" Block", "").replace(" Deck", "")}</span>
                        <span className={`w-1.5 h-1.5 rounded-full ${indicatorLight}`}></span>
                      </div>
                      <span className="text-white text-xs font-mono font-bold">
                        <AnimatedCounter value={block.currentDensity} />%
                      </span>
                    </motion.button>
                  );
                })}

                {/* Animated Crowd Heatmap Layer Overlays (density layer toggle) */}
                {activeLayer === "density" && heatpoints.map((pt, index) => {
                  let bubbleBg = "rgba(4, 120, 87, 0.2)";
                  let bubbleBorder = "rgba(52, 211, 153, 0.4)";
                  
                  if (pt.intensity === "CRITICAL") {
                    bubbleBg = "rgba(225, 29, 72, 0.25)";
                    bubbleBorder = "rgba(239, 68, 68, 0.6)";
                  } else if (pt.intensity === "HIGH") {
                    bubbleBg = "rgba(245, 158, 11, 0.22)";
                    bubbleBorder = "rgba(245, 158, 11, 0.5)";
                  }

                  return (
                    <div
                      key={index}
                      style={{
                        position: "absolute",
                        left: `${pt.x - pt.size / 2}px`,
                        top: `${pt.y - pt.size / 2}px`,
                        width: `${pt.size}px`,
                        height: `${pt.size}px`,
                        backgroundColor: bubbleBg,
                        borderColor: bubbleBorder,
                      }}
                      className="rounded-full border-2 border-dashed flex items-center justify-center animate-pulse z-15 pointer-events-none"
                      title={pt.label}
                    >
                      <div className="w-2 h-2 rounded-full bg-white opacity-40 animate-ping" />
                    </div>
                  );
                })}

                {/* Emergency Hazard markers (emergency layer toggle) */}
                {activeLayer === "emergency" && (
                  <>
                    {/* Pulsing hazard corridors */}
                    <svg className="absolute inset-0 w-full h-full pointer-events-none">
                      <path 
                        d="M 125 180 Q 200 130 280 180" 
                        fill="none" 
                        stroke="#ef4444" 
                        strokeWidth="3" 
                        strokeDasharray="5 5" 
                        className="animate-pulse"
                      />
                      <circle cx="125" cy="180" r="14" fill="rgba(239,68,68,0.2)" stroke="#ef4444" strokeWidth="1" />
                    </svg>

                    {/* Evacuation green routes */}
                    <svg className="absolute inset-0 w-full h-full pointer-events-none">
                      {/* Left Block to West Gate */}
                      <path d="M 115 210 L 45 260" fill="none" stroke="#10b981" strokeWidth="2.5" strokeDasharray="4 6" className="animate-route-flow" />
                      {/* East Block to East Gate */}
                      <path d="M 420 220 L 525 260" fill="none" stroke="#10b981" strokeWidth="2.5" strokeDasharray="4 6" className="animate-route-flow" />
                    </svg>

                    {/* Real time incidents from firebase telemetry */}
                    {telemetry.activeIncidents.map((inc, i) => {
                      const idx = i % seatBlocks.length;
                      const targetBlock = seatBlocks[idx];
                      const px = targetBlock ? targetBlock.x + 30 : 200;
                      const py = targetBlock ? targetBlock.y + 10 : 300;

                      return (
                        <div 
                          key={inc.id}
                          style={{ position: "absolute", left: `${px}px`, top: `${py}px` }}
                          className="z-25 group"
                        >
                          <div className="relative flex items-center justify-center cursor-pointer">
                            <span className="absolute animate-ping inline-flex h-8 w-8 rounded-full bg-red-500 opacity-60"></span>
                            <div className="relative p-1.5 bg-red-600 rounded-full border border-white text-white shadow-xl animate-bounce">
                              <ShieldAlert className="w-3.5 h-3.5" />
                            </div>
                          </div>

                          {/* Hover tooltip */}
                          <div className="absolute bottom-9 left-1/2 transform -translate-x-1/2 w-48 bg-slate-950 border border-rose-500 rounded-xl p-2.5 shadow-2xl text-[10px] pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300 font-mono z-30">
                            <div className="text-red-400 font-bold uppercase tracking-wider">{inc.type}</div>
                            <div className="text-white mt-1 leading-normal font-sans font-medium">{inc.description}</div>
                            <div className="text-gray-500 mt-1 uppercase text-[8px]">{inc.section} • {inc.status}</div>
                          </div>
                        </div>
                      );
                    })}
                  </>
                )}

                {/* Gate Pins on strategic layout */}
                {Object.entries(SVG_COORDS).filter(([key]) => key.includes("Gate")).map(([name, pt]) => (
                  <div
                    key={name}
                    style={{ position: "absolute", left: `${pt.x - 12}px`, top: `${pt.y - 12}px` }}
                    className="z-18 flex flex-col items-center group cursor-pointer"
                    onClick={() => {
                      setRouteEnd(name);
                      setActionSuccessMessage(`End point vector focused on: ${name}`);
                    }}
                  >
                    <div className="w-6 h-6 rounded-full bg-slate-900 border border-cyan-400/80 flex items-center justify-center text-cyan-300 text-[9px] font-bold shadow-[0_0_8px_rgba(0,240,255,0.2)] hover:scale-110 transition-all">
                      {name.replace("Gate ", "").substring(0, 1)}
                    </div>
                    {/* Hover indicator label */}
                    <div className="absolute opacity-0 group-hover:opacity-100 -bottom-8 bg-slate-950 text-[9px] text-white p-1 rounded border border-cyan-500/20 whitespace-nowrap pointer-events-none transition-opacity duration-200">
                      {name}
                    </div>
                  </div>
                ))}

              </div>
            </div>

          </div>

          {/* Lower Interactive Map stats strip */}
          <div className="p-4 bg-slate-950/90 border-t border-white/5 rounded-b-3xl flex flex-col sm:flex-row items-center justify-between text-xs font-mono text-gray-400 gap-4 relative z-20">
            <div className="flex flex-wrap items-center gap-4 text-[11px]">
              <span className="flex items-center space-x-1.5">
                <span className="w-2 h-2 rounded bg-emerald-500"></span>
                <span>Normal Flow (&lt;65%)</span>
              </span>
              <span className="flex items-center space-x-1.5">
                <span className="w-2 h-2 rounded bg-amber-500 animate-pulse"></span>
                <span>Restricted (65-85%)</span>
              </span>
              <span className="flex items-center space-x-1.5">
                <span className="w-2 h-2 rounded bg-rose-500 animate-ping"></span>
                <span>Critical (&gt;85%)</span>
              </span>
            </div>

            {/* Quick calibration buttons */}
            <div className="flex items-center space-x-2.5">
              <button 
                onClick={() => setZoomLevel(Math.min(150, zoomLevel + 10))}
                className="p-1 px-3 bg-white/5 border border-white/10 hover:border-white/20 hover:bg-white/10 text-white rounded-lg transition text-[11px] cursor-pointer"
              >
                Scale +
              </button>
              <button 
                onClick={() => setZoomLevel(Math.max(50, zoomLevel - 10))}
                className="p-1 px-3 bg-white/5 border border-white/10 hover:border-white/20 hover:bg-white/10 text-white rounded-lg transition text-[11px] cursor-pointer"
              >
                Scale -
              </button>
              <span className="text-[10px] text-gray-500 font-bold">{zoomLevel}% scale</span>
            </div>
          </div>
        </div>

        {/* Right Side Control Pane: Routing, Hotspot Inspection, Scenarios */}
        <div className="lg:col-span-4 space-y-6 flex flex-col justify-between">
          
          {/* Section 1: AI Smart Routing Assistance */}
          <div className="glass-panel p-5 rounded-2xl border border-white/10 bg-slate-900/40 space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-2">
              <h3 className="font-sans font-bold text-base text-white flex items-center gap-2">
                <Navigation className="w-4 h-4 text-cyan-400 animate-pulse" />
                <span>Smart Route Guidance</span>
              </h3>
              <button
                onClick={() => setRouteActive(!routeActive)}
                className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
                  routeActive ? "text-cyan-400 border-cyan-400/30 bg-cyan-400/10" : "text-gray-500 border-white/10"
                }`}
              >
                {routeActive ? "SIGNS ENABLED" : "MUTED"}
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs font-mono">
              <div>
                <label className="text-gray-500 uppercase text-[9px] block mb-1">Start Location</label>
                <select 
                  value={routeStart}
                  onChange={(e) => setRouteStart(e.target.value)}
                  className="w-full bg-slate-950 border border-white/10 text-white py-1.5 px-2 rounded-lg text-xs font-mono select-none focus:outline-none focus:border-cyan-500 cursor-pointer"
                >
                  <option value="North Deck A">Sector North Deck A</option>
                  <option value="East Block A">Sector East Block A</option>
                  <option value="South Deck A">Sector South Deck A</option>
                  <option value="West Block A">Sector West Block A</option>
                </select>
              </div>

              <div>
                <label className="text-gray-500 uppercase text-[9px] block mb-1">Destination Target</label>
                <select
                  value={routeEnd}
                  onChange={(e) => setRouteEnd(e.target.value)}
                  className="w-full bg-slate-950 border border-white/10 text-white py-1.5 px-2 rounded-lg text-xs font-mono select-none focus:outline-none focus:border-cyan-500 cursor-pointer"
                >
                  <option value="Gate A (Main Entrance)">Gate A (Main)</option>
                  <option value="Gate B (South Egress)">Gate B (South)</option>
                  <option value="Gate C (West Bottleneck)">Gate C (Bottleneck)</option>
                  <option value="Gate D (East Transit)">Gate D (Transit)</option>
                </select>
              </div>
            </div>

            {/* Calculations Panel Display */}
            {routeActive && (
              <div className="p-3 bg-cyan-950/20 rounded-xl border border-cyan-500/15 space-y-2 text-xs font-mono animate-fade-in">
                <div className="flex justify-between items-center text-[10px] text-cyan-400 uppercase font-bold">
                  <span>Routing Directives</span>
                  <span>Optimal Path Logged</span>
                </div>
                <p className="text-cyan-100 text-[11px] leading-relaxed font-sans">
                  {routeCalculationMessage}
                </p>
                <div className="flex justify-between text-[10px] text-gray-500 pt-1.5 border-t border-cyan-500/10">
                  <span>Latency Cost: 22s</span>
                  <span className="text-cyan-200">98.4% Efficiency Rating</span>
                </div>
              </div>
            )}
          </div>

          {/* Section 2: Selected Zone Inspector */}
          <div className="glass-panel p-5 rounded-2xl border border-white/10 bg-slate-900/40 space-y-4">
            <div className="border-b border-white/10 pb-2 flex justify-between items-center">
              <div>
                <h3 className="font-sans font-bold text-white text-base">Zone Inspector</h3>
                <p className="text-gray-400 text-[11px]">Pedestrian density analysis parameters</p>
              </div>
              {selectedSection && (
                <button 
                  onClick={() => setSelectedSection(null)}
                  className="text-[10px] font-mono text-cyan-400 hover:underline"
                >
                  Clear Detail
                </button>
              )}
            </div>

            {selectedSection ? (
              <div className="space-y-4 animate-fade-in text-xs font-mono">
                <div className="flex justify-between items-center bg-white/5 border border-white/10 p-2.5 rounded-lg">
                  <div>
                    <span className="text-[9px] text-gray-500 block uppercase">Selected Axis</span>
                    <span className="text-white font-bold text-sm">{selectedSection}</span>
                  </div>
                  <span className="bg-cyan-500/20 text-cyan-400 px-2.5 py-1 rounded text-[10px] font-bold border border-cyan-500/30">
                    {seatBlocks.find(b => b.id === selectedSection)?.currentDensity}% Capacity
                  </span>
                </div>

                {/* Progress Density Indicators */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[11px] text-gray-400">
                    <span>Flow Saturation Metric:</span>
                    <span className="text-white font-bold">
                      {seatBlocks.find(b => b.id === selectedSection)?.currentDensity}% / 100%
                    </span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-950 overflow-hidden rounded-full border border-white/5">
                    <div 
                      className="h-full bg-gradient-to-r from-cyan-400 to-purple-500 rounded-full"
                      style={{ width: `${seatBlocks.find(b => b.id === selectedSection)?.currentDensity}%` }}
                    ></div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-center">
                  <div className="bg-black/20 p-2 rounded-lg border border-white/5">
                    <span className="text-[9px] text-gray-500 block">TEMP COMPLIANCE</span>
                    <span className="text-white font-bold text-[11px]">71.8°F OK</span>
                  </div>
                  <div className="bg-black/20 p-2 rounded-lg border border-white/5">
                    <span className="text-[9px] text-gray-500 block">CONGESTION TREND</span>
                    <span className="text-emerald-400 font-bold text-[11px]">STABLE DELAY</span>
                  </div>
                </div>

                {/* Tactical Dispatch Shortcuts */}
                <div className="pt-2 border-t border-white/5 space-y-1.5 font-mono">
                  <span className="text-[9px] text-gray-500 block uppercase text-left">Security Dispatch Redirections</span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => onDispatchIncident(
                        "CROWD_REDIRECT", 
                        selectedSection, 
                        `System dispatched crowd redirection instructions along ${selectedSection}`, 
                        "MEDIUM"
                      )}
                      className="flex-1 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-black font-bold rounded-lg text-[9px] uppercase tracking-wider cursor-pointer"
                    >
                      Bypass Flows
                    </button>
                    <button
                      onClick={() => onDispatchIncident(
                        "SENSOR_AUDIT", 
                        selectedSection, 
                        `Direct sensor hardware check triggered for ${selectedSection} sector`, 
                        "LOW"
                      )}
                      className="flex-1 py-1.5 bg-slate-800 hover:bg-slate-700 text-gray-300 rounded-lg text-[9px] uppercase tracking-wider cursor-pointer border border-white/10"
                    >
                      Audit Sensors
                    </button>
                  </div>
                </div>

              </div>
            ) : (
              <div className="text-center py-6 space-y-2">
                <div className="w-8 h-8 rounded-full bg-cyan-500/10 border border-cyan-400/20 text-cyan-400 mx-auto flex items-center justify-center animate-pulse">
                  <Info className="w-4 h-4" />
                </div>
                <div className="space-y-0.5">
                  <h4 className="text-white text-xs font-bold font-sans">No Zone Inspected</h4>
                  <p className="text-gray-400 text-[10px] max-w-[200px] mx-auto font-sans leading-relaxed">
                    Select a block on the layout to access localized diagnostics or broadcast overriding guidelines.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Section 3: Macro Parking Zone Indicators */}
          <div className="glass-panel p-5 rounded-2xl border border-white/10 bg-slate-900/40 space-y-4">
            <h3 className="font-sans font-bold text-white text-base">
              Parking Zone Diagnostics
            </h3>
            
            <div className="space-y-2 text-xs font-mono">
              <div className="flex justify-between items-center text-gray-300 p-2 bg-black/20 rounded-lg border border-white/5">
                <span className="font-semibold text-white">🚗 VIP East Garage</span>
                <span className="text-amber-400 font-bold">91.0% Filled</span>
              </div>
              <div className="flex justify-between items-center text-gray-300 p-2 bg-black/20 rounded-lg border border-white/5">
                <span className="font-semibold text-white">🚗 North Lot Matrix</span>
                <span className="text-rose-400 font-bold">98.2% Filled</span>
              </div>
              <div className="flex justify-between items-center text-gray-300 p-2 bg-black/20 rounded-lg border border-white/5">
                <span className="font-semibold text-white">🚗 West Express Lot</span>
                <span className="text-emerald-400 font-bold">40.5% Vacant</span>
              </div>
            </div>
            
            <p className="text-[10px] text-gray-500 font-sans italic leading-relaxed text-center">
              *Wayfinding LED panels automatically updating to divert incoming stadium traffic to West Express.*
            </p>
          </div>

        </div>

      </div>

      {/* LOWER SECTION: Interactive Crowd Heatmap Control Panel (Scenario selectors & simulation triggers) */}
      <div className="glass-panel p-6 rounded-3xl bg-slate-950/40 border border-white/10 space-y-6" id="crowd-heatmap-section">
        <div className="border-b border-white/5 pb-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-cyan-400 font-mono text-xs font-bold uppercase tracking-wider">
              <Radio className="w-4 h-4 text-cyan-400 animate-pulse" />
              <span>COGNITIVE THERMAL PROJECTIONS CONTROL</span>
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
                  // Clear overrides to showcase preset behavior
                  setCustomHotspotTemp({});
                  // Trigger helpful notification
                  setActionSuccessMessage(`Activated simulation scenario: ${mode.toUpperCase().replaceAll("_", " ")}`);
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

        {/* Action success animations banner */}
        {actionSuccessMessage && (
          <div className="p-3 bg-emerald-950/45 border border-emerald-505/20 text-emerald-400 rounded-xl text-xs font-mono flex items-center gap-2 animate-pulse">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{actionSuccessMessage}</span>
          </div>
        )}

        {/* Dynamic sliding editor for hotspot densities */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          <div className="lg:col-span-7 space-y-3">
            <span className="text-[10px] text-gray-400 font-mono uppercase tracking-wider block font-semibold">Active Pedestrian Hotspots</span>
            
            <div className="space-y-3">
              {hotspotsData.map((hotspot) => {
                const density = getHotspotDensity(hotspot.id);
                const isSelected = selectedHotspotId === hotspot.id;
                
                let statusColor = "text-emerald-400";
                let barColor = "bg-emerald-500 animate-pulse";
                let labelText = "Nominal Flow Compliance";
                
                if (density > 85) {
                  statusColor = "text-rose-500 font-bold";
                  barColor = "bg-rose-500 animate-ping";
                  labelText = "CRITICAL CONGESTION RISK";
                } else if (density > 60) {
                  statusColor = "text-amber-400 font-bold";
                  barColor = "bg-amber-500";
                  labelText = "HIGH DENSITY WARNING";
                } else if (density > 35) {
                  statusColor = "text-cyan-400";
                  barColor = "bg-cyan-400";
                  labelText = "Stable Crowd Transit";
                }

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

                    <div className="mt-3.5 space-y-2">
                      <div className="flex justify-between text-[10px] font-mono text-gray-400">
                        <span className="flex items-center gap-1">Egress/Ingress Ratio: <AnimatedCounter value={calculatedHeadcount} /> / Max {hotspot.baseHeadcount.toLocaleString()}</span>
                        <span className={`${statusColor}`}>{labelText}</span>
                      </div>
                      
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

          <div className="lg:col-span-15 lg:col-start-8 lg:col-end-13">
            {(() => {
              const hotspot = hotspotsData.find((h) => h.id === selectedHotspotId) || hotspotsData[0];
              const density = getHotspotDensity(hotspot.id);
              
              let statusText = "Compliant Flow";
              let statusBorder = "border-emerald-500/20";
              let statusBg = "bg-emerald-950/10";
              let descAlert = "";

              if (density > 85) {
                statusText = "CRITICAL BOTTLE LIMIT";
                statusBorder = "border-rose-500/30";
                statusBg = "bg-rose-950/20";
                descAlert = "Direction bottleneck. Automatic LED waypoint overrides and tactical usher dispatch recommended.";
              } else if (density > 60) {
                statusText = "LOAD PRESSURE WARNING";
                statusBorder = "border-amber-500/30";
                statusBg = "bg-amber-950/20";
                descAlert = "Nearing safety margins. Ensure Gate turnstiles are operating optimally.";
              }

              return (
                <div className="p-5 bg-white/5 border border-white/10 rounded-3xl space-y-5 h-full flex flex-col justify-between font-mono">
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

                    <div className={`p-4 rounded-2xl border ${statusBorder} ${statusBg} text-xs font-mono space-y-2`}>
                      <div className="flex justify-between items-center text-[10px] tracking-wider uppercase font-bold text-gray-400">
                        <span>SYSTEM HEALTH</span>
                        <span className={density > 85 ? "text-rose-500" : density > 60 ? "text-amber-400" : "text-emerald-400"}>
                          {statusText}
                        </span>
                      </div>
                      <div className="flex justify-between text-[11px] text-gray-300">
                        <span>Projected Queue Wait:</span>
                        <span className="text-white font-bold">
                          <AnimatedCounter value={Math.round(density * 0.12)} /> mins
                        </span>
                      </div>
                      <div className="flex justify-between text-[11px] text-gray-300">
                        <span>Clearance Rate:</span>
                        <span className="text-white font-bold text-cyan-400">
                          ~<AnimatedCounter value={Math.round(240 / (density / 20 || 1))} /> fans/min
                        </span>
                      </div>
                      {descAlert && (
                        <p className="text-[10px] text-gray-400 mt-2 italic border-t border-white/5 pt-1.5 leading-normal">
                          {descAlert}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-gray-300 flex items-center gap-1">
                          <Sliders className="w-3.5 h-3.5 text-cyan-400" />
                          <span>Tune Local Heat Load:</span>
                        </span>
                        <span className="text-white font-bold">
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
                          className="w-full h-1.5 bg-gray-900 rounded-lg appearance-none cursor-pointer accent-cyan-500 outline-none border border-white/5"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-white/5 space-y-2">
                    <button
                      onClick={() => handleTriggerAction(hotspot.id, hotspot.name)}
                      disabled={activeActionId !== null}
                      className="w-full py-2.5 bg-gradient-to-r from-cyan-500 to-blue-500 text-black font-bold text-[10px] tracking-wider uppercase rounded-xl transition cursor-pointer flex items-center justify-center gap-2"
                    >
                      <Zap className="w-4 h-4 text-black" />
                      <span>Authorize Signage Reroutes</span>
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
                        className="w-full py-1.5 bg-white/5 border border-white/10 text-gray-300 text-[9px] uppercase tracking-wider rounded-lg transition hover:bg-white/10"
                      >
                        Reset Density Overrides
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
