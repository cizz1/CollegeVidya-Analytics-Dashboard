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
  agentTelemetry: MetricPoint[];
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
  agentTelemetry: [],
  savedLeadsImpact: [],
};

export const fetchDashboardData = async (filters: DashboardFilters): Promise<DashboardData> => {
  try {
    const params = new URLSearchParams();
    params.set("preset", filters.preset);
    params.set("timezone", filters.timezone);
    params.set("startTime", filters.startTime);
    params.set("endTime", filters.endTime);
    if (filters.preset === "custom") {
      params.set("startDate", filters.startDate);
      params.set("endDate", filters.endDate);
    }

    const response = await fetch(`/api/dashboard?${params.toString()}`);

    if (!response.ok) {
      throw new Error(`Dashboard API failed with ${response.status}`);
    }

    return await response.json();
  } catch (err) {
    console.error("Error fetching live dashboard data", err);
    return emptyData;
  }
};
