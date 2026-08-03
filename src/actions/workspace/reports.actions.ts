"use server";

import api from "@/lib/api";
import { getErrorMessage } from "@/lib/utils";
import { ActionResponse } from "@/actions/common/common.actions";

export interface ProjectMonthlyReport {
    period: string;
    total: number;
    by_status: Record<string, number>;
}

export interface ProjectsReport {
    total: number;
    by_status: Record<string, number>;
    monthly: ProjectMonthlyReport[];
}

export interface TaskMonthlyReport {
    period: string;
    total: number;
    completed: number;
}

export interface TasksReport {
    total: number;
    completed: number;
    overdue: number;
    monthly: TaskMonthlyReport[];
}

export interface AttendanceMonthlyReport {
    period: string;
    total: number;
    late_minutes: number;
    overtime_minutes: number;
}

export interface AttendanceReport {
    total: number;
    by_status: Record<string, number>;
    total_late_minutes: number;
    total_overtime_minutes: number;
    monthly: AttendanceMonthlyReport[];
}

export interface BuffetMonthlyReport {
    period: string;
    total_orders: number;
    total_revenue: number;
}

export interface BuffetReport {
    total_orders: number;
    total_revenue: number;
    by_status: Record<string, number>;
    monthly: BuffetMonthlyReport[];
}

export interface WorkspaceReportResponse {
    meta: {
        start_date: string;
        end_date: string;
    };
    data: {
        projects: ProjectsReport;
        tasks: TasksReport;
        attendance: AttendanceReport;
        buffet: BuffetReport;
    };
}

export async function getWorkspaceReport(
    params: { start_date?: string; end_date?: string }
): Promise<ActionResponse<WorkspaceReportResponse>> {
    try {
        const response = await api.get<WorkspaceReportResponse>("/workspace/reports", { params });
        return { success: true, data: response.data };
    } catch (error) {
        return { success: false, error: getErrorMessage(error) };
    }
}
