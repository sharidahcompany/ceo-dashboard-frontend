"use client"

import React, { useEffect } from "react"
import { useInView } from "react-intersection-observer"
import { useInfiniteQuery } from "@tanstack/react-query"
import { Building2, X, Check } from "lucide-react"
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
import { getDepartments, DepartmentResource } from "@/actions/company-spirit/department.actions"
import { Spinner } from "./spinner"
import { useTranslations } from "next-intl"

interface MultiSelectDepartmentProps<TFieldValues extends FieldValues> {
    control: Control<TFieldValues>
    name: Path<TFieldValues>
    initialDepartments?: DepartmentResource[]
}

export function MultiSelectDepartment<TFieldValues extends FieldValues>({
    control,
    name,
    initialDepartments = []
}: MultiSelectDepartmentProps<TFieldValues>) {
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
        queryKey: ["departments-multi-select"],
        queryFn: ({ pageParam = 1 }) => getDepartments(`page=${pageParam}`),
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

    const fetchedDepartments = data?.pages.flatMap((page) => {
        if (page && page.success && Array.isArray(page.data.data)) {
            return page.data.data;
        }
        return [];
    }) ?? [];

    const allDepartments = React.useMemo(() => {
        if (!initialDepartments.length) return fetchedDepartments
        const map = new Map<string, DepartmentResource>()
        initialDepartments.forEach((d) => map.set(String(d.id), d))
        fetchedDepartments.forEach((d) => map.set(String(d.id), d))
        return Array.from(map.values())
    }, [fetchedDepartments, initialDepartments])

    const getDepartmentName = (dept?: DepartmentResource | null) => {
        if (!dept) return ""
        return dept.name_localized || dept.name?.ar || dept.name?.en || ""
    }

    return (
        <Controller
            name={name}
            control={control}
            render={({ field }) => {
                const currentValues: string[] = Array.isArray(field.value)
                    ? field.value.map((v: any) => String(v))
                    : []

                const selectedDepartments = allDepartments.filter((d) =>
                    currentValues.includes(String(d.id))
                )

                const toggleDepartment = (departmentIdStr: string) => {
                    const exists = currentValues.includes(departmentIdStr)
                    const updated = exists
                        ? currentValues.filter((id) => id !== departmentIdStr)
                        : [...currentValues, departmentIdStr]
                    field.onChange(updated)
                }

                const removeDepartment = (departmentIdStr: string, e: React.MouseEvent) => {
                    e.stopPropagation()
                    field.onChange(currentValues.filter((id) => id !== departmentIdStr))
                }

                return (
                    <div className="space-y-2">
                        {selectedDepartments.length > 0 && (
                            <div className="flex flex-wrap gap-1.5">
                                {selectedDepartments.map((dept) => (
                                    <Badge key={dept.id} variant="secondary" className="gap-1 pr-1">
                                        <Building2 className="h-3 w-3" />
                                        <span className="text-xs">{getDepartmentName(dept)}</span>
                                        <button
                                            type="button"
                                            onClick={(e) => removeDepartment(String(dept.id), e)}
                                            className="rounded-full hover:bg-muted p-0.5"
                                        >
                                            <X className="h-3 w-3" />
                                        </button>
                                    </Badge>
                                ))}
                            </div>
                        )}

                        <Combobox
                            items={allDepartments}
                            value=""
                            onValueChange={(val) => {
                                if (val) toggleDepartment(val)
                            }}
                        >
                            <ComboboxInput placeholder={t("actions.select_department")} />
                            <ComboboxContent>
                                <ComboboxEmpty>
                                    {isLoading
                                        ? t("actions.loading")
                                        : isError
                                            ? t("errors.unknown_error")
                                            : t("actions.no_results")}
                                </ComboboxEmpty>
                                <ComboboxList>
                                    {(department: DepartmentResource) => {
                                        const departmentIdStr = String(department.id)
                                        const isSelected = currentValues.includes(departmentIdStr)

                                        return (
                                            <ComboboxItem
                                                key={department.id}
                                                value={departmentIdStr}
                                                className="flex items-center justify-between py-2 cursor-pointer"
                                            >
                                                <div className="flex items-center gap-3 min-w-0">
                                                    <div className="flex h-8 w-8 items-center justify-center rounded-md border border-border bg-muted/50 shrink-0">
                                                        <Building2 className="h-4 w-4 text-muted-foreground" />
                                                    </div>
                                                    <div className="flex flex-col min-w-0">
                                                        <span className="font-medium text-sm truncate">
                                                            {getDepartmentName(department)}
                                                        </span>
                                                        {department.branch && (
                                                            <span className="text-xs text-muted-foreground truncate">
                                                                {department.branch.name_localized ||
                                                                    (typeof department.branch.name === "object"
                                                                        ? department.branch.name.ar || department.branch.name.en
                                                                        : department.branch.name)}
                                                            </span>
                                                        )}
                                                    </div>
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
