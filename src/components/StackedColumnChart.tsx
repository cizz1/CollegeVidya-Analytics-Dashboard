import React from "react";
import { StackedBarConfig, StackedChartRow } from "./StackedBarChart";

export default function StackedColumnChart({
  data,
  config,
}: {
  data: StackedChartRow[];
  config: StackedBarConfig[];
}) {
  // Calculate total for each column to find the max total for scaling
  const totals = data.map((row) =>
    config.reduce((sum, c) => sum + Number(row[c.key] || 0), 0)
  );
  const maxTotal = Math.max(...totals, 1);

  return (
    <div className="flex flex-col w-full h-full" style={{ paddingLeft: "2.1276%", paddingRight: "2.1276%" }}>
      {/* Legend */}
      <div className="flex flex-wrap gap-x-6 gap-y-3 mb-6 mt-2">
        {config.map((item, index) => (
          <div key={index} className="flex items-center gap-2 text-xs">
            <span
              className="w-2.5 h-2.5 rounded-full shrink-0"
              style={{ backgroundColor: item.color }}
            />
            <span className="text-muted font-medium">{item.label}</span>
          </div>
        ))}
      </div>

      {/* Columns Container */}
      <div className="flex flex-row items-end justify-between gap-4 w-full h-[300px] pb-6 relative">
        {data.map((row, rowIndex) => {
          const total = totals[rowIndex];
          const colHeight = (total / maxTotal) * 100;

          return (
            <div key={rowIndex} className="flex flex-col items-center justify-end h-full flex-1 group relative">
              
              {/* Total Tooltip (Hover on column) */}
              <div className="opacity-0 group-hover:opacity-100 absolute bottom-[calc(100%+5px)] bg-black text-xs px-2 py-1 rounded whitespace-nowrap z-20 pointer-events-none border border-card-border shadow-lg transition-opacity">
                Total: {total.toLocaleString()}
              </div>

              {/* Stacked Segments */}
              <div 
                className="w-full max-w-[60px] flex flex-col-reverse rounded-t-sm overflow-hidden"
                style={{ height: `${colHeight}%` }}
              >
                {config.map((c, i) => {
                  const val = Number(row[c.key] || 0);
                  const segmentHeight = total > 0 ? (val / total) * 100 : 0;
                  if (segmentHeight === 0) return null;

                  return (
                    <div
                      key={i}
                      className="w-full transition-all duration-500 hover:brightness-110 relative flex items-center justify-center group/segment"
                      style={{
                        height: `${segmentHeight}%`,
                        backgroundColor: c.color,
                      }}
                    >
                      {/* Segment Tooltip */}
                      <div className="opacity-0 group-hover/segment:opacity-100 absolute left-full ml-2 bg-black text-xs px-2 py-1 rounded whitespace-nowrap z-30 pointer-events-none border border-card-border shadow-lg">
                        {c.label}: {val.toLocaleString()}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* X-Axis Label */}
              <span className="absolute top-full mt-2 text-[11px] text-muted font-medium whitespace-nowrap overflow-hidden text-ellipsis w-full text-center">
                {row.name}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
