import { NextRequest, NextResponse } from "next/server";
import type { DashboardData } from "@/utils/fetchData";

export const dynamic = "force-dynamic";

// --- The dashboard no longer fetches + reduces raw call rows itself. ---
// It proxies to the monade-analytics-aggregator microservice, which computes the
// full DashboardData payload server-side by streaming rows through a Postgres
// cursor (constant memory, no truncation, attempt-numbering done in SQL over the
// user's full history). This replaces the old path that pulled a client's entire
// call history (up to 8 JSON blob columns per row) into this function and reduced
// it in-process — which was slow and silently dropped the oldest calls once a
// window exceeded the page cap. See the aggregator repo README for details.

const USER_UID =
  process.env.COLLEGE_VIDYA_USER_UID || "091cf311-6949-42fd-b1d2-de3bb4b3bf48";
const CLIENT_ID = process.env.COLLEGE_VIDYA_CLIENT_ID || "college-vidya";
const AGGREGATOR_BASE_URL = (
  process.env.ANALYTICS_SERVICE_BASE_URL || "https://service.monade.ai/analytics"
).replace(/\/+$/, "");
const AGGREGATOR_API_KEY = process.env.ANALYTICS_SERVICE_API_KEY || "";
const AGGREGATOR_TIMEOUT_MS = 25_000;

const LIVE_BROWSER_CACHE_SECONDS = 10 * 60;
const LIVE_RESPONSE_CACHE_SECONDS = 10 * 60;
const LIVE_RESPONSE_STALE_SECONDS = 60 * 60;
const HISTORICAL_BROWSER_CACHE_SECONDS = 60 * 60;
const HISTORICAL_RESPONSE_CACHE_SECONDS = 12 * 60 * 60;
const HISTORICAL_RESPONSE_STALE_SECONDS = 7 * 24 * 60 * 60;

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

const yesterdayInTimezone = (timezone: string) => {
  const [year, month, day] = todayInTimezone(timezone).split("-").map(Number);
  const utc = new Date(Date.UTC(year, month - 1, day - 1));
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${utc.getUTCFullYear()}-${pad(utc.getUTCMonth() + 1)}-${pad(utc.getUTCDate())}`;
};

// A window is "historical" (immutable → long CDN cache) only when it ends strictly
// before yesterday. Today and yesterday still accrue late data, so they stay live.
// Only a past custom range qualifies. Mirrors utils/fetchData.ts so both agree.
const isHistoricalRequest = (params: URLSearchParams) => {
  const preset = params.get("preset") || "today";
  if (preset !== "custom") return false;
  const timezone = params.get("timezone") || "Asia/Kolkata";
  const endDate = params.get("endDate") || params.get("startDate") || "";
  return Boolean(endDate && endDate < yesterdayInTimezone(timezone));
};

const cacheHeaderFor = (historical: boolean) => {
  const browserCache = historical ? HISTORICAL_BROWSER_CACHE_SECONDS : LIVE_BROWSER_CACHE_SECONDS;
  const cdnCache = historical ? HISTORICAL_RESPONSE_CACHE_SECONDS : LIVE_RESPONSE_CACHE_SECONDS;
  const stale = historical ? HISTORICAL_RESPONSE_STALE_SECONDS : LIVE_RESPONSE_STALE_SECONDS;
  return `public, max-age=${browserCache}, s-maxage=${cdnCache}, stale-while-revalidate=${stale}`;
};

const buildUpstreamUrl = (incoming: URLSearchParams) => {
  const search = new URLSearchParams();
  search.set("user_uid", USER_UID);
  search.set("client", CLIENT_ID);
  search.set("preset", incoming.get("preset") || "today");
  search.set("timezone", incoming.get("timezone") || "Asia/Kolkata");
  search.set("startTime", incoming.get("startTime") || "00:00");
  search.set("endTime", incoming.get("endTime") || "23:59");
  if ((incoming.get("preset") || "") === "custom") {
    if (incoming.get("startDate")) search.set("startDate", incoming.get("startDate") as string);
    if (incoming.get("endDate")) search.set("endDate", incoming.get("endDate") as string);
  }
  return `${AGGREGATOR_BASE_URL}/api/v1/analytics/dashboard?${search.toString()}`;
};

export async function GET(request: NextRequest) {
  if (!AGGREGATOR_API_KEY) {
    return NextResponse.json(
      { error: "Missing ANALYTICS_SERVICE_API_KEY" },
      { status: 500, headers: { "Cache-Control": "no-store" } }
    );
  }

  const params = request.nextUrl.searchParams;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), AGGREGATOR_TIMEOUT_MS);

  try {
    const upstream = await fetch(buildUpstreamUrl(params), {
      headers: {
        "x-api-key": AGGREGATOR_API_KEY,
        authorization: `Bearer ${AGGREGATOR_API_KEY}`,
        accept: "application/json",
      },
      cache: "no-store",
      signal: controller.signal,
    });

    if (!upstream.ok) {
      const body = await upstream.text();
      throw new Error(`Aggregator request failed ${upstream.status}: ${body.slice(0, 240)}`);
    }

    const data = (await upstream.json()) as DashboardData;
    return NextResponse.json(data, {
      headers: {
        "Cache-Control": cacheHeaderFor(isHistoricalRequest(params)),
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown dashboard error";
    return NextResponse.json(
      { error: message },
      { status: 500, headers: { "Cache-Control": "no-store" } }
    );
  } finally {
    clearTimeout(timeout);
  }
}
