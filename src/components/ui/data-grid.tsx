"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useTranslations } from "next-intl";
import {
    useReactTable,
    getCoreRowModel,
    flexRender,
    ColumnDef,
    SortingState,
} from "@tanstack/react-table";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    ContextMenu,
    ContextMenuContent,
    ContextMenuItem,
    ContextMenuTrigger,
    ContextMenuSeparator,
} from "@/components/ui/context-menu";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
    Empty,
    EmptyContent,
    EmptyDescription,
    EmptyHeader,
    EmptyMedia,
    EmptyTitle,
} from "@/components/ui/empty";
import {
    Pagination,
    PaginationContent,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from "@/components/ui/pagination";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Download,
    Upload,
    Plus,
    Edit,
    Trash,
    FileText,
    Inbox,
    Search,
    ArrowUp,
    ArrowDown,
    ArrowUpDown,
} from "lucide-react";
import { ActionResponse } from "@/actions/common/common.actions";
import { RowError } from "@/lib/utils";
import { toast } from "sonner";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import Link from "next/link";

export interface DataGridProps<TData, TValue> {
    title?: string;
    description?: string;

    fetchAction: (query: string) => Promise<ActionResponse<{ data: TData[]; meta?: any }>>;

    viewMode?: "table" | "grid";

    // Table Mode
    columns?: ColumnDef<TData, TValue>[];

    // Grid Mode
    renderCard?: (item: TData) => React.ReactNode;
    gridCols?: string;

    // Custom Filters
    customFilters?: {
        key: string;
        value: string;
        label: string;
        icon?: React.ReactNode;
        sparkline?: React.ReactNode;
    }[];

    // Actions
    createTitle?: string;
    createIcon?: React.ComponentType<{ className?: string }>;

    editable?: boolean;
    idKey?: keyof TData;

    deletable?: boolean;
    deleteAction?: (ids: string[]) => Promise<ActionResponse>;

    hasPdf?: boolean;
    onDownloadPdf?: (item: TData) => void;

    importable?: boolean;
    exportable?: boolean;
    onExport?: () => void | Promise<void>;

    /** @deprecated pass onDownloadTemplate instead — auth requires the file to be fetched server-side, not linked directly */
    importTemplateUrl?: string;
    onDownloadTemplate?: () => void | Promise<void>;
    onImport?: (file: File) => Promise<{ success: boolean; message?: string; errors?: RowError[] }>;
}

export function DataGrid<TData, TValue>({
    title,
    description,
    fetchAction,
    viewMode = "table",
    columns,
    renderCard,
    gridCols = "grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4",
    customFilters,
    createTitle,
    createIcon: CreateIcon = Plus,
    editable = true,
    idKey = "id" as keyof TData,
    deletable = true,
    deleteAction,
    hasPdf,
    onDownloadPdf,
    importable = false,
    exportable = false,
    onExport,
    importTemplateUrl,
    onDownloadTemplate,
    onImport,
}: DataGridProps<TData, TValue>) {
    const t = useTranslations("datagrid");
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    // Data State
    const [data, setData] = useState<TData[]>([]);
    const [meta, setMeta] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Filter, Sort, Pagination State
    const [pageIndex, setPageIndex] = useState(
        Number(searchParams.get("page")) > 0 ? Number(searchParams.get("page")) - 1 : 0
    );
    const [pageSize, setPageSize] = useState(
        Number(searchParams.get("per_page")) || 15
    );
    const [sorting, setSorting] = useState<SortingState>(() => {
        const sort = searchParams.get("sort");
        if (sort) {
            return [{ id: sort.replace("-", ""), desc: sort.startsWith("-") }];
        }
        return [];
    });
    const [activeFilter, setActiveFilter] = useState<{ [key: string]: string }>(() => {
        const result: { [key: string]: string } = {};
        searchParams.forEach((value, key) => {
            const match = key.match(/^filter\[(.+)\]$/);
            if (match) {
                result[match[1]] = value;
            }
        });
        return result;
    });
    const [searchQuery, setSearchQuery] = useState(searchParams.get("search") || "");
    const [debouncedSearch, setDebouncedSearch] = useState(searchQuery);

    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [isExporting, setIsExporting] = useState(false);
    const [isDownloadingTemplate, setIsDownloadingTemplate] = useState(false);
    const [importErrors, setImportErrors] = useState<RowError[] | null>(null);
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    // Selection state
    const [rowSelection, setRowSelection] = useState<Record<string, boolean>>({});

    // Delete confirm modal state
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const [idsToDelete, setIdsToDelete] = useState<string[]>([]);

    // Clear selection when data changes
    useEffect(() => {
        setRowSelection({});
    }, [data]);

    // Debounce search input
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchQuery);
            setPageIndex(0);
        }, 500);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    // Use a ref for fetchAction to prevent infinite loops
    const fetchActionRef = React.useRef(fetchAction);
    useEffect(() => {
        fetchActionRef.current = fetchAction;
    }, [fetchAction]);

    // Fetch Data
    const fetchData = useCallback(async () => {
        setIsLoading(true);
        try {
            const currentUrl = new URLSearchParams(window.location.search);

            currentUrl.set("page", String(pageIndex + 1));
            currentUrl.set("per_page", String(pageSize));

            if (sorting.length > 0) {
                currentUrl.set("sort", `${sorting[0].desc ? "-" : ""}${sorting[0].id}`);
            } else {
                currentUrl.delete("sort");
            }

            Array.from(currentUrl.keys())
                .filter((key) => /^filter\[.+\]$/.test(key))
                .forEach((key) => currentUrl.delete(key));

            Object.entries(activeFilter).forEach(([key, value]) => {
                currentUrl.set(`filter[${key}]`, value);
            });

            if (debouncedSearch.trim() !== "") {
                currentUrl.set("search", debouncedSearch);
            } else {
                currentUrl.delete("search");
            }

            window.history.replaceState(null, "", `?${currentUrl.toString()}`);

            const res = await fetchActionRef.current(currentUrl.toString());
            if (res.success && res.data) {
                setData(res.data.data);
                setMeta(res.data.meta);
            } else if (!res.success) {
                toast.error(res.error || t("no_data"));
            }
        } catch (error) {
            toast.error(t("no_data"));
        } finally {
            setIsLoading(false);
        }
    }, [pageIndex, pageSize, sorting, activeFilter, debouncedSearch, t]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const pagination = useMemo(
        () => ({
            pageIndex,
            pageSize,
        }),
        [pageIndex, pageSize]
    );

    // Prepend checkbox column if deleteAction or editable is enabled
    const finalColumns = useMemo(() => {
        if (!columns) return [];
        if (!deleteAction && !editable) return columns;

        const checkboxCol: ColumnDef<TData, any> = {
            id: "select",
            header: ({ table }) => (
                <div className="flex items-center justify-center">
                    <Checkbox
                        checked={table.getIsAllPageRowsSelected()}
                        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
                        aria-label="Select all"
                    />
                </div>
            ),
            cell: ({ row }) => (
                <div className="flex items-center justify-center">
                    <Checkbox
                        checked={row.getIsSelected()}
                        onCheckedChange={(value) => row.toggleSelected(!!value)}
                        aria-label="Select row"
                    />
                </div>
            ),
            enableSorting: false,
        };

        return [checkboxCol, ...columns];
    }, [columns, deleteAction, editable]);

    const table = useReactTable({
        data,
        columns: finalColumns,
        getCoreRowModel: getCoreRowModel(),
        pageCount: meta?.last_page ?? -1,
        state: {
            sorting,
            pagination,
            rowSelection,
        },
        getRowId: (row: any) => String(row[idKey]),
        onRowSelectionChange: setRowSelection,
        onSortingChange: (updater) => {
            setSorting(updater);
            setPageIndex(0);
        },
        onPaginationChange: (updater) => {
            if (typeof updater === "function") {
                const newState = updater({ pageIndex, pageSize });
                setPageIndex(newState.pageIndex);
                setPageSize(newState.pageSize);
            } else {
                setPageIndex(updater.pageIndex);
                setPageSize(updater.pageSize);
            }
        },
        manualPagination: true,
        manualSorting: true,
        enableRowSelection: true,
    });

    const handleFilterClick = (key: string, value: string) => {
        setActiveFilter((prev) => {
            if (prev[key] === value) {
                const newFilter = { ...prev };
                delete newFilter[key];
                return newFilter;
            }
            return { ...prev, [key]: value };
        });
        setPageIndex(0);
    };

    // Selected Row IDs helper
    const selectedIds = useMemo(() => {
        return Object.keys(rowSelection).filter((key) => rowSelection[key]);
    }, [rowSelection]);

    const triggerDeleteConfirm = (ids: string[]) => {
        setIdsToDelete(ids);
        setDeleteConfirmOpen(true);
    };

    const confirmDelete = async () => {
        if (!deleteAction || idsToDelete.length === 0) return;

        try {
            const res = await deleteAction(idsToDelete);
            if (res.success) {
                toast.success(res.message || "Deleted successfully");
                setRowSelection({});
                fetchData();
            } else {
                toast.error(res.error || "Failed to delete");
            }
        } catch (err) {
            toast.error("An error occurred during deletion");
        } finally {
            setDeleteConfirmOpen(false);
            setIdsToDelete([]);
        }
    };

    const resetImportState = () => {
        setSelectedFile(null);
        setImportErrors(null);
        setIsDragging(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    const handleImportModalChange = (open: boolean) => {
        setIsImportModalOpen(open);
        if (!open) resetImportState();
    };

    const handleDownloadTemplateClick = async () => {
        if (!onDownloadTemplate) return;
        setIsDownloadingTemplate(true);
        try {
            await onDownloadTemplate();
        } catch (error) {
            toast.error(error instanceof Error && error.message ? error.message : t("template_download_failed"));
        } finally {
            setIsDownloadingTemplate(false);
        }
    };

    const handleExportClick = async () => {
        if (!onExport) return;
        setIsExporting(true);
        try {
            await onExport();
        } catch (error) {
            toast.error(error instanceof Error && error.message ? error.message : t("export_failed"));
        } finally {
            setIsExporting(false);
        }
    };

    const handleUploadClick = async () => {
        if (!onImport || !selectedFile) return;
        setIsUploading(true);
        setImportErrors(null);
        try {
            const result = await onImport(selectedFile);
            if (result.success) {
                toast.success(result.message || t("import_success"));
                handleImportModalChange(false);
                fetchData();
            } else {
                setImportErrors(result.errors && result.errors.length > 0 ? result.errors : null);
                toast.error(result.message || t("import_failed"));
            }
        } catch {
            toast.error(t("import_failed"));
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div className="space-y-6">

            {/* Title and Custom Filters Row */}
            <div className="flex flex-col gap-6">
                {(title || description) && (
                    <div>
                        {title && <h2 className="text-lg tracking-tight">{title}</h2>}
                        {description && <p className="text-muted-foreground">{description}</p>}
                    </div>
                )}

                {customFilters && customFilters.length > 0 && (
                    <div className="flex flex-wrap items-center gap-2">
                        {customFilters.map((filter, index) => {
                            const isActive = activeFilter[filter.key] === filter.value;
                            return (
                                <button
                                    key={index}
                                    onClick={() => handleFilterClick(filter.key, filter.value)}
                                    className={`flex items-center gap-3 p-3 rounded-xl border transition-all duration-200 ${isActive
                                        ? "bg-primary/5 border-primary shadow-sm ring-1 ring-primary/20"
                                        : "bg-card hover:bg-muted"
                                        }`}
                                >
                                    {filter.icon && (
                                        <div className={`p-2 rounded-lg ${isActive ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
                                            {filter.icon}
                                        </div>
                                    )}
                                    <div className="text-start">
                                        <p className={`text-sm font-semibold ${isActive ? "text-primary" : "text-foreground"}`}>
                                            {filter.label}
                                        </p>
                                    </div>
                                    {filter.sparkline && (
                                        <div className="ml-2 w-16 h-8 opacity-70">
                                            {filter.sparkline}
                                        </div>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Actions & Search Row */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="relative w-full sm:max-w-xs">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2  w-4 text-muted-foreground" />
                    <Input
                        placeholder={t("search")}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9   w-full bg-background"
                    />
                </div>

                <div className="flex items-center gap-2 shrink-0">
                    {/* Multi/Single Selection Actions next to Import */}
                    {selectedIds.length === 1 && (
                        <>
                            {editable && (
                                <Button render={<Link href={`${pathname}/edit/${selectedIds[0]}`} />} nativeButton={false} variant="outline">
                                    <Edit className="w-4 h-4" />
                                    {t("edit")}
                                </Button>
                            )}
                            {deletable && deleteAction && (
                                <Button onClick={() => triggerDeleteConfirm([selectedIds[0]])} className=" text-destructive border-destructive hover:bg-destructive/10" variant="outline">
                                    <Trash className="w-4 h-4" />
                                    {t("delete")}
                                </Button>
                            )}
                        </>
                    )}

                    {selectedIds.length > 1 && deletable && deleteAction && (
                        <Button onClick={() => triggerDeleteConfirm(selectedIds)} className=" text-destructive border-destructive hover:bg-destructive/10" variant="outline">
                            <Trash className="w-4 h-4  " />
                            {t("delete")} ({selectedIds.length})
                        </Button>
                    )}

                    {importable && (
                        <Button variant="outline" onClick={() => setIsImportModalOpen(true)} >
                            <Upload className="w-4 h-4 " />
                            {t("import")}
                        </Button>
                    )}
                    {exportable && (
                        <Button variant="outline" onClick={handleExportClick} disabled={isExporting} >
                            <Download className="w-4 h-4 " />
                            {isExporting ? t("exporting") : t("export")}
                        </Button>
                    )}
                    {createTitle && (
                        <Button render={<Link href={`${pathname}/create`} />} nativeButton={false} >
                            <CreateIcon className="w-4 h-4  " />
                            {createTitle}
                        </Button>
                    )}
                </div>
            </div>

            {/* Content Area */}
            {isLoading ? (
                // Loading Skeletons
                viewMode === "table" ? (
                    <div className="border rounded-xl overflow-hidden bg-card">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    {finalColumns.map((col, idx) => {
                                        const isSelect = col.id === "select";
                                        return (
                                            <TableHead key={idx} style={{ width: isSelect ? "50px" : undefined }}>
                                                {isSelect ? (
                                                    <div className="flex items-center justify-center">
                                                        <Skeleton className="h-4 w-4 rounded" />
                                                    </div>
                                                ) : (
                                                    <Skeleton className="h-4 w-24" />
                                                )}
                                            </TableHead>
                                        );
                                    })}
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {Array.from({ length: 5 }).map((_, rowIndex) => (
                                    <TableRow key={rowIndex}>
                                        {finalColumns.map((col, colIndex) => {
                                            const isSelect = col.id === "select";
                                            return (
                                                <TableCell key={colIndex} style={{ width: isSelect ? "50px" : undefined }}>
                                                    {isSelect ? (
                                                        <div className="flex items-center justify-center">
                                                            <Skeleton className="h-4 w-4 rounded" />
                                                        </div>
                                                    ) : (
                                                        <Skeleton className="h-4 w-full" />
                                                    )}
                                                </TableCell>
                                            );
                                        })}
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                ) : (
                    <div className={`grid gap-4 ${gridCols}`}>
                        {Array.from({ length: 8 }).map((_, idx) => (
                            <Skeleton key={idx} className="h-32 w-full rounded-xl bg-card" />
                        ))}
                    </div>
                )
            ) : data.length === 0 ? (
                // Empty State
                <div className="w-full border rounded-xl bg-card p-12 flex flex-col items-center justify-center">
                    <Empty>
                        <EmptyHeader>
                            <EmptyMedia variant="icon">
                                <Inbox className="w-8 h-8 text-muted-foreground" />
                            </EmptyMedia>
                            <EmptyTitle>{t("no_data")}</EmptyTitle>
                        </EmptyHeader>
                        <EmptyContent>
                            <EmptyDescription>{t("no_data_desc")}</EmptyDescription>
                            {createTitle && (
                                <Button size="sm" render={<Link href={`${pathname}/create`} />} nativeButton={false} className="mt-4">
                                    <CreateIcon className="w-4 h-4 mr-2" />
                                    {createTitle}
                                </Button>
                            )}
                        </EmptyContent>
                    </Empty>
                </div>
            ) : (
                // Data Display
                <>
                    {viewMode === "table" ? (
                        <div className="border rounded-xl overflow-hidden bg-card">
                            <Table>
                                <TableHeader className="bg-muted/50">
                                    {table.getHeaderGroups().map((headerGroup) => (
                                        <TableRow key={headerGroup.id}>
                                            {headerGroup.headers.map((header) => {
                                                const isSorted = header.column.getIsSorted();
                                                const isSelect = header.column.id === "select";
                                                const canSort = header.column.getCanSort();
                                                return (
                                                    <TableHead
                                                        key={header.id}
                                                        onClick={isSelect ? undefined : header.column.getToggleSortingHandler()}
                                                        className={!isSelect && canSort ? "cursor-pointer select-none" : ""}
                                                        style={{ width: isSelect ? "50px" : undefined }}
                                                    >
                                                        <div className={`flex items-center ${isSelect ? "justify-center" : "gap-2"}`}>
                                                            {flexRender(
                                                                header.column.columnDef.header,
                                                                header.getContext()
                                                            )}
                                                            {!isSelect && canSort && (
                                                                <>
                                                                    {isSorted === "asc" && <ArrowUp className="w-3.5 h-3.5 text-primary" />}
                                                                    {isSorted === "desc" && <ArrowDown className="w-3.5 h-3.5 text-primary" />}
                                                                    {!isSorted && <ArrowUpDown className="w-3.5 h-3.5 text-muted-foreground opacity-50" />}
                                                                </>
                                                            )}
                                                        </div>
                                                    </TableHead>
                                                );
                                            })}
                                        </TableRow>
                                    ))}
                                </TableHeader>
                                <TableBody>
                                    {table.getRowModel().rows.map((row) => {
                                        const itemId = String(row.original[idKey as keyof typeof row.original]);
                                        return (
                                            <ContextMenu key={row.id}>
                                                <ContextMenuTrigger render={<TableRow />}>
                                                    {row.getVisibleCells().map((cell) => {
                                                        const isSelect = cell.column.id === "select";
                                                        return (
                                                            <TableCell key={cell.id} style={{ width: isSelect ? "50px" : undefined }}>
                                                                {flexRender(
                                                                    cell.column.columnDef.cell,
                                                                    cell.getContext()
                                                                )}
                                                            </TableCell>
                                                        );
                                                    })}
                                                </ContextMenuTrigger>
                                                <ContextMenuContent className="w-48">
                                                    {editable && (
                                                        <ContextMenuItem onClick={() => router.push(`${pathname}/edit/${itemId}`)}>
                                                            <Edit className="w-4 h-4 mr-2" />
                                                            {t("edit")}
                                                        </ContextMenuItem>
                                                    )}
                                                    {hasPdf && onDownloadPdf && (
                                                        <ContextMenuItem onClick={() => onDownloadPdf(row.original)}>
                                                            <FileText className="w-4 h-4 mr-2" />
                                                            {t("download_pdf")}
                                                        </ContextMenuItem>
                                                    )}
                                                    {(editable || hasPdf) && deletable && <ContextMenuSeparator />}
                                                    {deletable && deleteAction && (
                                                        <ContextMenuItem
                                                            className="text-destructive focus:bg-destructive/10"
                                                            onClick={() => triggerDeleteConfirm([itemId])}
                                                        >
                                                            <Trash className="w-4 h-4 mr-2" />
                                                            {t("delete")}
                                                        </ContextMenuItem>
                                                    )}
                                                </ContextMenuContent>
                                            </ContextMenu>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        </div>
                    ) : (
                        <div className={`grid gap-4 ${gridCols}`}>
                            {data.map((item, idx) => {
                                const itemId = String(item[idKey as keyof typeof item]);
                                return (
                                    <ContextMenu key={idx}>
                                        <ContextMenuTrigger render={<div className="h-full cursor-context-menu" />}>
                                            {renderCard && renderCard(item)}
                                        </ContextMenuTrigger>
                                        <ContextMenuContent className="w-48">
                                            {editable && (
                                                <ContextMenuItem onClick={() => router.push(`${pathname}/edit/${itemId}`)}>
                                                    <Edit className="w-4 h-4 mr-2" />
                                                    {t("edit")}
                                                </ContextMenuItem>
                                            )}
                                            {hasPdf && onDownloadPdf && (
                                                <ContextMenuItem onClick={() => onDownloadPdf(item)}>
                                                    <FileText className="w-4 h-4 mr-2" />
                                                    {t("download_pdf")}
                                                </ContextMenuItem>
                                            )}
                                            {(editable || hasPdf) && deletable && <ContextMenuSeparator />}
                                            {deletable && deleteAction && (
                                                <ContextMenuItem
                                                    className="text-destructive focus:bg-destructive/10"
                                                    onClick={() => triggerDeleteConfirm([itemId])}
                                                >
                                                    <Trash className="w-4 h-4 mr-2" />
                                                    {t("delete")}
                                                </ContextMenuItem>
                                            )}
                                        </ContextMenuContent>
                                    </ContextMenu>
                                );
                            })}
                        </div>
                    )}

                    {/* Pagination */}
                    {meta && meta.total > 0 && (
                        <div className="mt-4 flex flex-col sm:flex-row justify-between items-center gap-4 py-4 border-t">
                            <div className="flex flex-col sm:flex-row items-center gap-4">
                                <span className="text-sm text-muted-foreground">
                                    {t("showing")} {meta.from || 1} {t("to")} {meta.to || meta.total} {t("of")} {meta.total} {t("results")}
                                </span>
                                <div className="flex items-center gap-2">
                                    <Select
                                        value={String(pageSize)}
                                        onValueChange={(val) => {
                                            const size = Number(val);
                                            setPageSize(size);
                                            setPageIndex(0);
                                        }}
                                    >
                                        <SelectTrigger size="sm" className="w-28 h-8">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="15">15 / {t("per_page")}</SelectItem>
                                            <SelectItem value="50">50 / {t("per_page")}</SelectItem>
                                            <SelectItem value="100">100 / {t("per_page")}</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            {meta.last_page > 1 && (
                                <Pagination className="justify-end w-auto mx-0">
                                    <PaginationContent>
                                        <PaginationItem>
                                            <PaginationPrevious
                                                text={t("previous") as string}
                                                onClick={() => table.previousPage()}
                                                aria-disabled={!table.getCanPreviousPage()}
                                                className={!table.getCanPreviousPage() ? "pointer-events-none opacity-50" : "cursor-pointer"}
                                            />
                                        </PaginationItem>
                                        {/* Simplified Pagination Links for Demo */}
                                        <PaginationItem>
                                            <PaginationLink isActive>{table.getState().pagination.pageIndex + 1}</PaginationLink>
                                        </PaginationItem>
                                        <PaginationItem>
                                            <PaginationNext
                                                text={t("next") as string}
                                                onClick={() => table.nextPage()}
                                                aria-disabled={!table.getCanNextPage()}
                                                className={!table.getCanNextPage() ? "pointer-events-none opacity-50" : "cursor-pointer"}
                                            />
                                        </PaginationItem>
                                    </PaginationContent>
                                </Pagination>
                            )}
                        </div>
                    )}
                </>
            )}

            {/* Import Dialog */}
            <Dialog open={isImportModalOpen} onOpenChange={handleImportModalChange}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{t("import_title")}</DialogTitle>
                        <DialogDescription>{t("import_desc")}</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 pt-4">
                        {onDownloadTemplate ? (
                            <Button
                                variant="outline"
                                className="w-full"
                                onClick={handleDownloadTemplateClick}
                                disabled={isDownloadingTemplate}
                            >
                                <Download className="w-4 h-4 mr-2" />
                                {isDownloadingTemplate ? t("downloading") : t("download_template")}
                            </Button>
                        ) : importTemplateUrl ? (
                            <Button variant="outline" className="w-full" render={<a href={importTemplateUrl} download />} nativeButton={false}>
                                <Download className="w-4 h-4 mr-2" />
                                {t("download_template")}
                            </Button>
                        ) : null}

                        <input
                            ref={fileInputRef}
                            type="file"
                            accept=".xlsx,.xls,.csv"
                            className="hidden"
                            onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                    setSelectedFile(file);
                                    setImportErrors(null);
                                }
                            }}
                        />

                        <div
                            onClick={() => fileInputRef.current?.click()}
                            onDragOver={(e) => {
                                e.preventDefault();
                                setIsDragging(true);
                            }}
                            onDragLeave={() => setIsDragging(false)}
                            onDrop={(e) => {
                                e.preventDefault();
                                setIsDragging(false);
                                const file = e.dataTransfer.files?.[0];
                                if (file) {
                                    setSelectedFile(file);
                                    setImportErrors(null);
                                }
                            }}
                            className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center gap-2 text-muted-foreground transition-colors cursor-pointer ${isDragging ? "border-primary bg-primary/5" : "border-muted hover:bg-muted/50"
                                }`}
                        >
                            <Upload className="w-8 h-8" />
                            <p className="text-sm text-center">
                                {selectedFile ? selectedFile.name : t("upload_prompt")}
                            </p>
                        </div>

                        {importErrors && importErrors.length > 0 && (
                            <div className="max-h-40 overflow-y-auto rounded-lg border border-destructive/30 bg-destructive/5 p-3 space-y-1">
                                {importErrors.map((err, idx) => (
                                    <p key={idx} className="text-xs text-destructive">
                                        {err.row ? `${t("row")} ${err.row}` : ""}
                                        {err.document ? ` (${err.document})` : ""}
                                        {(err.row || err.document) ? ": " : ""}
                                        {err.message}
                                    </p>
                                ))}
                            </div>
                        )}

                        {onImport && (
                            <Button
                                className="w-full"
                                onClick={handleUploadClick}
                                disabled={!selectedFile || isUploading}
                            >
                                <Upload className="w-4 h-4 mr-2" />
                                {isUploading ? t("uploading") : t("upload")}
                            </Button>
                        )}
                    </div>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{t("delete_confirm_title")}</DialogTitle>
                        <DialogDescription>
                            {t("delete_confirm_desc")}
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="flex justify-end gap-2 pt-4">
                        <Button variant="outline" onClick={() => setDeleteConfirmOpen(false)}>
                            {t("cancel")}
                        </Button>
                        <Button variant="destructive" onClick={confirmDelete}>
                            {t("confirm_delete")}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}