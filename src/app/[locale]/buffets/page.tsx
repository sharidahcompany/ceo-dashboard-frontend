import { getBuffets } from "@/actions/buffet/buffet.actions";
import Buffets from "@/components/features/buffet/Buffets";
import { PermissionGate } from "@/components/shared/PermissionGate";

export default async function Page() {
    const result = await getBuffets();
    const buffets = result.success ? result.data.data : [];
    return (
        <PermissionGate permission="workspace.buffet.view">
            <Buffets buffets={buffets} />
        </PermissionGate>
    );
}