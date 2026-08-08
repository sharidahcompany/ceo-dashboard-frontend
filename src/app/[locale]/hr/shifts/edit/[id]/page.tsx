"use client";

import React from "react";
import ShiftForm from "@/components/features/hr/ShiftForm";
import { PermissionGate } from "@/components/shared/PermissionGate";

export default function EditShiftPage() {
    return (
        <PermissionGate permission="workspace.shift.update">
            <ShiftForm />
        </PermissionGate>
    );
}
