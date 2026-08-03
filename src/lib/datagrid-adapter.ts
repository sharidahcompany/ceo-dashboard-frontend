import { ActionResponse } from "@/actions/common/common.actions";
import { normalizePaginationMeta } from "@/lib/utils";

function parseQuery(query?: string): Record<string, any> {
    return Object.fromEntries(new URLSearchParams(query));
}

/** Adapts an action whose success payload is a flat array (`ActionResponse<T[]>`) to DataGrid's fetchAction contract. */
export function adaptFlatListAction<T>(
    action: (params: Record<string, any>) => Promise<ActionResponse<T[]>>
) {
    return async (query?: string): Promise<ActionResponse<{ data: T[]; meta?: any }>> => {
        const res = await action(parseQuery(query));
        if (!res.success) return res;
        return { success: true, data: { data: res.data, meta: normalizePaginationMeta(res as any) } };
    };
}

/** Adapts an action whose success payload is `{ data: T[] }` to DataGrid's fetchAction contract. */
export function adaptWrappedListAction<T>(
    action: (params: Record<string, any>) => Promise<ActionResponse<{ data: T[] }>>
) {
    return async (query?: string): Promise<ActionResponse<{ data: T[]; meta?: any }>> => {
        const res = await action(parseQuery(query));
        if (!res.success) return res;
        return {
            success: true,
            data: { data: res.data.data, meta: normalizePaginationMeta(res.data as any) },
        };
    };
}
