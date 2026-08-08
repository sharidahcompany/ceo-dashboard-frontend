"use client";

import React from "react";
import ShiftForm from "@/components/features/hr/ShiftForm";
import { PermissionGate } from "@/components/shared/PermissionGate";

export default function CreateShiftPage() {
    return (
        <PermissionGate permission="workspace.shift.create">
            <ShiftForm />
        </PermissionGate>
    );
}
