import { useQuery } from "@tanstack/react-query";
import { getCurrentOrganization } from "@/actions/workspace/organization.actions";

export function useOrganization() {
    return useQuery({
        queryKey: ["organization"],
        queryFn: () => getCurrentOrganization(),
        staleTime: 5 * 60 * 1000,
    });
}

export function useTenantCurrency(): string | undefined {
    const { data: response } = useOrganization();
    return response?.success ? response.data.currency : undefined;
}
