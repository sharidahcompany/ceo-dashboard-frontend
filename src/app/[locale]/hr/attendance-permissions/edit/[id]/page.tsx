import AttendancePermissionsForm from "@/components/features/hr/AttendancePermissionsForm";
import { PermissionGate } from "@/components/shared/PermissionGate";

export default function Page() {
    return (
        <PermissionGate permission="workspace.attendance_permission.update">
            <AttendancePermissionsForm />
        </PermissionGate>
    );
}
