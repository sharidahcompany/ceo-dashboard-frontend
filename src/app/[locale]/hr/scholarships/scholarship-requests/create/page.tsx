import ScholarshipRequestForm from "@/components/features/hr/ScholarshipRequestForm";
import { PermissionGate } from "@/components/shared/PermissionGate";

export default function Page() {
    return (
        <PermissionGate permission="workspace.scholarship_request.create">
            <ScholarshipRequestForm />
        </PermissionGate>
    );
}
