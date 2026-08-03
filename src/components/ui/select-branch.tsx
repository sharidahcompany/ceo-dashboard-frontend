"use client"

import React, { useEffect } from "react"
import { useInView } from "react-intersection-observer"
import { useInfiniteQuery } from "@tanstack/react-query"
import { GitBranch } from "lucide-react"
import { Control, Controller, FieldValues, Path } from "react-hook-form"

import {
    Combobox,
    ComboboxContent,
    ComboboxEmpty,
    ComboboxInput,
    ComboboxItem,
    ComboboxList,
} from "@/components/ui/combobox"
import { getBranches, BranchResource } from "@/actions/company-spirit/branch.actions"
import { Spinner } from "./spinner"
import { useTranslations } from "next-intl"

interface SelectBranchProps<TFieldValues extends FieldValues> {
    control: Control<TFieldValues>
    name: Path<TFieldValues>
    initialBranch?: BranchResource | null // 👈 إضافة دعم الفرع المبدئي للـ Edit
}

export function SelectBranch<TFieldValues extends FieldValues>({
    control,
    name,
    initialBranch
}: SelectBranchProps<TFieldValues>) {
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
        queryKey: ["branches-select"],
        queryFn: ({ pageParam = 1 }) => getBranches(`page=${pageParam}`),
        initialPageParam: 1,
        getNextPageParam: (lastPage) => {
            if (!lastPage || !lastPage.success) return undefined;
            const meta = lastPage.data.meta;
            if (!meta || !meta.current_page || !meta.last_page) {
                return undefined;
            }
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

    // دمج initialBranch في القائمة لمنع اختفائه إذا كان في صفحة متأخرة
    const allBranches = React.useMemo(() => {
        if (!initialBranch) return fetchedBranches
        const exists = fetchedBranches.some(b => String(b.id) === String(initialBranch.id))
        return exists ? fetchedBranches : [initialBranch, ...fetchedBranches]
    }, [fetchedBranches, initialBranch])

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
                // البحث مع تحويل الأنواع لتجنب تفكك الـ Number والـ String
                const selectedBranch = allBranches.find(
                    (b: BranchResource) => String(b.id) === String(field.value)
                ) || (initialBranch && String(initialBranch.id) === String(field.value) ? initialBranch : null)

                return (
                    <Combobox
                        items={allBranches}
                        value={field.value !== undefined && field.value !== null ? String(field.value) : ""}
                        onValueChange={field.onChange}
                    >
                        <ComboboxInput
                            placeholder={t("actions.select_branch")}
                            value={selectedBranch ? getBranchName(selectedBranch) : ""}
                        />
                        <ComboboxContent>
                            <ComboboxEmpty>
                                {isLoading
                                    ? t("actions.loading")
                                    : isError
                                        ? t("errors.unknown_error")
                                        : t("actions.no_results")}
                            </ComboboxEmpty>
                            <ComboboxList>
                                {(branch: BranchResource) => (
                                    <ComboboxItem
                                        key={branch.id}
                                        value={String(branch.id)}
                                        className="flex items-center gap-3 py-2 cursor-pointer"
                                    >
                                        <div className="flex h-8 w-8 items-center justify-center rounded-md border border-border bg-muted/50">
                                            <GitBranch className="h-4 w-4 text-muted-foreground" />
                                        </div>
                                        <span className="font-medium text-sm">
                                            {getBranchName(branch)}
                                        </span>
                                    </ComboboxItem>
                                )}
                            </ComboboxList>

                            {hasNextPage && (
                                <div ref={ref} className="p-2 text-center text-xs text-muted-foreground flex items-center justify-center gap-2">
                                    {isFetchingNextPage && <Spinner />}
                                </div>
                            )}
                        </ComboboxContent>
                    </Combobox>
                )
            }}
        />
    )
}