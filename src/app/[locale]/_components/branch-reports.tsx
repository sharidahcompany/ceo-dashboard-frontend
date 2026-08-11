"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useQuery } from "@tanstack/react-query";
import { ArrowDown, ArrowUp, ArrowRight } from "lucide-react";
import { Sparkline } from "@/components/ui/sparkline";
import type { AttendancePoint } from "@/actions/company-spirit/branch-reports.actions";
import { Skeleton } from "@/components/ui/skeleton";
import { getBranchReports } from "@/actions/company-spirit/branch-reports.actions";
import { useTenantCurrency } from "@/hooks/use-organization";
import { formatCurrency } from "@/lib/currency";

const ROTATE_INTERVAL_MS = 10000;

function TrendArrow({ deltaPct }: { deltaPct: number | null }) {
  if (deltaPct === null || Math.abs(deltaPct) < 1) {
    return <ArrowRight className="size-3.5 text-muted-foreground" />;
  }
  if (deltaPct > 0) {
    return <ArrowUp className="size-3.5 text-emerald-500" />;
  }
  return <ArrowDown className="size-3.5 text-rose-500" />;
}

export function BranchReports() {
  const t = useTranslations("branches_map.reports");
  const locale = useLocale();
  const currency = useTenantCurrency();
  const [index, setIndex] = useState(0);

  const { data: response, isLoading } = useQuery({
    queryKey: ["branch-reports"],
    queryFn: () => getBranchReports(),
  });

  const reports = useMemo(
    () => (response?.success ? response.data : []),
    [response],
  );

  useEffect(() => {
    if (reports.length <= 1) return;
    const timer = setInterval(() => {
      setIndex((current) => (current + 1) % reports.length);
    }, ROTATE_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [reports.length]);

  if (isLoading) {
    return <Skeleton className="h-56 w-full rounded-xl" />;
  }

  if (reports.length === 0) {
    return <p className="text-sm text-muted-foreground">{t("no_data")}</p>;
  }

  const report = reports[index % reports.length];
  const hasTrend = report.attendance.trend.length >= 2;
  const trend: AttendancePoint[] = hasTrend
    ? report.attendance.trend
    : report.attendance.trend.length === 1
      ? [report.attendance.trend[0], report.attendance.trend[0]]
      : [
          { label: "", value: 0 },
          { label: "", value: 0 },
        ];

  return (
    <div className="flex flex-col gap-4 rounded-xl border p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {report.logoUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={report.logoUrl}
              alt={report.tenantName}
              className="size-8 rounded-full border object-cover"
            />
          )}
          <div>
            <p className="font-medium leading-none">{report.branchName}</p>
            <p className="text-xs text-muted-foreground">{report.tenantName}</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          {reports.map((_, i) => (
            <span
              key={i}
              className={`h-1.5 rounded-full transition-all ${
                i === index ? "w-4 bg-primary" : "w-1.5 bg-muted"
              }`}
            />
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 items-stretch">
        <div className="flex flex-col rounded-lg border p-3">
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">{t("attendance")}</p>
            <div className="flex items-center gap-1 text-sm font-medium">
              {report.attendance.percentage !== null
                ? `${report.attendance.percentage}%`
                : "—"}
              <TrendArrow deltaPct={report.attendance.deltaPct} />
            </div>
          </div>
          <div className="mt-2 min-h-16 flex-1">
            <Sparkline
              data={trend}
              color="#3b82f6"
              height="100%"
              formatValue={(v) => `${v}%`}
            />
          </div>
        </div>

        <div className="flex flex-col rounded-lg border p-3">
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">{t("projects")}</p>
            <p className="text-sm font-medium">{report.projects.total}</p>
          </div>
          <div className="mt-3 flex flex-1 flex-col justify-end">
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                {t("tasks_completion")}
              </p>
              <p className="text-sm font-medium">
                {report.tasks.completionPercentage !== null
                  ? `${report.tasks.completed}/${report.tasks.total} (${report.tasks.completionPercentage}%)`
                  : "—"}
              </p>
            </div>
            <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary transition-all"
                style={{ width: `${report.tasks.completionPercentage ?? 0}%` }}
              />
            </div>
          </div>
        </div>

        <div className="flex flex-col rounded-lg border p-3">
          <p className="text-xs text-muted-foreground">{t("finance")}</p>
          {report.finance ? (
            <div className="mt-2 flex flex-1 flex-col justify-center gap-1.5">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{t("revenue")}</span>
                <span className="font-medium text-emerald-600 dark:text-emerald-400">
                  {formatCurrency(report.finance.revenue, currency, locale)}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{t("expenses")}</span>
                <span className="font-medium text-rose-600 dark:text-rose-400">
                  {formatCurrency(report.finance.expenses, currency, locale)}
                </span>
              </div>
              <div className="mt-1 flex items-center justify-between border-t pt-1.5 text-sm">
                <span className="text-muted-foreground">{t("net_profit_loss")}</span>
                <span
                  className={`flex items-center gap-1 font-medium ${
                    report.finance.netProfitLoss >= 0
                      ? "text-emerald-600 dark:text-emerald-400"
                      : "text-rose-600 dark:text-rose-400"
                  }`}
                >
                  {report.finance.netProfitLoss >= 0 ? (
                    <ArrowUp className="size-3.5" />
                  ) : (
                    <ArrowDown className="size-3.5" />
                  )}
                  {formatCurrency(report.finance.netProfitLoss, currency, locale)}
                </span>
              </div>
            </div>
          ) : (
            <p className="mt-2 flex-1 text-xs text-muted-foreground">{t("not_enough_data")}</p>
          )}
        </div>
      </div>
    </div>
  );
}
