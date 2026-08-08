"use client";

import React from "react";
import CandidatesForm from "@/components/features/hr/CandidatesForm";
import { PermissionGate } from "@/components/shared/PermissionGate";

export default function EditCandidatePage() {
    return (
        <PermissionGate permission="workspace.job_application.update">
            <CandidatesForm />
        </PermissionGate>
    );
}
