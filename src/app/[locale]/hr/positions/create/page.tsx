"use client";

import React from "react";
import PositionsForm from "@/components/features/hr/PositionsForm";
import { PermissionGate } from "@/components/shared/PermissionGate";

export default function CreatePositionPage() {
    return (
        <PermissionGate permission="workspace.position.create">
            <PositionsForm />
        </PermissionGate>
    );
}
