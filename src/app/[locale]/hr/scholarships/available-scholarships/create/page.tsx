import AvailableScholarshipForm from "@/components/features/hr/AvailableScholarshipForm";
import { PermissionGate } from "@/components/shared/PermissionGate";

export default function Page() {
    return (
        <PermissionGate permission="workspace.scholarship.create">
            <AvailableScholarshipForm />
        </PermissionGate>
    );
}
