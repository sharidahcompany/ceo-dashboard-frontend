"use client"

import React, { useEffect } from "react"
import { useInView } from "react-intersection-observer"
import { useInfiniteQuery } from "@tanstack/react-query"
import { User } from "lucide-react"
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
import { getUsers, UserResource } from "@/actions/workspace/user.actions"
import { Spinner } from "./spinner"
import { useTranslations } from "next-intl"

interface SelectUserProps<TFieldValues extends FieldValues> {
    control: Control<TFieldValues>
    name: Path<TFieldValues>
    initialUser?: UserResource | null
}

export function SelectUser<TFieldValues extends FieldValues>({
    control,
    name,
    initialUser
}: SelectUserProps<TFieldValues>) {
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
        queryKey: ["users-select"],
        queryFn: ({ pageParam = 1 }) => getUsers({ page: pageParam }),
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

    // دمج initialUser لمنع اختفائه لو كان في صفحة بعيدة
    const allUsers = React.useMemo(() => {
        if (!initialUser) return fetchedUsers
        const exists = fetchedUsers.some(u => String(u.id) === String(initialUser.id))
        return exists ? fetchedUsers : [initialUser, ...fetchedUsers]
    }, [fetchedUsers, initialUser])

    const getUserFullName = (user?: UserResource | null) => {
        if (!user) return ""
        return `${user.first_name || ""} ${user.last_name || ""}`.trim()
    }

    return (
        <Controller
            name={name}
            control={control}
            render={({ field }) => {
                // البحث مع توحيد المقارنة لـ String
                const selectedUser = allUsers.find(
                    (u: UserResource) => String(u.id) === String(field.value)
                ) || (initialUser && String(initialUser.id) === String(field.value) ? initialUser : null)

                return (
                    <Combobox
                        items={allUsers}
                        value={field.value !== undefined && field.value !== null ? String(field.value) : ""}
                        onValueChange={field.onChange}
                    >
                        <ComboboxInput
                            placeholder={t("actions.select_user")}
                            value={selectedUser ? getUserFullName(selectedUser) : ""}
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
                                {(user: UserResource) => (
                                    <ComboboxItem
                                        key={user.id}
                                        value={String(user.id)}
                                        className="flex items-center gap-3 py-2 cursor-pointer"
                                    >
                                        <Avatar className="h-8 w-8 shrink-0">
                                            {user.avatar && <AvatarImage src={user.avatar} alt={user.username} />}
                                            <AvatarFallback className="bg-muted">
                                                <User className="h-4 w-4 text-muted-foreground" />
                                            </AvatarFallback>
                                        </Avatar>
                                        <span className="font-medium text-sm truncate">
                                            {getUserFullName(user)}
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