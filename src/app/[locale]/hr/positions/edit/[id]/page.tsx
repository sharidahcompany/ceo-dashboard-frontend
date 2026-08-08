"use client";

import React from "react";
import PositionsForm from "@/components/features/hr/PositionsForm";
import { PermissionGate } from "@/components/shared/PermissionGate";

export default function EditPositionPage() {
    return (
        <PermissionGate permission="workspace.position.update">
            <PositionsForm />
        </PermissionGate>
    );
}
