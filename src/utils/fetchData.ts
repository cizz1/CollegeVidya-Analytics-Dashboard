export type DashboardPage = "overview" | "trends" | "timing" | "qualification" | "operations";

export type DatePreset = "today" | "yesterday" | "tomorrow" | "7d" | "30d" | "month" | "custom";

export interface DashboardFilters {
  preset: DatePreset;
  timezone: string;
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
}

export interface MetricPoint {
  name: string;
  value: number;
}

export interface DailyPoint {
  name: string;
  totalCalls: number;
  connected: number;
  didNotConnect: number;
  qualified: number;
  uncertain: number;
  notInterested: number;
  connectivityRate: number;
  qualificationRate: number;
  avgTalkTimeSeconds: number | null;
  creditsSpent: number;
}

export interface HourlyPoint {
  hour: number;
  label: string;
  totalCalls: number;
  connected: number;
  didNotConnect: number;
  qualified: number;
  uncertain: number;
  notInterested: number;
  connectivityRate: number;
  qualificationRate: number;
  avgTalkTimeSeconds: number | null;
}

export interface LeadSegment {
  name: string;
  uniqueLeads: number;
  totalCalls: number;
  connected: number;
  qualified: number;
  uncertain: number;
  connectivityRate: number;
  qualificationRate: number;
}

export interface AttemptPerformance {
  attemptNumber: number;
  label: string;
  schedule: string;
  uniqueLeads: number;
  totalCalls: number;
  connected: number;
  qualified: number;
  uncertain: number;
  connectivityRate: number;
  qualificationRate: number;
}

export interface DashboardData {
  meta: {
    generatedAt: string;
    timezone: string;
    requestedRange: {
      startLocal: string;
      endLocal: string;
      startUtc: string;
      endUtc: string;
    };
    globalPeriodStart: string | null;
    globalPeriodEnd: string | null;
    filteredPeriodStart: string | null;
    filteredPeriodEnd: string | null;
    backendSource: string;
  };
  kpis: {
    totalLeadsReceived: number;
    totalLeadsAttempted: number;
    totalCalls: number;
    connectedCalls: number;
    didNotConnectCalls: number;
    notInterestedCalls: number;
    qualifiedLeads: number;
    uncertainLeads: number;
    callbackLeads: number;
    connectivityRate: number;
    qualificationRate: number;
    uncertainRate: number;
    notInterestedRate: number;
    avgTalkTimeSeconds: number | null;
    creditsSpent: number;
    avgQualifiedScore: number;
    highConfidenceQualifiedLeads: number;
    highConfidenceQualifiedRate: number;
  };
  comparisons: {
    previousTotalCalls: number;
    previousConnectedCalls: number;
    previousQualifiedLeads: number;
    previousConnectivityRate: number;
    previousQualificationRate: number;
    totalCallsDeltaPct: number | null;
    connectedDeltaPct: number | null;
    qualifiedDeltaPct: number | null;
  };
  funnel: {
    totalCalls: number;
    connected: number;
    didNotConnect: number;
    notInterested: number;
    uncertain: number;
    qualified: number;
    highConfidenceQualified: number;
  };
  daily: DailyPoint[];
  hourly: HourlyPoint[];
  verdictDistribution: MetricPoint[];
  callOutcomeDistribution: MetricPoint[];
  notInterestedReasons: MetricPoint[];
  uncertainReasons: MetricPoint[];
  retryBuckets: MetricPoint[];
  weeklyConnectivity: { name: string; connected: number; totalCalls: number; rate: number }[];
  bestConnectivityHours: HourlyPoint[];
  highestVolumeHours: HourlyPoint[];
  highestQualificationHours: HourlyPoint[];
  highestUncertainHours: HourlyPoint[];
  leadSegments: LeadSegment[];
  attemptPerformance: AttemptPerformance[];
  operationalMetrics: MetricPoint[];
  savedLeadsImpact: MetricPoint[];
}

export const defaultFilters = (): DashboardFilters => ({
  preset: "30d",
  timezone: "Asia/Kolkata",
  startDate: "",
  endDate: "",
  startTime: "00:00",
  endTime: "23:59",
});

const emptyData: DashboardData = {
  meta: {
    generatedAt: new Date().toISOString(),
    timezone: "Asia/Kolkata",
    requestedRange: {
      startLocal: "",
      endLocal: "",
      startUtc: "",
      endUtc: "",
    },
    globalPeriodStart: null,
    globalPeriodEnd: null,
    filteredPeriodStart: null,
    filteredPeriodEnd: null,
    backendSource: "unavailable",
  },
  kpis: {
    totalLeadsReceived: 0,
    totalLeadsAttempted: 0,
    totalCalls: 0,
    connectedCalls: 0,
    didNotConnectCalls: 0,
    notInterestedCalls: 0,
    qualifiedLeads: 0,
    uncertainLeads: 0,
    callbackLeads: 0,
    connectivityRate: 0,
    qualificationRate: 0,
    uncertainRate: 0,
    notInterestedRate: 0,
    avgTalkTimeSeconds: null,
    creditsSpent: 0,
    avgQualifiedScore: 0,
    highConfidenceQualifiedLeads: 0,
    highConfidenceQualifiedRate: 0,
  },
  comparisons: {
    previousTotalCalls: 0,
    previousConnectedCalls: 0,
    previousQualifiedLeads: 0,
    previousConnectivityRate: 0,
    previousQualificationRate: 0,
    totalCallsDeltaPct: null,
    connectedDeltaPct: null,
    qualifiedDeltaPct: null,
  },
  funnel: {
    totalCalls: 0,
    connected: 0,
    didNotConnect: 0,
    notInterested: 0,
    uncertain: 0,
    qualified: 0,
    highConfidenceQualified: 0,
  },
  daily: [],
  hourly: [],
  verdictDistribution: [],
  callOutcomeDistribution: [],
  notInterestedReasons: [],
  uncertainReasons: [],
  retryBuckets: [],
  weeklyConnectivity: [],
  bestConnectivityHours: [],
  highestVolumeHours: [],
  highestQualificationHours: [],
  highestUncertainHours: [],
  leadSegments: [],
  attemptPerformance: [],
  operationalMetrics: [],
  savedLeadsImpact: [],
};

const BROWSER_CACHE_PREFIX = "cv-dashboard:";
const LIVE_BROWSER_CACHE_TTL_MS = 10 * 60 * 1000;
const HISTORICAL_BROWSER_CACHE_TTL_MS = 24 * 60 * 60 * 1000;

type CachedDashboardData = {
  savedAt: number;
  data: DashboardData;
};

const todayInTimezone = (timezone: string) => {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());

  const get = (type: string) => parts.find((part) => part.type === type)?.value || "";
  return `${get("year")}-${get("month")}-${get("day")}`;
};

const isHistoricalRange = (filters: DashboardFilters) => {
  if (filters.preset === "yesterday") return true;
  if (filters.preset !== "custom") return false;
  const endDate = filters.endDate || filters.startDate;
  return Boolean(endDate && endDate < todayInTimezone(filters.timezone));
};

const cacheConfigForFilters = (filters: DashboardFilters) => {
  const historical = isHistoricalRange(filters);
  return {
    ttlMs: historical ? HISTORICAL_BROWSER_CACHE_TTL_MS : LIVE_BROWSER_CACHE_TTL_MS,
    storageName: historical ? "localStorage" : "sessionStorage",
  } as const;
};

const getStorage = (storageName: "localStorage" | "sessionStorage") => {
  if (typeof window === "undefined") return null;
  return storageName === "localStorage" ? window.localStorage : window.sessionStorage;
};

const getCachedDashboardData = (key: string, ttlMs: number, storageName: "localStorage" | "sessionStorage"): DashboardData | null => {
  if (typeof window === "undefined") return null;

  try {
    const storage = getStorage(storageName);
    if (!storage) return null;
    const raw = storage.getItem(key);
    if (!raw) return null;
    const cached = JSON.parse(raw) as CachedDashboardData;
    if (!cached?.savedAt || Date.now() - cached.savedAt > ttlMs) {
      storage.removeItem(key);
      return null;
    }
    return cached.data;
  } catch {
    return null;
  }
};

const setCachedDashboardData = (key: string, data: DashboardData, storageName: "localStorage" | "sessionStorage") => {
  if (typeof window === "undefined") return;

  try {
    const storage = getStorage(storageName);
    if (!storage) return;
    storage.setItem(
      key,
      JSON.stringify({
        savedAt: Date.now(),
        data,
      } satisfies CachedDashboardData)
    );
  } catch {
    // Storage can fail in private mode or when quota is full; the network path still works.
  }
};

const normalizeDashboardData = (data: Partial<DashboardData>): DashboardData => ({
  ...emptyData,
  ...data,
  meta: {
    ...emptyData.meta,
    ...(data.meta || {}),
    requestedRange: {
      ...emptyData.meta.requestedRange,
      ...(data.meta?.requestedRange || {}),
    },
  },
  kpis: {
    ...emptyData.kpis,
    ...(data.kpis || {}),
  },
  comparisons: {
    ...emptyData.comparisons,
    ...(data.comparisons || {}),
  },
  funnel: {
    ...emptyData.funnel,
    ...(data.funnel || {}),
  },
  daily: data.daily || [],
  hourly: data.hourly || [],
  verdictDistribution: data.verdictDistribution || [],
  callOutcomeDistribution: data.callOutcomeDistribution || [],
  notInterestedReasons: data.notInterestedReasons || [],
  uncertainReasons: data.uncertainReasons || [],
  retryBuckets: data.retryBuckets || [],
  weeklyConnectivity: data.weeklyConnectivity || [],
  bestConnectivityHours: data.bestConnectivityHours || [],
  highestVolumeHours: data.highestVolumeHours || [],
  highestQualificationHours: data.highestQualificationHours || [],
  highestUncertainHours: data.highestUncertainHours || [],
  leadSegments: data.leadSegments || [],
  attemptPerformance: data.attemptPerformance || [],
  operationalMetrics: data.operationalMetrics || [],
  savedLeadsImpact: data.savedLeadsImpact || [],
});

export const fetchDashboardData = async (filters: DashboardFilters): Promise<DashboardData> => {
  const params = new URLSearchParams();
  params.set("preset", filters.preset);
  params.set("timezone", filters.timezone);
  params.set("startTime", filters.startTime);
  params.set("endTime", filters.endTime);
  if (filters.preset === "custom") {
    params.set("startDate", filters.startDate);
    params.set("endDate", filters.endDate);
  }

  const cacheKey = `${BROWSER_CACHE_PREFIX}${params.toString()}`;
  const { ttlMs, storageName } = cacheConfigForFilters(filters);
  const cachedData = getCachedDashboardData(cacheKey, ttlMs, storageName);
  if (cachedData) return normalizeDashboardData(cachedData);

  try {
    const response = await fetch(`/api/dashboard?${params.toString()}`);

    if (!response.ok) {
      throw new Error(`Dashboard API failed with ${response.status}`);
    }

    const data = normalizeDashboardData(await response.json());
    setCachedDashboardData(cacheKey, data, storageName);
    return data;
  } catch (err) {
    console.error("Error fetching live dashboard data", err);
    return normalizeDashboardData(getCachedDashboardData(cacheKey, ttlMs, storageName) || emptyData);
  }
};
