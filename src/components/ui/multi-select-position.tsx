"use client"

import React, { useEffect } from "react"
import { useInView } from "react-intersection-observer"
import { useInfiniteQuery } from "@tanstack/react-query"
import { Briefcase, X, Check } from "lucide-react"
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
import { getPositions, PositionResource } from "@/actions/workspace/positions.actions"
import { Spinner } from "./spinner"
import { useTranslations } from "next-intl"

interface MultiSelectPositionProps<TFieldValues extends FieldValues> {
    control: Control<TFieldValues>
    name: Path<TFieldValues>
    initialPositions?: PositionResource[]
}

export function MultiSelectPosition<TFieldValues extends FieldValues>({
    control,
    name,
    initialPositions = []
}: MultiSelectPositionProps<TFieldValues>) {
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
        queryKey: ["positions-multi-select"],
        queryFn: ({ pageParam = 1 }) => getPositions(`page=${pageParam}`),
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

    const fetchedPositions = data?.pages.flatMap((page) => {
        if (page && page.success && Array.isArray(page.data.data)) {
            return page.data.data;
        }
        return [];
    }) ?? [];

    const allPositions = React.useMemo(() => {
        if (!initialPositions.length) return fetchedPositions
        const map = new Map<string, PositionResource>()
        initialPositions.forEach((p) => map.set(String(p.id), p))
        fetchedPositions.forEach((p) => map.set(String(p.id), p))
        return Array.from(map.values())
    }, [fetchedPositions, initialPositions])

    const getPositionName = (position?: PositionResource | null) => {
        if (!position) return ""
        return position.name_localized || position.name?.ar || position.name?.en || ""
    }

    return (
        <Controller
            name={name}
            control={control}
            render={({ field }) => {
                const currentValues: string[] = Array.isArray(field.value)
                    ? field.value.map((v: any) => String(v))
                    : []

                const selectedPositions = allPositions.filter((p) =>
                    currentValues.includes(String(p.id))
                )

                const togglePosition = (positionIdStr: string) => {
                    const exists = currentValues.includes(positionIdStr)
                    const updated = exists
                        ? currentValues.filter((id) => id !== positionIdStr)
                        : [...currentValues, positionIdStr]
                    field.onChange(updated)
                }

                const removePosition = (positionIdStr: string, e: React.MouseEvent) => {
                    e.stopPropagation()
                    field.onChange(currentValues.filter((id) => id !== positionIdStr))
                }

                return (
                    <div className="space-y-2">
                        {selectedPositions.length > 0 && (
                            <div className="flex flex-wrap gap-1.5">
                                {selectedPositions.map((position) => (
                                    <Badge key={position.id} variant="secondary" className="gap-1 pr-1">
                                        <Briefcase className="h-3 w-3" />
                                        <span className="text-xs">{getPositionName(position)}</span>
                                        <button
                                            type="button"
                                            onClick={(e) => removePosition(String(position.id), e)}
                                            className="rounded-full hover:bg-muted p-0.5"
                                        >
                                            <X className="h-3 w-3" />
                                        </button>
                                    </Badge>
                                ))}
                            </div>
                        )}

                        <Combobox
                            items={allPositions}
                            value=""
                            onValueChange={(val) => {
                                if (val) togglePosition(val)
                            }}
                        >
                            <ComboboxInput placeholder={t("actions.select_position")} />
                            <ComboboxContent>
                                <ComboboxEmpty>
                                    {isLoading
                                        ? t("actions.loading")
                                        : isError
                                            ? t("errors.unknown_error")
                                            : t("actions.no_results")}
                                </ComboboxEmpty>
                                <ComboboxList>
                                    {(position: PositionResource) => {
                                        const positionIdStr = String(position.id)
                                        const isSelected = currentValues.includes(positionIdStr)

                                        return (
                                            <ComboboxItem
                                                key={position.id}
                                                value={positionIdStr}
                                                className="flex items-center justify-between py-2 cursor-pointer"
                                            >
                                                <div className="flex items-center gap-3 min-w-0">
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
