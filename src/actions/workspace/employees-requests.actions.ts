"use server";

import api from "@/lib/api";
import { getErrorMessage, normalizePaginationMeta } from "@/lib/utils";
import { ActionResponse } from "@/actions/common/common.actions";
import { AttendancePermissionResource } from "./attendance-permissions.actions";
import { MissionResource } from "./missions.actions";
import { ScholarshipRequestResource } from "./scholarships.actions";

export async function getLeaveRequests(
  query?: string
): Promise<ActionResponse<{ data: AttendancePermissionResource[]; meta?: any }>> {
  try {
    const response = await api.get(
      `/workspace/attendance-permissions${query ? `?${query}` : ""}`
    );
    return {
      success: true,
      data: {
        data: Array.isArray(response.data.data) ? response.data.data : [],
        meta: normalizePaginationMeta(response.data),
      },
    };
  } catch (error) {
    return { success: false, error: getErrorMessage(error) };
  }
}

export async function getMissionRequests(
  query?: string
): Promise<ActionResponse<{ data: MissionResource[]; meta?: any }>> {
  try {
    const params = new URLSearchParams(query);
    params.set("include", "assignees");
    const response = await api.get(`/workspace/missions?${params.toString()}`);
    return {
      success: true,
      data: {
        data: Array.isArray(response.data.data) ? response.data.data : [],
        meta: normalizePaginationMeta(response.data),
      },
    };
  } catch (error) {
    return { success: false, error: getErrorMessage(error) };
  }
}

export async function getScholarshipRequests(
  query?: string
): Promise<ActionResponse<{ data: ScholarshipRequestResource[]; meta?: any }>> {
  try {
    const response = await api.get(
      `/workspace/scholarship-requests${query ? `?${query}` : ""}`
    );
    return {
      success: true,
      data: {
        data: Array.isArray(response.data.data) ? response.data.data : [],
        meta: normalizePaginationMeta(response.data),
      },
    };
  } catch (error) {
    return { success: false, error: getErrorMessage(error) };
  }
}
