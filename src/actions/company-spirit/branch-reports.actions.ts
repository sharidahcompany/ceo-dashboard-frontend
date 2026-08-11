"use server";

import { getAttendances } from "@/actions/workspace/attendance.actions";
import { getShifts } from "@/actions/workspace/shifts.actions";
import { getProjects, ProjectResource } from "@/actions/projects/projects.actions";
import { getProfitAndLossReport } from "@/actions/finance/financial-reports.actions";
import { getAllTenantsBranches } from "@/actions/company-spirit/branches-map.actions";
import { ActionResponse } from "@/actions/common/common.actions";
import { getErrorMessage } from "@/lib/utils";

export interface AttendancePoint {
  label: string;
  value: number;
}

export interface BranchReport {
  tenantId: string;
  tenantName: string;
  logoUrl?: string | null;
  branchId: number;
  branchName: string;
  attendance: {
    percentage: number | null;
    trend: AttendancePoint[];
    deltaPct: number | null;
  };
  projects: {
    total: number;
  };
  tasks: {
    total: number;
    completed: number;
    completionPercentage: number | null;
  };
  finance: {
    revenue: number;
    expenses: number;
    netProfitLoss: number;
  } | null;
}

const PRESENT_STATUSES = new Set(["present", "late", "missed_checkout"]);
const NON_WORKING_STATUSES = new Set(["weekend", "holiday"]);

function attendancePercentageFor(statuses: string[]): number | null {
  const countable = statuses.filter((status) => !NON_WORKING_STATUSES.has(status));
  if (countable.length === 0) return null;
  const present = countable.filter((status) => PRESENT_STATUSES.has(status)).length;
  return Math.round((present / countable.length) * 100);
}

function average(values: number[]): number | null {
  if (values.length === 0) return null;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function projectTaskStats(project: ProjectResource, monthKey: string) {
  let total = 0;
  let completed = 0;

  for (const sprint of project.sprints ?? []) {
    const stages = sprint.stages ?? [];
    const maxOrder = stages.reduce((max, stage) => Math.max(max, stage.order), -Infinity);
    for (const stage of stages) {
      const tasks = (stage.tasks ?? []).filter(
        (task) => !task.due_date || task.due_date.startsWith(monthKey),
      );
      total += tasks.length;
      if (stage.order === maxOrder) completed += tasks.length;
    }
  }

  return { total, completed };
}

/**
 * Builds one report per branch (attendance % trend + projects/tasks
 * completion + revenue/expenses/profit-loss) across every tenant the user
 * can see.
 */
export async function getBranchReports(): Promise<ActionResponse<BranchReport[]>> {
  try {
    const branchesRes = await getAllTenantsBranches();
    if (!branchesRes.success) {
      return { success: false, error: branchesRes.error };
    }

    const tenantIds = [...new Set(branchesRes.data.map((entry) => entry.tenantId))];
    const currentMonth = new Date().toISOString().substring(0, 7);

    const [attendanceByTenant, shiftsByTenant, projectsByTenant, financeByBranch] = await Promise.all([
      Promise.all(tenantIds.map((tenantId) => getAttendances(`per_page=1000`, tenantId))),
      Promise.all(tenantIds.map((tenantId) => getShifts(`per_page=1000`, tenantId))),
      Promise.all(tenantIds.map((tenantId) => getProjects(tenantId))),
      Promise.all(
        branchesRes.data.map(({ branch, tenantId }) =>
          getProfitAndLossReport(
            { start_month: currentMonth, end_month: currentMonth, branch_id: branch.id },
            tenantId,
          ),
        ),
      ),
    ]);

    const attendanceMap = new Map(tenantIds.map((id, i) => [id, attendanceByTenant[i]]));
    const projectsMap = new Map(tenantIds.map((id, i) => [id, projectsByTenant[i]]));
    const financeByBranchId = new Map(
      branchesRes.data.map(({ branch }, i) => [branch.id, financeByBranch[i]]),
    );
    const shiftBranchByTenant = new Map(
      tenantIds.map((id, i) => {
        const shiftsRes = shiftsByTenant[i];
        const shiftToBranch = new Map<number, number | null | undefined>();
        if (shiftsRes.success) {
          for (const shift of shiftsRes.data.data) {
            shiftToBranch.set(shift.id, shift.branch_id ?? shift.branch?.id);
          }
        }
        return [id, shiftToBranch];
      }),
    );

    const reports: BranchReport[] = branchesRes.data.map(({ branch, tenantId, tenantName, logoUrl }) => {
      const attendanceRes = attendanceMap.get(tenantId);
      const shiftToBranch = shiftBranchByTenant.get(tenantId);
      const branchAttendance = attendanceRes?.success
        ? attendanceRes.data.data.filter((a) => {
            const branchId = a.shift?.branch_id ?? (a.shift_id ? shiftToBranch?.get(a.shift_id) : undefined);
            return branchId === branch.id;
          })
        : [];

      const currentMonthKey = new Date().toISOString().substring(0, 7);
      const byDate = new Map<string, string[]>();
      for (const record of branchAttendance) {
        const date = record.attendance_date?.substring(0, 10);
        if (!date || !date.startsWith(currentMonthKey)) continue;
        const list = byDate.get(date) ?? [];
        list.push(record.status);
        byDate.set(date, list);
      }

      const dailyPercentages = [...byDate.entries()]
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([date, statuses]) => ({ date, pct: attendancePercentageFor(statuses) }))
        .filter((entry): entry is { date: string; pct: number } => entry.pct !== null);

      const trend: AttendancePoint[] = dailyPercentages.map(({ date, pct }) => ({
        label: date,
        value: pct,
      }));

      const midpoint = Math.ceil(dailyPercentages.length / 2);
      const previousAvg = average(dailyPercentages.slice(0, midpoint).map((d) => d.pct));
      const recentAvg = average(dailyPercentages.slice(midpoint).map((d) => d.pct));
      const deltaPct =
        recentAvg !== null && previousAvg !== null ? recentAvg - previousAvg : null;

      const percentage = dailyPercentages.length > 0
        ? Math.round(dailyPercentages.reduce((sum, d) => sum + d.pct, 0) / dailyPercentages.length)
        : null;

      const projectsRes = projectsMap.get(tenantId);
      const branchProjects = projectsRes?.success
        ? projectsRes.data.filter((p) => p.branch_id === branch.id)
        : [];

      const taskStats = branchProjects.reduce(
        (acc, project) => {
          const stats = projectTaskStats(project, currentMonthKey);
          return { total: acc.total + stats.total, completed: acc.completed + stats.completed };
        },
        { total: 0, completed: 0 },
      );

      const financeRes = financeByBranchId.get(branch.id);
      const financePeriod = financeRes?.success ? financeRes.data.data[0] : undefined;
      const finance = financePeriod
        ? {
            revenue: financePeriod.revenue,
            expenses: financePeriod.expenses,
            netProfitLoss: financePeriod.net_profit_loss,
          }
        : null;

      return {
        tenantId,
        tenantName,
        logoUrl,
        branchId: branch.id,
        branchName:
          branch.name_localized || Object.values(branch.name ?? {})[0] || branch.code || `#${branch.id}`,
        attendance: { percentage, trend, deltaPct },
        projects: { total: branchProjects.length },
        tasks: {
          total: taskStats.total,
          completed: taskStats.completed,
          completionPercentage:
            taskStats.total > 0 ? Math.round((taskStats.completed / taskStats.total) * 100) : null,
        },
        finance,
      };
    });

    return { success: true, data: reports };
  } catch (error) {
    return { success: false, error: getErrorMessage(error) };
  }
}
