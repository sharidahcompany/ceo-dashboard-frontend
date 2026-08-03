"use client";

import React, { useState } from "react";
import { useTranslations } from "next-intl";
import { useQuery } from "@tanstack/react-query";
import {
    BarChart,
    Bar,
    ComposedChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { DateRangeFilter, DateRange, lastNMonthsRange } from "@/components/ui/date-range-filter";
import { RadialGauge } from "@/components/ui/radial-gauge";
import { getWorkspaceReport } from "@/actions/workspace/reports.actions";

const CHART_COLORS = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)"];

function percentage(part: number | undefined, total: number): number {
    if (!total) return 0;
    return ((part ?? 0) / total) * 100;
}

function StatCard({ label, value, color }: { label: string; value: number | string; color?: string }) {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-muted-foreground text-sm font-normal">{label}</CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-2xl font-medium" style={color ? { color } : undefined}>
                    {value}
                </p>
            </CardContent>
        </Card>
    );
}

export function WorkspaceReports() {
    const t = useTranslations("workspace_reports");
    const [range, setRange] = useState<DateRange>(() => lastNMonthsRange(3));

    const { data: response, isLoading } = useQuery({
        queryKey: ["workspace-reports", range.from, range.to],
        queryFn: () => getWorkspaceReport({ start_date: range.from, end_date: range.to }),
    });

    const report = response?.success ? response.data.data : null;
    const errorMessage = response && !response.success ? response.error : null;

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-lg tracking-tight">{t("title")}</h2>
                    <p className="text-muted-foreground text-sm">{t("description")}</p>
                </div>
                <DateRangeFilter value={range} onChange={setRange} />
            </div>

            {isLoading && <Skeleton className="h-96 w-full rounded-xl" />}

            {errorMessage && <p className="text-sm text-destructive">{errorMessage}</p>}

            {report && (
                <div className="space-y-8">
                    <section className="space-y-3">
                        <h3 className="text-base font-medium">{t("gauges.title")}</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <RadialGauge
                                label={t("gauges.attendance_percentage")}
                                value={percentage(report.attendance.by_status["present"], report.attendance.total)}
                                color={CHART_COLORS[0]}
                            />
                            <RadialGauge
                                label={t("gauges.completed_projects_percentage")}
                                value={percentage(report.projects.by_status["complete"], report.projects.total)}
                                color={CHART_COLORS[2]}
                            />
                            <RadialGauge
                                label={t("gauges.completed_tasks_percentage")}
                                value={percentage(report.tasks.completed, report.tasks.total)}
                                color={CHART_COLORS[3]}
                            />
                        </div>
                    </section>

                    <section className="space-y-3">
                        <h3 className="text-base font-medium">{t("projects.title")}</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                            <StatCard label={t("projects.total")} value={report.projects.total} color={CHART_COLORS[0]} />
                            {Object.entries(report.projects.by_status).map(([status, count], index) => (
                                <StatCard
                                    key={status}
                                    label={t(`projects.status.${status}`)}
                                    value={count}
                                    color={CHART_COLORS[(index + 1) % CHART_COLORS.length]}
                                />
                            ))}
                        </div>
                        <div className="border rounded-xl bg-card p-4 h-72">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={report.projects.monthly} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                                    <XAxis dataKey="period" tick={{ fontSize: 12 }} stroke="var(--muted-foreground)" />
                                    <YAxis tick={{ fontSize: 12 }} stroke="var(--muted-foreground)" allowDecimals={false} />
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: "var(--popover)",
                                            borderColor: "var(--border)",
                                            borderRadius: 8,
                                            fontSize: 12,
                                        }}
                                    />
                                    <Legend wrapperStyle={{ fontSize: 12 }} />
                                    <Bar dataKey="total" name={t("projects.total")} fill={CHART_COLORS[0]} radius={[4, 4, 0, 0]} maxBarSize={40} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </section>

                    <section className="space-y-3">
                        <h3 className="text-base font-medium">{t("tasks.title")}</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <StatCard label={t("tasks.total")} value={report.tasks.total} color={CHART_COLORS[0]} />
                            <StatCard label={t("tasks.completed")} value={report.tasks.completed} color={CHART_COLORS[2]} />
                            <StatCard label={t("tasks.overdue")} value={report.tasks.overdue} color={CHART_COLORS[1]} />
                        </div>
                        <div className="border rounded-xl bg-card p-4 h-72">
                            <ResponsiveContainer width="100%" height="100%">
                                <ComposedChart data={report.tasks.monthly} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                                    <XAxis dataKey="period" tick={{ fontSize: 12 }} stroke="var(--muted-foreground)" />
                                    <YAxis tick={{ fontSize: 12 }} stroke="var(--muted-foreground)" allowDecimals={false} />
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: "var(--popover)",
                                            borderColor: "var(--border)",
                                            borderRadius: 8,
                                            fontSize: 12,
                                        }}
                                    />
                                    <Legend wrapperStyle={{ fontSize: 12 }} />
                                    <Bar dataKey="total" name={t("tasks.total")} fill={CHART_COLORS[0]} radius={[4, 4, 0, 0]} maxBarSize={40} />
                                    <Line dataKey="completed" name={t("tasks.completed")} stroke={CHART_COLORS[2]} strokeWidth={2} dot={{ r: 3 }} />
                                </ComposedChart>
                            </ResponsiveContainer>
                        </div>
                    </section>

                    <section className="space-y-3">
                        <h3 className="text-base font-medium">{t("attendance.title")}</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <StatCard label={t("attendance.total")} value={report.attendance.total} color={CHART_COLORS[0]} />
                            <StatCard label={t("attendance.late_minutes")} value={report.attendance.total_late_minutes} color={CHART_COLORS[1]} />
                            <StatCard label={t("attendance.overtime_minutes")} value={report.attendance.total_overtime_minutes} color={CHART_COLORS[3]} />
                        </div>
                        <div className="border rounded-xl bg-card p-4 h-72">
                            <ResponsiveContainer width="100%" height="100%">
                                <ComposedChart data={report.attendance.monthly} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                                    <XAxis dataKey="period" tick={{ fontSize: 12 }} stroke="var(--muted-foreground)" />
                                    <YAxis tick={{ fontSize: 12 }} stroke="var(--muted-foreground)" allowDecimals={false} />
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: "var(--popover)",
                                            borderColor: "var(--border)",
                                            borderRadius: 8,
                                            fontSize: 12,
                                        }}
                                    />
                                    <Legend wrapperStyle={{ fontSize: 12 }} />
                                    <Bar dataKey="total" name={t("attendance.total")} fill={CHART_COLORS[0]} radius={[4, 4, 0, 0]} maxBarSize={40} />
                                    <Line dataKey="late_minutes" name={t("attendance.late_minutes")} stroke={CHART_COLORS[1]} strokeWidth={2} dot={{ r: 3 }} />
                                    <Line dataKey="overtime_minutes" name={t("attendance.overtime_minutes")} stroke={CHART_COLORS[3]} strokeWidth={2} dot={{ r: 3 }} />
                                </ComposedChart>
                            </ResponsiveContainer>
                        </div>
                    </section>

                    <section className="space-y-3">
                        <h3 className="text-base font-medium">{t("buffet.title")}</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <StatCard label={t("buffet.total_orders")} value={report.buffet.total_orders} color={CHART_COLORS[0]} />
                            <StatCard label={t("buffet.total_revenue")} value={report.buffet.total_revenue.toFixed(2)} color={CHART_COLORS[2]} />
                        </div>
                        <div className="border rounded-xl bg-card p-4 h-72">
                            <ResponsiveContainer width="100%" height="100%">
                                <ComposedChart data={report.buffet.monthly} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                                    <XAxis dataKey="period" tick={{ fontSize: 12 }} stroke="var(--muted-foreground)" />
                                    <YAxis tick={{ fontSize: 12 }} stroke="var(--muted-foreground)" allowDecimals={false} />
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: "var(--popover)",
                                            borderColor: "var(--border)",
                                            borderRadius: 8,
                                            fontSize: 12,
                                        }}
                                    />
                                    <Legend wrapperStyle={{ fontSize: 12 }} />
                                    <Bar dataKey="total_orders" name={t("buffet.total_orders")} fill={CHART_COLORS[0]} radius={[4, 4, 0, 0]} maxBarSize={40} />
                                    <Line dataKey="total_revenue" name={t("buffet.total_revenue")} stroke={CHART_COLORS[2]} strokeWidth={2} dot={{ r: 3 }} />
                                </ComposedChart>
                            </ResponsiveContainer>
                        </div>
                    </section>
                </div>
            )}
        </div>
    );
}
