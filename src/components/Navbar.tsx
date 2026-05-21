import React, { useState, useEffect } from "react";
import { 
  Home, 
  Activity, 
  Map as MapIcon, 
  Cpu, 
  ShieldAlert, 
  Settings, 
  Menu, 
  X, 
  Bell, 
  Sparkles, 
  Database,
  VolumeX,
  Volume2
} from "lucide-react";
import { PageId } from "../types";

interface NavbarProps {
  currentPage: PageId;
  setCurrentPage: (page: PageId) => void;
  incidentCount: number;
  evacuationLock: boolean;
}

export default function Navbar({ 
  currentPage, 
  setCurrentPage, 
  incidentCount, 
  evacuationLock 
}: NavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [operationalTime, setOperationalTime] = useState("");
  const [soundEnabled, setSoundEnabled] = useState(true);

  useEffect(() => {
    // Tick operational network clock in 2026 format (or matching user's locale time)
    const updateTime = () => {
      const now = new Date();
      setOperationalTime(
        now.toISOString().replace("T", " ").substring(0, 19) + " UTC"
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const navItems = [
    { id: "home" as PageId, name: "Overview", icon: Home },
    { id: "dashboard" as PageId, name: "Metrics & Analytics", icon: Activity },
    { id: "map" as PageId, name: "Live Operations Map", icon: MapIcon },
    { id: "assistant" as PageId, name: "StadiumX AI Core", icon: Cpu },
    { id: "emergency" as PageId, name: "Emergency Dispatch", icon: ShieldAlert, badge: evacuationLock },
    { id: "admin" as PageId, name: "Simulation Panel", icon: Settings },
  ];

  return (
    <>
      {/* Upper Navigation Bar */}
      <header className="fixed top-0 left-0 w-full glass-panel z-50 bg-cyber-dark/80 border-b border-[rgba(0,240,255,0.15)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <button 
              onClick={() => setCurrentPage("home")} 
              className="flex items-center space-x-3 cursor-pointer group"
              id="header-logo-btn"
            >
              <div className="relative">
                <div className="absolute inset-0 bg-neon-blue blur-md opacity-40 group-hover:opacity-75 transition-opacity rounded-full"></div>
                <div className="relative bg-cyber-dark border border-neon-blue text-neon-blue rounded-xl p-2 font-mono font-bold tracking-widest text-lg shadow-[0_0_10px_rgba(0,240,255,0.2)]">
                  S<span className="text-neon-purple">X</span>
                </div>
              </div>
              <div>
                <span className="font-sans font-bold text-xl tracking-wider text-white flex items-center gap-1.5">
                  STADIUM<span className="text-neon-blue font-extrabold">X</span>
                  <span className="text-xs bg-neon-purple/20 border border-neon-purple/50 text-neon-purple px-1.5 py-0.5 rounded-sm font-mono tracking-widest uppercase">
                    AI
                  </span>
                </span>
                <span className="hidden sm:block text-[9px] text-gray-400 font-mono tracking-widest uppercase">
                  Core Operations OS v5.21
                </span>
              </div>
            </button>
          </div>

          {/* Operational Metrics clock and Indicators */}
          <div className="hidden md:flex items-center space-x-6 text-xs font-mono">
            <div className="flex items-center space-x-2 text-cyan-400">
              <span className="w-2 h-2 rounded-full bg-neon-blue animate-pulse"></span>
              <span>GRID: ONLINE</span>
            </div>
            
            <div className="text-gray-400 border-l border-gray-800 pl-4">
              <span className="text-[10px] text-gray-500 block">DECISION ENGINE TIME</span>
              <span className="text-white font-medium">{operationalTime}</span>
            </div>

            {evacuationLock && (
              <div className="bg-red-500/20 border border-red-500/50 text-red-500 px-3 py-1 rounded text-[11px] animate-pulse flex items-center gap-1.5">
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>EVAC WATCH ACTIVE</span>
              </div>
            )}

            <button 
              onClick={() => setSoundEnabled(!soundEnabled)}
              title={soundEnabled ? "Mute audio alarms" : "Enable audio alarms"}
              className="p-1 px-2 border border-gray-800 rounded bg-cyber-card/40 text-gray-400 hover:text-white hover:border-gray-700 transition"
            >
              {soundEnabled ? <Volume2 className="w-4 h-4 text-neon-blue" /> : <VolumeX className="w-4 h-4 text-rose-500" />}
            </button>
          </div>

          {/* Mobile responsive toggler */}
          <div className="flex items-center space-x-3 md:hidden">
            <button 
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="p-1.5 border border-gray-800 rounded text-gray-400 hover:text-white"
            >
              {soundEnabled ? <Volume2 className="w-4 h-4 text-neon-blue" /> : <VolumeX className="w-4 h-4 text-rose-500" />}
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 border border-cyan-500/30 text-neon-blue hover:text-white hover:border-neon-blue rounded-lg transition"
              id="mobile-menu-toggle"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </header>

      {/* Left Vertical Sidebar (Desktop) */}
      <nav className="hidden md:block fixed left-0 top-18 w-64 h-[calc(100vh-4.5rem)] bg-cyber-dark/95 border-r border-[rgba(0,240,255,0.1)] z-45">
        <div className="h-full py-6 px-4 flex flex-col justify-between overflow-y-auto">
          <div className="space-y-1">
            <span className="text-[10px] text-gray-500 font-mono tracking-widest uppercase px-3.5 block mb-4">
              SYSTEM COMMAND SENSOR
            </span>
            {navItems.map((item) => {
              const IconComponent = item.icon;
              const isActive = currentPage === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setCurrentPage(item.id)}
                  id={`sidebar-nav-${item.id}`}
                  className={`w-full flex items-center justify-between px-3.5 py-3 rounded-lg text-sm font-sans tracking-wide cursor-pointer group transition-all duration-250 ${
                    isActive
                      ? "bg-neon-blue/10 border-l-2 border-neon-blue text-white font-medium shadow-[0_0_15px_rgba(0,240,255,0.06)]"
                      : "text-gray-400 hover:text-white hover:bg-cyber-card/40 border-l-2 border-transparent"
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <IconComponent className={`w-5 h-5 transition-transform duration-300 group-hover:scale-110 ${
                      isActive ? "text-neon-blue" : "text-gray-400 group-hover:text-cyan-400"
                    }`} />
                    <span>{item.name}</span>
                  </div>
                  {item.id === "emergency" && incidentCount > 0 && (
                    <span className="bg-rose-600/30 border border-rose-500 hover:bg-rose-600 text-rose-300 font-mono text-[10px] px-1.5 py-0.5 rounded-full animate-pulse">
                      {incidentCount}
                    </span>
                  )}
                  {item.id === "assistant" && (
                    <Sparkles className="w-3.5 h-3.5 text-neon-purple animate-pulse" />
                  )}
                </button>
              );
            })}
          </div>

          <div className="border-t border-gray-900 pt-6 space-y-3.5">
            <div className="bg-cyber-card/60 rounded-xl p-3 border border-cyan-500/10 text-[11px] font-mono select-none">
              <div className="flex items-center justify-between text-gray-500 mb-1">
                <span>DRONE PATROLS</span>
                <span className="text-neon-blue animate-pulse">ACTIVE</span>
              </div>
              <div className="w-full bg-gray-900 h-1.5 rounded-full overflow-hidden">
                <div className="bg-neon-blue h-full w-[85%] rounded-full shadow-[0_0_8px_#00f0ff]"></div>
              </div>
              <div className="flex items-center justify-between text-[9px] text-gray-400 mt-1">
                <span>08 DEPLOYED</span>
                <span>BATTERY: 92%</span>
              </div>
            </div>

            <div className="text-center text-[10px] font-mono text-gray-500">
              StadiumX System Inc.
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Drawer Overlay */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 top-18 bg-cyber-dark/95 z-40 overflow-y-auto">
          <div className="p-6 space-y-4">
            <span className="text-[10px] text-gray-500 font-mono tracking-widest uppercase block mb-2 px-1">
              OPERATIONAL MENU GRID
            </span>
            {navItems.map((item) => {
              const IconComponent = item.icon;
              const isActive = currentPage === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setCurrentPage(item.id);
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center justify-between p-3.5 rounded-xl cursor-pointer ${
                    isActive
                      ? "bg-neon-blue/15 border border-neon-blue/50 text-white"
                      : "bg-cyber-card/30 border border-transparent text-gray-300 hover:bg-cyber-card/60"
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <IconComponent className={`w-5 h-5 ${isActive ? "text-neon-blue" : "text-gray-400"}`} />
                    <span className="font-sans text-sm">{item.name}</span>
                  </div>
                  {item.id === "emergency" && incidentCount > 0 && (
                    <span className="bg-rose-500 text-white font-mono text-xs px-2 py-0.5 rounded-full">
                      {incidentCount}
                    </span>
                  )}
                </button>
              );
            })}

            <div className="pt-6 border-t border-gray-900">
              <div className="bg-cyber-card p-4 rounded-xl border border-cyan-500/10 space-y-3 font-mono text-xs">
                <div className="flex justify-between items-center text-gray-400">
                  <span>TELEMETRY SYNC</span>
                  <span className="text-neon-blue">ONLINE</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[10px]">
                  <div className="bg-gray-900/40 p-2 rounded text-center">
                    <span className="text-gray-500 block">SENSORS</span>
                    <span className="text-white font-semibold">1,024/1,024</span>
                  </div>
                  <div className="bg-gray-900/40 p-2 rounded text-center">
                    <span className="text-gray-500 block">DRONE LINK</span>
                    <span className="text-white font-semibold">SECURED</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
