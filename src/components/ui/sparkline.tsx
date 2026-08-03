"use client";

import React from "react";
import { AreaChart, Area, Tooltip, ResponsiveContainer } from "recharts";

interface SparklinePoint {
    label: string;
    value: number;
}

interface SparklineProps {
    data: SparklinePoint[];
    color?: string;
    height?: number;
    formatValue?: (value: number) => string;
}

export function Sparkline({ data, color = "var(--chart-1)", height = 40, formatValue }: SparklineProps) {
    if (data.length < 2) {
        return null;
    }

    return (
        <div style={{ height }}>
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data} margin={{ top: 4, right: 2, left: 2, bottom: 0 }}>
                    <defs>
                        <linearGradient id={`sparkline-fill-${color}`} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor={color} stopOpacity={0.1} />
                            <stop offset="100%" stopColor={color} stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    <Tooltip
                        cursor={false}
                        formatter={(value) => [formatValue ? formatValue(Number(value)) : value, ""] as [React.ReactNode, string]}
                        labelFormatter={(label) => label as string}
                        contentStyle={{
                            backgroundColor: "var(--popover)",
                            borderColor: "var(--border)",
                            borderRadius: 8,
                            fontSize: 12,
                            padding: "4px 8px",
                        }}
                    />
                    <Area
                        type="monotone"
                        dataKey="value"
                        stroke={color}
                        strokeWidth={2}
                        fill={`url(#sparkline-fill-${color})`}
                        dot={false}
                        activeDot={{ r: 4, fill: color, stroke: "var(--card)", strokeWidth: 2 }}
                        isAnimationActive={false}
                    />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
}
