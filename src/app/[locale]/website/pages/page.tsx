"use client";

import React, { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button, buttonVariants } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { getPages, deletePage, PageResource } from "@/actions/website/pages.actions";
import { toast } from "sonner";

export default function PagesPage() {
    const t = useTranslations();
    const params = useParams();
    const isRtl = params?.locale === "ar";
    const currentLocale = (params?.locale as string) || "en";

    const [pages, setPages] = useState<PageResource[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);

    useEffect(() => {
        const loadPages = async () => {
            setIsLoading(true);
            const res = await getPages();
            if (res.success && res.data) {
                setPages(res.data.data);
            }
            setIsLoading(false);
        };
        loadPages();
    }, []);

    const handleDeleteClick = (id: number) => {
        setDeleteConfirmId(id);
    };

    const getLocalizedValue = (val: Record<string, string> | undefined) => {
        if (!val) return "";
        return val[currentLocale] || val["en"] || Object.values(val)[0] || "";
    };

    return (
        <Card dir={isRtl ? "rtl" : "ltr"}>
            <CardHeader className={`flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 ${isRtl ? "text-right" : "text-left"}`}>
                <div>
                    <CardTitle>{t("routes.pages", { defaultValue: "Pages" })}</CardTitle>
                    <CardDescription>
                        {t("pages.description", { defaultValue: "Manage website pages, configure custom slugs, and publish changes." })}
                    </CardDescription>
                </div>
                <Link
                    href={`/${currentLocale}/website/pages/create`}
                    className={cn(buttonVariants({ size: "sm" }), "gap-1.5 shrink-0")}
                >
                    <Plus className="w-4 h-4" />
                    <span>{t("routes.create_page", { defaultValue: "Create Page" })}</span>
                </Link>
            </CardHeader>
            <CardContent>
                {isLoading ? (
                    <div className="flex justify-center items-center h-32">
                        <Spinner className="w-6 h-6" />
                    </div>
                ) : pages.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground border border-dashed rounded-xl">
                        {t("pages.no_pages", { defaultValue: "No pages found" })}
                    </div>
                ) : (
                    <div className="border rounded-xl overflow-hidden bg-card">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>
                                        {t("attributes.title", { defaultValue: "Title" })}
                                    </TableHead>
                                    <TableHead>
                                        {t("attributes.slug", { defaultValue: "Slug" })}
                                    </TableHead>
                                    <TableHead>
                                        {t("attributes.status", { defaultValue: "Status" })}
                                    </TableHead>
                                    <TableHead className="w-24 text-center">
                                        {t("actions.actions", { defaultValue: "Actions" })}
                                    </TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {pages.map((page) => {
                                    const pageTitle = page.title_localized || getLocalizedValue(page.title);
                                    return (
                                        <TableRow key={page.id} className="hover:bg-muted/40">
                                            <TableCell className="font-semibold text-foreground">
                                                {pageTitle}
                                            </TableCell>
                                            <TableCell className="font-mono text-xs text-muted-foreground text-end" dir="ltr">
                                                {page.slug}
                                            </TableCell>
                                            <TableCell>
                                                {page.is_published ? (
                                                    <Badge className="bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/10 border border-emerald-500/20 font-semibold px-2 py-0.5 rounded-full text-xs shadow-none">
                                                        {t("status.active", { defaultValue: "Active" })}
                                                    </Badge>
                                                ) : (
                                                    <Badge className="bg-muted text-muted-foreground hover:bg-muted border border-transparent font-semibold px-2 py-0.5 rounded-full text-xs shadow-none">
                                                        {t("status.draft", { defaultValue: "Draft" })}
                                                    </Badge>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <div className="flex items-center justify-center gap-1">
                                                    <Link
                                                        href={`/${currentLocale}/website/pages/edit/${page.id}`}
                                                        className={cn(buttonVariants({ variant: "ghost", size: "icon" }), "h-8 w-8 text-muted-foreground hover:text-foreground")}
                                                    >
                                                        <Pencil className="w-4 h-4" />
                                                    </Link>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                                                        onClick={() => handleDeleteClick(page.id)}
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    </div>
                )}

                <Dialog open={deleteConfirmId !== null} onOpenChange={(open) => !open && setDeleteConfirmId(null)}>
                    <DialogContent showCloseButton={!isLoading}>
                        <DialogHeader className={isRtl ? "text-right" : "text-left"}>
                            <DialogTitle>
                                {t("common.confirm_delete_title", { defaultValue: isRtl ? "تأكيد الحذف" : "Confirm Delete" })}
                            </DialogTitle>
                            <DialogDescription>
                                {t("pages.delete_confirm", { defaultValue: "Are you sure you want to delete this page?" })}
                            </DialogDescription>
                        </DialogHeader>
                        <DialogFooter className="mt-4">
                            <Button
                                variant="outline"
                                onClick={() => setDeleteConfirmId(null)}
                                disabled={isLoading}
                            >
                                {t("buttons.cancel", { defaultValue: "Cancel" })}
                            </Button>
                            <Button
                                variant="destructive"
                                onClick={async () => {
                                    if (deleteConfirmId !== null) {
                                        setIsLoading(true);
                                        const res = await deletePage(deleteConfirmId);
                                        if (res.success) {
                                            toast.success(t("messages.success", { defaultValue: "Saved successfully!" }));
                                            const resPages = await getPages();
                                            if (resPages.success && resPages.data) {
                                                setPages(resPages.data.data);
                                            }
                                        } else {
                                            toast.error(res.error || t("errors.something_went_wrong"));
                                        }
                                        setIsLoading(false);
                                        setDeleteConfirmId(null);
                                    }
                                }}
                                disabled={isLoading}
                            >
                                {isLoading ? t("actions.loading", { defaultValue: "Loading..." }) : t("buttons.delete", { defaultValue: "Delete" })}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </CardContent>
        </Card>
    );
}