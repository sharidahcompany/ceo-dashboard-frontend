import HolidayForm from "@/components/features/hr/HolidayForm";
import { PermissionGate } from "@/components/shared/PermissionGate";

export default function Page() {
    return (
        <PermissionGate permission="workspace.holiday.create">
            <HolidayForm />
        </PermissionGate>
    );
}
