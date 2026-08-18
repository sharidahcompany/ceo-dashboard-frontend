"use client"
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

export default function GoalTimer({ endDate, className = "w-full" }: { endDate: string; className?: string }) {
    const t = useTranslations("projects");
    const [timeStr, setTimeStr] = useState("");
    const [isOverdue, setIsOverdue] = useState(false);

    useEffect(() => {
        const calculate = () => {
            const due = new Date(endDate).getTime();
            const now = Date.now();
            const diffMs = due - now;

            const overdue = diffMs < 0;
            const absDiff = Math.abs(diffMs);

            const days = Math.floor(absDiff / (1000 * 60 * 60 * 24));
            const hours = Math.floor((absDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((absDiff % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((absDiff % (1000 * 60)) / 1000);

            const pad = (num: number) => String(num).padStart(2, "0");

            let formatted = `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
            if (days > 0) {
                formatted = `${days}d ${formatted}`;
            }

            setTimeStr(formatted);
            setIsOverdue(overdue);
        };

        calculate();
        const interval = setInterval(calculate, 1000);
        return () => clearInterval(interval);
    }, [endDate]);

    const displayColorClass = isOverdue
        ? "text-red-500 drop-shadow-[0_0_8px_rgba(239,68,68,0.3)]"
        : "text-emerald-500 drop-shadow-[0_0_8px_rgba(16,185,129,0.3)]";

    return (
        <div className={`bg-zinc-950 dark:bg-black py-2 px-3 rounded-lg border border-zinc-800/80 shadow-inner flex flex-col items-center justify-center select-none mt-3 gap-1 ${className}`}>
            <div className={`font-mono text-base md:text-lg font-bold tracking-widest ${displayColorClass}`}>
                {timeStr}
            </div>
            <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
                {isOverdue ? t("late") : t("active")}
            </span>
        </div>
    );
}
