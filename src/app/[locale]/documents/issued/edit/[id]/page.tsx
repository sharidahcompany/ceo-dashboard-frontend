import DocumentForm from "@/components/features/documents/DocumentForm";
import { PermissionGate } from "@/components/shared/PermissionGate";

export default function Page() {
    return (
        <PermissionGate permission="workspace.document.update">
            <DocumentForm />
        </PermissionGate>
    );
}
