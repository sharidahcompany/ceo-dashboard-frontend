"use client";

import { RadialBar, RadialBarChart, PolarAngleAxis, ResponsiveContainer } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface RadialGaugeProps {
    label: string;
    value: number;
    color?: string;
}

export function RadialGauge({ label, value, color = "var(--chart-1)" }: RadialGaugeProps) {
    const clamped = Math.max(0, Math.min(100, value));
    const data = [{ value: clamped, fill: color }];

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-muted-foreground text-sm font-normal">{label}</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="relative h-32">
                    <ResponsiveContainer width="100%" height="100%">
                        <RadialBarChart
                            data={data}
                            startAngle={90}
                            endAngle={-270}
                            innerRadius="75%"
                            outerRadius="100%"
                            barSize={10}
                        >
                            <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
                            <RadialBar dataKey="value" cornerRadius={6} background={{ fill: "var(--muted)" }} />
                        </RadialBarChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-2xl font-medium" style={{ color }}>
                            {clamped.toFixed(0)}%
                        </span>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
