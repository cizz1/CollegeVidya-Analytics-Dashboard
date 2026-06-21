import React from "react";

export default function HorizontalBarChart({
  data,
  colors,
  valueMode = "percentage",
}: {
  data: { name: string; value: number }[];
  colors: string[];
  valueMode?: "percentage" | "absolute" | "fixed-100";
}) {
  const referenceValue = valueMode === "percentage" 
    ? data.reduce((sum, item) => sum + item.value, 0)
    : valueMode === "fixed-100" 
      ? 100 
      : Math.max(...data.map(d => d.value), 1);

  return (
    <div className="flex flex-col justify-start w-full" style={{ paddingLeft: "2.1276%", paddingRight: "2.1276%" }}>
      <div className="flex flex-col gap-5 w-full">
        {data.map((item, index) => {
          const width = referenceValue > 0 ? (item.value / referenceValue) * 100 : 0;
          if (width === 0) return null;

          return (
            <div key={index} className="flex flex-col w-full group">
              <div className="flex justify-between items-end mb-2 gap-4">
                <span className="text-base text-foreground leading-tight flex-1 whitespace-normal font-medium">
                  {item.name}
                </span>
                <span className="text-sm text-muted font-mono shrink-0">
                  {item.value.toLocaleString()}{valueMode === "fixed-100" ? "%" : ""} {valueMode === "percentage" && `(${width.toFixed(0)}%)`}
                </span>
              </div>
              <div className="w-full h-2.5 bg-card-border rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500 group-hover:brightness-110"
                  style={{
                    width: `${width}%`,
                    backgroundColor: colors[index % colors.length],
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
