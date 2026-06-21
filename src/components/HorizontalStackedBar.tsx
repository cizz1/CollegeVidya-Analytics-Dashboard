import React from "react";

export default function HorizontalStackedBar({
  data,
  colors,
}: {
  data: { name: string; value: number }[];
  colors: string[];
}) {
  const total = data.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className="flex flex-col gap-3 h-full justify-center">
      {/* The Bar */}
      <div className="flex w-full h-8 rounded-md overflow-hidden bg-card-border shrink-0">
        {data.map((item, index) => {
          const width = (item.value / total) * 100;
          if (width === 0) return null;
          return (
            <div
              key={index}
              style={{
                width: `${width}%`,
                backgroundColor: colors[index % colors.length],
              }}
              className="h-full flex items-center justify-center transition-all hover:brightness-110 relative group"
            >
              <div className="opacity-0 group-hover:opacity-100 absolute bottom-full mb-1 bg-black text-xs px-2 py-1 rounded whitespace-nowrap z-10 pointer-events-none border border-card-border shadow-lg">
                {item.name}: {item.value} ({width.toFixed(1)}%)
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-x-6 gap-y-3 mt-3 overflow-y-auto pr-2 custom-scrollbar flex-1 content-start">
        {data.map((item, index) => (
          <div key={index} className="flex items-start gap-2 text-xs max-w-[300px]">
            <span
              className="w-2.5 h-2.5 rounded-full shrink-0 mt-[2px]"
              style={{ backgroundColor: colors[index % colors.length] }}
            />
            <span className="text-foreground whitespace-normal leading-tight" title={item.name}>
              {item.name}
            </span>
            <span className="text-muted font-mono shrink-0">{((item.value / total) * 100).toFixed(0)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}