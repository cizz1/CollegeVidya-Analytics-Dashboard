"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { Activity, BarChart3, Clock3, LineChart, RefreshCw, Target, Workflow } from "lucide-react";
import Dashboard from "@/components/Dashboard";
import {
  DashboardData,
  DashboardFilters,
  DashboardPage,
  DatePreset,
  defaultFilters,
  fetchDashboardData,
} from "@/utils/fetchData";

const pages: { id: DashboardPage; label: string; icon: React.ComponentType<{ size?: number }> }[] = [
  { id: "overview", label: "Overview", icon: Activity },
  { id: "trends", label: "Trends", icon: LineChart },
  { id: "timing", label: "Timing", icon: Clock3 },
  { id: "qualification", label: "Qualification", icon: Target },
  { id: "operations", label: "Operations", icon: Workflow },
];

const presets: { id: DatePreset; label: string }[] = [
  { id: "today", label: "Today" },
  { id: "yesterday", label: "Yesterday" },
  { id: "7d", label: "7D" },
  { id: "30d", label: "30D" },
  { id: "month", label: "This Month" },
  { id: "custom", label: "Custom" },
];

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

export default function Home() {
  const [activePage, setActivePage] = useState<DashboardPage>("overview");
  const [filters, setFilters] = useState<DashboardFilters>(() => defaultFilters());
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  const effectiveFilters = useMemo(() => {
    if (filters.preset !== "custom") return filters;
    const today = todayInTimezone(filters.timezone);
    return {
      ...filters,
      startDate: filters.startDate || today,
      endDate: filters.endDate || filters.startDate || today,
    };
  }, [filters]);

  useEffect(() => {
    let cancelled = false;
    const loadData = async () => {
      setLoading(true);
      const fetchedData = await fetchDashboardData(effectiveFilters);
      if (!cancelled) {
        setData(fetchedData);
        setLoading(false);
      }
    };
    loadData();
    return () => {
      cancelled = true;
    };
  }, [effectiveFilters]);

  const updateFilter = <K extends keyof DashboardFilters>(key: K, value: DashboardFilters[K]) => {
    setFilters((current) => ({ ...current, [key]: value }));
  };

  return (
    <main className="flex flex-col h-screen w-screen bg-background text-foreground overflow-hidden">
      <header className="border-b border-card-border bg-[#0d0d0d] shrink-0">
        <div className="flex flex-col gap-3 px-4 py-3 xl:px-6">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2 h-10">
                <div className="h-full w-24 overflow-hidden rounded-md flex items-center justify-center -ml-3">
                  <Image src="/monade-logo.avif" alt="Monade AI" width={0} height={0} sizes="100vw" style={{ width: "auto", height: "100%" }} className="object-contain scale-[1.8]" />
                </div>
                <Image src="/collegevidya-logo.png" alt="College Vidya" width={0} height={0} sizes="100vw" style={{ width: "auto", height: "100%" }} className="object-contain filter grayscale brightness-200" />
              </div>
              <button
                suppressHydrationWarning
                onClick={() => setFilters((current) => ({ ...current }))}
                className="xl:hidden h-9 w-9 inline-flex items-center justify-center rounded-md border border-card-border bg-card-bg text-muted hover:text-white"
                title="Refresh"
              >
                <RefreshCw size={16} />
              </button>
            </div>

            <nav className="flex items-center gap-1 overflow-x-auto rounded-lg border border-card-border bg-card-bg p-1">
              {pages.map((page) => {
                const Icon = page.icon;
                const active = activePage === page.id;
                return (
                  <button
                    suppressHydrationWarning
                    key={page.id}
                    onClick={() => setActivePage(page.id)}
                    className={`h-9 shrink-0 inline-flex items-center gap-2 rounded-md px-3 text-sm font-medium transition-colors ${
                      active ? "bg-[#272727] text-white" : "text-muted hover:text-white"
                    }`}
                  >
                    <Icon size={15} />
                    {page.label}
                  </button>
                );
              })}
            </nav>
          </div>

          <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex items-center gap-1 overflow-x-auto">
              {presets.map((preset) => (
                <button
                  suppressHydrationWarning
                  key={preset.id}
                  onClick={() => updateFilter("preset", preset.id)}
                  className={`h-8 shrink-0 rounded-md px-3 text-xs font-semibold transition-colors ${
                    filters.preset === preset.id
                      ? "bg-monade text-black"
                      : "bg-card-bg border border-card-border text-muted hover:text-white"
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-2 md:flex md:items-center">
              {filters.preset === "custom" ? (
                <>
                  <input
                    suppressHydrationWarning
                    type="date"
                    value={effectiveFilters.startDate}
                    onChange={(event) => updateFilter("startDate", event.target.value)}
                    className="h-9 rounded-md border border-card-border bg-card-bg px-3 text-sm text-foreground outline-none"
                  />
                  <input
                    suppressHydrationWarning
                    type="date"
                    value={effectiveFilters.endDate}
                    onChange={(event) => updateFilter("endDate", event.target.value)}
                    className="h-9 rounded-md border border-card-border bg-card-bg px-3 text-sm text-foreground outline-none"
                  />
                </>
              ) : null}
              <input
                suppressHydrationWarning
                type="time"
                value={filters.startTime}
                onChange={(event) => updateFilter("startTime", event.target.value)}
                className="h-9 rounded-md border border-card-border bg-card-bg px-3 text-sm text-foreground outline-none"
              />
              <input
                suppressHydrationWarning
                type="time"
                value={filters.endTime}
                onChange={(event) => updateFilter("endTime", event.target.value)}
                className="h-9 rounded-md border border-card-border bg-card-bg px-3 text-sm text-foreground outline-none"
              />
              <select
                suppressHydrationWarning
                value={filters.timezone}
                onChange={(event) => updateFilter("timezone", event.target.value)}
                className="h-9 rounded-md border border-card-border bg-card-bg px-3 text-sm text-foreground outline-none"
              >
                <option value="Asia/Kolkata">IST</option>
                <option value="UTC">UTC</option>
              </select>
              <button
                suppressHydrationWarning
                onClick={() => setFilters((current) => ({ ...current }))}
                className="hidden h-9 w-9 xl:inline-flex items-center justify-center rounded-md border border-card-border bg-card-bg text-muted hover:text-white"
                title="Refresh"
              >
                <RefreshCw size={16} />
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-hidden relative">
        {loading && !data ? (
          <div className="flex h-full items-center justify-center text-monade">
            <div className="inline-flex items-center gap-3 text-sm font-medium">
              <BarChart3 size={18} />
              Loading live analytics...
            </div>
          </div>
        ) : data ? (
          <Dashboard data={data} activePage={activePage} loading={loading} />
        ) : (
          <div className="flex h-full items-center justify-center text-red">Unable to load dashboard.</div>
        )}
      </div>
    </main>
  );
}
