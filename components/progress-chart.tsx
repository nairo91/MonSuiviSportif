"use client";

import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatDateShort } from "@/lib/format";

export function ProgressChart({
  data,
  valueKey,
  label,
}: {
  data: Array<{ date: string; [key: string]: number | string }>;
  valueKey: string;
  label: string;
}) {
  return (
    <div className="h-52 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ left: -30, right: 8, top: 8, bottom: 0 }}>
          <XAxis
            dataKey="date"
            tickFormatter={(value) => formatDateShort(value)}
            axisLine={false}
            tickLine={false}
            tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
            width={30}
          />
          <Tooltip
            contentStyle={{
              background: "rgba(10,16,30,0.96)",
              borderColor: "rgba(255,255,255,0.08)",
              borderRadius: 18,
              color: "#f8fafc",
            }}
            labelFormatter={(value) => formatDateShort(String(value))}
          />
          <Line
            type="monotone"
            dataKey={valueKey}
            name={label}
            stroke="var(--accent)"
            strokeWidth={3}
            dot={{ fill: "var(--accent)", r: 4 }}
            activeDot={{ r: 6, fill: "var(--accent)" }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
