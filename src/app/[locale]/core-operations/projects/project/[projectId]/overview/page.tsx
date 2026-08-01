"use client";

import React, { useState, useEffect, useTransition } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { useProject } from "../layout";
import { Calendar, Users, Info, UserPlus, Clock } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { MultiSelectUser } from "@/components/ui/multi-select-user";
import { syncProjectUsers, updateProject } from "@/actions/projects/projects.actions";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { UserResource } from "@/actions/workspace/user.actions";

interface TeamFormValues {
    user_ids: string[];
}

function UserAvatar({ user, size = "md" }: { user: UserResource; size?: "sm" | "md" }) {
    const sizeClass = size === "sm" ? "size-7" : "size-9";
    const fallbackClass = size === "sm" ? "text-[10px]" : "text-xs";
    return (
        <Avatar className={`${sizeClass} border-2 border-background`}>
            {user.avatar && <AvatarImage src={user.avatar} alt={`${user.first_name} ${user.last_name}`} />}
            <AvatarFallback className={fallbackClass}>
                {user.first_name?.charAt(0) || ""}{user.last_name?.charAt(0) || ""}
            </AvatarFallback>
        </Avatar>
    );
}

export default function ProjectOverviewPage() {
    const t = useTranslations("projects");
    const locale = useLocale();
    const { project, fetchProject } = useProject();

    const [isAddTeamOpen, setIsAddTeamOpen] = useState(false);
    const [isPending, startTransition] = useTransition();

    const { control, handleSubmit, reset } = useForm<TeamFormValues>({
        defaultValues: {
            user_ids: project?.team?.map((u) => String(u.id)) ?? [],
        },
    });

    if (!project) return null;

    const team = project.team ?? [];
    const visibleMembers = team.slice(0, 3);
    const extraCount = team.length - 3;

    const onSubmit = (values: TeamFormValues) => {
        startTransition(async () => {
            const res = await syncProjectUsers(project.id, values.user_ids);
            if (res.success) {
                toast.success(t("team_updated"));
                setIsAddTeamOpen(false);
                fetchProject();
            } else {
                toast.error(res.error || "Failed to update team");
            }
        });
    };

    return (
        <div className="grid gap-6 md:grid-cols-3">
            {/* Left: General Info */}
            <div className="md:col-span-2 space-y-6">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0 pb-4 border-b">
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <Info className="size-5 text-muted-foreground" />
                            {t("about_project")}
                        </CardTitle>
                        <select
                            value={typeof project.status === "object" && project.status ? project.status.value : project.status}
                            onChange={async (e) => {
                                const newStatus = e.target.value;
                                const res = await updateProject(project.id, { status: newStatus });
                                if (res.success) {
                                    toast.success(t("status_updated"));
                                    fetchProject();
                                } else {
                                    toast.error(res.error || "Failed to update project status");
                                }
                            }}
                            className="h-8 rounded-md border border-input bg-transparent px-2.5 py-1 text-xs shadow-sm focus:outline-none focus:ring-1 focus:ring-ring font-medium cursor-pointer"
                        >
                            <option value="pending">{t("pending") || "Pending"}</option>
                            <option value="in_progress">{t("in_progress") || "In Progress"}</option>
                            <option value="complete">{t("complete") || "Complete"}</option>
                            <option value="late">{t("late") || "Late"}</option>
                        </select>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <h4 className="text-sm font-semibold text-muted-foreground mb-1">{t("description_label")}</h4>
                            <p className="text-sm text-foreground bg-muted/20 p-3 rounded-lg border">
                                {project.description || t("no_description")}
                            </p>
                        </div>
                        {project.notes && (
                            <div>
                                <h4 className="text-sm font-semibold text-muted-foreground mb-1">{t("notes_label")}</h4>
                                <p className="text-sm text-foreground bg-muted/20 p-3 rounded-lg border">
                                    {project.notes}
                                </p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <Calendar className="size-5 text-muted-foreground" />
                            {t("dates")}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-3 gap-4 text-center">
                        <div className="border rounded-lg p-3 bg-muted/10">
                            <span className="text-xs text-muted-foreground block mb-1">{t("start_date_label")}</span>
                            <span className="text-sm font-medium">
                                {project.start_date ? new Date(project.start_date).toLocaleDateString(locale) : "-"}
                            </span>
                        </div>
                        <div className="border rounded-lg p-3 bg-muted/10">
                            <span className="text-xs text-muted-foreground block mb-1">{t("due_date_label")}</span>
                            <span className="text-sm font-medium">
                                {project.due_date ? new Date(project.due_date).toLocaleDateString(locale) : "-"}
                            </span>
                        </div>
                        <div className="border rounded-lg p-3 bg-muted/10">
                            <span className="text-xs text-muted-foreground block mb-1">{t("end_date_label")}</span>
                            <span className="text-sm font-medium">
                                {project.end_date ? new Date(project.end_date).toLocaleDateString(locale) : "-"}
                            </span>
                        </div>
                    </CardContent>
                    <CardContent className="pt-0">
                        {project.due_date && <ProjectStopwatch dueDate={project.due_date} endDate={project.end_date} />}
                    </CardContent>
                </Card>
            </div>

            {/* Right: Team Members */}
            <div className="space-y-6">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between gap-4">
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <Users className="size-5 text-muted-foreground" />
                            {t("team_members_title")}
                        </CardTitle>

                        <Dialog open={isAddTeamOpen} onOpenChange={(open) => {
                            setIsAddTeamOpen(open);
                            if (open) {
                                reset({ user_ids: team.map((u) => String(u.id)) });
                            }
                        }}>
                            <DialogTrigger
                                render={
                                    <Button size="sm" variant="outline" className="gap-1.5 shrink-0">
                                        <UserPlus className="size-4" />
                                        {t("add_members")}
                                    </Button>
                                }
                            />
                            <DialogContent className="sm:max-w-[480px]">
                                <form onSubmit={handleSubmit(onSubmit)}>
                                    <DialogHeader>
                                        <DialogTitle>{t("add_members")}</DialogTitle>
                                        <DialogDescription>{t("add_members_desc")}</DialogDescription>
                                    </DialogHeader>
                                    <div className="py-4">
                                        <MultiSelectUser
                                            control={control}
                                            name="user_ids"
                                            initialUsers={team as any}
                                        />
                                    </div>
                                    <DialogFooter>
                                        <Button type="button" variant="outline" onClick={() => setIsAddTeamOpen(false)}>
                                            {t("cancel")}
                                        </Button>
                                        <Button type="submit" disabled={isPending}>
                                            {t("save")}
                                        </Button>
                                    </DialogFooter>
                                </form>
                            </DialogContent>
                        </Dialog>
                    </CardHeader>

                    <CardContent>
                        {team.length > 0 ? (
                            <div className="flex items-center gap-3">
                                {/* Avatar group — first 3 */}
                                <div className="flex -space-x-2.5">
                                    {visibleMembers.map((member) => (
                                        <UserAvatar key={member.id} user={member as any} />
                                    ))}
                                </div>

                                {/* +N popover */}
                                {extraCount > 0 && (
                                    <Popover>
                                        <PopoverTrigger
                                            render={
                                                <button className="size-9 rounded-full border-2 border-background bg-muted text-xs font-semibold text-muted-foreground flex items-center justify-center hover:bg-accent transition-colors">
                                                    +{extraCount}
                                                </button>
                                            }
                                        />
                                        <PopoverContent className="w-64 p-3" side="bottom" align="start">
                                            <p className="text-sm font-semibold mb-3">{t("all_members")}</p>
                                            <div className="space-y-2 max-h-56 overflow-y-auto">
                                                {team.map((member) => (
                                                    <div key={member.id} className="flex items-center gap-2.5 p-1.5 rounded-md hover:bg-muted/50">
                                                        <UserAvatar user={member as any} size="sm" />
                                                        <div className="min-w-0">
                                                            <p className="text-sm font-medium truncate">
                                                                {member.first_name} {member.last_name}
                                                            </p>
                                                            <p className="text-xs text-muted-foreground truncate">{member.email}</p>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </PopoverContent>
                                    </Popover>
                                )}

                                {/* Names of visible members */}
                                <div className="min-w-0">
                                    <p className="text-sm font-medium truncate">
                                        {visibleMembers.map((m) => `${m.first_name} ${m.last_name}`).join(", ")}
                                        {extraCount > 0 && ` ${t("and_more", { count: extraCount })}`}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        {team.length} {t("members")}
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-6 text-center gap-2">
                                <Users className="size-8 text-muted-foreground/50" />
                                <p className="text-sm text-muted-foreground">{t("no_members")}</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

function ProjectStopwatch({ dueDate, endDate }: { dueDate: string; endDate?: string }) {
    const t = useTranslations("projects");
    const [timeStr, setTimeStr] = useState("");
    const [isOverdue, setIsOverdue] = useState(false);

    useEffect(() => {
        const calculate = () => {
            const due = new Date(dueDate).getTime();
            const hasEnded = !!endDate;
            const now = (hasEnded && endDate) ? new Date(endDate).getTime() : Date.now();
            const diffMs = due - now;

            const overdue = diffMs < 0;
            const absDiff = Math.abs(diffMs);

            const days = Math.floor(absDiff / (1000 * 60 * 60 * 24));
            const hours = Math.floor((absDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((absDiff % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((absDiff % (1000 * 60)) / 1000);

            const pad = (num: number) => String(num).padStart(2, "0");

            let formatted = `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
            if (days > 0) {
                formatted = `${days}d ${formatted}`;
            }

            setTimeStr(formatted);
            setIsOverdue(overdue);
        };

        calculate();
        if (endDate) return;

        const interval = setInterval(calculate, 1000);
        return () => clearInterval(interval);
    }, [dueDate, endDate]);

    const displayColorClass = isOverdue
        ? "text-red-500 drop-shadow-[0_0_8px_rgba(239,68,68,0.6)]"
        : "text-emerald-500 drop-shadow-[0_0_8px_rgba(16,185,129,0.6)]";

    const labelText = isOverdue 
        ? t("time_late", { time: "" }).replace(/\s*\{\s*time\s*\}\s*/g, "").trim()
        : endDate 
            ? t("time_saved", { time: "" }).replace(/\s*\{\s*time\s*\}\s*/g, "").trim()
            : t("time_left", { time: "" }).replace(/\s*\{\s*time\s*\}\s*/g, "").trim();

    return (
        <div className="mt-6 bg-zinc-950 dark:bg-black p-5 rounded-xl border border-zinc-800 shadow-inner flex items-center justify-center select-none">
            <div className="flex items-center gap-2">
                <div className={`font-mono text-3xl md:text-4xl font-bold tracking-widest ${displayColorClass}`}>
                    {timeStr}
                </div>
                {endDate && (
                    <span className="text-[9px] font-bold bg-emerald-950 text-emerald-400 border border-emerald-800/50 px-1.5 py-0.5 rounded uppercase">
                        SAVED
                    </span>
                )}
            </div>
        </div>
    );
}
