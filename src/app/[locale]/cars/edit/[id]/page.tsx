import CarForm from "@/components/features/cars/CarForm";
import { PermissionGate } from "@/components/shared/PermissionGate";

export default function Page() {
    return (
        <PermissionGate permission="workspace.car.update">
            <CarForm />
        </PermissionGate>
    );
}
