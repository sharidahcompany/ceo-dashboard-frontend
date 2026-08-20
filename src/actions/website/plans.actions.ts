"use server";

import api from "@/lib/api";
import { getErrorMessage } from "@/lib/utils";
import { ActionResponse } from "@/actions/common/common.actions";
import { revalidatePath } from "next/cache";

export interface FeatureResource {
    id: number;
    name: string;
    slug: string;
    description: string | null;
    type: "toggle" | "consumable" | "limit" | "metered";
    sort_order: number;
    created_at?: string;
    updated_at?: string;
}

export interface PlanFeatureResource extends FeatureResource {
    value: number;
    unit_price: string;
    reset_period: number;
    reset_interval: "day" | "week" | "month" | "year";
}

export interface PlanResource {
    id: number;
    name: string;
    slug: string;
    description: string | null;
    is_free: boolean;
    is_active: boolean;
    currency: string;
    price: number;
    price_before_discount?: number | null;
    billing_period: number;
    billing_interval: "day" | "week" | "month" | "year";
    trial_days: number;
    grace_days: number;
    sort_order: number;
    features?: PlanFeatureResource[];
    created_at?: string;
    updated_at?: string;
}

export interface PlanFormData {
    name: string;
    slug: string;
    description: string | null;
    is_free: boolean;
    is_active: boolean;
    currency: string;
    price: number;
    price_before_discount?: number | null;
    billing_period: number;
    billing_interval: "day" | "week" | "month" | "year";
    trial_days: number;
    grace_days: number;
    sort_order: number;
    features?: {
        id: number;
        value: number;
        unit_price: string;
        reset_period: number;
        reset_interval: "day" | "week" | "month" | "year";
    }[];
}

export interface FeatureFormData {
    name: string;
    slug: string;
    description: string | null;
    type: "toggle" | "consumable" | "limit" | "metered";
    sort_order: number;
}

/**
 * Fetch all plans.
 */
export async function getPlans(): Promise<ActionResponse<{ data: PlanResource[] }>> {
    try {
        const response = await api.get("/auth/plans");
        return { success: true, data: response.data };
    } catch (error) {
        return { success: false, error: getErrorMessage(error) };
    }
}

/**
 * Fetch a single plan by ID.
 */
export async function getPlan(id: number): Promise<ActionResponse<{ data: PlanResource }>> {
    try {
        const response = await api.get(`/auth/plans/${id}`);
        return { success: true, data: response.data };
    } catch (error) {
        return { success: false, error: getErrorMessage(error) };
    }
}

/**
 * Create a new plan.
 */
export async function createPlan(data: PlanFormData): Promise<ActionResponse<PlanResource>> {
    try {
        const response = await api.post("/auth/plans", data);
        revalidatePath("/[locale]/website/plans", "page");
        return { success: true, data: response.data.data };
    } catch (error) {
        return { success: false, error: getErrorMessage(error) };
    }
}

/**
 * Update an existing plan.
 */
export async function updatePlan(id: number, data: PlanFormData): Promise<ActionResponse<PlanResource>> {
    try {
        const response = await api.put(`/auth/plans/${id}`, data);
        revalidatePath("/[locale]/website/plans", "page");
        return { success: true, data: response.data.data };
    } catch (error) {
        return { success: false, error: getErrorMessage(error) };
    }
}

/**
 * Delete a plan.
 */
export async function deletePlan(id: number): Promise<ActionResponse<void>> {
    try {
        await api.delete(`/auth/plans/${id}`);
        revalidatePath("/[locale]/website/plans", "page");
        return { success: true, data: undefined };
    } catch (error) {
        return { success: false, error: getErrorMessage(error) };
    }
}

/**
 * Fetch all feature definitions.
 */
export async function getFeatures(): Promise<ActionResponse<{ data: FeatureResource[] }>> {
    try {
        const response = await api.get("/auth/features");
        return { success: true, data: response.data };
    } catch (error) {
        return { success: false, error: getErrorMessage(error) };
    }
}

/**
 * Create a new feature definition.
 */
export async function createFeature(data: FeatureFormData): Promise<ActionResponse<FeatureResource>> {
    try {
        const response = await api.post("/auth/features", data);
        revalidatePath("/[locale]/website/plans", "page");
        return { success: true, data: response.data.data };
    } catch (error) {
        return { success: false, error: getErrorMessage(error) };
    }
}

/**
 * Update an existing feature definition.
 */
export async function updateFeature(id: number, data: FeatureFormData): Promise<ActionResponse<FeatureResource>> {
    try {
        const response = await api.put(`/auth/features/${id}`, data);
        revalidatePath("/[locale]/website/plans", "page");
        return { success: true, data: response.data.data };
    } catch (error) {
        return { success: false, error: getErrorMessage(error) };
    }
}

/**
 * Delete a feature definition.
 */
export async function deleteFeature(id: number): Promise<ActionResponse<void>> {
    try {
        await api.delete(`/auth/features/${id}`);
        revalidatePath("/[locale]/website/plans", "page");
        return { success: true, data: undefined };
    } catch (error) {
        return { success: false, error: getErrorMessage(error) };
    }
}
