"use client"

import React, { useEffect } from "react"
import { useInView } from "react-intersection-observer"
import { useInfiniteQuery } from "@tanstack/react-query"
import { Coffee } from "lucide-react"
import { Control, Controller, FieldValues, Path } from "react-hook-form"

import {
    Combobox,
    ComboboxContent,
    ComboboxEmpty,
    ComboboxInput,
    ComboboxItem,
    ComboboxList,
} from "@/components/ui/combobox"
import { getBuffets, BuffetResource } from "@/actions/buffet/buffet.actions"
import { Spinner } from "./spinner"
import { useTranslations } from "next-intl"

interface SelectBuffetProps<TFieldValues extends FieldValues> {
    control: Control<TFieldValues>
    name: Path<TFieldValues>
    initialBuffet?: BuffetResource | null
}

export function SelectBuffet<TFieldValues extends FieldValues>({
    control,
    name,
    initialBuffet
}: SelectBuffetProps<TFieldValues>) {
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
        queryKey: ["buffets-select"],
        queryFn: ({ pageParam = 1 }) => getBuffets({ page: pageParam }),
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

    const fetchedBuffets = data?.pages.flatMap((page) => {
        if (page && page.success && Array.isArray(page.data.data)) {
            return page.data.data;
        }
        return [];
    }) ?? [];

    const allBuffets = React.useMemo(() => {
        if (!initialBuffet) return fetchedBuffets
        const exists = fetchedBuffets.some(b => String(b.id) === String(initialBuffet.id))
        return exists ? fetchedBuffets : [initialBuffet, ...fetchedBuffets]
    }, [fetchedBuffets, initialBuffet])

    const getBuffetName = (buffet?: BuffetResource | null) => {
        if (!buffet) return ""
        if (typeof buffet.name === "string") return buffet.name
        return buffet.name_localized || buffet.name?.ar || buffet.name?.en || ""
    }

    return (
        <Controller
            name={name}
            control={control}
            render={({ field }) => {
                const selectedBuffet = allBuffets.find(
                    (b: BuffetResource) => String(b.id) === String(field.value)
                ) || (initialBuffet && String(initialBuffet.id) === String(field.value) ? initialBuffet : null)

                return (
                    <Combobox
                        items={allBuffets}
                        value={field.value !== undefined && field.value !== null ? String(field.value) : ""}
                        onValueChange={field.onChange}
                    >
                        <ComboboxInput
                            placeholder={t("messages.buffets.select_buffet") || "اختر البوفيه"}
                            value={selectedBuffet ? getBuffetName(selectedBuffet) : ""}
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
                                {(buffet: BuffetResource) => (
                                    <ComboboxItem
                                        key={buffet.id}
                                        value={String(buffet.id)}
                                        className="flex items-center gap-3 py-2 cursor-pointer"
                                    >
                                        <div className="flex h-8 w-8 items-center justify-center rounded-md border border-border bg-muted/50">
                                            <Coffee className="h-4 w-4 text-muted-foreground" />
                                        </div>
                                        <span className="font-medium text-sm">
                                            {getBuffetName(buffet)}
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
