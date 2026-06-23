import { NextRequest, NextResponse } from "next/server";
import type { DashboardData, DatePreset, DailyPoint, HourlyPoint, MetricPoint } from "@/utils/fetchData";

export const dynamic = "force-dynamic";

type JsonRecord = Record<string, unknown>;

type AnalyticsRecord = {
  call_id?: string;
  analytics?: JsonRecord | null;
  token_cost_summary?: JsonRecord | null;
  phone_number?: string | null;
  campaign_id?: string | null;
  contact_id?: string | null;
  call_started_at?: string | null;
  call_ended_at?: string | null;
  duration_seconds?: number | null;
  billing_data?: JsonRecord | null;
  provider_call_status?: JsonRecord | null;
  created_at?: string | null;
};

type CampaignRecord = {
  total_contacts?: number | null;
  created_at?: string | null;
};

type RangeConfig = {
  timezone: string;
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
  startUtcMs: number;
  endUtcMs: number;
  previousStartUtcMs: number;
  previousEndUtcMs: number;
};

type AggregateResult = {
  kpis: DashboardData["kpis"];
  funnel: DashboardData["funnel"];
  daily: DailyPoint[];
  hourly: HourlyPoint[];
  verdictDistribution: MetricPoint[];
  callOutcomeDistribution: MetricPoint[];
  notInterestedReasons: MetricPoint[];
  uncertainReasons: MetricPoint[];
  retryBuckets: MetricPoint[];
  weeklyConnectivity: DashboardData["weeklyConnectivity"];
  bestConnectivityHours: HourlyPoint[];
  highestVolumeHours: HourlyPoint[];
  agentTelemetry: MetricPoint[];
  savedLeadsImpact: MetricPoint[];
  filteredPeriodStart: string | null;
  filteredPeriodEnd: string | null;
};

const USER_UID =
  process.env.COLLEGE_VIDYA_USER_UID || "091cf311-6949-42fd-b1d2-de3bb4b3bf48";
const BACKEND_BASE_URL =
  process.env.COLLEGE_VIDYA_BACKEND_BASE_URL || "https://service.monade.ai/db_services";
const RAW_CACHE_TTL_MS = 60 * 60 * 1000;
const LIVE_BROWSER_CACHE_SECONDS = 10 * 60;
const LIVE_RESPONSE_CACHE_SECONDS = 10 * 60;
const LIVE_RESPONSE_STALE_SECONDS = 60 * 60;
const HISTORICAL_BROWSER_CACHE_SECONDS = 60 * 60;
const HISTORICAL_RESPONSE_CACHE_SECONDS = 12 * 60 * 60;
const HISTORICAL_RESPONSE_STALE_SECONDS = 7 * 24 * 60 * 60;

let rawCache:
  | {
      expiresAt: number;
      analyticsPayload: unknown;
      campaignPayload: unknown;
    }
  | null = null;
let rawCachePromise: Promise<{ analyticsPayload: unknown; campaignPayload: unknown }> | null = null;

const asRecord = (value: unknown): JsonRecord =>
  value && typeof value === "object" && !Array.isArray(value) ? (value as JsonRecord) : {};

const asNumber = (value: unknown): number => {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
};

const asString = (value: unknown): string => (typeof value === "string" ? value.trim() : "");

const percent = (part: number, total: number) => (total > 0 ? Math.round((part / total) * 1000) / 10 : 0);

const deltaPct = (current: number, previous: number) =>
  previous > 0 ? Math.round(((current - previous) / previous) * 1000) / 10 : null;

const labelize = (value: string) =>
  value
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());

const pad = (value: number) => String(value).padStart(2, "0");

const dateFromParts = (year: number, month: number, day: number) => `${year}-${pad(month)}-${pad(day)}`;

const parseDate = (value: string) => {
  const [year, month, day] = value.split("-").map(Number);
  return { year, month, day };
};

const addDays = (date: string, days: number) => {
  const { year, month, day } = parseDate(date);
  const utc = new Date(Date.UTC(year, month - 1, day + days));
  return dateFromParts(utc.getUTCFullYear(), utc.getUTCMonth() + 1, utc.getUTCDate());
};

const monthStart = (date: string) => {
  const { year, month } = parseDate(date);
  return dateFromParts(year, month, 1);
};

const minutesFromTime = (value: string) => {
  const [hour, minute] = value.split(":").map(Number);
  if (!Number.isFinite(hour) || !Number.isFinite(minute)) return 0;
  return Math.max(0, Math.min(1439, hour * 60 + minute));
};

const formatInTimezone = (date: Date, timezone: string) => {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);

  const get = (type: string) => parts.find((part) => part.type === type)?.value || "00";
  return {
    year: Number(get("year")),
    month: Number(get("month")),
    day: Number(get("day")),
    hour: Number(get("hour")),
    minute: Number(get("minute")),
    date: `${get("year")}-${get("month")}-${get("day")}`,
    time: `${get("hour")}:${get("minute")}`,
  };
};

const timezoneOffsetMs = (date: Date, timezone: string) => {
  const zoned = formatInTimezone(date, timezone);
  const asUtc = Date.UTC(zoned.year, zoned.month - 1, zoned.day, zoned.hour, zoned.minute);
  return asUtc - date.getTime();
};

const zonedLocalToUtcMs = (date: string, time: string, timezone: string) => {
  const { year, month, day } = parseDate(date);
  const [hour, minute] = time.split(":").map(Number);
  const guessedUtc = Date.UTC(year, month - 1, day, hour || 0, minute || 0);
  const offset = timezoneOffsetMs(new Date(guessedUtc), timezone);
  const correctedUtc = guessedUtc - offset;
  const correctedOffset = timezoneOffsetMs(new Date(correctedUtc), timezone);
  return guessedUtc - correctedOffset;
};

const localWeekKey = (recordDate: Date, timezone: string) => {
  const local = formatInTimezone(recordDate, timezone);
  const utc = new Date(Date.UTC(local.year, local.month - 1, local.day));
  const day = utc.getUTCDay() || 7;
  utc.setUTCDate(utc.getUTCDate() - day + 1);
  return utc.toISOString().slice(0, 10);
};

const normalizePreset = (value: string | null): DatePreset => {
  const allowed = new Set(["today", "yesterday", "tomorrow", "7d", "30d", "month", "custom"]);
  return allowed.has(value || "") ? (value as DatePreset) : "30d";
};

const buildRange = (request: NextRequest): RangeConfig => {
  const params = request.nextUrl.searchParams;
  const timezone = params.get("timezone") || "Asia/Kolkata";
  const preset = normalizePreset(params.get("preset"));
  const nowLocal = formatInTimezone(new Date(), timezone).date;
  const startTime = params.get("startTime") || "00:00";
  const endTime = params.get("endTime") || "23:59";

  let startDate = nowLocal;
  let endDate = nowLocal;

  if (preset === "yesterday") {
    startDate = addDays(nowLocal, -1);
    endDate = startDate;
  } else if (preset === "tomorrow") {
    startDate = addDays(nowLocal, 1);
    endDate = startDate;
  } else if (preset === "7d") {
    startDate = addDays(nowLocal, -6);
  } else if (preset === "30d") {
    startDate = addDays(nowLocal, -29);
  } else if (preset === "month") {
    startDate = monthStart(nowLocal);
  } else if (preset === "custom") {
    startDate = params.get("startDate") || nowLocal;
    endDate = params.get("endDate") || startDate;
  }

  if (startDate > endDate) {
    [startDate, endDate] = [endDate, startDate];
  }

  const startUtcMs = zonedLocalToUtcMs(startDate, "00:00", timezone);
  const endUtcMs = zonedLocalToUtcMs(addDays(endDate, 1), "00:00", timezone) - 1;
  const periodMs = endUtcMs - startUtcMs + 1;

  return {
    timezone,
    startDate,
    endDate,
    startTime,
    endTime,
    startUtcMs,
    endUtcMs,
    previousStartUtcMs: startUtcMs - periodMs,
    previousEndUtcMs: startUtcMs - 1,
  };
};

const isHistoricalRange = (range: RangeConfig) => {
  const today = formatInTimezone(new Date(), range.timezone).date;
  return range.endDate < today;
};

const cacheHeaderForRange = (range: RangeConfig) => {
  const historical = isHistoricalRange(range);
  const browserCache = historical ? HISTORICAL_BROWSER_CACHE_SECONDS : LIVE_BROWSER_CACHE_SECONDS;
  const cdnCache = historical ? HISTORICAL_RESPONSE_CACHE_SECONDS : LIVE_RESPONSE_CACHE_SECONDS;
  const stale = historical ? HISTORICAL_RESPONSE_STALE_SECONDS : LIVE_RESPONSE_STALE_SECONDS;
  return `public, max-age=${browserCache}, s-maxage=${cdnCache}, stale-while-revalidate=${stale}`;
};

const getRecordMs = (record: AnalyticsRecord) => {
  const raw = record.call_started_at || record.created_at;
  if (!raw) return null;
  const ms = new Date(raw).getTime();
  return Number.isFinite(ms) ? ms : null;
};

const matchesTimeWindow = (record: AnalyticsRecord, range: RangeConfig) => {
  const ms = getRecordMs(record);
  if (ms === null) return false;
  const local = formatInTimezone(new Date(ms), range.timezone);
  const minutes = local.hour * 60 + local.minute;
  const start = minutesFromTime(range.startTime);
  const end = minutesFromTime(range.endTime);
  return start <= end ? minutes >= start && minutes <= end : minutes >= start || minutes <= end;
};

const recordsInWindow = (records: AnalyticsRecord[], startMs: number, endMs: number, range: RangeConfig) =>
  records.filter((record) => {
    const ms = getRecordMs(record);
    return ms !== null && ms >= startMs && ms <= endMs && matchesTimeWindow(record, range);
  });

const normalizeVerdict = (record: AnalyticsRecord) => {
  const analytics = asRecord(record.analytics);
  const verdict = asString(analytics.verdict).toLowerCase().replace(/\s+/g, "_");
  const callStatus = asString(analytics.call_status).toLowerCase().replace(/\s+/g, "_");
  const providerStatus = asString(asRecord(record.provider_call_status).status).toLowerCase().replace(/\s+/g, "_");

  if (verdict.includes("not_interested")) return "notInterested";
  if (verdict.includes("qualified") || verdict === "interested") return "qualified";
  if (verdict === "callback") return "callback";
  if (verdict === "uncertain" || verdict === "call_disconnected" || verdict === "in") return "uncertain";
  if (verdict.includes("not_pick") || callStatus.includes("not_pick") || providerStatus.includes("not_pick")) return "didNotConnect";
  return "unclassified";
};

const isConnected = (record: AnalyticsRecord) => {
  const analytics = asRecord(record.analytics);
  const providerStatus = asString(asRecord(record.provider_call_status).status).toLowerCase().replace(/\s+/g, "_");
  const callStatus = asString(analytics.call_status).toLowerCase().replace(/\s+/g, "_");
  const verdict = asString(analytics.verdict).toLowerCase().replace(/\s+/g, "_");

  if (providerStatus === "completed" || providerStatus === "picked_up") return true;
  if (callStatus === "picked_up") return true;
  if (providerStatus === "failed" || providerStatus === "not_picked_up") return false;
  if (callStatus === "not_picked_up" || verdict === "did_not_pick_up") return false;
  return Boolean(record.duration_seconds && record.duration_seconds > 0);
};

const increment = (map: Map<string, number>, key: string, amount = 1) => {
  map.set(key, (map.get(key) || 0) + amount);
};

const topList = (map: Map<string, number>, limit: number, fallbackLabel: string) => {
  const entries = [...map.entries()]
    .filter(([, value]) => value > 0)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([name, value]) => ({ name, value }));

  return entries.length ? entries : [{ name: fallbackLabel, value: 0 }];
};

async function backendGet(path: string) {
  const apiKey = process.env.COLLEGE_VIDYA_API_KEY;
  if (!apiKey) throw new Error("Missing COLLEGE_VIDYA_API_KEY");

  const response = await fetch(`${BACKEND_BASE_URL}${path}`, {
    headers: {
      "x-api-key": apiKey,
      accept: "application/json",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Backend request failed ${response.status}: ${body.slice(0, 240)}`);
  }

  return response.json();
}

async function getBackendData() {
  const now = Date.now();
  if (rawCache && rawCache.expiresAt > now) {
    return rawCache;
  }

  if (!rawCachePromise) {
    rawCachePromise = Promise.all([
      backendGet(`/api/analytics/user/${encodeURIComponent(USER_UID)}`),
      backendGet(`/api/campaigns/user/${encodeURIComponent(USER_UID)}`),
    ]).then(([analyticsPayload, campaignPayload]) => {
      rawCache = {
        expiresAt: Date.now() + RAW_CACHE_TTL_MS,
        analyticsPayload,
        campaignPayload,
      };
      rawCachePromise = null;
      return rawCache;
    }).catch((error) => {
      rawCachePromise = null;
      throw error;
    });
  }

  return rawCachePromise;
}

function aggregate(records: AnalyticsRecord[], campaigns: CampaignRecord[], range: RangeConfig): AggregateResult {
  let connected = 0;
  let didNotConnect = 0;
  let qualified = 0;
  let uncertain = 0;
  let callback = 0;
  let notInterested = 0;
  let talkSeconds = 0;
  let talkCount = 0;
  let creditsSpent = 0;
  let qualifiedScoreTotal = 0;
  let qualifiedScoreCount = 0;

  const attemptedLeads = new Map<string, number>();
  const daily = new Map<string, DailyPoint>();
  const hourly = new Map<number, HourlyPoint & { talkSeconds: number; talkCount: number }>();
  const weekly = new Map<string, { name: string; connected: number; totalCalls: number; rate: number }>();
  const verdicts = new Map<string, number>();
  const outcomes = new Map<string, number>();
  const uncertainReasons = new Map<string, number>();
  const notInterestedReasons = new Map<string, number>();

  const timestamps = records.map(getRecordMs).filter((value): value is number => value !== null);

  for (let hour = 0; hour < 24; hour += 1) {
    hourly.set(hour, {
      hour,
      label: `${pad(hour)}:00`,
      totalCalls: 0,
      connected: 0,
      didNotConnect: 0,
      qualified: 0,
      uncertain: 0,
      notInterested: 0,
      connectivityRate: 0,
      qualificationRate: 0,
      avgTalkTimeSeconds: null,
      talkSeconds: 0,
      talkCount: 0,
    });
  }

  for (const record of records) {
    const ms = getRecordMs(record);
    if (ms === null) continue;

    const analytics = asRecord(record.analytics);
    const discoveries = asRecord(analytics.key_discoveries);
    const verdict = normalizeVerdict(record);
    const connectedCall = isConnected(record);
    const duration = asNumber(record.duration_seconds);
    const local = formatInTimezone(new Date(ms), range.timezone);
    const day = local.date;
    const week = localWeekKey(new Date(ms), range.timezone);
    const leadKey = record.contact_id || record.phone_number || record.call_id || "unknown";

    increment(attemptedLeads, leadKey);
    creditsSpent += asNumber(asRecord(record.billing_data).credits_used);
    increment(verdicts, labelize(verdict));
    increment(outcomes, connectedCall ? "Connected" : "Did Not Connect");

    if (duration > 0 && connectedCall) {
      talkSeconds += duration;
      talkCount += 1;
    }

    if (connectedCall) connected += 1;
    else didNotConnect += 1;

    if (verdict === "qualified") {
      qualified += 1;
      const score = asNumber(discoveries.qualified_confidence_score || analytics.confidence_score);
      if (score > 0) {
        qualifiedScoreTotal += score;
        qualifiedScoreCount += 1;
      }
    } else if (verdict === "uncertain" || verdict === "callback") {
      if (verdict === "callback") callback += 1;
      else uncertain += 1;
      const reason =
        asString(discoveries.uncertain_tag) ||
        (analytics.voicemail === true ? "Voicemail" : "") ||
        asString(discoveries.uncertain_reason) ||
        (verdict === "callback" ? "Callback Requested" : "Other");
      increment(uncertainReasons, labelize(reason));
    } else if (verdict === "notInterested") {
      notInterested += 1;
      const reason = asString(discoveries.not_interested_tag) || asString(discoveries.not_interested_reason) || "Other";
      increment(notInterestedReasons, labelize(reason));
    }

    if (!daily.has(day)) {
      daily.set(day, {
        name: day,
        totalCalls: 0,
        connected: 0,
        didNotConnect: 0,
        qualified: 0,
        uncertain: 0,
        notInterested: 0,
        connectivityRate: 0,
        qualificationRate: 0,
        avgTalkTimeSeconds: null,
        creditsSpent: 0,
      });
    }

    const dayRow = daily.get(day);
    if (dayRow) {
      dayRow.totalCalls += 1;
      dayRow.creditsSpent += asNumber(asRecord(record.billing_data).credits_used);
      if (connectedCall) dayRow.connected += 1;
      else dayRow.didNotConnect += 1;
      if (verdict === "qualified") dayRow.qualified += 1;
      if (verdict === "uncertain" || verdict === "callback") dayRow.uncertain += 1;
      if (verdict === "notInterested") dayRow.notInterested += 1;
    }

    const hourRow = hourly.get(local.hour);
    if (hourRow) {
      hourRow.totalCalls += 1;
      if (connectedCall) hourRow.connected += 1;
      else hourRow.didNotConnect += 1;
      if (verdict === "qualified") hourRow.qualified += 1;
      if (verdict === "uncertain" || verdict === "callback") hourRow.uncertain += 1;
      if (verdict === "notInterested") hourRow.notInterested += 1;
      if (duration > 0 && connectedCall) {
        hourRow.talkSeconds += duration;
        hourRow.talkCount += 1;
      }
    }

    if (!weekly.has(week)) {
      weekly.set(week, { name: week, connected: 0, totalCalls: 0, rate: 0 });
    }
    const weekRow = weekly.get(week);
    if (weekRow) {
      weekRow.totalCalls += 1;
      if (connectedCall) weekRow.connected += 1;
    }
  }

  const retryBucketsMap = new Map<string, number>();
  for (const attempts of attemptedLeads.values()) {
    const bucket = attempts <= 1 ? "First Attempt" : `Retry ${Math.min(attempts - 1, 5)}${attempts > 6 ? "+" : ""}`;
    increment(retryBucketsMap, bucket);
  }

  const normalizedDaily = [...daily.values()]
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((row) => ({
      ...row,
      connectivityRate: percent(row.connected, row.totalCalls),
      qualificationRate: percent(row.qualified, row.connected),
      creditsSpent: Math.round(row.creditsSpent * 100) / 100,
    }));

  const normalizedHourly = [...hourly.values()].map(({ talkSeconds: hourTalkSeconds, talkCount: hourTalkCount, ...row }) => ({
    ...row,
    connectivityRate: percent(row.connected, row.totalCalls),
    qualificationRate: percent(row.qualified, row.connected),
    avgTalkTimeSeconds: hourTalkCount > 0 ? Math.round(hourTalkSeconds / hourTalkCount) : null,
  }));

  const totalLeadsReceived =
    campaigns
      .filter((campaign) => {
        if (!campaign.created_at) return true;
        const ms = new Date(campaign.created_at).getTime();
        return Number.isFinite(ms) && ms >= range.startUtcMs && ms <= range.endUtcMs;
      })
      .reduce((sum, campaign) => sum + asNumber(campaign.total_contacts), 0) || attemptedLeads.size;

  return {
    kpis: {
      totalLeadsReceived,
      totalLeadsAttempted: attemptedLeads.size,
      totalCalls: records.length,
      connectedCalls: connected,
      didNotConnectCalls: didNotConnect,
      notInterestedCalls: notInterested,
      qualifiedLeads: qualified,
      uncertainLeads: uncertain,
      callbackLeads: callback,
      connectivityRate: percent(connected, records.length),
      qualificationRate: percent(qualified, connected),
      uncertainRate: percent(uncertain + callback, connected),
      notInterestedRate: percent(notInterested, connected),
      avgTalkTimeSeconds: talkCount > 0 ? Math.round(talkSeconds / talkCount) : null,
      creditsSpent: Math.round(creditsSpent * 100) / 100,
      avgQualifiedScore: qualifiedScoreCount > 0 ? Math.round(qualifiedScoreTotal / qualifiedScoreCount) : 0,
    },
    funnel: {
      totalCalls: records.length,
      connected,
      didNotConnect,
      notInterested,
      uncertain: uncertain + callback,
      qualified,
    },
    daily: normalizedDaily,
    hourly: normalizedHourly,
    verdictDistribution: topList(verdicts, 8, "No verdict"),
    callOutcomeDistribution: topList(outcomes, 4, "No calls"),
    notInterestedReasons: topList(notInterestedReasons, 7, "No tagged reason"),
    uncertainReasons: topList(uncertainReasons, 7, "No tagged reason"),
    retryBuckets: [...retryBucketsMap.entries()]
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => {
        if (a.name === "First Attempt") return -1;
        if (b.name === "First Attempt") return 1;
        return a.name.localeCompare(b.name);
      }),
    weeklyConnectivity: [...weekly.values()]
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((row) => ({ ...row, rate: percent(row.connected, row.totalCalls) })),
    bestConnectivityHours: normalizedHourly
      .filter((row) => row.totalCalls >= 10)
      .sort((a, b) => b.connectivityRate - a.connectivityRate || b.totalCalls - a.totalCalls)
      .slice(0, 5),
    highestVolumeHours: normalizedHourly
      .filter((row) => row.totalCalls > 0)
      .sort((a, b) => b.totalCalls - a.totalCalls)
      .slice(0, 5),
    agentTelemetry: [
      { name: "Calls with priced token telemetry", value: records.filter((record) => record.token_cost_summary).length },
      { name: "Calls with provider status", value: records.filter((record) => record.provider_call_status).length },
      { name: "Calls with billing data", value: records.filter((record) => record.billing_data).length },
      { name: "Connected calls over 30 seconds", value: records.filter((record) => isConnected(record) && asNumber(record.duration_seconds) >= 30).length },
    ],
    savedLeadsImpact: [
      { name: "Qualified or interested leads", value: qualified },
      { name: "Callback marked leads", value: callback },
      { name: "Uncertain leads still recoverable", value: uncertain },
    ],
    filteredPeriodStart: timestamps.length ? new Date(Math.min(...timestamps)).toISOString() : null,
    filteredPeriodEnd: timestamps.length ? new Date(Math.max(...timestamps)).toISOString() : null,
  };
}

export async function GET(request: NextRequest) {
  try {
    const range = buildRange(request);
    const { analyticsPayload, campaignPayload } = await getBackendData();

    const analyticsResponse = asRecord(analyticsPayload);
    const allRecords = Array.isArray(analyticsResponse.analytics)
      ? (analyticsResponse.analytics as AnalyticsRecord[])
      : [];
    const campaigns = Array.isArray(campaignPayload) ? (campaignPayload as CampaignRecord[]) : [];
    const records = recordsInWindow(allRecords, range.startUtcMs, range.endUtcMs, range);
    const previousRecords = recordsInWindow(allRecords, range.previousStartUtcMs, range.previousEndUtcMs, range);
    const current = aggregate(records, campaigns, range);
    const previous = aggregate(previousRecords, [], range);

    const allTimestamps = allRecords.map(getRecordMs).filter((value): value is number => value !== null);
    const response: DashboardData = {
      meta: {
        generatedAt: new Date().toISOString(),
        timezone: range.timezone,
        requestedRange: {
          startLocal: `${range.startDate} ${range.startTime}`,
          endLocal: `${range.endDate} ${range.endTime}`,
          startUtc: new Date(range.startUtcMs).toISOString(),
          endUtc: new Date(range.endUtcMs).toISOString(),
        },
        globalPeriodStart: allTimestamps.length ? new Date(Math.min(...allTimestamps)).toISOString() : null,
        globalPeriodEnd: allTimestamps.length ? new Date(Math.max(...allTimestamps)).toISOString() : null,
        filteredPeriodStart: current.filteredPeriodStart,
        filteredPeriodEnd: current.filteredPeriodEnd,
        backendSource: BACKEND_BASE_URL,
      },
      kpis: current.kpis,
      comparisons: {
        previousTotalCalls: previous.kpis.totalCalls,
        previousConnectedCalls: previous.kpis.connectedCalls,
        previousQualifiedLeads: previous.kpis.qualifiedLeads,
        previousConnectivityRate: previous.kpis.connectivityRate,
        previousQualificationRate: previous.kpis.qualificationRate,
        totalCallsDeltaPct: deltaPct(current.kpis.totalCalls, previous.kpis.totalCalls),
        connectedDeltaPct: deltaPct(current.kpis.connectedCalls, previous.kpis.connectedCalls),
        qualifiedDeltaPct: deltaPct(current.kpis.qualifiedLeads, previous.kpis.qualifiedLeads),
      },
      funnel: current.funnel,
      daily: current.daily,
      hourly: current.hourly,
      verdictDistribution: current.verdictDistribution,
      callOutcomeDistribution: current.callOutcomeDistribution,
      notInterestedReasons: current.notInterestedReasons,
      uncertainReasons: current.uncertainReasons,
      retryBuckets: current.retryBuckets,
      weeklyConnectivity: current.weeklyConnectivity,
      bestConnectivityHours: current.bestConnectivityHours,
      highestVolumeHours: current.highestVolumeHours,
      agentTelemetry: current.agentTelemetry,
      savedLeadsImpact: current.savedLeadsImpact,
    };

    return NextResponse.json(response, {
      headers: {
        "Cache-Control": cacheHeaderForRange(range),
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown dashboard error";
    return NextResponse.json(
      { error: message },
      {
        status: 500,
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  }
}
