"use client";

import React from "react";
import { useTranslations, useLocale } from "next-intl";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { RadialGauge } from "@/components/ui/radial-gauge";
import { getAttendances } from "@/actions/workspace/attendance.actions";
import { getMissions } from "@/actions/workspace/missions.actions";
import { getUserTasks } from "@/actions/projects/projects.actions";

const GAUGE_COLORS = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)"];

function percentage(part: number, total: number): number {
    if (!total) return 0;
    return (part / total) * 100;
}

function formatDate(value: string | null | undefined, locale: string): string {
    if (!value) return "-";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleDateString(locale);
}

function formatDateTime(value: string | null | undefined, locale: string): string {
    if (!value) return "-";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleString(locale, { dateStyle: "medium", timeStyle: "short" });
}

function formatTime(value: string | null | undefined, locale: string): string {
    if (!value) return "-";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit" });
}

interface EmployeeReportsProps {
    employeeId: string;
}

function StatCard({ label, value }: { label: string; value: number | string }) {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-muted-foreground text-sm font-normal">{label}</CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-2xl font-medium">{value}</p>
            </CardContent>
        </Card>
    );
}

export default function EmployeeReports({ employeeId }: EmployeeReportsProps) {
    const t = useTranslations();
    const locale = useLocale();

    const { data: attendanceRes, isLoading: attendanceLoading } = useQuery({
        queryKey: ["employee-attendance-report", employeeId],
        queryFn: () => getAttendances(`user_id=${employeeId}&per_page=10`),
    });

    const { data: missionsRes, isLoading: missionsLoading } = useQuery({
        queryKey: ["employee-missions-report", employeeId],
        queryFn: () => getMissions(`assignee_ids[]=${employeeId}&per_page=10`),
    });

    const { data: tasksRes, isLoading: tasksLoading } = useQuery({
        queryKey: ["employee-tasks-report", employeeId],
        queryFn: () => getUserTasks(employeeId),
    });

    const attendances = attendanceRes?.success ? attendanceRes.data.data : [];
    const lateCount = attendances.filter((a) => (a.late_minutes ?? 0) > 0).length;

    const missions = missionsRes?.success ? missionsRes.data.data : [];
    const completedMissions = missions.filter((m) => m.status?.value === "completed").length;

    const tasks = tasksRes?.success ? tasksRes.data : [];
    const completedTasks = tasks.filter((tk) => tk.is_completed).length;

    const gaugesLoading = attendanceLoading || missionsLoading || tasksLoading;

    return (
        <div className="space-y-6">
            <Card className="w-full">
                <CardHeader className="border-b">
                    <CardTitle>{t("attributes.performance_overview")}</CardTitle>
                    <CardDescription>{t("messages.employees.performance_overview_description")}</CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                    {gaugesLoading ? (
                        <Skeleton className="h-32 w-full rounded-xl" />
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <RadialGauge
                                label={t("attributes.on_time_rate")}
                                value={percentage(attendances.length - lateCount, attendances.length)}
                                color={GAUGE_COLORS[0]}
                            />
                            <RadialGauge
                                label={t("attributes.missions_completion_rate")}
                                value={percentage(completedMissions, missions.length)}
                                color={GAUGE_COLORS[1]}
                            />
                            <RadialGauge
                                label={t("attributes.tasks_completion_rate")}
                                value={percentage(completedTasks, tasks.length)}
                                color={GAUGE_COLORS[2]}
                            />
                        </div>
                    )}
                </CardContent>
            </Card>

            <Card className="w-full">
                <CardHeader className="border-b">
                    <CardTitle>{t("attributes.attendance_report")}</CardTitle>
                    <CardDescription>{t("messages.employees.attendance_report_description")}</CardDescription>
                </CardHeader>
                <CardContent className="pt-6 space-y-4">
                    {attendanceLoading ? (
                        <Skeleton className="h-32 w-full rounded-xl" />
                    ) : (
                        <>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <StatCard label={t("attributes.total_records")} value={attendances.length} />
                                <StatCard label={t("attributes.late_days")} value={lateCount} />
                            </div>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>{t("attributes.attendance_date")}</TableHead>
                                        <TableHead>{t("attributes.check_in")}</TableHead>
                                        <TableHead>{t("attributes.check_out")}</TableHead>
                                        <TableHead>{t("attributes.status")}</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {attendances.map((a) => (
                                        <TableRow key={a.id}>
                                            <TableCell>{formatDate(a.attendance_date, locale)}</TableCell>
                                            <TableCell>{formatTime(a.check_in, locale)}</TableCell>
                                            <TableCell>{formatTime(a.check_out, locale)}</TableCell>
                                            <TableCell>
                                                <Badge variant="secondary">{a.status_label}</Badge>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </>
                    )}
                </CardContent>
            </Card>

            <Card className="w-full">
                <CardHeader className="border-b">
                    <CardTitle>{t("attributes.missions_report")}</CardTitle>
                    <CardDescription>{t("messages.employees.missions_report_description")}</CardDescription>
                </CardHeader>
                <CardContent className="pt-6 space-y-4">
                    {missionsLoading ? (
                        <Skeleton className="h-32 w-full rounded-xl" />
                    ) : (
                        <>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <StatCard label={t("attributes.total_missions")} value={missions.length} />
                                <StatCard label={t("attributes.completed_missions")} value={completedMissions} />
                            </div>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>{t("attributes.title")}</TableHead>
                                        <TableHead>{t("attributes.start_date")}</TableHead>
                                        <TableHead>{t("attributes.end_date")}</TableHead>
                                        <TableHead>{t("attributes.status")}</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {missions.map((m) => (
                                        <TableRow key={m.id}>
                                            <TableCell>{m.title}</TableCell>
                                            <TableCell>{formatDateTime(m.start_datetime, locale)}</TableCell>
                                            <TableCell>{formatDateTime(m.end_datetime, locale)}</TableCell>
                                            <TableCell>
                                                <Badge variant="secondary">{m.status?.label}</Badge>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </>
                    )}
                </CardContent>
            </Card>

            <Card className="w-full">
                <CardHeader className="border-b">
                    <CardTitle>{t("attributes.tasks_report")}</CardTitle>
                    <CardDescription>{t("messages.employees.tasks_report_description")}</CardDescription>
                </CardHeader>
                <CardContent className="pt-6 space-y-4">
                    {tasksLoading ? (
                        <Skeleton className="h-32 w-full rounded-xl" />
                    ) : (
                        <>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <StatCard label={t("attributes.total_tasks")} value={tasks.length} />
                                <StatCard label={t("attributes.completed_tasks")} value={completedTasks} />
                            </div>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>{t("attributes.name")}</TableHead>
                                        <TableHead>{t("attributes.stage")}</TableHead>
                                        <TableHead>{t("attributes.end_date")}</TableHead>
                                        <TableHead>{t("attributes.status")}</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {tasks.map((tk) => (
                                        <TableRow key={tk.id}>
                                            <TableCell>{tk.name}</TableCell>
                                            <TableCell>{tk.sprint_stage?.name ?? "-"}</TableCell>
                                            <TableCell>{formatDate(tk.due_date, locale)}</TableCell>
                                            <TableCell>
                                                <Badge variant={tk.is_completed ? "default" : "secondary"}>
                                                    {tk.is_completed
                                                        ? t("status.completed")
                                                        : t("status.in_progress")}
                                                </Badge>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
