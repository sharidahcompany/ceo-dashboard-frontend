import DocumentDetail from "@/components/features/documents/DocumentDetail";
import { PermissionGate } from "@/components/shared/PermissionGate";

export default function Page() {
    return (
        <PermissionGate permission="workspace.document.view">
            <DocumentDetail />
        </PermissionGate>
    );
}
