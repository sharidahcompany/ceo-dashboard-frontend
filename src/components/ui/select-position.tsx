"use client"

import React, { useEffect } from "react"
import { useInView } from "react-intersection-observer"
import { useInfiniteQuery } from "@tanstack/react-query"
import { Briefcase } from "lucide-react"
import { Control, Controller, FieldValues, Path } from "react-hook-form"

import {
    Combobox,
    ComboboxContent,
    ComboboxEmpty,
    ComboboxInput,
    ComboboxItem,
    ComboboxList,
} from "@/components/ui/combobox"
import { getPositions, PositionResource } from "@/actions/workspace/positions.actions"
import { Spinner } from "./spinner"
import { useTranslations } from "next-intl"

interface SelectPositionProps<TFieldValues extends FieldValues> {
    control: Control<TFieldValues>
    name: Path<TFieldValues>
    initialPosition?: PositionResource | null
}

export function SelectPosition<TFieldValues extends FieldValues>({
    control,
    name,
    initialPosition,
}: SelectPositionProps<TFieldValues>) {
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
        queryKey: ["positions-select"],
        queryFn: ({ pageParam = 1 }) => getPositions(`page=${pageParam}`),
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

    const fetchedPositions = data?.pages.flatMap((page) => {
        if (page && page.success && Array.isArray(page.data.data)) {
            return page.data.data;
        }
        return [];
    }) ?? [];

    // Keep the currently assigned position visible even when it lives on a
    // page the infinite query hasn't reached yet.
    const allPositions = React.useMemo(() => {
        if (!initialPosition) return fetchedPositions
        const exists = fetchedPositions.some(p => String(p.id) === String(initialPosition.id))
        return exists ? fetchedPositions : [initialPosition, ...fetchedPositions]
    }, [fetchedPositions, initialPosition])

    const getPositionName = (position?: PositionResource | null) => {
        if (!position) return ""
        return position.name_localized || position.name?.ar || position.name?.en || ""
    }

    return (
        <Controller
            name={name}
            control={control}
            render={({ field }) => {
                const selectedPosition = allPositions.find(
                    (p: PositionResource) => String(p.id) === String(field.value)
                ) || (initialPosition && String(initialPosition.id) === String(field.value) ? initialPosition : null)

                return (
                    <Combobox
                        items={allPositions}
                        value={field.value !== undefined && field.value !== null ? String(field.value) : ""}
                        onValueChange={field.onChange}
                    >
                        <ComboboxInput
                            placeholder={t("actions.select_position")}
                            value={selectedPosition ? getPositionName(selectedPosition) : ""}
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
                                {(position: PositionResource) => (
                                    <ComboboxItem
                                        key={position.id}
                                        value={String(position.id)}
                                        className="flex items-center gap-3 py-2 cursor-pointer"
                                    >
                                        <div className="flex h-8 w-8 items-center justify-center rounded-md border border-border bg-muted/50 shrink-0">
                                            <Briefcase className="h-4 w-4 text-muted-foreground" />
                                        </div>
                                        <div className="flex flex-col min-w-0">
                                            <span className="font-medium text-sm truncate">
                                                {getPositionName(position)}
                                            </span>
                                            {position.department && (
                                                <span className="text-xs text-muted-foreground truncate">
                                                    {position.department.name}
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
