import { getBuffet } from "@/actions/buffet/buffet.actions";
import BuffetDetail from "@/components/features/buffet/BuffetDetail";
import { PermissionGate } from "@/components/shared/PermissionGate";

export default async function BuffetDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const result = await getBuffet(id);
    if (!result.success) return <div>Error loading buffet: {result.error}</div>;

    return (
        <PermissionGate permission="workspace.buffet.view">
            <BuffetDetail buffet={result.data.data} />
        </PermissionGate>
    );
}
