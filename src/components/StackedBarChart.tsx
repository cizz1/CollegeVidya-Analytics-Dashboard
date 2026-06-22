import React from "react";

export interface StackedBarConfig {
  key: string;
  label: string;
  color: string;
}

export type StackedChartRow = {
  name: string;
  [key: string]: string | number;
};

export default function StackedBarChart({
  data,
  config,
}: {
  data: StackedChartRow[];
  config: StackedBarConfig[];
}) {
  return (
    <div className="flex flex-col w-full" style={{ paddingLeft: "2.1276%", paddingRight: "2.1276%" }}>
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

      {/* Bars */}
      <div className="flex flex-col gap-5 w-full">
        {data.map((row, rowIndex) => {
          const total = config.reduce((sum, c) => sum + Number(row[c.key] || 0), 0);

          return (
            <div key={rowIndex} className="flex flex-col w-full group">
              <div className="flex justify-between items-end mb-2 gap-4">
                <span className="text-base text-foreground leading-tight whitespace-normal font-medium w-24 shrink-0">
                  {row.name}
                </span>
                <span className="text-sm text-muted font-mono shrink-0">
                  Total: {total.toLocaleString()}
                </span>
              </div>
              <div className="w-full h-2.5 bg-card-border rounded-full overflow-hidden flex">
                {config.map((c, i) => {
                  const val = Number(row[c.key] || 0);
                  const width = total > 0 ? (val / total) * 100 : 0;
                  if (width === 0) return null;

                  return (
                    <div
                      key={i}
                      className="h-full transition-all duration-500 group-hover:brightness-110 relative flex items-center justify-center group/segment"
                      style={{
                        width: `${width}%`,
                        backgroundColor: c.color,
                      }}
                    >
                      {/* Tooltip */}
                      <div className="opacity-0 group-hover/segment:opacity-100 absolute bottom-full mb-1 bg-black text-xs px-2 py-1 rounded whitespace-nowrap z-10 pointer-events-none border border-card-border shadow-lg">
                        {c.label}: {val.toLocaleString()} ({width.toFixed(1)}%)
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
