export interface Station {
  code: string;
  name: string;
  lat: number;
  lng: number;
  scheduledArrival: string;
  scheduledDeparture: string;
  actualArrival?: string;
  actualDeparture?: string;
  delayMinutes: number;
  distanceKm: number;
  status: 'passed' | 'current' | 'upcoming';
  platform?: string;
  haltMinutes?: number;
}

export interface SearchResult {
  id: string;
  number: string;
  name: string;
  origin: {
    code: string;
    name: string;
  };
  destination: {
    code: string;
    name: string;
  };
  runsOn?: string[];
  duration?: string;
  departureTime?: string;
  arrivalTime?: string;
}

export interface LiveLocation {
  lat: number;
  lng: number;
  heading: number; // angle in degrees 0-360
  speedKmh: number;
  isMoving: boolean;
}

export interface LiveJourney {
  trainId: string;
  number: string;
  name: string;
  origin: {
    code: string;
    name: string;
  };
  destination: {
    code: string;
    name: string;
  };
  currentLocation: LiveLocation;
  status: 'running' | 'delayed' | 'on_time' | 'cancelled' | 'not_started' | 'completed';
  delayMinutes: number;
  speedKmh: number;
  distanceCoveredKm: number;
  remainingDistanceKm: number;
  totalDistanceKm: number;
  completionPercentage: number;
  lastUpdated: string; // ISO timestamp — when position was last observed by upstream API
  previousStation?: Station;
  currentStation?: Station;
  nextStation?: Station;
  ETA: string;
  stations: Station[];
  routeGeometry?: [number, number][]; // Array of [lng, lat] for MapLibre polyline
  /** Whether the train is at a station, between stations, or position unknown */
  positionState?: 'AT_STATION' | 'BETWEEN_STATIONS' | 'PASSED_STATION' | 'UNKNOWN';
  /** Freshness metadata */
  freshness: {
    /** Whether the upstream API reports this as live tracking */
    isLive: boolean;
    /** Whether the coordinates come from actual GPS (vs station-based or interpolated) */
    isActualPosition: boolean;
    /** How the position was determined: 'gps' | 'station' | 'interpolated' | 'fallback' */
    positionSource: 'gps' | 'station' | 'interpolated' | 'fallback';
    /** Seconds since the upstream API last updated the position */
    dataAgeSeconds: number;
    /** Freshness label: 'live' | 'recent' | 'stale' | 'outdated' | 'unknown' */
    freshnessLevel: 'live' | 'recent' | 'stale' | 'outdated' | 'unknown';
    /** Speed from API if available, otherwise null */
    speedAvailable: boolean;
    /** Heading calculated from position delta, or null if unavailable */
    headingAvailable: boolean;
    /** The raw trackingMode string from the API */
    trackingMode: string;
  };
}
