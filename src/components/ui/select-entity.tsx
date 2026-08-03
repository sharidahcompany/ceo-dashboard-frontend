"use client"

import React from "react"
import { Control, Controller, FieldValues, Path } from "react-hook-form"
import { useTranslations } from "next-intl"

import {
    Combobox,
    ComboboxContent,
    ComboboxEmpty,
    ComboboxInput,
    ComboboxItem,
    ComboboxList,
} from "@/components/ui/combobox"

export interface EntityOption {
    id: number | string
    label: string
}

interface SelectEntityProps<TFieldValues extends FieldValues> {
    control: Control<TFieldValues>
    name: Path<TFieldValues>
    options: EntityOption[]
    loading?: boolean
    placeholder?: string
    initialOption?: EntityOption | null
    disabled?: boolean
}

export function SelectEntity<TFieldValues extends FieldValues>({
    control,
    name,
    options,
    loading = false,
    placeholder,
    initialOption,
    disabled = false,
}: SelectEntityProps<TFieldValues>) {
    const t = useTranslations()

    const allOptions = React.useMemo(() => {
        if (!initialOption) return options
        const exists = options.some((o) => String(o.id) === String(initialOption.id))
        return exists ? options : [initialOption, ...options]
    }, [options, initialOption])

    return (
        <Controller
            name={name}
            control={control}
            render={({ field }) => {
                const selected =
                    allOptions.find((o) => String(o.id) === String(field.value)) || null

                return (
                    <Combobox
                        items={allOptions}
                        value={field.value !== undefined && field.value !== null ? String(field.value) : ""}
                        onValueChange={field.onChange}
                        disabled={disabled}
                    >
                        <ComboboxInput
                            placeholder={placeholder || t("actions.select")}
                            value={selected ? selected.label : ""}
                            disabled={disabled}
                            showClear
                        />
                        <ComboboxContent>
                            <ComboboxEmpty>
                                {loading ? t("actions.loading") : t("actions.no_results")}
                            </ComboboxEmpty>
                            <ComboboxList>
                                {(option: EntityOption) => (
                                    <ComboboxItem key={option.id} value={String(option.id)}>
                                        {option.label}
                                    </ComboboxItem>
                                )}
                            </ComboboxList>
                        </ComboboxContent>
                    </Combobox>
                )
            }}
        />
    )
}
