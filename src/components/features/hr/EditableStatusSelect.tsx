"use client";

import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

type BadgeVariant = "default" | "secondary" | "destructive" | "outline";

export interface StatusOption {
    value: string;
    label: string;
    variant?: BadgeVariant;
}

interface EditableStatusSelectProps {
    value: string;
    options: StatusOption[];
    onChange: (value: string) => Promise<{ success: boolean; error?: string; message?: string }>;
}

export function EditableStatusSelect({ value, options, onChange }: EditableStatusSelectProps) {
    const [current, setCurrent] = useState(value);
    const [isPending, startTransition] = useTransition();

    useEffect(() => {
        setCurrent(value);
    }, [value]);

    const handleChange = (newValue: string | null) => {
        if (!newValue || newValue === current) return;
        const previous = current;
        setCurrent(newValue);
        startTransition(async () => {
            const res = await onChange(newValue);
            if (!res.success) {
                setCurrent(previous);
                toast.error(res.error || "Failed to update status");
            } else if (res.message) {
                toast.success(res.message);
            }
        });
    };

    const selected = options.find((o) => o.value === current);

    return (
        <Select value={current} onValueChange={handleChange} disabled={isPending}>
            <SelectTrigger size="sm" className="w-fit h-8">
                <SelectValue>
                    <Badge variant={selected?.variant || "outline"}>
                        {selected?.label || current}
                    </Badge>
                </SelectValue>
            </SelectTrigger>
            <SelectContent>
                {options.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    );
}
