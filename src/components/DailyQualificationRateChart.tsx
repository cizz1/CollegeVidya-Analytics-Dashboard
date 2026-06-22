import React from "react";
import { DashboardData } from "@/utils/fetchData";

export default function DailyQualificationRateChart({
  data,
}: {
  data: DashboardData["daily"];
}) {
  const rates = data.map(row => {
    // Qualification rate is calculated out of connected calls
    const rate = row.connected > 0 ? (row.qualified / row.connected) * 100 : 0;
    return { name: row.name, rate };
  });

  // Scale so the highest bar hits ~95% of the container to maximize height visibility
  const maxRate = Math.max(...rates.map(r => r.rate), 1) / 0.95;

  return (
    <div className="shrink-0 bg-card-bg border border-card-border rounded-xl p-4 flex flex-col justify-center w-full mt-4">
      <h2 className="text-sm font-semibold text-monade uppercase tracking-wider mb-4 shrink-0">Daily Qualification Rate</h2>
      <div className="flex-1 w-full pb-6 relative mt-4" style={{ paddingLeft: "2.1276%", paddingRight: "2.1276%" }}>
        
        {/* Columns Container */}
        <div className="flex flex-row items-end justify-between gap-4 w-full h-[300px] relative">
          {rates.map((row, rowIndex) => {
            const colHeight = (row.rate / maxRate) * 100;

            return (
              <div key={rowIndex} className="group relative flex flex-col items-center justify-end w-full max-w-[80px]" style={{ height: '100%' }}>
                
                {/* Tooltip */}
                <div className="opacity-0 group-hover:opacity-100 absolute bg-black text-xs px-2 py-1 rounded whitespace-nowrap z-20 pointer-events-none border border-card-border shadow-lg transition-opacity"
                     style={{ bottom: `calc(${Math.max(colHeight, 2)}% + 25px)` }}>
                  {row.name}: {row.rate.toFixed(1)}%
                </div>

                {/* Bar */}
                <div 
                  className="w-full rounded-t-sm overflow-hidden bg-[#00d26a] transition-all duration-500 hover:brightness-110"
                  style={{ height: `${Math.max(colHeight, 2)}%`, minHeight: '8px' }}
                >
                </div>

                {/* X-Axis Label */}
                <span className="absolute top-full mt-2 text-xs text-muted font-medium whitespace-nowrap overflow-hidden text-ellipsis w-full text-center">
                  {row.name.replace('2026-', '')}
                </span>
                
                {/* Overlay Text above bar */}
                {row.rate > 0 && (
                  <span 
                    className="absolute text-[12px] text-[#00d26a] font-bold whitespace-nowrap pointer-events-none transition-all duration-500"
                    style={{ bottom: `calc(${Math.max(colHeight, 2)}% + 5px)` }}
                  >
                    {row.rate.toFixed(1)}%
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
