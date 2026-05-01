import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { DashboardData } from "@/utils/fetchData";

const COLORS = {
  didNotConnect: "#a3a3a3", // Muted
  notInterested: "#ff3b3b", // Red
  uncertain: "#ff7700", // Orange
  qualified: "#00d26a", // Green
};

export default function ScriptPerformanceChart({
  data,
}: {
  data: DashboardData["scriptPerformance"];
}) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart
        data={data}
        margin={{
          top: 20,
          right: 30,
          left: 0,
          bottom: 5,
        }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#262626" vertical={false} />
        <XAxis
          dataKey="name"
          stroke="#a3a3a3"
          tick={{ fill: "#a3a3a3", fontSize: 12 }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          stroke="#a3a3a3"
          tick={{ fill: "#a3a3a3", fontSize: 12 }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip
          contentStyle={{ backgroundColor: "#141414", borderColor: "#262626", borderRadius: "8px" }}
          itemStyle={{ color: "#ededed" }}
          cursor={{ fill: "#262626", opacity: 0.4 }}
        />
        <Legend wrapperStyle={{ fontSize: "12px", color: "#a3a3a3" }} />
        <Bar dataKey="didNotConnect" stackId="a" fill={COLORS.didNotConnect} name="Did Not Connect" radius={[0, 0, 4, 4]} />
        <Bar dataKey="notInterested" stackId="a" fill={COLORS.notInterested} name="Not Interested" />
        <Bar dataKey="uncertain" stackId="a" fill={COLORS.uncertain} name="Uncertain" />
        <Bar dataKey="qualified" stackId="a" fill={COLORS.qualified} name="Qualified" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}