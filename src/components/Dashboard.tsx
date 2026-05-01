import React from "react";
import { DashboardData } from "@/utils/fetchData";
import FunnelChart from "./FunnelChart";
import HorizontalStackedBar from "./HorizontalStackedBar";
import ScriptPerformanceChart from "./ScriptPerformanceChart";

const colorPalette = ["#ff7700", "#ff3b3b", "#FFC700", "#00d26a", "#a3a3a3", "#262626"];

export default function Dashboard({ data }: { data: DashboardData }) {
  return (
    <div className="flex flex-col h-full w-full p-4 gap-4 bg-background">
      
      {/* Top Half: Funnel and Breakdown charts */}
      <div className="flex-1 flex gap-4 min-h-0">
        {/* Funnel Section (Left) */}
        <div className="flex-[3] relative bg-card-bg border border-card-border rounded-xl p-4 flex flex-col">
          <h2 className="text-sm font-semibold text-muted uppercase tracking-wider mb-2 shrink-0">Call Funnel & Qualifications</h2>
          <div className="flex-1 w-full relative">
            <FunnelChart data={data.funnel} />
          </div>
        </div>

        {/* Breakdown Section (Right) */}
        <div className="flex-[2] flex flex-col gap-4 min-h-0">
          
          <div className="flex gap-4 flex-[1.2] min-h-0">
            {/* Why Not Interested */}
            <div className="flex-1 bg-card-bg border border-card-border rounded-xl p-4 flex flex-col justify-center">
              <h2 className="text-sm font-semibold text-monade uppercase tracking-wider mb-4">Why Not Interested</h2>
              <HorizontalStackedBar data={data.notInterestedReasons} colors={colorPalette} />
            </div>

            {/* Avg Confidence Score */}
            <div className="w-[180px] bg-card-bg border border-card-border rounded-xl p-4 flex flex-col items-center justify-center">
              <h2 className="text-xs font-semibold text-muted uppercase tracking-wider text-center mb-2">
                Avg Qualified<br/>Confidence Score
              </h2>
              <div className="text-5xl font-bold text-green flex items-baseline">
                {data.avgQualifiedScore}<span className="text-xl ml-1 text-muted">%</span>
              </div>
            </div>
          </div>

          {/* Why Uncertain */}
          <div className="flex-[1] min-h-0 bg-card-bg border border-card-border rounded-xl p-4 flex flex-col justify-center">
            <h2 className="text-sm font-semibold text-monade uppercase tracking-wider mb-4">Why Uncertain</h2>
            <HorizontalStackedBar data={data.uncertainReasons} colors={colorPalette} />
          </div>
        </div>
      </div>

      {/* Bottom Half: Script Performance */}
      <div className="h-[30vh] shrink-0 bg-card-bg border border-card-border rounded-xl p-4 flex flex-col">
        <h2 className="text-sm font-semibold text-muted uppercase tracking-wider mb-2 shrink-0">Script Performance</h2>
        <div className="flex-1 w-full relative">
          <ScriptPerformanceChart data={data.scriptPerformance} />
        </div>
      </div>

    </div>
  );
}