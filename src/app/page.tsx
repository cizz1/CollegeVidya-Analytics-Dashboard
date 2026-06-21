"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Dashboard from "@/components/Dashboard";
import DataSource from "@/components/DataSource";
import { fetchDashboardData, DashboardData } from "@/utils/fetchData";

const GOOGLE_SHEET_URL = "https://docs.google.com/spreadsheets/d/15-dd5pJ72ZxcNkgaCaqOlMVGWUIabYFwdpl_vIrzKG4/edit?usp=sharing";

export default function Home() {
  const [activeTab, setActiveTab] = useState<"dashboard" | "data">("dashboard");
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      const fetchedData = await fetchDashboardData(GOOGLE_SHEET_URL);
      setData(fetchedData);
      setLoading(false);
    };
    loadData();
  }, []);

  return (
    <main className="flex flex-col h-screen w-screen bg-background text-foreground overflow-hidden">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-card-border shrink-0">
        <div className="flex items-center gap-2 h-10">
          <div className="h-full w-24 overflow-hidden rounded-md flex items-center justify-center -ml-3">
            <Image src="/monade-logo.avif" alt="Monade AI" width={0} height={0} sizes="100vw" style={{ width: 'auto', height: '100%' }} className="object-contain scale-[1.8]" />
          </div>
          <Image src="/collegevidya-logo.png" alt="College Vidya" width={0} height={0} sizes="100vw" style={{ width: 'auto', height: '100%' }} className="object-contain filter grayscale brightness-200" />
        </div>
        <div className="flex items-center bg-card-bg rounded-lg p-1 border border-card-border">
          <button
            onClick={() => setActiveTab("dashboard")}
            className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${
              activeTab === "dashboard"
                ? "bg-card-border text-white"
                : "text-muted hover:text-white"
            }`}
          >
            Dashboard
          </button>
          <button
            onClick={() => setActiveTab("data")}
            className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${
              activeTab === "data"
                ? "bg-card-border text-white"
                : "text-muted hover:text-white"
            }`}
          >
            Data Source
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 overflow-hidden relative">
        {loading ? (
          <div className="flex items-center justify-center h-full text-monade">
            Loading dashboard data...
          </div>
        ) : activeTab === "dashboard" && data ? (
          <Dashboard data={data} />
        ) : (
          <DataSource sheetUrl={GOOGLE_SHEET_URL} />
        )}
      </div>
    </main>
  );
}