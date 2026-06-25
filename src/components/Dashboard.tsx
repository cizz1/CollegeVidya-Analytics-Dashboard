"use client";

import React from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ArrowDownRight, ArrowUpRight, Info, Minus, Sparkles } from "lucide-react";
import { AttemptPerformance, DashboardData, DashboardPage, HourlyPoint, MetricPoint } from "@/utils/fetchData";
import FunnelChart from "./FunnelChart";
import HorizontalBarChart from "./HorizontalBarChart";

const palette = {
  yellow: "#FFC700",
  green: "#00d26a",
  red: "#ff3b3b",
  orange: "#ff7700",
  cyan: "#38bdf8",
  violet: "#a78bfa",
  muted: "#a3a3a3",
  grid: "#262626",
};

const pieColors = [palette.green, palette.orange, palette.red, palette.yellow, palette.cyan, palette.violet, palette.muted];
const chartAnimation = false;

const safeNumber = (value: number | null | undefined) => (typeof value === "number" && Number.isFinite(value) ? value : 0);

const formatNumber = (value: number | null | undefined) => safeNumber(value).toLocaleString("en-IN");

const formatPercent = (value: number | null | undefined) => {
  const numeric = safeNumber(value);
  return `${numeric.toFixed(numeric % 1 === 0 ? 0 : 1)}%`;
};

const formatDecimal = (value: number | null | undefined) =>
  safeNumber(value).toLocaleString("en-IN", {
    maximumFractionDigits: 2,
  });

const formatDuration = (seconds: number | null | undefined) => {
  if (seconds == null) return "No data";
  const safeSeconds = safeNumber(seconds);
  const minutes = Math.floor(safeSeconds / 60);
  const remainingSeconds = safeSeconds % 60;
  return minutes > 0 ? `${minutes}m ${String(remainingSeconds).padStart(2, "0")}s` : `${remainingSeconds}s`;
};

const formatDateTime = (value: string | null, timezone: string) => {
  if (!value) return "No calls";
  return new Intl.DateTimeFormat("en-IN", {
    timeZone: timezone,
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(new Date(value));
};

const tooltipStyle = {
  backgroundColor: "#101010",
  border: "1px solid #262626",
  borderRadius: 8,
  color: "#ededed",
};

function DeltaBadge({ value }: { value: number | null }) {
  if (value === null) {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-muted">
        <Minus size={12} />
        no previous window
      </span>
    );
  }

  const positive = value >= 0;
  const Icon = positive ? ArrowUpRight : ArrowDownRight;
  return (
    <span className={`inline-flex items-center gap-1 text-xs ${positive ? "text-green" : "text-red"}`}>
      <Icon size={12} />
      {Math.abs(value).toFixed(1)}% vs previous
    </span>
  );
}

function MetricCard({
  label,
  value,
  detail,
  delta,
  tone = "default",
}: {
  label: string;
  value: string;
  detail?: string;
  delta?: number | null;
  tone?: "default" | "green" | "orange" | "red" | "cyan";
}) {
  const toneClass = {
    default: "text-foreground",
    green: "text-green",
    orange: "text-orange",
    red: "text-red",
    cyan: "text-[#38bdf8]",
  }[tone];

  return (
    <div className="rounded-lg border border-card-border bg-card-bg p-4 min-h-[126px] flex flex-col justify-between">
      <div className="text-[11px] font-semibold uppercase tracking-wider text-muted">{label}</div>
      <div>
        <div className={`text-2xl font-semibold leading-none md:text-3xl ${toneClass}`}>{value}</div>
        {detail ? <div className="mt-2 text-xs leading-snug text-muted">{detail}</div> : null}
        {delta !== undefined ? <div className="mt-3"><DeltaBadge value={delta} /></div> : null}
      </div>
    </div>
  );
}

function InfoTip({ text }: { text: string }) {
  return (
    <span className="group relative inline-flex">
      <button
        type="button"
        aria-label={text}
        className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-card-border bg-[#101010] text-muted transition hover:border-monade hover:text-monade focus:outline-none focus:ring-2 focus:ring-monade/40"
      >
        <Info size={13} />
      </button>
      <span className="pointer-events-none absolute right-0 top-8 z-20 hidden w-[280px] rounded-lg border border-card-border bg-[#101010] p-3 text-left text-xs leading-relaxed text-foreground shadow-xl group-hover:block group-focus-within:block">
        {text}
      </span>
    </span>
  );
}

function Panel({
  title,
  children,
  className = "",
  action,
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
  action?: React.ReactNode;
}) {
  return (
    <section className={`rounded-lg border border-card-border bg-card-bg p-4 ${className}`}>
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-monade">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

function EmptyState() {
  return (
    <div className="flex h-[260px] items-center justify-center rounded-lg border border-dashed border-card-border text-sm text-muted">
      No calls in this selected window.
    </div>
  );
}

function PieBlock({ data }: { data: MetricPoint[] }) {
  const hasData = data.some((item) => item.value > 0);
  if (!hasData) return <EmptyState />;

  return (
    <ResponsiveContainer width="100%" height={280}>
      <PieChart>
        <Pie data={data} dataKey="value" nameKey="name" innerRadius={68} outerRadius={102} paddingAngle={2} isAnimationActive={chartAnimation}>
          {data.map((_, index) => (
            <Cell key={index} fill={pieColors[index % pieColors.length]} />
          ))}
        </Pie>
        <Tooltip contentStyle={tooltipStyle} formatter={(value: number) => formatNumber(value)} />
        <Legend iconType="circle" wrapperStyle={{ color: palette.muted, fontSize: 12 }} />
      </PieChart>
    </ResponsiveContainer>
  );
}

function TopHours({
  rows,
  mode,
  totalCalls = 0,
}: {
  rows: HourlyPoint[];
  mode: "connectivity" | "volume" | "qualification" | "uncertain";
  totalCalls?: number;
}) {
  if (!rows.length) return <EmptyState />;

  const valueForMode = (row: HourlyPoint) => {
    if (mode === "connectivity") return formatPercent(row.connectivityRate);
    if (mode === "qualification") return formatPercent(row.qualificationRate);
    if (mode === "uncertain") return formatPercent(row.connected > 0 ? (row.uncertain / row.connected) * 100 : 0);
    return formatPercent(percentOfTotal(row.totalCalls, totalCalls));
  };

  const labelForMode = {
    connectivity: "connect",
    volume: "of calls",
    qualification: "qualified",
    uncertain: "uncertain",
  }[mode];

  const colorForMode = {
    connectivity: "text-green",
    volume: "text-monade",
    qualification: "text-green",
    uncertain: "text-orange",
  }[mode];

  return (
    <div className="space-y-3">
      {rows.map((row, index) => (
        <div key={row.hour} className="grid grid-cols-[44px_1fr_auto] items-center gap-3 rounded-lg bg-[#101010] px-3 py-3">
          <div className="text-sm font-semibold text-muted">#{index + 1}</div>
          <div>
            <div className="text-sm font-semibold text-foreground">{row.label}</div>
            <div className="mt-1 text-xs text-muted">
              {formatNumber(row.totalCalls)} calls, {formatNumber(row.connected)} connected
            </div>
          </div>
          <div className={colorForMode}>
            <div className="text-lg font-semibold leading-none">
              {valueForMode(row)}
            </div>
            <div className="mt-1 text-right text-[11px] text-muted">
              {labelForMode}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

const percentOfTotal = (part: number, total: number) => (total > 0 ? Math.round((part / total) * 1000) / 10 : 0);

function Overview({ data }: { data: DashboardData }) {
  return (
    <>
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-6">
        <MetricCard label="Leads Received" value={formatNumber(data.kpis.totalLeadsReceived)} detail="Campaign contacts in window" />
        <MetricCard label="Leads Attempted" value={formatNumber(data.kpis.totalLeadsAttempted)} detail="Unique phone/contact dialed" />
        <MetricCard label="Connected" value={formatNumber(data.kpis.connectedCalls)} detail={formatPercent(data.kpis.connectivityRate)} delta={data.comparisons.connectedDeltaPct} tone="green" />
        <MetricCard label="Qualified" value={formatNumber(data.kpis.qualifiedLeads)} detail={`${formatPercent(data.kpis.qualificationRate)} of connected`} delta={data.comparisons.qualifiedDeltaPct} tone="green" />
        <MetricCard label="High Score Leads" value={formatNumber(data.kpis.highConfidenceQualifiedLeads)} detail={`${formatPercent(data.kpis.highConfidenceQualifiedRate)} of qualified, score > 80`} tone="green" />
        <MetricCard label="Avg Talk Time" value={formatDuration(data.kpis.avgTalkTimeSeconds)} detail="Connected calls only" tone="cyan" />
        <MetricCard label="Credits Spent" value={formatNumber(data.kpis.creditsSpent)} detail="Per-call billing rollup" tone="orange" />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.35fr_0.65fr]">
        <Panel title="Daily Momentum">
          {data.daily.length ? (
            <ResponsiveContainer width="100%" height={320}>
              <AreaChart data={data.daily}>
                <CartesianGrid stroke={palette.grid} vertical={false} />
                <XAxis dataKey="name" stroke={palette.muted} tick={{ fontSize: 11 }} />
                <YAxis stroke={palette.muted} tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={tooltipStyle} />
                <Area type="monotone" dataKey="connected" name="Connected" stroke={palette.green} fill={palette.green} fillOpacity={0.18} isAnimationActive={chartAnimation} />
                <Area type="monotone" dataKey="qualified" name="Qualified" stroke={palette.yellow} fill={palette.yellow} fillOpacity={0.18} isAnimationActive={chartAnimation} />
              </AreaChart>
            </ResponsiveContainer>
          ) : <EmptyState />}
        </Panel>

        <Panel title="Call Outcomes">
          <PieBlock data={data.callOutcomeDistribution} />
        </Panel>
      </div>

      <Panel
        title="Qualification Funnel"
        action={<span className="text-xs text-muted">{formatNumber(data.kpis.highConfidenceQualifiedLeads)} high score leads · score &gt; 80</span>}
      >
        <div className="overflow-auto pb-2">
          <div className="min-w-[1160px]">
          <FunnelChart data={data.funnel} uncertainReasons={data.uncertainReasons} />
          </div>
        </div>
      </Panel>
    </>
  );
}

function Trends({ data }: { data: DashboardData }) {
  return (
    <>
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-5">
        <MetricCard label="Total Calls" value={formatNumber(data.kpis.totalCalls)} detail={`${formatNumber(data.kpis.didNotConnectCalls)} did not connect`} delta={data.comparisons.totalCallsDeltaPct} />
        <MetricCard label="Connectivity" value={formatPercent(data.kpis.connectivityRate)} detail="Connected over total calls" tone="green" />
        <MetricCard label="Qualification Rate" value={formatPercent(data.kpis.qualificationRate)} detail="Qualified over connected" tone="green" />
        <MetricCard label="Uncertain Rate" value={formatPercent(data.kpis.uncertainRate)} detail={`${formatNumber(data.kpis.uncertainLeads + data.kpis.callbackLeads)} leads`} tone="orange" />
        <MetricCard label="Not Interested" value={formatPercent(data.kpis.notInterestedRate)} detail={`${formatNumber(data.kpis.notInterestedCalls)} calls`} tone="red" />
      </div>

      <Panel title="Rates By Day">
        {data.daily.length ? (
          <ResponsiveContainer width="100%" height={330}>
            <LineChart data={data.daily}>
              <CartesianGrid stroke={palette.grid} vertical={false} />
              <XAxis dataKey="name" stroke={palette.muted} tick={{ fontSize: 11 }} />
              <YAxis stroke={palette.muted} tick={{ fontSize: 11 }} domain={[0, 100]} tickFormatter={(value) => `${value}%`} />
              <Tooltip contentStyle={tooltipStyle} formatter={(value: number) => `${value}%`} />
              <Legend wrapperStyle={{ color: palette.muted, fontSize: 12 }} />
              <Line type="monotone" dataKey="connectivityRate" name="Connectivity" stroke={palette.green} strokeWidth={2} dot={false} isAnimationActive={chartAnimation} />
              <Line type="monotone" dataKey="qualificationRate" name="Qualification" stroke={palette.yellow} strokeWidth={2} dot={false} isAnimationActive={chartAnimation} />
            </LineChart>
          </ResponsiveContainer>
        ) : <EmptyState />}
      </Panel>

      <Panel title="Call Mix By Day">
        {data.daily.length ? (
          <ResponsiveContainer width="100%" height={330}>
            <BarChart data={data.daily}>
              <CartesianGrid stroke={palette.grid} vertical={false} />
              <XAxis dataKey="name" stroke={palette.muted} tick={{ fontSize: 11 }} />
              <YAxis stroke={palette.muted} tick={{ fontSize: 11 }} />
              <Tooltip contentStyle={tooltipStyle} />
              <Legend wrapperStyle={{ color: palette.muted, fontSize: 12 }} />
              <Bar dataKey="qualified" name="Qualified" stackId="a" fill={palette.green} isAnimationActive={chartAnimation} />
              <Bar dataKey="uncertain" name="Uncertain" stackId="a" fill={palette.orange} isAnimationActive={chartAnimation} />
              <Bar dataKey="notInterested" name="Not Interested" stackId="a" fill={palette.red} isAnimationActive={chartAnimation} />
              <Bar dataKey="didNotConnect" name="Did Not Connect" stackId="a" fill={palette.muted} isAnimationActive={chartAnimation} />
            </BarChart>
          </ResponsiveContainer>
        ) : <EmptyState />}
      </Panel>
    </>
  );
}

function Timing({ data }: { data: DashboardData }) {
  const hourlyWithUncertainRate = data.hourly.map((row) => ({
    ...row,
    uncertainRate: row.connected > 0 ? Math.round((row.uncertain / row.connected) * 1000) / 10 : 0,
  }));

  return (
    <>
      <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <Panel title="Hourly Performance" className="self-start">
          <ResponsiveContainer width="100%" height={320}>
            <ComposedChart data={hourlyWithUncertainRate}>
              <CartesianGrid stroke={palette.grid} vertical={false} />
              <XAxis dataKey="label" stroke={palette.muted} tick={{ fontSize: 11 }} />
              <YAxis yAxisId="calls" stroke={palette.muted} tick={{ fontSize: 11 }} />
              <YAxis yAxisId="rate" orientation="right" stroke={palette.muted} tick={{ fontSize: 11 }} domain={[0, 100]} tickFormatter={(value) => `${value}%`} />
              <Tooltip contentStyle={tooltipStyle} />
              <Legend wrapperStyle={{ color: palette.muted, fontSize: 12 }} />
              <Bar yAxisId="calls" dataKey="totalCalls" name="Calls" fill={palette.cyan} radius={[4, 4, 0, 0]} isAnimationActive={chartAnimation} />
              <Line yAxisId="rate" type="monotone" dataKey="connectivityRate" name="Connectivity" stroke={palette.green} strokeWidth={2} dot={false} isAnimationActive={chartAnimation} />
              <Line yAxisId="rate" type="monotone" dataKey="qualificationRate" name="Qualification" stroke={palette.yellow} strokeWidth={2} dot={false} isAnimationActive={chartAnimation} />
              <Line yAxisId="rate" type="monotone" dataKey="uncertainRate" name="Uncertain" stroke={palette.orange} strokeWidth={2} dot={false} isAnimationActive={chartAnimation} />
            </ComposedChart>
          </ResponsiveContainer>
        </Panel>

        <div className="grid gap-4">
          <Panel title="Best Connectivity Hours">
            <TopHours rows={data.bestConnectivityHours} mode="connectivity" />
          </Panel>
          <Panel title="Highest Volume Hours">
            <TopHours rows={data.highestVolumeHours} mode="volume" totalCalls={data.kpis.totalCalls} />
          </Panel>
          <Panel title="Highest Qualification Hours">
            <TopHours rows={data.highestQualificationHours} mode="qualification" />
          </Panel>
          <Panel title="Highest Uncertain Hours">
            <TopHours rows={data.highestUncertainHours} mode="uncertain" />
          </Panel>
        </div>
      </div>

      <Panel title="Hourly Qualification Split">
        <ResponsiveContainer width="100%" height={320}>
          <BarChart data={data.hourly}>
            <CartesianGrid stroke={palette.grid} vertical={false} />
            <XAxis dataKey="label" stroke={palette.muted} tick={{ fontSize: 11 }} />
            <YAxis stroke={palette.muted} tick={{ fontSize: 11 }} />
            <Tooltip contentStyle={tooltipStyle} />
            <Legend wrapperStyle={{ color: palette.muted, fontSize: 12 }} />
            <Bar dataKey="qualified" name="Qualified" stackId="a" fill={palette.green} isAnimationActive={chartAnimation} />
            <Bar dataKey="uncertain" name="Uncertain" stackId="a" fill={palette.orange} isAnimationActive={chartAnimation} />
            <Bar dataKey="notInterested" name="Not Interested" stackId="a" fill={palette.red} isAnimationActive={chartAnimation} />
          </BarChart>
        </ResponsiveContainer>
      </Panel>
    </>
  );
}

function Qualification({ data }: { data: DashboardData }) {
  return (
    <>
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <MetricCard label="Qualified Leads" value={formatNumber(data.kpis.qualifiedLeads)} detail={`${formatPercent(data.kpis.qualificationRate)} of connected`} tone="green" />
        <MetricCard label="Uncertain" value={formatNumber(data.kpis.uncertainLeads)} detail={`${formatNumber(data.kpis.callbackLeads)} callbacks tagged`} tone="orange" />
        <MetricCard label="Not Interested" value={formatNumber(data.kpis.notInterestedCalls)} detail={`${formatPercent(data.kpis.notInterestedRate)} of connected`} tone="red" />
        <MetricCard label="High Score Leads" value={formatNumber(data.kpis.highConfidenceQualifiedLeads)} detail={`${formatPercent(data.kpis.highConfidenceQualifiedRate)} of qualified, score > 80`} tone="cyan" />
      </div>

      <div className="grid gap-4 xl:grid-cols-[0.75fr_1.25fr]">
        <Panel title="Verdict Distribution">
          <PieBlock data={data.verdictDistribution} />
        </Panel>

        <Panel title="Why Leads Stayed Uncertain">
          <HorizontalBarChart data={data.uncertainReasons} colors={[palette.orange, palette.yellow, palette.cyan, palette.violet, palette.muted]} valueMode="absolute" />
        </Panel>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Panel
          title="Why Leads Were Not Interested"
          action={<InfoTip text="These reasons come from the structured post-processing tags currently stored for each call. More granular metadata, such as other course names, fee objections, EMI concerns, or alternate enrollment status, will need those fields to be extracted and saved during post-processing." />}
        >
          <HorizontalBarChart data={data.notInterestedReasons} colors={[palette.red, palette.orange, palette.yellow, palette.cyan, palette.muted]} valueMode="absolute" />
        </Panel>

        <Panel title="Recoverable Lead Impact">
          <HorizontalBarChart data={data.savedLeadsImpact} colors={[palette.green, palette.yellow, palette.orange]} valueMode="absolute" />
        </Panel>
      </div>
    </>
  );
}

function Operations({ data }: { data: DashboardData }) {
  const metricValue = (name: string) => data.operationalMetrics.find((item) => item.name === name)?.value || 0;
  const attemptInfo =
    "SARA makes the first call within 3-4 minutes of lead arrival. Retry 1 is after 1 hour, Retry 2 after 2 hours, Retry 3 after 3 hours, Retry 4 next day around 6 PM, Retry 5 next day 7-8 PM, Retry 6 on the third day around 6 PM, and Retry 7 around 7-8 PM. Calling is restricted to 9 AM-9 PM as per TRAI guidelines.";

  return (
    <>
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <MetricCard label="Credits / Call" value={formatDecimal(metricValue("Credits per call"))} detail={`${formatNumber(data.kpis.creditsSpent)} total credits`} tone="orange" />
        <MetricCard label="Avg Call Duration" value={formatDuration(metricValue("Avg call duration (sec)"))} detail="All calls with duration" tone="cyan" />
        <MetricCard label="Avg Connected Duration" value={formatDuration(metricValue("Avg connected duration (sec)"))} detail="Connected calls only" tone="green" />
        <MetricCard label="Distinct Leads Called" value={formatNumber(data.kpis.totalLeadsAttempted)} detail={`${formatNumber(data.kpis.totalCalls)} total call attempts`} />
      </div>

      <div className="grid gap-4 xl:grid-cols-[0.85fr_1.15fr]">
        <Panel
          title="Fresh Vs Retry Call Mix"
          action={<InfoTip text="Fresh means the first-ever observed SARA call for that contact is inside the selected window. Retry means the call is attempt 2 or later, even if the first call happened yesterday or two days earlier. The distinct leads KPI above is de-duplicated across the whole selected window, so it should not be added to these call-volume buckets." />}
        >
          <div className="space-y-3">
            {data.leadSegments.map((segment) => (
              <div key={segment.name} className="rounded-lg border border-card-border bg-[#101010] p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="text-sm font-semibold text-foreground">{segment.name}</div>
                    <div className="mt-1 text-xs text-muted">
                      {segment.name === "Fresh leads called"
                        ? `${formatNumber(segment.totalCalls)} first-attempt calls`
                        : `${formatNumber(segment.totalCalls)} retry calls across ${formatNumber(segment.uniqueLeads)} leads`}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-semibold text-green">{formatPercent(segment.qualificationRate)}</div>
                    <div className="mt-1 text-[11px] text-muted">qualification</div>
                  </div>
                </div>
                <div className="mt-4 grid grid-cols-3 gap-2 text-xs">
                  <div className="rounded-md bg-card-bg p-2">
                    <div className="text-muted">Connected</div>
                    <div className="mt-1 font-semibold text-foreground">{formatNumber(segment.connected)} ({formatPercent(segment.connectivityRate)})</div>
                  </div>
                  <div className="rounded-md bg-card-bg p-2">
                    <div className="text-muted">Qualified</div>
                    <div className="mt-1 font-semibold text-green">{formatNumber(segment.qualified)}</div>
                  </div>
                  <div className="rounded-md bg-card-bg p-2">
                    <div className="text-muted">Uncertain</div>
                    <div className="mt-1 font-semibold text-orange">{formatNumber(segment.uncertain)}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="Qualification By Call Attempt" action={<InfoTip text={attemptInfo} />}>
          {data.attemptPerformance.some((row) => row.totalCalls > 0) ? (
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={data.attemptPerformance}>
                <CartesianGrid stroke={palette.grid} vertical={false} />
                <XAxis dataKey="label" stroke={palette.muted} tick={{ fontSize: 11 }} />
                <YAxis stroke={palette.muted} tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={tooltipStyle} />
                <Legend wrapperStyle={{ color: palette.muted, fontSize: 12 }} />
                <Bar dataKey="connected" name="Connected" fill={palette.cyan} isAnimationActive={chartAnimation} />
                <Bar dataKey="qualified" name="Qualified" fill={palette.green} isAnimationActive={chartAnimation} />
                <Bar dataKey="uncertain" name="Uncertain" fill={palette.orange} isAnimationActive={chartAnimation} />
              </BarChart>
            </ResponsiveContainer>
          ) : <EmptyState />}
        </Panel>
      </div>

      <Panel title="Attempt-Level Detail" action={<InfoTip text="This table separates the first call from seven retries. Each row uses the selected dashboard date, time, and timezone filters." />}>
        <AttemptTable rows={data.attemptPerformance} />
      </Panel>

      <Panel title="Weekly Connectivity">
        {data.weeklyConnectivity.length ? (
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={data.weeklyConnectivity}>
              <CartesianGrid stroke={palette.grid} vertical={false} />
              <XAxis dataKey="name" stroke={palette.muted} tick={{ fontSize: 11 }} />
              <YAxis stroke={palette.muted} tick={{ fontSize: 11 }} domain={[0, 100]} tickFormatter={(value) => `${value}%`} />
              <Tooltip contentStyle={tooltipStyle} formatter={(value: number) => `${value}%`} />
              <Bar dataKey="rate" name="Connectivity" fill={palette.green} radius={[4, 4, 0, 0]} isAnimationActive={chartAnimation} />
            </BarChart>
          </ResponsiveContainer>
        ) : <EmptyState />}
      </Panel>
    </>
  );
}

function AttemptTable({ rows }: { rows: AttemptPerformance[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[860px] border-collapse text-sm">
        <thead>
          <tr className="border-b border-card-border text-left text-[11px] uppercase tracking-wider text-muted">
            <th className="py-3 pr-4 font-semibold">Attempt</th>
            <th className="py-3 pr-4 font-semibold">Schedule</th>
            <th className="py-3 pr-4 text-right font-semibold">Leads Called</th>
            <th className="py-3 pr-4 text-right font-semibold">Total Calls</th>
            <th className="py-3 pr-4 text-right font-semibold">Connected</th>
            <th className="py-3 pr-4 text-right font-semibold">Qualified</th>
            <th className="py-3 pr-4 text-right font-semibold">Connectivity</th>
            <th className="py-3 text-right font-semibold">Qualification</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.attemptNumber} className="border-b border-card-border/70 text-foreground last:border-b-0">
              <td className="py-3 pr-4 font-semibold">{row.label}</td>
              <td className="py-3 pr-4 text-xs text-muted">{row.schedule}</td>
              <td className="py-3 pr-4 text-right">{formatNumber(row.uniqueLeads)}</td>
              <td className="py-3 pr-4 text-right">{formatNumber(row.totalCalls)}</td>
              <td className="py-3 pr-4 text-right">{formatNumber(row.connected)}</td>
              <td className="py-3 pr-4 text-right text-green">{formatNumber(row.qualified)}</td>
              <td className="py-3 pr-4 text-right">{formatPercent(row.connectivityRate)}</td>
              <td className="py-3 text-right">{formatPercent(row.qualificationRate)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function Dashboard({
  data,
  activePage,
  loading,
}: {
  data: DashboardData;
  activePage: DashboardPage;
  loading: boolean;
}) {
  const periodLabel = `${data.meta.requestedRange.startLocal} to ${data.meta.requestedRange.endLocal}`;

  return (
    <div className="h-full w-full overflow-y-auto bg-background p-4 custom-scrollbar">
      <div className="mx-auto flex max-w-[1600px] flex-col gap-4">
        <div className="flex flex-col gap-3 border-b border-card-border pb-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-md border border-card-border bg-card-bg px-3 py-1 text-xs text-muted">
              <Sparkles size={14} className="text-monade" />
              Live voice-agent analytics
            </div>
            <h1 className="mt-3 text-2xl font-semibold tracking-normal text-foreground md:text-3xl">
              College Vidya Lead Qualification
            </h1>
            <p className="mt-2 text-sm text-muted">
              {periodLabel} ({data.meta.timezone}) · Data through {formatDateTime(data.meta.filteredPeriodEnd, data.meta.timezone)}
            </p>
          </div>
          <div className="text-left text-xs text-muted xl:text-right">
            <div>Last refreshed {formatDateTime(data.meta.generatedAt, data.meta.timezone)}</div>
            <div className={loading ? "text-monade" : ""}>{loading ? "Refreshing selected window..." : "All charts use the selected window"}</div>
          </div>
        </div>

        {activePage === "overview" ? <Overview data={data} /> : null}
        {activePage === "trends" ? <Trends data={data} /> : null}
        {activePage === "timing" ? <Timing data={data} /> : null}
        {activePage === "qualification" ? <Qualification data={data} /> : null}
        {activePage === "operations" ? <Operations data={data} /> : null}
      </div>
    </div>
  );
}
