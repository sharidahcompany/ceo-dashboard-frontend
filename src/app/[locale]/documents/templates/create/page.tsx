import DocumentTemplateForm from "@/components/features/documents/DocumentTemplateForm";
import { PermissionGate } from "@/components/shared/PermissionGate";

export default function Page() {
    return (
        <PermissionGate permission="workspace.document_template.create">
            <DocumentTemplateForm />
        </PermissionGate>
    );
}
