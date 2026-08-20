"use client"

import React, { useEffect } from "react"
import { useInView } from "react-intersection-observer"
import { useInfiniteQuery } from "@tanstack/react-query"
import { User, X, Check } from "lucide-react"
import { Control, Controller, FieldValues, Path } from "react-hook-form"

import {
    Combobox,
    ComboboxContent,
    ComboboxEmpty,
    ComboboxInput,
    ComboboxItem,
    ComboboxList,
} from "@/components/ui/combobox"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { getTenantUsers, UserResource } from "@/actions/workspace/user.actions"
import { Spinner } from "./spinner"
import { useTranslations } from "next-intl"

interface MultiSelectUserProps<TFieldValues extends FieldValues> {
    control: Control<TFieldValues>
    name: Path<TFieldValues>
    initialUsers?: UserResource[]
}

export function MultiSelectUser<TFieldValues extends FieldValues>({
    control,
    name,
    initialUsers = []
}: MultiSelectUserProps<TFieldValues>) {
    const { ref, inView } = useInView()
    const t = useTranslations()
    const [isSelectingAll, setIsSelectingAll] = React.useState(false)

    const {
        data,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        isLoading,
        isError
    } = useInfiniteQuery({
        queryKey: ["tenant-users-select"],
        queryFn: ({ pageParam = 1 }) => getTenantUsers(`page=${pageParam}`),
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

    const fetchedUsers = data?.pages.flatMap((page) => {
        if (page && page.success && Array.isArray(page.data.data)) {
            return page.data.data;
        }
        return [];
    }) ?? [];

    const allUsers = React.useMemo(() => {
        if (!initialUsers.length) return fetchedUsers

        const map = new Map<string, UserResource>()
        initialUsers.forEach((u) => map.set(String(u.id), u))
        fetchedUsers.forEach((u) => map.set(String(u.id), u))

        return Array.from(map.values())
    }, [fetchedUsers, initialUsers])

    const getUserFullName = (user?: UserResource | null) => {
        if (!user) return ""
        return `${user.first_name || ""} ${user.last_name || ""}`.trim()
    }

    return (
        <Controller
            name={name}
            control={control}
            render={({ field }) => {
                const currentValues: string[] = Array.isArray(field.value)
                    ? field.value.map((v: any) => String(v))
                    : []

                const selectedUsers = allUsers.filter((u) =>
                    currentValues.includes(String(u.id))
                )

                const toggleUser = (userIdStr: string) => {
                    const exists = currentValues.includes(userIdStr)
                    const updated = exists
                        ? currentValues.filter((id) => id !== userIdStr)
                        : [...currentValues, userIdStr]
                    field.onChange(updated)
                }

                const removeUser = (userIdStr: string, e: React.MouseEvent) => {
                    e.stopPropagation()
                    field.onChange(currentValues.filter((id) => id !== userIdStr))
                }

                const allSelected =
                    allUsers.length > 0 &&
                    !hasNextPage &&
                    allUsers.every((u) => currentValues.includes(String(u.id)))

                const toggleSelectAll = async () => {
                    if (allSelected) {
                        field.onChange([])
                        return
                    }

                    setIsSelectingAll(true)
                    try {
                        // Pull the remaining pages so "select all" really means all users.
                        let pages = data?.pages ?? []
                        let more = hasNextPage
                        while (more) {
                            const result = await fetchNextPage()
                            pages = result.data?.pages ?? pages
                            more = !!result.hasNextPage
                        }

                        const ids = new Set(initialUsers.map((u) => String(u.id)))
                        pages.forEach((page) => {
                            if (page && page.success && Array.isArray(page.data.data)) {
                                page.data.data.forEach((u: UserResource) => ids.add(String(u.id)))
                            }
                        })
                        field.onChange(Array.from(ids))
                    } finally {
                        setIsSelectingAll(false)
                    }
                }

                return (
                    <div className="space-y-2">
                        {selectedUsers.length > 0 && (
                            <div className="flex flex-wrap gap-1.5">
                                {selectedUsers.map((user) => (
                                    <Badge key={user.id} variant="secondary" className="gap-1 pr-1">
                                        <Avatar className="h-4 w-4">
                                            {user.avatar && <AvatarImage src={user.avatar} alt={user.username} />}
                                            <AvatarFallback className="text-[10px]">
                                                {user.first_name?.[0] || "U"}
                                            </AvatarFallback>
                                        </Avatar>
                                        <span className="text-xs">{getUserFullName(user)}</span>
                                        <button
                                            type="button"
                                            onClick={(e) => removeUser(String(user.id), e)}
                                            className="rounded-full hover:bg-muted p-0.5"
                                        >
                                            <X className="h-3 w-3" />
                                        </button>
                                    </Badge>
                                ))}
                            </div>
                        )}

                        <label className="flex items-center gap-2 text-sm cursor-pointer w-fit">
                            <Checkbox
                                checked={allSelected}
                                disabled={isSelectingAll || isLoading || isError || allUsers.length === 0}
                                onCheckedChange={() => { void toggleSelectAll() }}
                            />
                            <span className="text-muted-foreground">
                                {allSelected ? t("actions.clear_all") : t("actions.select_all")}
                            </span>
                            {isSelectingAll && <Spinner />}
                        </label>

                        <Combobox
                            items={allUsers}
                            value=""
                            onValueChange={(val) => {
                                if (val) toggleUser(val)
                            }}
                        >
                            <ComboboxInput placeholder={t("actions.select_user")} />
                            <ComboboxContent>
                                <ComboboxEmpty>
                                    {isLoading
                                        ? t("actions.loading")
                                        : isError
                                            ? t("errors.unknown_error")
                                            : t("actions.no_results")}
                                </ComboboxEmpty>
                                <ComboboxList>
                                    {(user: UserResource) => {
                                        const userIdStr = String(user.id)
                                        const isSelected = currentValues.includes(userIdStr)

                                        return (
                                            <ComboboxItem
                                                key={user.id}
                                                value={userIdStr}
                                                className="flex items-center justify-between py-2 cursor-pointer"
                                            >
                                                <div className="flex items-center gap-3 min-w-0">
                                                    <Avatar className="h-8 w-8 shrink-0">
                                                        {user.avatar && <AvatarImage src={user.avatar} alt={user.username} />}
                                                        <AvatarFallback className="bg-muted">
                                                            <User className="h-4 w-4 text-muted-foreground" />
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <span className="font-medium text-sm truncate">
                                                        {getUserFullName(user)}
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