import React from "react";
import { DashboardData } from "@/utils/fetchData";
import FunnelChart from "./FunnelChart";
import HorizontalBarChart from "./HorizontalBarChart";
import StackedColumnChart from "./StackedColumnChart";
import DailyConnectionRateChart from "./DailyConnectionRateChart";
import DailyQualificationRateChart from "./DailyQualificationRateChart";

const colorPalette = ["#ff7700", "#ff3b3b", "#FFC700", "#00d26a", "#a3a3a3", "#262626"];

const callVolumeConfig = [
  { key: "qualified", label: "Qualified", color: "#00d26a" },
  { key: "uncertain", label: "Uncertain", color: "#ff7700" },
  { key: "notInterested", label: "Not Interested", color: "#ff3b3b" },
  { key: "didNotConnect", label: "Did Not Connect", color: "#a3a3a3" },
];

export default function Dashboard({ data }: { data: DashboardData }) {
  return (
    <div className="flex flex-col h-full w-full p-4 gap-4 bg-background overflow-y-auto custom-scrollbar">
      
      {/* 1st Section: Funnel (Full Width) */}
      <div className="shrink-0 relative bg-card-bg border border-card-border rounded-xl p-4 flex flex-col">
        <h2 className="text-sm font-semibold text-muted uppercase tracking-wider mb-4 shrink-0">Call Funnel & Qualifications</h2>
        <div className="w-full relative flex items-center justify-center">
          <FunnelChart data={data.funnel} avgScore={data.avgQualifiedScore} uncertainReasons={data.uncertainReasons} />
        </div>
      </div>

      {/* Daily Qualification Rate (Full Width) */}
      <DailyQualificationRateChart data={data.callVolume} />

      {/* 2nd Section: Why Not Interested & Why Uncertain (50-50 Split) */}
      <div className="flex flex-col md:flex-row gap-4 shrink-0">
        <div className="flex-1 min-w-0 bg-card-bg border border-card-border rounded-xl p-4 flex flex-col justify-start">
          <h2 className="text-sm font-semibold text-monade uppercase tracking-wider mb-4 shrink-0">Why Not Interested</h2>
          <div className="flex-1 min-h-0">
            <HorizontalBarChart data={data.notInterestedReasons} colors={colorPalette} />
          </div>
        </div>

        <div className="flex-1 min-w-0 bg-card-bg border border-card-border rounded-xl p-4 flex flex-col justify-start">
          <h2 className="text-sm font-semibold text-monade uppercase tracking-wider mb-4 shrink-0">Why Uncertain</h2>
          <div className="flex-1 min-h-0">
            <HorizontalBarChart data={data.uncertainReasons} colors={colorPalette} />
          </div>
        </div>
      </div>

      {/* 4th Section: Intelligence Statistics (50-50 Split) */}
      <div className="flex flex-col md:flex-row gap-4 shrink-0">
        <div className="flex-1 min-w-0 bg-card-bg border border-card-border rounded-xl p-4 flex flex-col justify-start relative">
          <h2 className="text-sm font-semibold text-monade uppercase tracking-wider mb-4 shrink-0">Agent Intelligence Statistics (Comprehensive)</h2>
          <div className="flex-1 w-full pb-6">
            <HorizontalBarChart data={data.agentIntelligenceComprehensive} colors={colorPalette} valueMode="absolute" />
          </div>
          <div className="absolute bottom-3 right-6 text-[10px] text-muted italic">
            *For calls more than 30 seconds
          </div>
        </div>

        <div className="flex-1 min-w-0 bg-card-bg border border-card-border rounded-xl p-4 flex flex-col justify-start relative">
          <h2 className="text-sm font-semibold text-monade uppercase tracking-wider mb-4 shrink-0">Everyday's Connection Rate</h2>
          <div className="flex-1 w-full pb-6">
            <DailyConnectionRateChart data={data.callVolume} />
          </div>
        </div>
      </div>

      {/* 5th Section: Objection Recovery & Saved Leads (50-50 Split) */}
      <div className="flex flex-col md:flex-row gap-4 shrink-0">
        <div className="flex-1 min-w-0 bg-card-bg border border-card-border rounded-xl p-4 flex flex-col justify-start">
          <h2 className="text-sm font-semibold text-monade uppercase tracking-wider mb-4 shrink-0">Objections Successfully Recovered</h2>
          <div className="flex-1 w-full pb-4">
            <HorizontalBarChart data={data.objectionRecovery} colors={colorPalette} valueMode="absolute" />
          </div>
        </div>

        <div className="flex-1 min-w-0 bg-card-bg border border-card-border rounded-xl p-4 flex flex-col justify-start">
          <h2 className="text-sm font-semibold text-monade uppercase tracking-wider mb-4 shrink-0">Saved Leads Impact</h2>
          <div className="flex-1 w-full pb-4">
            <HorizontalBarChart data={data.savedLeadsImpact} colors={colorPalette} valueMode="absolute" />
          </div>
        </div>
      </div>

      {/* 6th Section: Call Volume (Bottom) */}
      <div className="shrink-0 bg-card-bg border border-card-border rounded-xl p-4 flex flex-col justify-center">
        <h2 className="text-sm font-semibold text-monade uppercase tracking-wider mb-4 shrink-0">Call Volume (10 Days)</h2>
        <div className="flex-1 w-full pt-4 pb-8">
          <StackedColumnChart data={data.callVolume} config={callVolumeConfig} />
        </div>
      </div>

    </div>
  );
}
