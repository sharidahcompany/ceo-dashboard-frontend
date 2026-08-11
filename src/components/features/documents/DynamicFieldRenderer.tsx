"use client";

import React from "react";
import { useTranslations } from "next-intl";
import { Control, Controller, FieldValues, Path } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Field,
    FieldContent,
    FieldError,
    FieldLabel,
} from "@/components/ui/field";
import { DocumentTemplateFieldResource } from "@/actions/workspace/document-templates.actions";

export interface DynamicFieldRendererProps<T extends FieldValues> {
    field: DocumentTemplateFieldResource;
    control: Control<T>;
    error?: string;
    disabled?: boolean;
}

/**
 * Renders one of a template's parsed placeholders as the input type its author
 * configured. The field name is `field_values.<key>`, matching the shape the
 * backend validates against.
 */
export default function DynamicFieldRenderer<T extends FieldValues>({
    field,
    control,
    error,
    disabled,
}: DynamicFieldRendererProps<T>) {
    const t = useTranslations();

    // The set of fields comes from the template at runtime, so this path
    // cannot be known statically — the cast is confined to this one line.
    const name = `field_values.${field.key}` as Path<T>;
    const type = field.type.value;

    const rules = field.required ? { required: "validation.required" } : {};

    return (
        <Field className={type === "textarea" ? "md:col-span-2" : undefined}>
            <FieldLabel>
                {field.label}
                {field.required && <span className="text-destructive"> *</span>}
            </FieldLabel>
            <FieldContent>
                <Controller
                    name={name}
                    control={control}
                    rules={rules}
                    render={({ field: rhf }) => {
                        switch (type) {
                            case "textarea":
                                return (
                                    <Textarea
                                        {...rhf}
                                        rows={3}
                                        disabled={disabled}
                                        value={rhf.value ?? ""}
                                        placeholder={field.label}
                                    />
                                );

                            case "number":
                                return (
                                    <Input
                                        {...rhf}
                                        type="number"
                                        dir="ltr"
                                        disabled={disabled}
                                        value={rhf.value ?? ""}
                                        placeholder={field.label}
                                    />
                                );

                            case "date":
                                return (
                                    <Input
                                        {...rhf}
                                        type="date"
                                        dir="ltr"
                                        disabled={disabled}
                                        value={rhf.value ?? ""}
                                    />
                                );

                            case "boolean":
                                return (
                                    <label className="flex items-center gap-2 text-sm">
                                        <Checkbox
                                            checked={Boolean(rhf.value)}
                                            disabled={disabled}
                                            onCheckedChange={(checked) =>
                                                rhf.onChange(Boolean(checked))
                                            }
                                        />
                                        {field.label}
                                    </label>
                                );

                            case "select":
                                return (
                                    <Select
                                        value={rhf.value ?? ""}
                                        disabled={disabled}
                                        onValueChange={(v) => v && rhf.onChange(v)}
                                    >
                                        <SelectTrigger className="w-full">
                                            <SelectValue>{rhf.value || field.label}</SelectValue>
                                        </SelectTrigger>
                                        <SelectContent>
                                            {(field.options ?? []).map((option) => (
                                                <SelectItem key={option} value={option}>
                                                    {option}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                );

                            default:
                                return (
                                    <Input
                                        {...rhf}
                                        disabled={disabled}
                                        value={rhf.value ?? ""}
                                        placeholder={field.label}
                                    />
                                );
                        }
                    }}
                />
                {error && <FieldError>{t(error)}</FieldError>}
            </FieldContent>
        </Field>
    );
}
