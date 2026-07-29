"use client"

import React, { useEffect } from "react"
import { useInView } from "react-intersection-observer"
import { useInfiniteQuery } from "@tanstack/react-query"
import { Building2 } from "lucide-react"
import { Control, Controller, FieldValues, Path } from "react-hook-form"

import {
    Combobox,
    ComboboxContent,
    ComboboxEmpty,
    ComboboxInput,
    ComboboxItem,
    ComboboxList,
} from "@/components/ui/combobox"
import { getDepartments, DepartmentResource } from "@/actions/company-spirit/department.actions"
import { Spinner } from "./spinner"
import { useTranslations } from "next-intl"

interface SelectDepartmentProps<TFieldValues extends FieldValues> {
    control: Control<TFieldValues>
    name: Path<TFieldValues>
    initialDepartment?: DepartmentResource | null // 👈 دعم القسم المبدئي للـ Edit
}

export function SelectDepartment<TFieldValues extends FieldValues>({
    control,
    name,
    initialDepartment
}: SelectDepartmentProps<TFieldValues>) {
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
        queryKey: ["departments-select"],
        queryFn: ({ pageParam = 1 }) => getDepartments({ page: pageParam }),
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

    const fetchedDepartments = data?.pages.flatMap((page) => {
        if (page && page.success && Array.isArray(page.data.data)) {
            return page.data.data;
        }
        return [];
    }) ?? [];

    // دمج initialDepartment في القائمة لمنع اختفائه إذا كان في صفحة بعيدة
    const allDepartments = React.useMemo(() => {
        if (!initialDepartment) return fetchedDepartments
        const exists = fetchedDepartments.some(d => String(d.id) === String(initialDepartment.id))
        return exists ? fetchedDepartments : [initialDepartment, ...fetchedDepartments]
    }, [fetchedDepartments, initialDepartment])

    const getDepartmentName = (dept?: DepartmentResource | null) => {
        if (!dept) return ""
        return dept.name_localized || dept.name?.ar || dept.name?.en || ""
    }

    return (
        <Controller
            name={name}
            control={control}
            render={({ field }) => {
                // البحث مع تحويل الأنواع لتجنب تفكك الـ Number والـ String
                const selectedDepartment = allDepartments.find(
                    (d: DepartmentResource) => String(d.id) === String(field.value)
                ) || (initialDepartment && String(initialDepartment.id) === String(field.value) ? initialDepartment : null)

                return (
                    <Combobox
                        items={allDepartments}
                        value={field.value !== undefined && field.value !== null ? String(field.value) : ""}
                        onValueChange={field.onChange}
                    >
                        <ComboboxInput
                            placeholder={t("actions.select_department")}
                            value={selectedDepartment ? getDepartmentName(selectedDepartment) : ""}
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
                                {(department: DepartmentResource) => (
                                    <ComboboxItem
                                        key={department.id}
                                        value={String(department.id)}
                                        className="flex items-center gap-3 py-2 cursor-pointer"
                                    >
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