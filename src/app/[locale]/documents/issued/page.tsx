import DocumentsList from "@/components/features/documents/DocumentsList";
import { PermissionGate } from "@/components/shared/PermissionGate";

export default function Page() {
    return (
        <PermissionGate permission="workspace.document.view">
            <DocumentsList />
        </PermissionGate>
    );
}
