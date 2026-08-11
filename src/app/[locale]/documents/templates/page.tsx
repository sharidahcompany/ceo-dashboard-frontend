import DocumentTemplatesList from "@/components/features/documents/DocumentTemplatesList";
import { PermissionGate } from "@/components/shared/PermissionGate";

export default function Page() {
    return (
        <PermissionGate permission="workspace.document_template.view">
            <DocumentTemplatesList />
        </PermissionGate>
    );
}
