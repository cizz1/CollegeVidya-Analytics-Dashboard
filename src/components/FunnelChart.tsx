import React from "react";
import { DashboardData } from "@/utils/fetchData";

type FunnelNodeProps = {
  x: number;
  y: number;
  w: number;
  h: number;
  label: string;
  value: number;
  color: string;
  denominator: number;
};

function FunnelNode({ x, y, w, h, label, value, color, denominator }: FunnelNodeProps) {
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} fill={color} rx={4} />
      <text x={x + w / 2} y={y + h / 2 - 6} fill="#fff" fontSize={11} fontWeight="bold" textAnchor="middle" dominantBaseline="middle">
        {label}
      </text>
      <text x={x + w / 2} y={y + h / 2 + 8} fill="rgba(255,255,255,0.7)" fontSize={9} textAnchor="middle" dominantBaseline="middle">
        {value.toLocaleString()} ({Math.round((value / (denominator || 1)) * 100)}%)
      </text>
    </g>
  );
}

export default function FunnelChart({ data, avgScore, uncertainReasons = [] }: { data: DashboardData["funnel"], avgScore: number, uncertainReasons?: { name: string, value: number }[] }) {
  const { totalCalls, connected, didNotConnect, notInterested, qualified } = data;

  // Extract the 3 sub-buckets for Uncertain
  const getReasonVal = (name: string) => uncertainReasons.find(r => r.name.toLowerCase().includes(name.toLowerCase()))?.value || 0;
  const uncDisconnected = getReasonVal("Disconnected on hearing reason");
  const uncVoicemail = getReasonVal("Voicemail");
  // Everything else goes to "Other"
  const uncOther = uncertainReasons.filter(r => 
    !r.name.toLowerCase().includes("disconnected on hearing reason") && 
    !r.name.toLowerCase().includes("voicemail")
  ).reduce((acc, curr) => acc + curr.value, 0);

  // Fallback to data.uncertain if empty
  const uncertain = (uncDisconnected + uncVoicemail + uncOther) || data.uncertain;

  const width = 940;
  const height = 280; // Reduced height by ~50%
  
  // Dimensions
  const boxWidth = 200;
  const gap = 4;
  const startX = 20;
  const totalY = 15;
  const maxH = height - 40; 

  // Calculate Heights based on values
  const scale = (val: number) => Math.max((val / totalCalls) * maxH, 32); // min 32px for tight stacking

  const hTotal = scale(totalCalls);
  const hConnected = scale(connected);
  const hDidNotConnect = scale(didNotConnect);

  // Stage 1
  const x1 = startX;
  const y1 = totalY;

  // Stage 2
  const x2 = startX + boxWidth + 150; 
  const y2Conn = y1;
  const y2Dnc = y2Conn + hConnected + gap * 2;

  // Stage 3 split
  const hNI = scale(notInterested);
  const hUncDisc = scale(uncDisconnected || (uncertain * 0.6)); // fallback splits if 0
  const hUncVoice = scale(uncVoicemail || (uncertain * 0.2));
  const hUncOther = scale(uncOther || (uncertain * 0.2));
  const hQual = scale(qualified);

  const x3 = x2 + boxWidth + 150; 
  
  const y3NI = y2Conn;
  const y3UncDisc = y3NI + hNI + gap;
  const y3UncVoice = y3UncDisc + hUncDisc + gap;
  const y3UncOther = y3UncVoice + hUncVoice + gap;
  const y3Qual = y3UncOther + hUncOther + gap;

  // Proportional heights for link start points to prevent overflowing parent boxes
  const sumStage2 = connected + didNotConnect || 1;
  const propConn = (connected / sumStage2) * hTotal;
  const propDnc = (didNotConnect / sumStage2) * hTotal;

  const sumStage3 = notInterested + uncertain + qualified || 1;
  const propNI = (notInterested / sumStage3) * hConnected;
  const propUncDisc = ((uncDisconnected || uncertain * 0.6) / sumStage3) * hConnected;
  const propUncVoice = ((uncVoicemail || uncertain * 0.2) / sumStage3) * hConnected;
  const propUncOther = ((uncOther || uncertain * 0.2) / sumStage3) * hConnected;
  const propQual = (qualified / sumStage3) * hConnected;

  const leftY2UncDisc = y2Conn + propNI;
  const leftY2UncVoice = leftY2UncDisc + propUncDisc;
  const leftY2UncOther = leftY2UncVoice + propUncVoice;
  const leftY2Qual = leftY2UncOther + propUncOther;

  // Paths
  const createPath = (sx: number, sy: number, sh: number, ex: number, ey: number, eh: number) => {
    const cx = (sx + ex) / 2;
    return `M ${sx} ${sy} C ${cx} ${sy}, ${cx} ${ey}, ${ex} ${ey} L ${ex} ${ey + eh} C ${cx} ${ey + eh}, ${cx} ${sy + sh}, ${sx} ${sy + sh} Z`;
  };

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto" preserveAspectRatio="xMidYMid meet">
      
      {/* Links Stage 1 -> Stage 2 */}
      <path d={createPath(x1 + boxWidth, y1, propConn, x2, y2Conn, hConnected)} fill="#FFC700" opacity={0.2} />
      <path d={createPath(x1 + boxWidth, y1 + propConn, propDnc, x2, y2Dnc, hDidNotConnect)} fill="#a3a3a3" opacity={0.15} />

      {/* Links Stage 2 -> Stage 3 */}
      <path d={createPath(x2 + boxWidth, y2Conn, propNI, x3, y3NI, hNI)} fill="#ff3b3b" opacity={0.2} />
      <path d={createPath(x2 + boxWidth, leftY2UncDisc, propUncDisc, x3, y3UncDisc, hUncDisc)} fill="#ff7700" opacity={0.2} />
      <path d={createPath(x2 + boxWidth, leftY2UncVoice, propUncVoice, x3, y3UncVoice, hUncVoice)} fill="#ff9100" opacity={0.15} />
      <path d={createPath(x2 + boxWidth, leftY2UncOther, propUncOther, x3, y3UncOther, hUncOther)} fill="#ffaa00" opacity={0.1} />
      <path d={createPath(x2 + boxWidth, leftY2Qual, propQual, x3, y3Qual, hQual)} fill="#00d26a" opacity={0.2} />

      {/* Stage 1 */}
      <FunnelNode x={x1} y={y1} w={boxWidth} h={hTotal} label="Total Calls" value={totalCalls} color="#FFC700" denominator={totalCalls} />

      {/* Stage 2 */}
      <FunnelNode x={x2} y={y2Conn} w={boxWidth} h={hConnected} label="Connected" value={connected} color="#FFC700" denominator={totalCalls} />
      <FunnelNode x={x2} y={y2Dnc} w={boxWidth} h={hDidNotConnect} label="Did Not Connect" value={didNotConnect} color="#333333" denominator={totalCalls} />

      {/* Stage 3 */}
      <FunnelNode x={x3} y={y3NI} w={boxWidth} h={hNI} label="Not Interested" value={notInterested} color="#ff3b3b" denominator={sumStage3} />
      <FunnelNode x={x3} y={y3UncDisc} w={boxWidth} h={hUncDisc} label="Disconnected on hearing reason" value={uncDisconnected || uncertain * 0.6} color="#ff7700" denominator={sumStage3} />
      <FunnelNode x={x3} y={y3UncVoice} w={boxWidth} h={hUncVoice} label="Voicemail" value={uncVoicemail || uncertain * 0.2} color="#ff9100" denominator={sumStage3} />
      <FunnelNode x={x3} y={y3UncOther} w={boxWidth} h={hUncOther} label="Other Uncertain" value={uncOther || uncertain * 0.2} color="#ffaa00" denominator={sumStage3} />
      <FunnelNode x={x3} y={y3Qual} w={boxWidth} h={hQual} label="Qualified" value={qualified} color="#00d26a" denominator={sumStage3} />

      {/* Avg Qualified Score Card */}
      <g transform={`translate(${x3}, ${y2Dnc + hDidNotConnect - 32})`}>
        <rect x={0} y={0} width={boxWidth} height={32} fill="#1a1a1a" stroke="#262626" strokeWidth={1} rx={4} />
        <text x={8} y={16} fill="#a3a3a3" fontSize={9} fontWeight="bold" textAnchor="start" dominantBaseline="middle">
          AVG QUALIFIED SCORE:
        </text>
        <text x={boxWidth - 8} y={16} fill="#00d26a" fontSize={12} fontWeight="bold" textAnchor="end" dominantBaseline="middle">
          {avgScore}%
        </text>
      </g>
      
    </svg>
  );
}
