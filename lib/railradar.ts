import { SearchResult, LiveJourney, Station } from '@/types/train';
import { env } from '@/config/env';
import { searchLocalTrains, TRAINS_DB, TrainEntry } from '@/lib/trains-db';

const RR_BASE = 'https://api.railradar.in/v1';

function rrHeaders() {
  return {
    Authorization: `Bearer ${env.RAILRADAR_API_KEY}`,
    'Content-Type': 'application/json',
  };
}

function extractErrorMessage(json: Record<string, unknown>): string {
  if (!json) return 'Unknown error';
  const error = json.error as Record<string, unknown> | string | undefined;
  if (error && typeof error === 'object' && 'message' in error) {
    const code = (error as Record<string, unknown>).code;
    return `${code}: ${(error as Record<string, unknown>).message}`;
  }
  if (typeof error === 'string') return error;
  if (json.message) return String(json.message);
  return 'Unknown API error';
}

/**
 * Fetch wrapper with a 4-second timeout to prevent Node undici connect timeouts.
 */
async function rrFetch(url: string, options?: RequestInit): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 4000);

  try {
    const res = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: { ...rrHeaders(), ...(options?.headers || {}) },
    });
    return res;
  } finally {
    clearTimeout(timeoutId);
  }
}

// ─── Type helpers for RailRadar raw API shapes ─────────────────────────────

interface RRStation {
  code: string;
  name: string;
  lat: number;
  lng: number;
}

interface RRTrainDetail {
  number: string;
  name: string;
  type: string;
  category: string;
  source: RRStation;
  destination: RRStation;
  runDays: string[];
  distance: number;
  duration: number;
  avgSpeed: number;
}

interface RRRouteStop {
  sequence: number;
  station?: RRStation;
  stationCode?: string;
  stationName?: string;
  isHalt: boolean;
  platform?: string;
  arrival?: string;
  departure?: string;
  scheduledArrival?: string;
  scheduledDeparture?: string;
  actualArrival?: string;
  actualDeparture?: string;
  delayArrival?: number;
  delayDeparture?: number;
  distance: number;
  status?: string;
}

interface RRLiveResponse {
  trainNumber: string;
  trainName: string;
  startDate: string;
  lastUpdatedAt: string;
  status: string;
  train: RRTrainDetail;
  isLive: boolean;
  trackingMode: string;
  currentLocation?: {
    stationCode: string;
    sequence: number;
    status: string;
    isHalt: boolean;
    isActualPosition: boolean;
    lat?: number;
    lng?: number;
  };
  nextHalt?: {
    stationCode: string;
    stationName: string;
    sequence: number;
    distance: number;
  };
  delayMinutes: number;
  route: RRRouteStop[];
}

function normaliseStatus(status: string): LiveJourney['status'] {
  switch (status) {
    case 'running': return 'running';
    case 'not-started': return 'not_started';
    case 'completed': return 'completed';
    case 'cancelled': return 'cancelled';
    default: return 'running';
  }
}

function normaliseRouteStop(stop: RRRouteStop, stationMap: Map<string, RRStation>): Station {
  const stCode = stop.stationCode || stop.station?.code || '';
  const stInfo = stationMap.get(stCode) || stop.station;

  const parseTime = (val?: string): string | undefined => {
    if (!val) return undefined;
    if (val.includes('T')) {
      return new Date(val).toLocaleTimeString('en-IN', {
        hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'Asia/Kolkata',
      });
    }
    return val;
  };

  let stStatus: Station['status'] = 'upcoming';
  const raw = (stop.status || '').toLowerCase();
  if (raw === 'departed' || raw === 'passed' || raw === 'arrived') stStatus = 'passed';
  else if (raw === 'at-station') stStatus = 'current';
  else stStatus = 'upcoming';

  return {
    code: stCode,
    name: stop.stationName || stop.station?.name || stCode,
    lat: stInfo?.lat ?? 0,
    lng: stInfo?.lng ?? 0,
    scheduledArrival: parseTime(stop.scheduledArrival || stop.arrival) || '--:--',
    scheduledDeparture: parseTime(stop.scheduledDeparture || stop.departure) || '--:--',
    actualArrival: parseTime(stop.actualArrival) || undefined,
    actualDeparture: parseTime(stop.actualDeparture) || undefined,
    delayMinutes: stop.delayArrival ?? stop.delayDeparture ?? 0,
    distanceKm: Math.round(stop.distance || 0),
    status: stStatus,
    platform: stop.platform,
  };
}

function interpolatePolyline(coords: [number, number][], pct: number): [number, number] {
  if (!coords || coords.length === 0) return [77.2194, 28.643];
  if (coords.length === 1 || pct <= 0) return coords[0];
  if (pct >= 100) return coords[coords.length - 1];

  const distances: number[] = [0];
  let totalDist = 0;
  for (let i = 1; i < coords.length; i++) {
    const [lng1, lat1] = coords[i - 1];
    const [lng2, lat2] = coords[i];
    const dx = lng2 - lng1;
    const dy = lat2 - lat1;
    const dist = Math.sqrt(dx * dx + dy * dy);
    totalDist += dist;
    distances.push(totalDist);
  }

  if (totalDist === 0) return coords[0];

  const targetDist = (pct / 100) * totalDist;
  for (let i = 1; i < coords.length; i++) {
    if (distances[i] >= targetDist) {
      const segStartDist = distances[i - 1];
      const segLen = distances[i] - segStartDist;
      const t = segLen > 0 ? (targetDist - segStartDist) / segLen : 0;
      const [lng1, lat1] = coords[i - 1];
      const [lng2, lat2] = coords[i];
      return [lng1 + t * (lng2 - lng1), lat1 + t * (lat2 - lat1)];
    }
  }
  return coords[coords.length - 1];
}

// ─── Haversine distance between two lat/lng points (meters) ────────────────

function haversineDistanceMeters(
  lat1: number, lng1: number,
  lat2: number, lng2: number,
): number {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ─── GPS-based station status calculator ────────────────────────────────────
// This is the SINGLE SOURCE OF TRUTH for station status.
// It uses actual GPS position + route-ordered stations to determine:
//   - which stations have been passed
//   - which station the train is currently at (or between)
//   - which stations are upcoming
//
// CRITICAL: Schedule timing is NEVER used here.
// The schedule is reference info only — GPS position determines all status.

interface StationStatusResult {
  previousStation: Station | undefined;
  currentStation: Station | undefined;
  nextStation: Station | undefined;
  positionState: 'AT_STATION' | 'BETWEEN_STATIONS' | 'PASSED_STATION' | 'UNKNOWN';
}

function calculateStationStatusFromGPS(
  trainLat: number,
  trainLng: number,
  stations: Station[],
): StationStatusResult {
  if (stations.length === 0) {
    return { previousStation: undefined, currentStation: undefined, nextStation: undefined, positionState: 'UNKNOWN' };
  }

  // Ensure stations are sorted by distanceKm (route order)
  const sorted = [...stations].sort((a, b) => a.distanceKm - b.distanceKm);

  // AT_STATION if within 1 km of any station
  const AT_STATION_THRESHOLD_M = 1000;
  for (const st of sorted) {
    if (!st.lat || !st.lng) continue;
    const dist = haversineDistanceMeters(trainLat, trainLng, st.lat, st.lng);
    if (dist <= AT_STATION_THRESHOLD_M) {
      // Everything before this station = passed, everything after = upcoming
      const idx = sorted.indexOf(st);
      const passedStations = sorted.slice(0, idx);
      const upcomingStations = sorted.slice(idx + 1);
      return {
        previousStation: passedStations.length > 0 ? passedStations[passedStations.length - 1] : undefined,
        currentStation: st,
        nextStation: upcomingStations.length > 0 ? upcomingStations[0] : undefined,
        positionState: 'AT_STATION',
      };
    }
  }

  // BETWEEN_STATIONS: find the two consecutive stations that bracket the train position
  for (let i = 0; i < sorted.length - 1; i++) {
    const stA = sorted[i];
    const stB = sorted[i + 1];
    if (!stA.lat || !stA.lng || !stB.lat || !stB.lng) continue;

    // Project train position onto the line segment between stA and stB
    const dLng = stB.lng - stA.lng;
    const dLat = stB.lat - stA.lat;
    const segLenSq = dLng * dLng + dLat * dLat;
    if (segLenSq === 0) continue;

    const t = Math.max(0, Math.min(1,
      ((trainLng - stA.lng) * dLng + (trainLat - stA.lat) * dLat) / segLenSq
    ));
    const projLng = stA.lng + t * dLng;
    const projLat = stA.lat + t * dLat;
    const distToLine = haversineDistanceMeters(trainLat, trainLng, projLat, projLng);

    // Within 1.5 km of the route line between these two stations
    if (distToLine <= 1500) {
      const passedStations = sorted.slice(0, i + 1);
      const upcomingStations = sorted.slice(i + 2);
      return {
        previousStation: stA,
        currentStation: undefined,
        nextStation: stB,
        positionState: 'BETWEEN_STATIONS',
      };
    }
  }

  // PASSED_STATION or UNKNOWN: train is past all stations or before first station
  const firstStation = sorted[0];
  const lastStation = sorted[sorted.length - 1];

  if (firstStation.lat && firstStation.lng) {
    const distToFirst = haversineDistanceMeters(trainLat, trainLng, firstStation.lat, firstStation.lng);
    // More than 2 km before first station → hasn't started
    if (distToFirst > 2000) {
      return { previousStation: undefined, currentStation: undefined, nextStation: firstStation, positionState: 'UNKNOWN' };
    }
  }

  if (lastStation.lat && lastStation.lng) {
    const distToLast = haversineDistanceMeters(trainLat, trainLng, lastStation.lat, lastStation.lng);
    // More than 2 km past last station → journey complete
    if (distToLast > 2000) {
      return { previousStation: lastStation, currentStation: undefined, nextStation: undefined, positionState: 'PASSED_STATION' };
    }
  }

  return { previousStation: undefined, currentStation: undefined, nextStation: sorted[0], positionState: 'UNKNOWN' };
}

function normaliseLiveResponse(raw: RRLiveResponse, routeGeo?: [number, number][]): LiveJourney {
  const train = raw.train;

  const stationMap = new Map<string, RRStation>();
  if (train.source) stationMap.set(train.source.code, train.source);
  if (train.destination) stationMap.set(train.destination.code, train.destination);

  const relevantStops = raw.route.filter((s) => s.isHalt || s.stationCode || s.station?.code);
  const totalDistanceKm = train.distance || Math.round(relevantStops[relevantStops.length - 1]?.distance || 0);

  // ── Step 1: Build stations list (schedule + coordinates) ──────────────
  const stations = relevantStops.map((s) => {
    const st = normaliseRouteStop(s, stationMap);
    if ((!st.lat || !st.lng) && routeGeo && routeGeo.length >= 2 && totalDistanceKm > 0) {
      const pct = Math.min(100, Math.max(0, (st.distanceKm / totalDistanceKm) * 100));
      const [lng, lat] = interpolatePolyline(routeGeo, pct);
      st.lat = lat;
      st.lng = lng;
    }
    return st;
  });

  // ── Step 2: Determine train position from API data ───────────────────
  // Priority:
  //   1. Raw GPS coordinates (raw.currentLocation.lat/lng)
  //   2. API station code position (raw.currentLocation.stationCode → station coords)
  //   3. Route geometry interpolation (last resort)
  //   4. Origin station (absolute fallback)
  let trainLat = raw.currentLocation?.lat;
  let trainLng = raw.currentLocation?.lng;
  let positionSource: 'gps' | 'station' | 'interpolated' | 'fallback' = 'fallback';
  const isActualPosition = raw.currentLocation?.isActualPosition ?? false;

  if (trainLat && trainLng) {
    // Have actual coordinates from API — trust them
    positionSource = isActualPosition ? 'gps' : 'station';
  } else {
    // No coordinates from API — find position from station code
    const apiStationCode = raw.currentLocation?.stationCode;
    const apiStation = apiStationCode ? stations.find((s) => s.code === apiStationCode) : undefined;

    if (apiStation && apiStation.lat && apiStation.lng) {
      // Use station coordinates as position (station-based, not GPS)
      trainLat = apiStation.lat;
      trainLng = apiStation.lng;
      positionSource = 'station';
    } else {
      // Try route geometry interpolation (NOT schedule — only geometry)
      const apiSequence = raw.currentLocation?.sequence;
      if (apiSequence && apiSequence > 0 && apiSequence <= stations.length) {
        const st = stations[apiSequence - 1];
        if (st.lat && st.lng) {
          trainLat = st.lat;
          trainLng = st.lng;
          positionSource = 'station';
        }
      }

      if (!trainLat || !trainLng) {
        // Route geometry interpolation based on completion percentage
        const coveredKm = raw.route
          .filter((s) => s.status?.toLowerCase() === 'departed' || s.status?.toLowerCase() === 'passed')
          .reduce((max, s) => Math.max(max, s.distance || 0), 0);
        const completion = totalDistanceKm > 0 ? (coveredKm / totalDistanceKm) * 100 : 0;

        if (routeGeo && routeGeo.length >= 2) {
          const [lng, lat] = interpolatePolyline(routeGeo, completion);
          trainLng = lng;
          trainLat = lat;
          positionSource = 'interpolated';
        } else if (train.source.lat && train.source.lng) {
          trainLat = train.source.lat;
          trainLng = train.source.lng;
          positionSource = 'fallback';
        }
      }
    }
  }

  // ── Step 3: Calculate station statuses from GPS position ─────────────
  // CRITICAL: This is the SINGLE SOURCE OF TRUTH.
  // Schedule timing is NEVER used to determine current/passed/next station.
  // Only the actual GPS position relative to route-ordered stations matters.
  let previousStation: Station | undefined;
  let currentStation: Station | undefined;
  let nextStation: Station | undefined;
  let positionState: 'AT_STATION' | 'BETWEEN_STATIONS' | 'PASSED_STATION' | 'UNKNOWN' = 'UNKNOWN';

  if (trainLat && trainLng) {
    // GPS-based station calculation — the correct approach
    const gpsResult = calculateStationStatusFromGPS(trainLat, trainLng, stations);
    previousStation = gpsResult.previousStation;
    currentStation = gpsResult.currentStation;
    nextStation = gpsResult.nextStation;
    positionState = gpsResult.positionState;
  } else {
    // No position available at all — use API's reference as last resort
    // Do NOT use schedule timing to determine station
    const apiStationCode = raw.currentLocation?.stationCode;
    if (apiStationCode) {
      const idx = stations.findIndex((s) => s.code === apiStationCode);
      if (idx >= 0) {
        currentStation = stations[idx];
        previousStation = idx > 0 ? stations[idx - 1] : undefined;
        nextStation = idx < stations.length - 1 ? stations[idx + 1] : undefined;
        positionState = 'AT_STATION';
      }
    }

    // If still nothing, next station is the first one
    if (!currentStation && !nextStation && stations.length > 0) {
      nextStation = stations[0];
    }
  }

  // ── Step 4: Recalculate station statuses for the stations array ──────
  // Override the schedule-based statuses with GPS-derived statuses
  if (trainLat && trainLng) {
    for (const st of stations) {
      if (!st.lat || !st.lng) continue;
      const distMeters = haversineDistanceMeters(trainLat, trainLng, st.lat, st.lng);
      if (distMeters <= 1000) {
        // Within 1 km = current
        st.status = 'current';
      } else if (currentStation) {
        // Train is at some station — everything before = passed, after = upcoming
        const currentIdx = stations.indexOf(currentStation);
        const thisIdx = stations.indexOf(st);
        if (thisIdx < currentIdx) st.status = 'passed';
        else if (thisIdx > currentIdx) st.status = 'upcoming';
      } else if (previousStation && nextStation) {
        // Train is between stations
        const prevIdx = stations.indexOf(previousStation);
        const nextIdx = stations.indexOf(nextStation);
        const thisIdx = stations.indexOf(st);
        if (thisIdx <= prevIdx) st.status = 'passed';
        else if (thisIdx >= nextIdx) st.status = 'upcoming';
      }
    }
  }

  // ── Step 5: Calculate distance, completion, heading ──────────────────
  const coveredKm = currentStation?.distanceKm || previousStation?.distanceKm || 0;
  const remainingKm = Math.max(0, totalDistanceKm - coveredKm);
  const completion = totalDistanceKm > 0 ? Math.min(100, (coveredKm / totalDistanceKm) * 100) : 0;

  let heading = 0;
  let headingAvailable = false;
  if (previousStation && previousStation.lat && previousStation.lng && trainLat && trainLng) {
    const dLng = ((trainLng - previousStation.lng) * Math.PI) / 180;
    const lat1 = (previousStation.lat * Math.PI) / 180;
    const lat2 = (trainLat * Math.PI) / 180;
    const y = Math.sin(dLng) * Math.cos(lat2);
    const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);
    heading = ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
    headingAvailable = true;
  }

  // ── Speed: NOT faking it ────────────────────────────────────────────
  // The RailRadar API does NOT provide live speed in its type definition.
  // train.avgSpeed is the train's profile average, NOT current speed.
  // We use 0 to indicate "speed not available" rather than showing fake data.
  const liveSpeed = 0; // API does not provide live speed
  const speedAvailable = false;

  // ── Freshness calculation ───────────────────────────────────────────
  const lastUpdatedIso = raw.lastUpdatedAt || new Date().toISOString();
  const lastUpdatedMs = new Date(lastUpdatedIso).getTime();
  const dataAgeSeconds = Math.max(0, Math.floor((Date.now() - lastUpdatedMs) / 1000));

  let freshnessLevel: LiveJourney['freshness']['freshnessLevel'] = 'unknown';
  if (dataAgeSeconds <= 60) freshnessLevel = 'live';
  else if (dataAgeSeconds <= 180) freshnessLevel = 'recent';
  else if (dataAgeSeconds <= 300) freshnessLevel = 'stale';
  else freshnessLevel = 'outdated';

  const isLive = raw.isLive ?? (raw.status === 'running');

  // Guarantee lat/lng are numbers for the type
  const finalLat = trainLat ?? train.source.lat ?? 28.643;
  const finalLng = trainLng ?? train.source.lng ?? 77.2194;

  const currentLocation: LiveJourney['currentLocation'] = {
    lat: finalLat,
    lng: finalLng,
    heading,
    speedKmh: liveSpeed,
    isMoving: raw.status === 'running',
  };

  // ── ETA: from nextStation ──────────────────────────────────────────
  const etaStr = nextStation?.scheduledArrival
    ? `${nextStation.name} at ${nextStation.scheduledArrival}`
    : 'Calculating...';

  // ── Dev logging ─────────────────────────────────────────────────────
  if (process.env.NODE_ENV === 'development') {
    console.groupCollapsed(`%c[RailRadar] Train #${raw.trainNumber} — RAW vs NORMALIZED`, 'color: #0ea5e9; font-weight: bold');
    console.log('RAW API:', {
      currentLocation: raw.currentLocation,
      isLive: raw.isLive,
      status: raw.status,
      trackingMode: raw.trackingMode,
      lastUpdatedAt: raw.lastUpdatedAt,
      delayMinutes: raw.delayMinutes,
    });
    console.log('NORMALIZED position:', {
      lat: finalLat,
      lng: finalLng,
      source: positionSource,
      isActualPosition,
      dataAgeSeconds,
      freshnessLevel,
    });
    console.log('NORMALIZED stations:', {
      positionState,
      previousStation: previousStation?.name,
      currentStation: currentStation?.name,
      nextStation: nextStation?.name,
      apiProvidedCurrentCode: raw.currentLocation?.stationCode,
    });
    console.log('Station statuses (after GPS recalculation):', stations.map((s) => ({
      code: s.code,
      name: s.name,
      status: s.status,
      distKm: s.distanceKm,
    })));
    console.groupEnd();
  }

  return {
    trainId: raw.trainNumber,
    number: raw.trainNumber,
    name: raw.trainName,
    origin: { code: train.source.code, name: train.source.name },
    destination: { code: train.destination.code, name: train.destination.name },
    currentLocation,
    status: normaliseStatus(raw.status),
    delayMinutes: raw.delayMinutes || 0,
    speedKmh: liveSpeed,
    distanceCoveredKm: coveredKm,
    remainingDistanceKm: remainingKm,
    totalDistanceKm,
    completionPercentage: Math.round(completion * 10) / 10,
    lastUpdated: lastUpdatedIso,
    ETA: etaStr,
    previousStation,
    currentStation,
    nextStation,
    stations,
    routeGeometry: routeGeo,
    positionState,
    freshness: {
      isLive,
      isActualPosition,
      positionSource,
      dataAgeSeconds,
      freshnessLevel,
      speedAvailable,
      headingAvailable,
      trackingMode: raw.trackingMode || 'unknown',
    },
  };
}

async function fetchRouteGeometry(trainNumber: string): Promise<[number, number][] | undefined> {
  try {
    const res = await rrFetch(`${RR_BASE}/trains/${trainNumber}/route`);
    if (!res.ok) return undefined;
    const json = await res.json();
    if (!json.success) return undefined;
    const coords: [number, number][] | undefined = json?.data?.geojson?.geometry?.coordinates;
    if (coords && coords.length > 200) {
      const step = Math.ceil(coords.length / 200);
      return coords.filter((_, i) => i % step === 0);
    }
    return coords;
  } catch {
    return undefined;
  }
}

// ─── Fallback Journey Generator ──────────────────────────────────────────

function generateFallbackJourney(trainNumber: string): LiveJourney | null {
  const train = TRAINS_DB.find((t) => t.number === trainNumber) || {
    number: trainNumber,
    name: `Express Train #${trainNumber}`,
    from: 'Mumbai Central',
    fromCode: 'MMCT',
    to: 'New Delhi',
    toCode: 'NDLS',
  };

  const stations: Station[] = [
    {
      code: train.fromCode,
      name: train.from,
      lat: 18.9696,
      lng: 72.8193,
      scheduledArrival: '17:00',
      scheduledDeparture: '17:00',
      actualArrival: '17:00',
      actualDeparture: '17:00',
      delayMinutes: 0,
      distanceKm: 0,
      status: 'passed',
      platform: '1',
    },
    {
      code: 'ST',
      name: 'Surat',
      lat: 21.2049,
      lng: 72.8406,
      scheduledArrival: '20:10',
      scheduledDeparture: '20:15',
      actualArrival: '20:14',
      actualDeparture: '20:19',
      delayMinutes: 4,
      distanceKm: 263,
      status: 'passed',
      platform: '1',
    },
    {
      code: 'KOTA',
      name: 'Kota Junction',
      lat: 25.2138,
      lng: 75.8648,
      scheduledArrival: '03:15',
      scheduledDeparture: '03:25',
      actualArrival: '03:23',
      actualDeparture: '03:33',
      delayMinutes: 8,
      distanceKm: 920,
      status: 'current',
      platform: '1',
    },
    {
      code: train.toCode,
      name: train.to,
      lat: 28.643,
      lng: 77.2194,
      scheduledArrival: '08:32',
      scheduledDeparture: '08:32',
      delayMinutes: 8,
      distanceKm: 1384,
      status: 'upcoming',
      platform: '1',
    },
  ];

  return {
    trainId: train.number,
    number: train.number,
    name: train.name,
    origin: { code: train.fromCode, name: train.from },
    destination: { code: train.toCode, name: train.to },
    currentLocation: {
      lat: 25.2138,
      lng: 75.8648,
      heading: 0,
      speedKmh: 0,
      isMoving: true,
    },
    status: 'running',
    delayMinutes: 8,
    speedKmh: 0,
    distanceCoveredKm: 920,
    remainingDistanceKm: 464,
    totalDistanceKm: 1384,
    completionPercentage: 66.5,
    lastUpdated: new Date().toISOString(),
    ETA: 'Kota Junction at 03:15',
    previousStation: stations[1],
    currentStation: stations[2],
    nextStation: stations[3],
    stations,
    routeGeometry: [
      [72.8193, 18.9696],
      [72.8406, 21.2049],
      [75.8648, 25.2138],
      [77.2194, 28.643],
    ],
    freshness: {
      isLive: false,
      isActualPosition: false,
      positionSource: 'fallback',
      dataAgeSeconds: 0,
      freshnessLevel: 'outdated',
      speedAvailable: false,
      headingAvailable: false,
      trackingMode: 'fallback',
    },
  };
}

// ─── Public API ────────────────────────────────────────────────────────────

export async function searchTrains(query: string): Promise<SearchResult[]> {
  const q = query.trim();
  if (!q) {
    return searchLocalTrains('').map((t) => ({
      id: t.number,
      number: t.number,
      name: t.name,
      origin: { code: t.fromCode, name: t.from },
      destination: { code: t.toCode, name: t.to },
    }));
  }

  try {
    const res = await rrFetch(`${RR_BASE}/lookup/trains?q=${encodeURIComponent(q)}`);
    if (!res.ok) {
      const json = await res.json().catch(() => ({}));
      throw new Error(extractErrorMessage(json) || `Lookup failed: ${res.status}`);
    }

    const json = await res.json();
    if (!json.success) throw new Error(extractErrorMessage(json));

    const data: Record<string, string> = json?.data || {};
    return Object.entries(data)
      .slice(0, 15)
      .map(([number, name]) => ({
        id: number,
        number,
        name,
        origin: { code: '', name: '' },
        destination: { code: '', name: '' },
      }));
  } catch {
    console.warn('RailRadar lookup API fetch failed, using local DB fallback');
    return searchLocalTrains(q).map((t) => ({
      id: t.number,
      number: t.number,
      name: t.name,
      origin: { code: t.fromCode, name: t.from },
      destination: { code: t.toCode, name: t.to },
    }));
  }
}

export async function getLiveJourney(trainNumber: string): Promise<LiveJourney | null> {
  try {
    const [liveRes, routeGeo] = await Promise.all([
      rrFetch(`${RR_BASE}/trains/${trainNumber}/live`),
      fetchRouteGeometry(trainNumber),
    ]);

    const json = await liveRes.json().catch(() => null);

    if (!liveRes.ok) {
      if (liveRes.status === 404) return null;
      const msg = extractErrorMessage(json);
      if (liveRes.status === 429 || json?.error?.code === 'TOO_MANY_REQUESTS') {
        throw new Error(`QUOTA_EXCEEDED: ${msg}`);
      }
      throw new Error(`RailRadar API error (${liveRes.status}): ${msg}`);
    }

    if (!json?.success || !json?.data) {
      const msg = extractErrorMessage(json);
      if (json?.error?.code === 'TOO_MANY_REQUESTS') {
        throw new Error(`QUOTA_EXCEEDED: ${msg}`);
      }
      return null;
    }

    return normaliseLiveResponse(json.data as RRLiveResponse, routeGeo);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    if (message.includes('QUOTA_EXCEEDED')) {
      throw err;
    }
    console.warn(`[getLiveJourney] RailRadar API network error for train ${trainNumber}:`, message);
    // Return generated fallback journey if server can't reach RailRadar API
    return generateFallbackJourney(trainNumber);
  }
}
