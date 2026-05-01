import React, { useMemo } from "react";
import { DashboardData } from "@/utils/fetchData";

export default function FunnelChart({ data }: { data: DashboardData["funnel"] }) {
  const { totalCalls, connected, didNotConnect, notInterested, uncertain, qualified } = data;

  const width = 1000;
  const height = 600;
  
  // Dimensions
  const boxWidth = 200;
  const gap = 15;
  const startX = 20;
  const totalY = 50;
  const maxH = height - 100; // 500

  // Calculate Heights based on values
  // We want to scale them relative to maxH
  // but if the total isn't exact, we scale by totalCalls.
  const scale = (val: number) => (val / totalCalls) * maxH;

  const hTotal = scale(totalCalls);
  const hConnected = scale(connected);
  const hDidNotConnect = scale(didNotConnect);

  // Stage 1
  const x1 = startX;
  const y1 = totalY;

  // Stage 2
  const x2 = startX + boxWidth + 150; // 370
  // Connected is top
  const y2Conn = y1;
  // Did not connect is bottom
  const y2Dnc = y2Conn + hConnected + gap;

  // Stage 3
  const x3 = x2 + boxWidth + 150; // 720
  // Ensure that Stage 3 sum matches Connected visually, ignoring gap for now or factoring it in
  // Let's base them on the actual scale
  const hNI = scale(notInterested);
  const hUnc = scale(uncertain);
  const hQual = scale(qualified);

  const y3NI = y2Conn;
  const y3Unc = y3NI + hNI + gap;
  const y3Qual = y3Unc + hUnc + gap;

  // Paths
  const createPath = (sx: number, sy: number, sh: number, ex: number, ey: number, eh: number) => {
    const cx = (sx + ex) / 2;
    return `M ${sx} ${sy} C ${cx} ${sy}, ${cx} ${ey}, ${ex} ${ey} L ${ex} ${ey + eh} C ${cx} ${ey + eh}, ${cx} ${sy + sh}, ${sx} ${sy + sh} Z`;
  };

  // Node component
  const Node = ({ x, y, w, h, label, value, color }: any) => (
    <g>
      <rect x={x} y={y} width={w} height={h} fill={color} rx={4} />
      {h > 30 && (
        <text x={x + w / 2} y={y + h / 2} fill="#fff" fontSize={14} fontWeight="bold" textAnchor="middle" dominantBaseline="middle">
          {label}
        </text>
      )}
      {h > 45 && (
        <text x={x + w / 2} y={y + h / 2 + 18} fill="rgba(255,255,255,0.7)" fontSize={12} textAnchor="middle" dominantBaseline="middle">
          {value.toLocaleString()} ({Math.round((value / totalCalls) * 100)}%)
        </text>
      )}
    </g>
  );

  // Arrow component
  const Arrow = ({ x, y, width }: any) => (
    <g>
      <line x1={x} y1={y} x2={x + width - 10} y2={y} stroke="#FFC700" strokeWidth="2" strokeDasharray="4 2" />
      <polygon points={`${x + width - 10},${y - 5} ${x + width},${y} ${x + width - 10},${y + 5}`} fill="#FFC700" />
    </g>
  );

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full" preserveAspectRatio="xMidYMid meet">
      
      {/* Links Stage 1 -> Stage 2 */}
      <path d={createPath(x1 + boxWidth, y1, hConnected, x2, y2Conn, hConnected)} fill="#FFC700" opacity={0.2} />
      <path d={createPath(x1 + boxWidth, y1 + hConnected, hDidNotConnect, x2, y2Dnc, hDidNotConnect)} fill="#a3a3a3" opacity={0.15} />

      {/* Links Stage 2 -> Stage 3 */}
      {/* For connected to splits, we need to map the starting Y positions dynamically from within the connected box */}
      <path d={createPath(x2 + boxWidth, y2Conn, hNI, x3, y3NI, hNI)} fill="#ff3b3b" opacity={0.2} />
      <path d={createPath(x2 + boxWidth, y2Conn + hNI, hUnc, x3, y3Unc, hUnc)} fill="#ff7700" opacity={0.2} />
      <path d={createPath(x2 + boxWidth, y2Conn + hNI + hUnc, hQual, x3, y3Qual, hQual)} fill="#00d26a" opacity={0.2} />

      {/* Stage 1 */}
      <Node x={x1} y={y1} w={boxWidth} h={hTotal} label="Total Calls" value={totalCalls} color="#FFC700" />

      {/* Stage 2 */}
      <Node x={x2} y={y2Conn} w={boxWidth} h={hConnected} label="Connected" value={connected} color="#FFC700" />
      <Node x={x2} y={y2Dnc} w={boxWidth} h={hDidNotConnect} label="Did Not Connect" value={didNotConnect} color="#333333" />

      {/* Stage 3 */}
      <Node x={x3} y={y3NI} w={boxWidth} h={hNI} label="Not Interested" value={notInterested} color="#ff3b3b" />
      <Node x={x3} y={y3Unc} w={boxWidth} h={hUnc} label="Uncertain" value={uncertain} color="#ff7700" />
      <Node x={x3} y={y3Qual} w={boxWidth} h={hQual} label="Qualified" value={qualified} color="#00d26a" />

      {/* Arrows */}
      <Arrow x={x3 + boxWidth + 10} y={y3NI + hNI / 2} width={width - (x3 + boxWidth + 10)} />
      <Arrow x={x3 + boxWidth + 10} y={y3Unc + hUnc / 2} width={width - (x3 + boxWidth + 10)} />
      <Arrow x={x3 + boxWidth + 10} y={y3Qual + hQual / 2} width={width - (x3 + boxWidth + 10)} />
      
    </svg>
  );
}