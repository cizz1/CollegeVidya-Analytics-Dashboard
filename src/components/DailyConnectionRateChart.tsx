import React from "react";
import { DashboardData } from "@/utils/fetchData";

export default function DailyConnectionRateChart({
  data,
}: {
  data: DashboardData["daily"];
}) {
  const rates = data.map(row => {
    const rate = row.totalCalls > 0 ? (row.connected / row.totalCalls) * 100 : 0;
    return { name: row.name, rate };
  });

  const maxRate = 100; // Always 100% max for connection rate

  return (
    <div className="flex flex-col w-full" style={{ paddingLeft: "2.1276%", paddingRight: "2.1276%" }}>
      {/* Columns Container */}
      <div className="flex flex-row items-end justify-between gap-4 w-full h-[300px] pb-6 relative mt-4">
        {rates.map((row, rowIndex) => {
          const colHeight = (row.rate / maxRate) * 100;

          return (
            <div key={rowIndex} className="group relative flex flex-col items-center justify-end w-full max-w-[60px]" style={{ height: '100%' }}>
              
              {/* Tooltip */}
              <div className="opacity-0 group-hover:opacity-100 absolute bg-black text-xs px-2 py-1 rounded whitespace-nowrap z-20 pointer-events-none border border-card-border shadow-lg transition-opacity"
                   style={{ bottom: `calc(${Math.max(colHeight, 2)}% + 25px)` }}>
                {row.name}: {Math.round(row.rate)}%
              </div>

              {/* Bar */}
              <div 
                className="w-full rounded-t-sm overflow-hidden bg-[#00d26a] transition-all duration-500 hover:brightness-110"
                style={{ height: `${Math.max(colHeight, 2)}%`, minHeight: '8px' }}
              >
              </div>

              {/* Overlay Text */}
              {row.rate > 0 && (
                <span 
                  className="absolute text-[11px] text-[#00d26a] font-bold whitespace-nowrap pointer-events-none transition-all duration-500"
                  style={{ bottom: `calc(${Math.max(colHeight, 2)}% + 5px)` }}
                >
                  {Math.round(row.rate)}%
                </span>
              )}

              {/* X-Axis Label */}
              <span className="absolute top-full mt-2 text-[10px] text-muted font-medium whitespace-nowrap overflow-hidden text-ellipsis w-full text-center">
                {row.name.replace('2026-', '')} {/* Shorten date if it's long */}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
