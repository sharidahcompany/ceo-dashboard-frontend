"use client";

import React, { useEffect, useState, useTransition, use, createContext, useContext } from "react";
import { useTranslations, useLocale } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getProjectDetails, ProjectResource, uploadProjectFile, deleteProjectFile } from "@/actions/projects/projects.actions";
import { FolderKanban, Calendar, Users, Paperclip, ChevronLeft, LayoutDashboard, Trash2, ArrowUpRight } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

interface ProjectContextType {
    project: ProjectResource | null;
    fetchProject: () => Promise<void>;
}

const ProjectContext = createContext<ProjectContextType>({
    project: null,
    fetchProject: async () => { },
});

export const useProject = () => useContext(ProjectContext);

export default function ProjectLayout({
    children,
    params,
}: {
    children: React.ReactNode;
    params: Promise<{ projectId: string; locale: string }>;
}) {
    const t = useTranslations("projects");
    const locale = useLocale();
    const pathname = usePathname();
    const resolvedParams = use(params);
    const projectId = resolvedParams.projectId;

    const [project, setProject] = useState<ProjectResource | null>(null);
    const [loading, setLoading] = useState(true);
    const [filesOpen, setFilesOpen] = useState(false);
    const [isPending, startTransition] = useTransition();

    const fetchProject = async () => {
        const res = await getProjectDetails(projectId);
        if (res.success) {
            setProject(res.data);
        } else {
            toast.error(res.error || "Failed to fetch project details");
        }
    };

    useEffect(() => {
        const initFetch = async () => {
            setLoading(true);
            await fetchProject();
            setLoading(false);
        };
        initFetch();
    }, [projectId]);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        const formData = new FormData();
        formData.append("files[]", files[0]);

        startTransition(async () => {
            const res = await uploadProjectFile(projectId, formData);
            if (res.success) {
                toast.success(t("file_uploaded"));
                fetchProject();
            } else {
                toast.error(res.error || "Failed to upload file");
            }
        });
    };

    const handleFileDelete = async (fileId: number) => {
        startTransition(async () => {
            const res = await deleteProjectFile(projectId, fileId);
            if (res.success) {
                toast.success(t("file_deleted"));
                fetchProject();
            } else {
                toast.error(res.error || "Failed to delete file");
            }
        });
    };

    if (loading) {
        return (
            <div className="container py-8 space-y-6">
                <div className="h-8 w-1/4 bg-muted animate-pulse rounded" />
                <div className="h-32 bg-muted/40 animate-pulse rounded" />
                <div className="h-96 bg-muted/20 animate-pulse rounded" />
            </div>
        );
    }

    if (!project) {
        return (
            <div className="container py-12 text-center space-y-4">
                <h2 className="text-xl font-semibold">{t("project_not_found")}</h2>
                <Link href="/core-operations/projects">
                    <Button variant="outline">
                        <ChevronLeft className="size-4 mr-2" />
                        {t("back_to_projects")}
                    </Button>
                </Link>
            </div>
        );
    }

    const isActive = (tabPath: string) => {
        return pathname.includes(tabPath);
    };

    return (
        <ProjectContext.Provider value={{ project, fetchProject }}>
            <Card className="w-full">
                <CardHeader className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b">
                    <div className="flex items-center gap-3">
                        <Link href="/core-operations/projects">
                            <Button variant="ghost" size="icon" className="rounded-full">
                                <ChevronLeft className="size-5" />
                            </Button>
                        </Link>
                        <div>
                            <div className="flex items-center gap-2">
                                <h1 className="text-xl font-bold tracking-tight">{project.name}</h1>
                                <Badge variant="outline">{project.status.label}</Badge>
                            </div>
                            <p className="text-sm text-muted-foreground line-clamp-1">{project.description}</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <Dialog open={filesOpen} onOpenChange={setFilesOpen}>
                            <DialogTrigger
                                render={
                                    <Button variant="outline" size="sm" className="gap-2">
                                        <Paperclip className="size-4" />
                                        {t("project_files")}
                                        {project.files && project.files.length > 0 && (
                                            <Badge variant="secondary" className="ml-1 px-1.5 py-0 text-xs">
                                                {project.files.length}
                                            </Badge>
                                        )}
                                    </Button>
                                }
                            />
                            <DialogContent className="sm:max-w-[450px]">
                                <DialogHeader>
                                    <DialogTitle>{t("project_files")}</DialogTitle>
                                    <DialogDescription>{t("project_files_desc")}</DialogDescription>
                                </DialogHeader>
                                <div className="py-4 space-y-4">
                                    <div className="grid w-full items-center gap-1.5">
                                        <label className="text-sm font-medium">{t("upload_file")}</label>
                                        <input
                                            type="file"
                                            onChange={handleFileUpload}
                                            disabled={isPending}
                                            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                                        />
                                    </div>

                                    <div className="space-y-2 mt-4 max-h-[40vh] overflow-y-auto pr-1">
                                        {project.files && project.files.length > 0 ? (
                                            project.files.map((file) => (
                                                <div key={file.id} className="flex items-center justify-between p-2 rounded border bg-muted/30">
                                                    <div className="flex flex-col min-w-0 pr-2">
                                                        <span className="text-sm font-medium truncate">{file.name}</span>
                                                        <span className="text-xs text-muted-foreground">
                                                            {(file.size / 1024).toFixed(1)} KB
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-1.5">
                                                        <a href={file.full_url} target="_blank" rel="noopener noreferrer">
                                                            <Button size="icon" variant="ghost" className="size-8">
                                                                <ArrowUpRight className="size-4" />
                                                            </Button>
                                                        </a>
                                                        <Button
                                                            size="icon"
                                                            variant="ghost"
                                                            onClick={() => handleFileDelete(file.id)}
                                                            disabled={isPending}
                                                            className="size-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                                                        >
                                                            <Trash2 className="size-4" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <p className="text-sm text-muted-foreground text-center py-4">{t("no_files")}</p>
                                        )}
                                    </div>
                                </div>
                            </DialogContent>
                        </Dialog>
                    </div>
                </CardHeader>

                <CardContent className="space-y-6 pt-6">
                    {/* Navigation Tabs */}
                    <div className="flex border-b gap-2">
                        <Link href={`/core-operations/projects/project/${projectId}/overview`}>
                            <Button
                                variant="ghost"
                                className={`rounded-none   px-4 py-2 h-auto ${isActive("overview")
                                    ? "border-primary text-foreground font-semibold"
                                    : "border-transparent text-muted-foreground"
                                    }`}
                            >
                                <LayoutDashboard className="size-4 mr-2" />
                                {t("overview")}
                            </Button>
                        </Link>
                        <Link href={`/core-operations/projects/project/${projectId}/board`}>
                            <Button
                                variant="ghost"
                                className={`rounded-none  px-4 py-2 h-auto ${isActive("board")
                                    ? "border-primary text-foreground font-semibold"
                                    : "border-transparent text-muted-foreground"
                                    }`}
                            >
                                <FolderKanban className="size-4 mr-2" />
                                {t("board")}
                            </Button>
                        </Link>
                    </div>

                    {/* Content Area */}
                    <div>{children}</div>
                </CardContent>
            </Card>
        </ProjectContext.Provider>
    );
}
