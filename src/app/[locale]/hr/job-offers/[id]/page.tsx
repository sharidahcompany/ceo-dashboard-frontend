import JobOfferDetail from "@/components/features/hr/JobOfferDetail";
import { PermissionGate } from "@/components/shared/PermissionGate";

export default function Page() {
    return (
        <PermissionGate permission="workspace.job_offer.view">
            <JobOfferDetail />
        </PermissionGate>
    );
}
