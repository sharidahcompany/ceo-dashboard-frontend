"use client"

import React, { useEffect } from "react"
import { useInView } from "react-intersection-observer"
import { useInfiniteQuery } from "@tanstack/react-query"
import { GitBranch, X, Check } from "lucide-react"
import { Control, Controller, FieldValues, Path } from "react-hook-form"

import {
    Combobox,
    ComboboxContent,
    ComboboxEmpty,
    ComboboxInput,
    ComboboxItem,
    ComboboxList,
} from "@/components/ui/combobox"
import { Badge } from "@/components/ui/badge"
import { getBranches, BranchResource } from "@/actions/company-spirit/branch.actions"
import { Spinner } from "./spinner"
import { useTranslations } from "next-intl"

interface MultiSelectBranchProps<TFieldValues extends FieldValues> {
    control: Control<TFieldValues>
    name: Path<TFieldValues>
    initialBranches?: BranchResource[]
}

export function MultiSelectBranch<TFieldValues extends FieldValues>({
    control,
    name,
    initialBranches = []
}: MultiSelectBranchProps<TFieldValues>) {
    const { ref, inView } = useInView()
    const t = useTranslations()

    const {
        data,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        isLoading,
        isError
    } = useInfiniteQuery({
        queryKey: ["branches-multi-select"],
        queryFn: ({ pageParam = 1 }) => getBranches(`page=${pageParam}`),
        initialPageParam: 1,
        getNextPageParam: (lastPage) => {
            if (!lastPage || !lastPage.success) return undefined;
            const meta = lastPage.data.meta;
            if (!meta || !meta.current_page || !meta.last_page) return undefined;
            return meta.current_page < meta.last_page ? meta.current_page + 1 : undefined;
        },
    })

    useEffect(() => {
        if (inView && hasNextPage && !isFetchingNextPage) {
            fetchNextPage()
        }
    }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage])

    const fetchedBranches = data?.pages.flatMap((page) => {
        if (page && page.success && Array.isArray(page.data.data)) {
            return page.data.data;
        }
        return [];
    }) ?? [];

    const allBranches = React.useMemo(() => {
        if (!initialBranches.length) return fetchedBranches
        const map = new Map<string, BranchResource>()
        initialBranches.forEach((b) => map.set(String(b.id), b))
        fetchedBranches.forEach((b) => map.set(String(b.id), b))
        return Array.from(map.values())
    }, [fetchedBranches, initialBranches])

    const getBranchName = (branch?: BranchResource | null) => {
        if (!branch) return ""
        if (typeof branch.name === "string") return branch.name
        return branch.name_localized || branch.name?.ar || branch.name?.en || ""
    }

    return (
        <Controller
            name={name}
            control={control}
            render={({ field }) => {
                const currentValues: string[] = Array.isArray(field.value)
                    ? field.value.map((v: any) => String(v))
                    : []

                const selectedBranches = allBranches.filter((b) =>
                    currentValues.includes(String(b.id))
                )

                const toggleBranch = (branchIdStr: string) => {
                    const exists = currentValues.includes(branchIdStr)
                    const updated = exists
                        ? currentValues.filter((id) => id !== branchIdStr)
                        : [...currentValues, branchIdStr]
                    field.onChange(updated)
                }

                const removeBranch = (branchIdStr: string, e: React.MouseEvent) => {
                    e.stopPropagation()
                    field.onChange(currentValues.filter((id) => id !== branchIdStr))
                }

                return (
                    <div className="space-y-2">
                        {selectedBranches.length > 0 && (
                            <div className="flex flex-wrap gap-1.5">
                                {selectedBranches.map((branch) => (
                                    <Badge key={branch.id} variant="secondary" className="gap-1 pr-1">
                                        <GitBranch className="h-3 w-3" />
                                        <span className="text-xs">{getBranchName(branch)}</span>
                                        <button
                                            type="button"
                                            onClick={(e) => removeBranch(String(branch.id), e)}
                                            className="rounded-full hover:bg-muted p-0.5"
                                        >
                                            <X className="h-3 w-3" />
                                        </button>
                                    </Badge>
                                ))}
                            </div>
                        )}

                        <Combobox
                            items={allBranches}
                            value=""
                            onValueChange={(val) => {
                                if (val) toggleBranch(val)
                            }}
                        >
                            <ComboboxInput placeholder={t("actions.select_branch")} />
                            <ComboboxContent>
                                <ComboboxEmpty>
                                    {isLoading
                                        ? t("actions.loading")
                                        : isError
                                            ? t("errors.unknown_error")
                                            : t("actions.no_results")}
                                </ComboboxEmpty>
                                <ComboboxList>
                                    {(branch: BranchResource) => {
                                        const branchIdStr = String(branch.id)
                                        const isSelected = currentValues.includes(branchIdStr)

                                        return (
                                            <ComboboxItem
                                                key={branch.id}
                                                value={branchIdStr}
                                                className="flex items-center justify-between py-2 cursor-pointer"
                                            >
                                                <div className="flex items-center gap-3 min-w-0">
                                                    <div className="flex h-8 w-8 items-center justify-center rounded-md border border-border bg-muted/50 shrink-0">
                                                        <GitBranch className="h-4 w-4 text-muted-foreground" />
                                                    </div>
                                                    <span className="font-medium text-sm truncate">
                                                        {getBranchName(branch)}
                                                    </span>
                                                </div>
                                                {isSelected && <Check className="h-4 w-4 text-primary shrink-0" />}
                                            </ComboboxItem>
                                        )
                                    }}
                                </ComboboxList>

                                {hasNextPage && (
                                    <div ref={ref} className="p-2 text-center text-xs text-muted-foreground flex items-center justify-center gap-2">
                                        {isFetchingNextPage && <Spinner />}
                                    </div>
                                )}
                            </ComboboxContent>
                        </Combobox>
                    </div>
                )
            }}
        />
    )
}
