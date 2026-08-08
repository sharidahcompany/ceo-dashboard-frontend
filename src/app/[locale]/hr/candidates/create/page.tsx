"use client";

import React from "react";
import CandidatesForm from "@/components/features/hr/CandidatesForm";
import { PermissionGate } from "@/components/shared/PermissionGate";

export default function CreateCandidatePage() {
    return (
        <PermissionGate permission="workspace.job_application.create">
            <CandidatesForm />
        </PermissionGate>
    );
}
