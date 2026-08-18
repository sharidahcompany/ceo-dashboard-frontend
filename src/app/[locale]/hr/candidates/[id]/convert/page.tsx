"use client";

import React from "react";
import ConvertToEmployeeReview from "@/components/features/hr/ConvertToEmployeeReview";
import { PermissionGate } from "@/components/shared/PermissionGate";

export default function ConvertCandidatePage() {
    return (
        <PermissionGate permission="workspace.job_application.update">
            <ConvertToEmployeeReview />
        </PermissionGate>
    );
}
