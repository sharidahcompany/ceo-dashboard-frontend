"use client";

import React, { useState, useEffect, useTransition } from "react";
import { useForm } from "react-hook-form";
import { useTranslations, useLocale } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { SelectBranch } from "@/components/ui/select-branch";
import { getProjects, createProject, ProjectResource } from "@/actions/projects/projects.actions";
import { Calendar, Plus, FolderKanban, Clock } from "lucide-react";
import { toast } from "sonner";
import { Can } from "@/providers/AbilityProvider";

export default function ProjectsList() {
    const t = useTranslations("projects");
    const locale = useLocale();
    const [projects, setProjects] = useState<ProjectResource[]>([]);
    const [loading, setLoading] = useState(true);
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [isPending, startTransition] = useTransition();

    // Form fields
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [notes, setNotes] = useState("");
    const [startDate, setStartDate] = useState("");
    const [dueDate, setDueDate] = useState("");

    const { control: branchControl, watch: watchBranch, reset: resetBranch } = useForm<{ branch_id: string | null }>({
        defaultValues: { branch_id: null },
    });
    const branchId = watchBranch("branch_id");

    const fetchProjects = async () => {
        setLoading(true);
        const res = await getProjects();
        if (res.success) {
            setProjects(res.data);
        } else {
            toast.error(res.error || "Failed to fetch projects");
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchProjects();
    }, []);

    const handleCreate = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) return;

        startTransition(async () => {
            const res = await createProject({
                branch_id: branchId || undefined,
                name,
                description,
                notes,
                start_date: startDate || undefined,
                due_date: dueDate || undefined,
            });

            if (res.success) {
                toast.success(t("success_created"));
                setIsCreateOpen(false);
                // Reset form
                resetBranch({ branch_id: null });
                setName("");
                setDescription("");
                setNotes("");
                setStartDate("");
                setDueDate("");
                fetchProjects();
            } else {
                toast.error(res.error || "Failed to create project");
            }
        });
    };

    const getStatusColor = (val: string) => {
        switch (val) {
            case "complete": return "bg-green-500/10 text-green-500 border-green-500/20";
            case "in_progress": return "bg-blue-500/10 text-blue-500 border-blue-500/20";
            case "pending": return "bg-yellow-500/10 text-yellow-500 border-yellow-500/20";
            case "late": return "bg-red-500/10 text-red-500 border-red-500/20";
            default: return "bg-muted text-muted-foreground border-muted-foreground/20";
        }
    };

    return (
        <div className="space-y-6">
            <Can I="create" a="workspace.project">
            <div className="flex justify-end">
                <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                    <DialogTrigger
                        render={
                            <Button className="gap-2">
                                <Plus className="size-4" />
                                {t("create_project")}
                            </Button>
                        }
                    />
                    <DialogContent className="sm:max-w-[500px]">
                        <form onSubmit={handleCreate}>
                            <DialogHeader>
                                <DialogTitle>{t("create_project")}</DialogTitle>
                                <DialogDescription>{t("create_description")}</DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                                <div className="grid gap-2">
                                    <label className="text-sm font-medium">{t("branch_label")}</label>
                                    <SelectBranch control={branchControl} name="branch_id" />
                                </div>
                                <div className="grid gap-2">
                                    <label className="text-sm font-medium">{t("name_label")}</label>
                                    <Input 
                                        required 
                                        value={name} 
                                        onChange={(e) => setName(e.target.value)} 
                                        placeholder={t("name_placeholder")}
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <label className="text-sm font-medium">{t("description_label")}</label>
                                    <Textarea 
                                        value={description} 
                                        onChange={(e) => setDescription(e.target.value)} 
                                        placeholder={t("description_placeholder")}
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <label className="text-sm font-medium">{t("notes_label")}</label>
                                    <Input 
                                        value={notes} 
                                        onChange={(e) => setNotes(e.target.value)} 
                                        placeholder={t("notes_placeholder")}
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="grid gap-2">
                                        <label className="text-sm font-medium">{t("start_date_label")}</label>
                                        <Input 
                                            type="date" 
                                            value={startDate} 
                                            onChange={(e) => setStartDate(e.target.value)} 
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <label className="text-sm font-medium">{t("due_date_label")}</label>
                                        <Input 
                                            type="date" 
                                            value={dueDate} 
                                            onChange={(e) => setDueDate(e.target.value)} 
                                        />
                                    </div>
                                </div>
                            </div>
                            <DialogFooter>
                                <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>
                                    {t("cancel")}
                                </Button>
                                <Button type="submit" disabled={isPending}>
                                    {t("save")}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>
            </Can>

            {loading ? (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {[1, 2, 3].map((n) => (
                        <Card key={n} className="animate-pulse">
                            <CardHeader className="h-32 bg-muted/20" />
                            <CardContent className="h-24 bg-muted/10" />
                        </Card>
                    ))}
                </div>
            ) : projects.length === 0 ? (
                <Card className="flex flex-col items-center justify-center p-12 text-center border-dashed">
                    <FolderKanban className="size-12 text-muted-foreground mb-4" />
                    <CardTitle className="mb-2">{t("no_projects")}</CardTitle>
                    <CardDescription className="mb-6">{t("no_projects_desc")}</CardDescription>
                    <Can I="create" a="workspace.project">
                        <Button onClick={() => setIsCreateOpen(true)} className="gap-2">
                            <Plus className="size-4" />
                            {t("create_project")}
                        </Button>
                    </Can>
                </Card>
            ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {projects.map((project) => (
                        <Card key={project.id} className="group hover:shadow-md transition-all border-border/60 hover:border-border duration-200">
                            <CardHeader>
                                <div className="flex items-center justify-between gap-2 mb-2">
                                    <Badge variant="outline" className={getStatusColor(project.status.value)}>
                                        {project.status.label}
                                    </Badge>
                                    {project.due_date && (
                                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                            <Clock className="size-3" />
                                            <span>{new Date(project.due_date).toLocaleDateString(locale)}</span>
                                        </div>
                                    )}
                                </div>
                                <CardTitle className="line-clamp-1 group-hover:text-primary transition-colors">
                                    {project.name}
                                </CardTitle>
                                <CardDescription className="line-clamp-2 min-h-10">
                                    {project.description || t("no_description")}
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                    {project.start_date && (
                                        <div className="flex items-center gap-1.5">
                                            <Calendar className="size-4" />
                                            <span>{new Date(project.start_date).toLocaleDateString(locale)}</span>
                                        </div>
                                    )}
                                </div>
                                {project.due_date && (
                                    <ProjectStopwatch dueDate={project.due_date} endDate={project.end_date} />
                                )}
                            </CardContent>
                            <CardFooter className="border-t bg-muted/5 py-3 flex items-center justify-between gap-4">
                                <span className="text-xs text-muted-foreground">
                                    {t("team_members", { count: project.team?.length || 0 })}
                                </span>
                                <div className="flex items-center gap-2">
                                    <Link href={`/core-operations/projects/project/${project.id}/overview`}>
                                        <Button size="xs" variant="outline">{t("view_overview")}</Button>
                                    </Link>
                                    <Link href={`/core-operations/projects/project/${project.id}/board`}>
                                        <Button size="xs" className="gap-1.5">
                                            <FolderKanban className="size-3" />
                                            {t("view_board")}
                                        </Button>
                                    </Link>
                                </div>
                            </CardFooter>
                        </Card>
                    ))}
                </div>
            )}
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
        ? "text-red-500 drop-shadow-[0_0_8px_rgba(239,68,68,0.3)]"
        : "text-emerald-500 drop-shadow-[0_0_8px_rgba(16,185,129,0.3)]";

    return (
        <div className="bg-zinc-950 dark:bg-black py-2 px-3 rounded-lg border border-zinc-800/80 shadow-inner flex items-center justify-center select-none w-full mt-2">
            <div className={`font-mono text-base md:text-lg font-bold tracking-widest ${displayColorClass}`}>
                {timeStr}
            </div>
        </div>
    );
}
