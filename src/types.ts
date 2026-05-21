export type PageId = "home" | "dashboard" | "map" | "assistant" | "emergency" | "admin";

export interface Incident {
  id: string;
  section: string;
  type: string;
  description: string;
  status: "DISPATCHED" | "IN_PROGRESS" | "RESOLVED" | "TRIGGERED";
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  timestamp: string;
}

export interface ParkingZone {
  capacity: number;
  filled: number;
  state: "CRITICAL" | "STABLE" | "HIGH" | "OPEN";
}

export interface ParkingStatus {
  northLot: ParkingZone;
  southGarage: ParkingZone;
  vipEast: ParkingZone;
  westExpress: ParkingZone;
}

export interface SentimentComment {
  id: string;
  user: string;
  text: string;
  sentiment: "POSITIVE" | "NEUTRAL" | "NEGATIVE";
  timestamp: string;
}

export interface QueuePrediction {
  id: string;
  name: string;
  currentQueue: number;
  waitTime: number;
  trend: "UP" | "DOWN" | "STEADY";
  capacityRate: number;
}

export interface AIRecommendation {
  id: string;
  title: string;
  category: "SAFETY" | "CROWD" | "CONCESSIONS" | "ENERGY";
  description: string;
  impact: string;
  severity: "LOW" | "MEDIUM" | "HIGH";
  resolved: boolean;
}

export interface TelemetryData {
  attendance: number;
  maxCapacity: number;
  gateLatencies: Record<string, number>;
  activeIncidents: Incident[];
  parkingStatus: ParkingStatus;
  evacuationLock: boolean;
  fanSentiment: SentimentComment[];
  queuePredictions: QueuePrediction[];
  aiRecommendations: AIRecommendation[];
  washroomOccupancy: number;
  securityStatus: "NORMAL" | "VIGILANT" | "ALERT";
}

