"use client";

import React, { useState } from "react";
import { useTranslations } from "next-intl";
import { Calendar, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Popover,
    PopoverTrigger,
    PopoverContent,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export interface DateRange {
    from: string; // YYYY-MM-DD
    to: string; // YYYY-MM-DD
}

function toIsoDate(date: Date): string {
    return date.toISOString().slice(0, 10);
}

export function lastNMonthsRange(months: number): DateRange {
    const to = new Date();
    const from = new Date();
    from.setMonth(from.getMonth() - months);
    return { from: toIsoDate(from), to: toIsoDate(to) };
}

interface Preset {
    key: string;
    range: () => DateRange;
}

const PRESETS: Preset[] = [
    {
        key: "this_month",
        range: () => {
            const now = new Date();
            const from = new Date(now.getFullYear(), now.getMonth(), 1);
            return { from: toIsoDate(from), to: toIsoDate(now) };
        },
    },
    { key: "last_3_months", range: () => lastNMonthsRange(3) },
    { key: "last_6_months", range: () => lastNMonthsRange(6) },
    {
        key: "this_year",
        range: () => {
            const now = new Date();
            const from = new Date(now.getFullYear(), 0, 1);
            return { from: toIsoDate(from), to: toIsoDate(now) };
        },
    },
];

interface DateRangeFilterProps {
    value: DateRange;
    onChange: (range: DateRange) => void;
}

export function DateRangeFilter({ value, onChange }: DateRangeFilterProps) {
    const t = useTranslations("reports");
    const [open, setOpen] = useState(false);
    const [customFrom, setCustomFrom] = useState(value.from);
    const [customTo, setCustomTo] = useState(value.to);

    const activePresetKey = PRESETS.find((preset) => {
        const range = preset.range();
        return range.from === value.from && range.to === value.to;
    })?.key;

    const applyCustom = () => {
        if (customFrom && customTo && customFrom <= customTo) {
            onChange({ from: customFrom, to: customTo });
            setOpen(false);
        }
    };

    return (
        <Popover open={open} onOpenChange={(next) => {
            setOpen(next);
            if (next) {
                setCustomFrom(value.from);
                setCustomTo(value.to);
            }
        }}>
            <PopoverTrigger render={
                <Button variant="outline">
                    <Calendar className="w-4 h-4" />
                    {value.from} — {value.to}
                </Button>
            } nativeButton={true} />
            <PopoverContent align="end" className="w-72 p-0">
                <div className="p-1">
                    {PRESETS.map((preset) => {
                        const isActive = preset.key === activePresetKey;
                        return (
                            <button
                                key={preset.key}
                                onClick={() => {
                                    onChange(preset.range());
                                    setOpen(false);
                                }}
                                className={cn(
                                    "flex w-full items-center justify-between rounded-md px-3 py-2 text-sm hover:bg-muted transition-colors",
                                    isActive && "font-medium"
                                )}
                            >
                                {t(`presets.${preset.key}`)}
                                {isActive && <Check className="w-4 h-4" />}
                            </button>
                        );
                    })}
                </div>
                <div className="border-t p-3 space-y-2">
                    <p className="text-xs text-muted-foreground">{t("custom_range")}</p>
                    <div className="flex items-center gap-2">
                        <Input
                            type="date"
                            value={customFrom}
                            max={customTo}
                            onChange={(e) => setCustomFrom(e.target.value)}
                            className="h-8"
                        />
                        <span className="text-muted-foreground text-xs">—</span>
                        <Input
                            type="date"
                            value={customTo}
                            min={customFrom}
                            onChange={(e) => setCustomTo(e.target.value)}
                            className="h-8"
                        />
                    </div>
                    <Button size="sm" className="w-full" onClick={applyCustom}>
                        {t("apply")}
                    </Button>
                </div>
            </PopoverContent>
        </Popover>
    );
}
