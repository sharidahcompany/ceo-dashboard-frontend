import MissionForm from "@/components/features/hr/MissionForm";
import { PermissionGate } from "@/components/shared/PermissionGate";

export default function Page() {
    return (
        <PermissionGate permission="workspace.mission.update">
            <MissionForm />
        </PermissionGate>
    );
}
