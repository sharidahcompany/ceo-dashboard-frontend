"use server";

import api from "@/lib/api";
import { getErrorMessage } from "@/lib/utils";
import { ActionResponse } from "@/actions/common/common.actions";
import { revalidatePath } from "next/cache";

// ==========================================
// TYPES
// ==========================================

export interface UserResource {
    id: string;
    first_name: string;
    last_name: string;
    username: string;
    email: string;
}

export interface FileResource {
    id: number;
    name: string;
    file_name: string;
    full_url: string;
    mime_type: string;
    size: number;
    created_at: string;
}

export interface ProjectResource {
    id: number;
    name: string;
    description?: string;
    notes?: string;
    status: {
        value: string;
        label: string;
    };
    start_date?: string;
    due_date?: string;
    end_date?: string;
    sprints?: SprintResource[];
    team?: UserResource[];
    files?: FileResource[];
    created_at: string;
    updated_at: string;
}

export interface SprintResource {
    id: number;
    project_id: number;
    name: string;
    description?: string;
    start_date?: string;
    due_date?: string;
    is_active?: boolean;
    stages?: SprintStageResource[];
}

export interface SprintStageResource {
    id: number;
    sprint_id: number;
    name: string;
    order: number;
    tasks?: TaskResource[];
}

export interface CommentResource {
    id: number;
    body: string;
    commentable_type: string;
    commentable_id: number;
    user_id: string;
    user?: UserResource;
    created_at: string;
}

export interface RatingResource {
    id: number;
    rating: number;
    feedback?: string;
    rateable_type: string;
    rateable_id: number;
    user_id: string;
    user?: UserResource;
    created_at: string;
}

export interface TaskResource {
    id: number;
    sprint_stage_id: number;
    name: string;
    description?: string;
    story_point?: number;
    order: number;
    priority: "low" | "medium" | "high";
    assigned_by?: string;
    start_date?: string;
    due_date?: string;
    end_date?: string;
    sprint_stage?: {
        id: number;
        name: string | null;
    };
    assigned_by_user?: {
        id: string;
        full_name: string;
        email: string;
    };
    users?: UserResource[];
    attachments?: FileResource[];
    comments?: CommentResource[];
    ratings?: RatingResource[];
    comments_count?: number;
    average_rating?: number | null;
    created_at?: string;
    updated_at?: string;
}

// ==========================================
// ACTIONS
// ==========================================

// --- PROJECTS ---

export async function getProjects(): Promise<ActionResponse<ProjectResource[]>> {
    try {
        const response = await api.get("/workspace/projects");
        return { success: true, data: response.data.data || response.data };
    } catch (error) {
        return { success: false, error: getErrorMessage(error) };
    }
}

export async function getProjectDetails(projectId: number | string): Promise<ActionResponse<ProjectResource>> {
    try {
        const response = await api.get(`/workspace/projects/${projectId}`);
        return { success: true, data: response.data.data || response.data };
    } catch (error) {
        return { success: false, error: getErrorMessage(error) };
    }
}

export async function createProject(data: {
    name: string;
    description?: string;
    notes?: string;
    status?: string;
    start_date?: string;
    due_date?: string;
}): Promise<ActionResponse<ProjectResource>> {
    try {
        const response = await api.post("/workspace/projects", data);
        revalidatePath("/[locale]/core-operations", "page");
        return { success: true, data: response.data.data || response.data };
    } catch (error) {
        return { success: false, error: getErrorMessage(error) };
    }
}

export async function updateProject(id: number | string, data: {
    name?: string;
    description?: string;
    notes?: string;
    status?: string;
    start_date?: string;
    due_date?: string;
}): Promise<ActionResponse<ProjectResource>> {
    try {
        const response = await api.put(`/workspace/projects/${id}`, data);
        revalidatePath("/[locale]/core-operations", "page");
        return { success: true, data: response.data.data || response.data };
    } catch (error) {
        return { success: false, error: getErrorMessage(error) };
    }
}

export async function deleteProject(id: number | string): Promise<ActionResponse<void>> {
    try {
        await api.delete(`/workspace/projects/${id}`);
        revalidatePath("/[locale]/core-operations", "page");
        return { success: true, data: undefined };
    } catch (error) {
        return { success: false, error: getErrorMessage(error) };
    }
}

export async function uploadProjectFile(projectId: number | string, formData: FormData): Promise<ActionResponse<FileResource>> {
    try {
        const response = await api.post(`/workspace/projects/${projectId}/files`, formData, {
            headers: {
                "Content-Type": "multipart/form-data",
            },
        });
        return { success: true, data: response.data.data || response.data };
    } catch (error) {
        return { success: false, error: getErrorMessage(error) };
    }
}

export async function deleteProjectFile(projectId: number | string, mediaId: number | string): Promise<ActionResponse<void>> {
    try {
        await api.delete(`/workspace/projects/${projectId}/files/${mediaId}`);
        return { success: true, data: undefined };
    } catch (error) {
        return { success: false, error: getErrorMessage(error) };
    }
}

export async function syncProjectUsers(projectId: number | string, userIds: string[]): Promise<ActionResponse<ProjectResource>> {
    try {
        const response = await api.post(`/workspace/projects/${projectId}/users`, { user_ids: userIds });
        return { success: true, data: response.data.data || response.data };
    } catch (error) {
        return { success: false, error: getErrorMessage(error) };
    }
}

// --- SPRINTS ---

export async function createSprint(data: {
    project_id: number;
    name: string;
    description?: string;
    start_date?: string;
    due_date?: string;
}): Promise<ActionResponse<SprintResource>> {
    try {
        const response = await api.post("/workspace/sprints", data);
        return { success: true, data: response.data.data || response.data };
    } catch (error) {
        return { success: false, error: getErrorMessage(error) };
    }
}

export async function updateSprint(id: number | string, data: {
    name?: string;
    description?: string;
    start_date?: string;
    due_date?: string;
}): Promise<ActionResponse<SprintResource>> {
    try {
        const response = await api.put(`/workspace/sprints/${id}`, data);
        return { success: true, data: response.data.data || response.data };
    } catch (error) {
        return { success: false, error: getErrorMessage(error) };
    }
}

export async function deleteSprint(id: number | string): Promise<ActionResponse<void>> {
    try {
        await api.delete(`/workspace/sprints/${id}`);
        return { success: true, data: undefined };
    } catch (error) {
        return { success: false, error: getErrorMessage(error) };
    }
}

// --- STAGES ---

export async function createStage(data: {
    sprint_id: number;
    name: string;
    order?: number;
}): Promise<ActionResponse<SprintStageResource>> {
    try {
        const response = await api.post("/workspace/stages", data);
        return { success: true, data: response.data.data || response.data };
    } catch (error) {
        return { success: false, error: getErrorMessage(error) };
    }
}

export async function updateStage(id: number | string, data: {
    name: string;
}): Promise<ActionResponse<SprintStageResource>> {
    try {
        const response = await api.put(`/workspace/stages/${id}`, data);
        return { success: true, data: response.data.data || response.data };
    } catch (error) {
        return { success: false, error: getErrorMessage(error) };
    }
}

export async function deleteStage(id: number | string): Promise<ActionResponse<void>> {
    try {
        await api.delete(`/workspace/stages/${id}`, { data: { ids: [id] } });
        return { success: true, data: undefined };
    } catch (error) {
        return { success: false, error: getErrorMessage(error) };
    }
}

export async function reorderStages(sprintId: number | string, stageIds: number[]): Promise<ActionResponse<void>> {
    try {
        await api.post(`/workspace/sprints/${sprintId}/stages/reorder`, { stages: stageIds });
        return { success: true, data: undefined };
    } catch (error) {
        return { success: false, error: getErrorMessage(error) };
    }
}

// --- TASKS ---

export async function createTask(data: FormData): Promise<ActionResponse<TaskResource>> {
    try {
        const response = await api.post("/workspace/tasks", data, {
            headers: {
                "Content-Type": "multipart/form-data",
            },
        });
        return { success: true, data: response.data.data || response.data };
    } catch (error) {
        return { success: false, error: getErrorMessage(error) };
    }
}

export async function updateTask(id: number | string, data: {
    name?: string;
    description?: string;
    story_point?: number;
    priority?: "low" | "medium" | "high";
    start_date?: string;
    due_date?: string;
}): Promise<ActionResponse<TaskResource>> {
    try {
        const response = await api.put(`/workspace/tasks/${id}`, data);
        return { success: true, data: response.data.data || response.data };
    } catch (error) {
        return { success: false, error: getErrorMessage(error) };
    }
}

export async function deleteTask(id: number | string): Promise<ActionResponse<void>> {
    try {
        await api.delete(`/workspace/tasks/${id}`);
        return { success: true, data: undefined };
    } catch (error) {
        return { success: false, error: getErrorMessage(error) };
    }
}

export async function moveTask(taskId: number | string, targetStageId: number | string, order?: number): Promise<ActionResponse<void>> {
    try {
        await api.post(`/workspace/tasks/${taskId}/move`, {
            sprint_stage_id: targetStageId,
            order: order,
        });
        return { success: true, data: undefined };
    } catch (error) {
        return { success: false, error: getErrorMessage(error) };
    }
}

export async function getTask(taskId: number | string): Promise<ActionResponse<TaskResource>> {
    try {
        const response = await api.get(`/workspace/tasks/${taskId}`);
        return { success: true, data: response.data.data || response.data };
    } catch (error) {
        return { success: false, error: getErrorMessage(error) };
    }
}

export async function uploadTaskFile(taskId: number | string, formData: FormData): Promise<ActionResponse<void>> {
    try {
        const response = await api.post(`/workspace/tasks/${taskId}/files`, formData, {
            headers: {
                "Content-Type": "multipart/form-data",
            },
        });
        return { success: true, data: undefined };
    } catch (error) {
        return { success: false, error: getErrorMessage(error) };
    }
}

export async function deleteTaskFile(taskId: number | string, mediaId: number | string): Promise<ActionResponse<void>> {
    try {
        await api.delete(`/workspace/tasks/${taskId}/files`, {
            data: { ids: [mediaId] }
        });
        return { success: true, data: undefined };
    } catch (error) {
        return { success: false, error: getErrorMessage(error) };
    }
}

// --- COMMENTS & RATINGS ---

export async function getComments(taskId: number | string): Promise<ActionResponse<CommentResource[]>> {
    try {
        const response = await api.get(`/workspace/tasks/${taskId}/comments`);
        return { success: true, data: response.data.data || response.data };
    } catch (error) {
        return { success: false, error: getErrorMessage(error) };
    }
}

export async function postComment(taskId: number | string, content: string): Promise<ActionResponse<CommentResource>> {
    try {
        const response = await api.post(`/workspace/tasks/${taskId}/comments`, { body: content });
        return { success: true, data: response.data.data || response.data };
    } catch (error) {
        return { success: false, error: getErrorMessage(error) };
    }
}

export async function getRatings(taskId: number | string): Promise<ActionResponse<RatingResource[]>> {
    try {
        const response = await api.get(`/workspace/tasks/${taskId}/rates`);
        return { success: true, data: response.data.data || response.data };
    } catch (error) {
        return { success: false, error: getErrorMessage(error) };
    }
}

export async function postRating(taskId: number | string, score: number, feedback?: string): Promise<ActionResponse<RatingResource>> {
    try {
        const response = await api.post(`/workspace/tasks/${taskId}/rates`, { rate: score, feedback });
        return { success: true, data: response.data.data || response.data };
    } catch (error) {
        return { success: false, error: getErrorMessage(error) };
    }
}

export interface UserTaskResource {
    id: number;
    name: string;
    priority: "low" | "medium" | "high";
    due_date?: string | null;
    project?: { id: number; name: string } | null;
    sprint_stage?: { id: number; name: string | null; order: number } | null;
    // computed server-side: true when the task's stage is the last (highest
    // order) stage of its sprint
    is_completed: boolean;
}

/**
 * Fetch every task assigned to a given user across all projects, used for
 * the per-employee task-completion report.
 */
export async function getUserTasks(userId: number | string): Promise<ActionResponse<UserTaskResource[]>> {
    try {
        const response = await api.get(`/workspace/users/${userId}/tasks`);
        return { success: true, data: response.data.data || response.data };
    } catch (error) {
        return { success: false, error: getErrorMessage(error) };
    }
}

export async function syncTaskUsers(taskId: number | string, userIds: string[]): Promise<ActionResponse<TaskResource>> {
    try {
        const response = await api.post(`/workspace/tasks/${taskId}/users`, { user_ids: userIds });
        return { success: true, data: response.data.data || response.data };
    } catch (error) {
        return { success: false, error: getErrorMessage(error) };
    }
}
